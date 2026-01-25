package com.dbs.feedback.agents;

import com.dbs.feedback.model.Feedback;
import com.dbs.feedback.service.FeedbackService;
import jakarta.annotation.PostConstruct;
import jakarta.mail.*;
import jakarta.mail.Flags.Flag;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.search.FlagTerm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class EmailReviewAgent {

    private final FeedbackService feedbackService;
    private final JavaMailSender mailSender;
    private final com.dbs.feedback.service.SchedulingService schedulingService;

    @Value("${app.emailAgent.enabled:true}")
    private boolean enabled;
    @Value("${app.emailAgent.poll-interval-ms:60000}")
    private long pollIntervalMs;
    @Value("${app.emailAgent.imap.host:imap.gmail.com}")
    private String imapHost;
    @Value("${app.emailAgent.imap.port:993}")
    private int imapPort;
    @Value("${app.emailAgent.imap.ssl:true}")
    private boolean imapSsl;
    @Value("${app.emailAgent.username:${spring.mail.username:}}")
    private String username;
    @Value("${spring.mail.password:}")
    private String password;
    @Value("${app.emailAgent.required-fields:customerName,userEmail,productId,rating,comment}")
    private String requiredFieldsCsv;
    @Value("${app.ui.base-url:http://localhost:3000}")
    private String uiBaseUrl;

    private final FeedbackEmailParser parser = new FeedbackEmailParser();
    private Set<String> requiredFields;

    // Status tracking
    private volatile Instant lastPollAt;
    private volatile Integer lastUnreadCount;
    private volatile String lastError;

    public EmailReviewAgent(FeedbackService feedbackService, JavaMailSender mailSender, com.dbs.feedback.service.SchedulingService schedulingService) {
        this.feedbackService = feedbackService;
        this.mailSender = mailSender;
        this.schedulingService = schedulingService;
    }

    @PostConstruct
    void init() {
        requiredFields = Arrays.stream(requiredFieldsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    @Scheduled(fixedDelayString = "${app.emailAgent.poll-interval-ms:60000}")
    public void pollMailbox() {
        if (!enabled) return;
        pollOnce();
    }

    /** Public method so controllers can trigger an on-demand poll */
    public void pollOnce() {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            System.out.println("EmailReviewAgent disabled: username/password not configured");
            return;
        }
        Properties props = new Properties();
        props.put("mail.store.protocol", "imaps");
        props.put("mail.imaps.host", imapHost);
        props.put("mail.imaps.port", String.valueOf(imapPort));
        props.put("mail.imaps.ssl.enable", String.valueOf(imapSsl));
        props.put("mail.imaps.timeout", "10000");
        props.put("mail.imaps.connectiontimeout", "10000");

        try {
            Session session = Session.getInstance(props);
            try (Store store = session.getStore("imaps")) {
                store.connect(imapHost, imapPort, username, password);
                try (Folder inbox = store.getFolder("INBOX")) {
                    inbox.open(Folder.READ_WRITE);
                    // Unread messages only
                    Message[] messages = inbox.search(new FlagTerm(new Flags(Flag.SEEN), false));
                    this.lastUnreadCount = messages.length;
                    this.lastPollAt = Instant.now();
                    this.lastError = null;
                    System.out.println("EmailReviewAgent: found " + messages.length + " unread messages at " + this.lastPollAt);
                    for (Message msg : messages) {
                        handleMessage(msg);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            this.lastError = e.getClass().getSimpleName() + ": " + String.valueOf(e.getMessage());
            this.lastPollAt = Instant.now();
        }
    }

    private void handleMessage(Message msg) throws MessagingException, IOException {
        Address[] from = msg.getFrom();
        String fromEmail = (from != null && from.length > 0) ? ((InternetAddress) from[0]).getAddress() : null;
        String subject = msg.getSubject();
        String body = extractText(msg);

        FeedbackEmailParser.Parsed parsed = parser.parse(fromEmail, subject, body);
        Map<String, Boolean> have = parsed.missing(requiredFields);
        List<String> missing = have.entrySet().stream().filter(e -> !e.getValue()).map(Map.Entry::getKey).toList();

        if (!missing.isEmpty()) {
            // Ask for missing fields
            String content = parser.buildMissingFieldsPrompt(new LinkedHashSet<>(missing));
            sendReply(fromEmail, subject, content);
            msg.setFlag(Flag.SEEN, true);
            return;
        }

    // Build Feedback and save
        Feedback fb = new Feedback();
        fb.setCustomerName(firstNonNull(parsed.customerName, parsed.userName));
        fb.setUserName(parsed.userName != null ? parsed.userName : (parsed.customerName != null ? parsed.customerName : null));
        fb.setUserEmail(parsed.userEmail);
        fb.setProductId(parsed.productId);
        fb.setRating(parsed.rating != null ? parsed.rating : 0);
        fb.setComment(parsed.comment);
        fb.setFeedback(parsed.comment);

    Feedback saved = feedbackService.saveFeedback(fb);

    // Optional auto-scheduling
    String scheduleNote = "";
    if (schedulingService != null && schedulingService.isAutoScheduleEnabled()) {
        try {
            var result = schedulingService.scheduleWithAutoConflictResolution(
                saved,
                new com.dbs.feedback.service.SchedulingService.ScheduleRequest(
                    null, // desiredStart: default now+1h
                    0,    // duration: use default
                    null, // accessToken: use refresh token if present
                    java.util.List.of()
                )
            );
            scheduleNote = "\nMeeting scheduled: " + result.scheduledStart().toString() +
                    " (" + result.htmlLink() + ")";
        } catch (Exception ex) {
            scheduleNote = "\nScheduling failed: " + ex.getClass().getSimpleName() + ": " + String.valueOf(ex.getMessage());
        }
    }

    Long id = saved != null ? saved.getId() : fb.getId();
    String link = (uiBaseUrl != null && id != null) ? String.format("%s/feedback/%d", uiBaseUrl, id) : null;
    String ack = "Thanks! Your review has been recorded successfully.\n" +
        (id != null ? ("Feedback ID: #" + id + "\n") : "") +
        "Rating: " + (saved != null ? saved.getRating() : fb.getRating()) + "\n" +
        "Comment: " + (fb.getComment() != null ? truncate(fb.getComment(), 200) : "(none)") +
        scheduleNote +
        (link != null ? ("\nView: " + link) : "");
    String subj = (subject == null ? "Your feedback" : subject) + (id != null ? (" [#" + id + "]") : "");
    sendReplyWithSubject(fromEmail, subj, ack);
        msg.setFlag(Flag.SEEN, true);
    }

    private void sendReply(String to, String originalSubject, String text) {
        try {
            MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
            message.setFrom(new InternetAddress(username));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to));
            message.setSubject("Re: " + (originalSubject == null ? "Your feedback" : originalSubject));
            message.setText(text);
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void sendReplyWithSubject(String to, String subject, String text) {
        try {
            MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
            message.setFrom(new InternetAddress(username));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to));
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String extractText(Part p) throws MessagingException, IOException {
        if (p.isMimeType("text/*")) {
            Object content = p.getContent();
            return content == null ? "" : content.toString();
        }
        if (p.isMimeType("multipart/*")) {
            Multipart mp = (Multipart) p.getContent();
            for (int i = 0; i < mp.getCount(); i++) {
                String s = extractText(mp.getBodyPart(i));
                if (s != null && !s.isBlank()) return s;
            }
        }
        if (p.isMimeType("message/rfc822")) {
            return extractText((Part) p.getContent());
        }
        return "";
    }

    private static String firstNonNull(String a, String b) { return a != null ? a : b; }
    private static String truncate(String s, int n) { return s == null ? null : (s.length() > n ? s.substring(0, n) + "…" : s); }

    // Exposed getters for status controller
    public boolean isEnabled() { return enabled; }
    public Instant getLastPollAt() { return lastPollAt; }
    public Integer getLastUnreadCount() { return lastUnreadCount; }
    public String getLastError() { return lastError; }
}
