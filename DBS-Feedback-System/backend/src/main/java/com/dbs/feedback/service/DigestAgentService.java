package com.dbs.feedback.service;

import com.dbs.feedback.model.FeedbackTask;
import com.dbs.feedback.repository.FeedbackTaskRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@Service
public class DigestAgentService {
    private final FeedbackTaskRepository taskRepo;
    private final EmailService emailService;

    @Value("${app.ui.base-url:http://localhost:3000}")
    private String uiBaseUrl;

    @Value("${app.agents.digest.cron:0 0 9 * * MON-FRI}")
    private String cronExpr;

    @Value("${app.agents.digest.enabled:false}")
    private boolean digestEnabled;

    @Value("${app.agents.digest.onlyCriticalHigh:false}")
    private boolean defaultOnlyCriticalHigh;

    // Comma-separated default recipients; if empty, all assignees are targeted
    @Value("${app.agents.digest.recipients:}")
    private String defaultRecipientsCsv;

    // Keep an in-memory snapshot of the last run outcome (manual or scheduled)
    private volatile Map<String, Object> lastRun;

    public DigestAgentService(FeedbackTaskRepository taskRepo, EmailService emailService) {
        this.taskRepo = taskRepo;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> sendDigest(boolean onlyCriticalHigh, List<String> recipientsOverride, boolean dryRun) {
        // Load TODO tasks and keep only assigned ones
        List<FeedbackTask> allTodo = taskRepo.findByStatusOrderByCreatedAtDesc("TODO");
        List<FeedbackTask> assigned = allTodo.stream()
                .filter(t -> t.getAssignedTo() != null && !t.getAssignedTo().isBlank())
                .collect(Collectors.toList());

        if (onlyCriticalHigh) {
            assigned = assigned.stream()
                    .filter(t -> {
                        String p = Optional.ofNullable(t.getPriority()).orElse("").toUpperCase(Locale.ROOT);
                        return p.equals("CRITICAL") || p.equals("HIGH");
                    })
                    .collect(Collectors.toList());
        }

        // Group tasks by assignee
        Map<String, List<FeedbackTask>> byOwner = assigned.stream()
                .collect(Collectors.groupingBy(t -> t.getAssignedTo().trim()));

        // If recipients override provided, filter/group accordingly
        List<String> recipients;
        if (recipientsOverride != null && !recipientsOverride.isEmpty()) {
            recipients = recipientsOverride.stream().map(String::trim).filter(s -> !s.isEmpty()).toList();
        } else {
            recipients = new ArrayList<>(byOwner.keySet());
        }

        Map<String, Integer> perRecipient = new LinkedHashMap<>();
        int sent = 0;
        for (String r : recipients) {
            List<FeedbackTask> items = byOwner.getOrDefault(r, java.util.Collections.emptyList());
            perRecipient.put(r, items.size());
            if (dryRun) continue;
            if (items.isEmpty()) continue;
            // Only send if looks like an email to avoid misfires
            if (!isLikelyEmail(r)) continue;
            String subject = String.format("Your Task Digest (%d open)", items.size());
            String html = buildDigestHtml(r, items);
            try {
                emailService.sendHtmlEmail(r, subject, html);
                sent++;
            } catch (Exception ex) {
                // try plain text fallback
                try {
                    emailService.sendEmail(r, subject, buildDigestText(r, items));
                    sent++;
                } catch (Exception ignore) { /* swallow */ }
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("recipients", recipients);
        out.put("recipientsCount", recipients.size());
        out.put("emailsSent", sent);
        out.put("tasksConsidered", assigned.size());
        out.put("perRecipient", perRecipient);
        out.put("dryRun", dryRun);
        out.put("runAt", LocalDateTime.now().toString());

        // Update last-run snapshot
        this.lastRun = new LinkedHashMap<>(out);
        return out;
    }

    // Default schedule: 9 AM every weekday (Mon-Fri). Can be overridden via app.agents.digest.cron
    @Scheduled(cron = "${app.agents.digest.cron:0 0 9 * * MON-FRI}")
    public void scheduledDigest() {
        if (!digestEnabled) return;
        List<String> recipients = parseRecipients(defaultRecipientsCsv);
        // Run with configured defaults; real send (dryRun=false)
        try {
            sendDigest(defaultOnlyCriticalHigh, recipients, false);
        } catch (Exception ignored) {
            // Avoid crashing scheduler if email fails; logs can be added via a logger
        }
    }

    private List<String> parseRecipients(String csv) {
        if (csv == null || csv.isBlank()) return java.util.Collections.emptyList();
        return Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getConfig() {
        Map<String, Object> cfg = new LinkedHashMap<>();
        cfg.put("enabled", digestEnabled);
        cfg.put("cron", cronExpr);
        cfg.put("onlyCriticalHigh", defaultOnlyCriticalHigh);
        cfg.put("defaultRecipients", parseRecipients(defaultRecipientsCsv));
        if (lastRun != null) cfg.put("lastRun", lastRun);
        return cfg;
    }

    private boolean isLikelyEmail(String s) {
        return s != null && s.contains("@") && s.contains(".") && !s.contains(" ");
    }

    private String buildDigestText(String recipient, List<FeedbackTask> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hello ").append(recipient).append(",\n\n");
        sb.append("Here is your current task digest:\n\n");
        for (FeedbackTask t : items) {
            String url = linkToTask(t.getId());
            sb.append(String.format("#%d [%s] %s\n%s\n\n",
                    t.getId(), safe(t.getPriority()), safe(t.getTitle()), url));
        }
        sb.append("Thanks,\nDBS Feedback System\n");
        return sb.toString();
    }

    private String buildDigestHtml(String recipient, List<FeedbackTask> items) {
        StringBuilder rows = new StringBuilder();
        for (FeedbackTask t : items) {
            String url = linkToTask(t.getId());
            rows.append("<tr>")
                .append(String.format("<td style=\"padding:6px 8px;\">#%d</td>", t.getId()))
                .append(String.format("<td style=\"padding:6px 8px;\">%s</td>", escapeHtml(safe(t.getPriority()))))
                .append(String.format("<td style=\"padding:6px 8px;\">%s</td>", escapeHtml(safe(t.getTitle()))))
                .append(String.format("<td style=\"padding:6px 8px;\"><a href=\"%s\">Open</a></td>", url))
                .append("</tr>");
        }
        return "" +
                "<div style=\"font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b0f19;\">" +
                String.format("<h2 style=\"margin:0 0 12px;\">Your Task Digest (%d open)</h2>", items.size()) +
                "<table style=\"border-collapse:collapse; min-width:540px;\">" +
                "<thead><tr><th align=\"left\" style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;\">ID</th>" +
                "<th align=\"left\" style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;\">Priority</th>" +
                "<th align=\"left\" style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;\">Title</th>" +
                "<th align=\"left\" style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;\">Link</th></tr></thead>" +
                "<tbody>" + rows + "</tbody>" +
                "</table>" +
                "<p style=\"margin:16px 0 0; color:#6b7280; font-size:12px;\">This is an automated summary.</p>" +
                "</div>";
    }

    private String linkToTask(Long id) {
        String base = (uiBaseUrl != null && !uiBaseUrl.isBlank()) ? uiBaseUrl : "http://localhost:3000";
        return String.format("%s/admin/agents?taskId=%d", base, id);
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String safe(String s) { return s == null ? "" : s; }
}
