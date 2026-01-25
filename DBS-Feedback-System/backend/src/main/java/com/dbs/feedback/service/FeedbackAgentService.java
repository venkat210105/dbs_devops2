package com.dbs.feedback.service;

import com.dbs.feedback.model.Feedback;
import com.dbs.feedback.repository.FeedbackRepository;
// import com.dbs.util.NLPUtils;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FeedbackAgentService {
    @Autowired
    private FeedbackRepository feedbackRepository;

    // Advanced analytics: count, sentiment, topic/service breakdown (now DB-backed)
    public java.util.Map<String, Object> getFeedbackAnalytics() {
        List<Feedback> all = feedbackRepository.findAll();
        int total = all.size();
        int positive = 0, negative = 0, neutral = 0;
        java.util.Map<String, Integer> topicBreakdown = new java.util.HashMap<>();
        java.util.Map<String, Integer> serviceBreakdown = new java.util.HashMap<>();
        for (Feedback f : all) {
            String s = f.getSentimentLabel() != null ? f.getSentimentLabel().toLowerCase() : "neutral";
            switch (s) {
                case "positive": positive++; break;
                case "negative": negative++; break;
                default: neutral++;
            }
            String topic = f.getTopic();
            if (topic != null && !topic.isEmpty()) {
                topicBreakdown.put(topic, topicBreakdown.getOrDefault(topic, 0) + 1);
            }
            String service = f.getServiceCategory();
            if (service != null && !service.isEmpty()) {
                serviceBreakdown.put(service, serviceBreakdown.getOrDefault(service, 0) + 1);
            }
        }
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("total", total);
        result.put("positive", positive);
        result.put("negative", negative);
        result.put("neutral", neutral);
        result.put("topicBreakdown", topicBreakdown);
        result.put("serviceBreakdown", serviceBreakdown);
        return result;
    }

    // For legacy/demo – retain in-memory list but prefer DB for reads
    private final List<Feedback> feedbackList = new java.util.ArrayList<>();

    public List<Feedback> getAllFeedbacks() {
        return feedbackRepository.findAll();
    }

    public Feedback getFeedbackById(Long id) {
        return feedbackRepository.findById(id).orElse(null);
    }
    // Inject sender email from application.properties
    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String senderEmail;

    private final EmailService emailService;
    @org.springframework.beans.factory.annotation.Autowired
    private GoogleCalendarService googleCalendarService;

    // ...existing code...

    public FeedbackAgentService(EmailService emailService) {
        this.emailService = emailService;
    }

    // Dynamic tech guy assignment based on topic/service
    private String assignTechGuy(Feedback feedback) {
        String topic = feedback.getTopic();
        String service = feedback.getServiceCategory();
        // Example: map topic/service to tech guy
        if (topic != null && topic.toLowerCase().contains("loan")) {
            return "loan.techguy@dbs.com";
        } else if (service != null && service.toLowerCase().contains("credit")) {
            return "credit.techguy@dbs.com";
        }
        return "venkatmariserla02@gmail.com"; // default
    }

    public void processFeedback(Feedback feedback) {
        feedbackList.add(feedback);
        boolean isCritical = false;
        // Check for critical feedback: rating <= 2 or sentiment NEGATIVE
        if (feedback.getRating() <= 2) {
            isCritical = true;
        } else if (feedback.getSentimentLabel() != null && feedback.getSentimentLabel().equalsIgnoreCase("NEGATIVE")) {
            isCritical = true;
        }

        String techGuyEmail = assignTechGuy(feedback);
        String reason = feedback.getTopic() != null ? feedback.getTopic() : "General Issue";

        String dbsEmailBody = String.format(
            "Feedback Alert!\n\n" +
            "Customer Name: %s\n" +
            "Customer Email: %s\n" +
            "Product/Service: %s\n" +
            "Service Category: %s\n" +
            "Topic: %s\n" +
            "Service Channel: %s\n" +
            "Customer Type: %s\n" +
            "Business Unit: %s\n\n" +
            "Feedback Summary: %s\n" +
            "Detailed Feedback: %s\n\n" +
            "Detected Issue/Reason: %s\n" +
            "Assigned Tech Guy: %s\n\n",
            feedback.getCustomerName(),
            feedback.getEmail(),
            feedback.getProductId(),
            feedback.getServiceCategory(),
            feedback.getTopic(),
            feedback.getServiceChannel(),
            feedback.getCustomerType(),
            feedback.getBusinessUnit(),
            feedback.getComment(),
            feedback.getFeedback(),
            reason,
            techGuyEmail
        );

        String calendarText = "";
        String calendarLink = null;
        if (isCritical) {
            String accessToken = System.getenv("GOOGLE_OAUTH_ACCESS_TOKEN");
            try {
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                String adminEmail = "venkatmariserla001@gmail.com";
                calendarLink = googleCalendarService.scheduleMeeting(
                    accessToken,
                    feedback.getEmail(), // customer email
                    "DBS Feedback Meeting",
                    "Scheduled via FeedbackAgentService integration at " + now.toString()
                );
                if (calendarLink != null && !calendarLink.isEmpty()) {
                    calendarText = "Add this meeting to your calendar: " + calendarLink;
                } else {
                    calendarText = "Authorization required to generate meeting link.";
                }
                System.out.println("Meeting scheduled: " + calendarLink);
            } catch (Exception ex) {
                calendarText = "Authorization required to generate meeting link.";
                System.out.println("Error scheduling meeting: " + ex.getMessage());
            }
        }

        String dbsEmailBodyWithCalendar = dbsEmailBody + (isCritical ? ("\n\n" + calendarText) : "\n\nNo meeting scheduled (feedback not critical).");
        try {
            emailService.sendEmail(
                techGuyEmail, // receiver
                (isCritical ? "⚠ Critical Feedback Received" : "Feedback Received"),
                "From: " + senderEmail + "\nCustomer: " + String.valueOf(feedback.getEmail()) +
                "\nMessage: " + dbsEmailBodyWithCalendar
            );
        } catch (Exception ex) {
            System.out.println("Internal notification email failed: " + ex.getMessage());
        }

        // Prepare customer email body
        String customerEmailBody;
        if (isCritical && feedback.getEmail() != null && !feedback.getEmail().isBlank()) {
            customerEmailBody = String.format(
                "Dear %s,\n\n" +
                "Thank you for your feedback regarding %s.\n\n" +
                "We have detected the following issue: %s\n\n" +
                "Feedback Summary: %s\n" +
                "Detailed Feedback: %s\n\n" +
                "We appreciate your patience and will ensure the matter is resolved promptly.\n\n" +
                calendarText + "\n\n" +
                "Best regards,\n" +
                "DBS Customer Support Team",
                feedback.getCustomerName(),
                feedback.getServiceCategory(),
                reason,
                feedback.getComment(),
                feedback.getFeedback()
            );
            try {
                emailService.sendEmail(
                    feedback.getEmail(), // receiver
                    "Your issue is being reviewed",
                    customerEmailBody
                );
            } catch (Exception ex) {
                System.out.println("Customer email (critical) failed: " + ex.getMessage());
            }
        } else {
            // Send non-critical customer email only if address available
            if (feedback.getEmail() != null && !feedback.getEmail().isBlank()) {
                customerEmailBody = String.format(
                    "Dear %s,\n\n" +
                    "Thank you for your feedback regarding %s.\n\n" +
                    "Feedback Summary: %s\n" +
                    "Detailed Feedback: %s\n\n" +
                    "We appreciate your input and will use it to improve our services.\n\n" +
                    "Best regards,\n" +
                    "DBS Customer Support Team",
                    feedback.getCustomerName(),
                    feedback.getServiceCategory(),
                    feedback.getComment(),
                    feedback.getFeedback()
                );
                try {
                    emailService.sendEmail(
                        feedback.getEmail(), // receiver
                        "Thank you for your feedback",
                        customerEmailBody
                    );
                } catch (Exception ex) {
                    System.out.println("Customer email (non-critical) failed: " + ex.getMessage());
                }
            }
        }
    }

    private LocalDateTime getNextAvailableSlot() {
        // ...existing code...
        return null;
    }
}