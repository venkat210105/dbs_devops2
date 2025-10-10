package com.dbs.feedback.service;

import com.dbs.feedback.model.Feedback;
// import com.dbs.util.NLPUtils;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FeedbackAgentService {
    // Simple analytics: count, sentiment breakdown
    public java.util.Map<String, Object> getFeedbackAnalytics() {
        int total = feedbackList.size();
        int positive = 0, negative = 0, neutral = 0;
        for (Feedback f : feedbackList) {
            String sentiment = "neutral";
            if (f.getFeedback() != null) {
                String text = f.getFeedback().toLowerCase();
                if (text.contains("good") || text.contains("excellent") || text.contains("happy")) sentiment = "positive";
                else if (text.contains("bad") || text.contains("poor") || text.contains("angry")) sentiment = "negative";
            }
            switch (sentiment) {
                case "positive": positive++; break;
                case "negative": negative++; break;
                default: neutral++;
            }
        }
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("total", total);
        result.put("positive", positive);
        result.put("negative", negative);
        result.put("neutral", neutral);
        return result;
    }
    // For demo: store feedbacks in memory (replace with DB in production)
    private final List<Feedback> feedbackList = new java.util.ArrayList<>();

    public List<Feedback> getAllFeedbacks() {
        return feedbackList;
    }

    public Feedback getFeedbackById(Long id) {
        for (Feedback f : feedbackList) {
            if (f.getId() != null && f.getId().equals(id)) {
                return f;
            }
        }
        return null;
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
    String reason = "Transaction Issue";  // replace with NLP extraction later

    public void processFeedback(Feedback feedback) {
        String text = feedback.getComment();
        feedbackList.add(feedback);
        String dbsEmailBody = String.format(
            "⚠ Important Feedback Alert!\n\n" +
            "Customer Name: %s\n" +
            "Customer Email: %s\n" +
            "Product/Service: %s\n" +
            "Service Category: %s\n" +
            "Service Channel: %s\n" +
            "Customer Type: %s\n" +
            "Business Unit: %s\n\n" +
            "Feedback Summary: %s\n" +
            "Detailed Feedback: %s\n\n" +
            "Detected Issue/Reason: %s\n\n" +
            "Please follow up with the customer promptly.",
            feedback.getCustomerName(),
            feedback.getEmail(),
            feedback.getProductId(),
            feedback.getServiceCategory(),
            feedback.getServiceChannel(),
            feedback.getCustomerType(),
            feedback.getBusinessUnit(),
            feedback.getComment(),
            feedback.getFeedback(),
            reason
        );

        String accessToken = System.getenv("GOOGLE_OAUTH_ACCESS_TOKEN"); // Use env variable, not hardcoded
        String calendarText = "No meeting link available.";
        String calendarLink = null;
        try {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            String adminEmail = "venkatmariserla001@gmail.com";
            calendarLink = googleCalendarService.scheduleMeeting(
                accessToken,
                adminEmail,
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

        String dbsEmailBodyWithCalendar = dbsEmailBody + "\n\n" + calendarText;
        emailService.sendEmail(
            "venkatmariserla02@gmail.com", // receiver
            "⚠ Important Feedback Received",
            "From: " + senderEmail + "\nCustomer: " + feedback.getEmail() +
            "\nMessage: " + dbsEmailBodyWithCalendar
        );

        // Prepare customer email body
        String customerEmailBody = String.format(
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
        emailService.sendEmail(
            feedback.getEmail(), // receiver
            "Your issue is being reviewed",
            customerEmailBody
        );
    }

    private LocalDateTime getNextAvailableSlot() {
    // Slot logic removed
    return null;
    }
}