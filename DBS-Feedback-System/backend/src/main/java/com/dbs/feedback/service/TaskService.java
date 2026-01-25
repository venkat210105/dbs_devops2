package com.dbs.feedback.service;

import com.dbs.feedback.model.Feedback;
import com.dbs.feedback.model.FeedbackTask;
import com.dbs.feedback.repository.FeedbackRepository;
import com.dbs.feedback.repository.FeedbackTaskRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class TaskService {
    private final FeedbackTaskRepository taskRepository;
    private final FeedbackRepository feedbackRepository;
    private final EmailService emailService;

    @Value("${app.ui.base-url:http://localhost:3000}")
    private String uiBaseUrl;

    public TaskService(FeedbackTaskRepository taskRepository, FeedbackRepository feedbackRepository, EmailService emailService) {
        this.taskRepository = taskRepository;
        this.feedbackRepository = feedbackRepository;
        this.emailService = emailService;
    }

    public String computePriority(Feedback f) {
        // Base priority
        String priority = "MEDIUM";

        // Negative or very low rating => elevate
        if (f.getRating() <= 2 || (f.getSentimentLabel() != null && f.getSentimentLabel().equalsIgnoreCase("NEGATIVE"))) {
            priority = "HIGH";
        }

        // Keyword-based boost
        String text = (f.getFeedback() != null && !f.getFeedback().isEmpty()) ? f.getFeedback() : (f.getComment() != null ? f.getComment() : "");
        String lower = text.toLowerCase(Locale.ROOT);
        if (lower.contains("urgent") || lower.contains("asap") || lower.contains("immediately") || lower.contains("outage") || lower.contains("down")) {
            priority = "CRITICAL";
        } else if (lower.contains("crash") || lower.contains("error") || lower.contains("payment")) {
            if (!"CRITICAL".equals(priority)) priority = "HIGH";
        }

        // Customer type boost
        if (f.getCustomerType() != null && f.getCustomerType().toLowerCase(Locale.ROOT).contains("premium")) {
            if (!"CRITICAL".equals(priority)) priority = "HIGH";
        }

        return priority;
    }

    /** Create a system task not tied to a specific feedback (e.g., anomaly alerts). */
    @Transactional
    public FeedbackTask createSystemTask(String title, String description, String priority) {
        FeedbackTask task = new FeedbackTask();
        task.setFeedback(null);
        task.setStatus("TODO");
        task.setPriority(priority != null ? priority : "HIGH");
        task.setTitle(title != null ? title : "System Alert");
        task.setDescription(description);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        return taskRepository.save(task);
    }

    @Transactional
    public FeedbackTask createTaskForFeedback(Long feedbackId, String title, String description, String assignedTo) {
        Feedback feedback = feedbackRepository.findById(feedbackId).orElseThrow(() -> new NoSuchElementException("Feedback not found: " + feedbackId));

        // Avoid duplicate open tasks for same feedback
        if (taskRepository.existsByFeedback_IdAndStatus(feedbackId, "TODO")) {
            // return the latest TODO
            return taskRepository.findTopByFeedback_IdOrderByCreatedAtDesc(feedbackId).orElseThrow();
        }

        FeedbackTask task = new FeedbackTask();
        task.setFeedback(feedback);
        task.setStatus("TODO");
        task.setPriority(computePriority(feedback));
        task.setTitle(title != null ? title : defaultTitle(feedback));
        task.setDescription(description != null ? description : defaultDescription(feedback));
        task.setAssignedTo(assignedTo);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        FeedbackTask saved = taskRepository.save(task);
        // If created with an assignee, notify them
        maybeSendAssignmentEmail(saved);
        return saved;
    }

    private String defaultTitle(Feedback f) {
        String topic = f.getTopic() != null ? f.getTopic() : (f.getServiceCategory() != null ? f.getServiceCategory() : "General");
        String sentiment = f.getSentimentLabel() != null ? f.getSentimentLabel() : "Neutral";
        return String.format("%s issue - %s", topic, sentiment);
    }

    private String defaultDescription(Feedback f) {
        StringBuilder sb = new StringBuilder();
        sb.append("Automatically generated task for feedback #").append(f.getId()).append(".\n");
        if (f.getFeedback() != null && !f.getFeedback().isEmpty()) {
            sb.append("Feedback: ").append(f.getFeedback());
        } else if (f.getComment() != null && !f.getComment().isEmpty()) {
            sb.append("Comment: ").append(f.getComment());
        }
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public List<FeedbackTask> listByStatus(String status) {
        // Ensure feedback proxy is initialized only to get id when mapping later
        List<FeedbackTask> tasks = taskRepository.findByStatusOrderByCreatedAtDesc(status);
        // Touch feedback id to initialize proxies
        for (FeedbackTask t : tasks) {
            if (t.getFeedback() != null) {
                t.getFeedback().getId();
            }
        }
        return tasks;
    }

    @Transactional
    public FeedbackTask markDone(Long taskId, String resolutionNote) {
        FeedbackTask task = taskRepository.findById(taskId).orElseThrow(() -> new NoSuchElementException("Task not found: " + taskId));
        task.setStatus("DONE");
        task.setDoneAt(LocalDateTime.now());
        task.setResolutionNote(resolutionNote);
        return taskRepository.save(task);
    }

    @Transactional(readOnly = true)
    public Optional<FeedbackTask> findById(Long id) {
        return taskRepository.findById(id);
    }

    @Transactional
    public void deleteById(Long id) {
        taskRepository.deleteById(id);
    }

    /** Assign a task to an owner */
    @Transactional
    public FeedbackTask assign(Long taskId, String assignedTo) {
        FeedbackTask task = taskRepository.findById(taskId).orElseThrow(() -> new NoSuchElementException("Task not found: " + taskId));
        task.setAssignedTo(assignedTo);
        task.setUpdatedAt(LocalDateTime.now());
        FeedbackTask saved = taskRepository.save(task);
        // Notify assignee via email if possible
        maybeSendAssignmentEmail(saved);
        return saved;
    }

    /** Generate tasks for recent feedback that have no open task. Optionally only negatives. */
    @Transactional
    public Map<String, Object> generateTasks(boolean onlyNegative) {
        List<Feedback> all = feedbackRepository.findAll();
        int created = 0;
        for (Feedback f : all) {
            if (taskRepository.existsByFeedback_IdAndStatus(f.getId(), "TODO")) continue;
            if (onlyNegative) {
                if (f.getSentimentLabel() == null || !"NEGATIVE".equalsIgnoreCase(f.getSentimentLabel())) continue;
            }
            createTaskForFeedback(f.getId(), null, null, null);
            created++;
        }
        Map<String, Object> out = new HashMap<>();
        out.put("created", created);
        return out;
    }

    /** If assignedTo looks like an email, send an assignment notification with feedback details. */
    private void maybeSendAssignmentEmail(FeedbackTask task) {
        try {
            String to = task.getAssignedTo();
            if (to == null) return;
            String trimmed = to.trim();
            if (trimmed.isEmpty() || !isLikelyEmail(trimmed)) return;

            String subject = String.format("Task Assigned: #%d - %s [%s]", task.getId(),
                    safe(task.getTitle()), safe(task.getPriority()));
            String html = buildAssignmentEmailHtml(task);
            try {
                emailService.sendHtmlEmail(trimmed, subject, html);
            } catch (Exception htmlEx) {
                // Fallback to plain text
                String body = buildAssignmentEmailBody(task);
                emailService.sendEmail(trimmed, subject, body);
            }
        } catch (Exception ex) {
            // Do not fail the transaction if email sending fails
            System.out.println("Assignment email failed: " + ex.getMessage());
        }
    }

    private boolean isLikelyEmail(String s) {
        // Simple heuristic; can be replaced with stricter validation if needed
        return s.contains("@") && s.contains(".") && !s.contains(" ");
    }

    private String buildAssignmentEmailBody(FeedbackTask task) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hello,\n\n");
        sb.append("You have been assigned a new task.\n\n");
        sb.append(String.format("Task ID: #%d\n", task.getId()));
        sb.append(String.format("Title: %s\n", safe(task.getTitle())));
        sb.append(String.format("Priority: %s\n", safe(task.getPriority())));
        sb.append(String.format("Status: %s\n", safe(task.getStatus())));
        if (task.getDescription() != null && !task.getDescription().isBlank()) {
            sb.append("\nDescription:\n").append(task.getDescription()).append("\n");
        }

        Feedback f = task.getFeedback();
        if (f != null) {
            sb.append("\nLinked Feedback Details:\n");
            sb.append(String.format("- Feedback ID: %d\n", f.getId()));
            if (f.getRating() > 0) sb.append(String.format("- Rating: %d/5\n", f.getRating()));
            if (f.getSentimentLabel() != null) sb.append(String.format("- Sentiment: %s\n", f.getSentimentLabel()));
            if (f.getTopic() != null) sb.append(String.format("- Topic: %s\n", f.getTopic()));
            if (f.getServiceCategory() != null) sb.append(String.format("- Service: %s\n", f.getServiceCategory()));
            if (f.getCustomerName() != null) sb.append(String.format("- Customer Name: %s\n", f.getCustomerName()));
            if (f.getEmail() != null) sb.append(String.format("- Customer Email: %s\n", f.getEmail()));
            if (f.getUserEmail() != null) sb.append(String.format("- Submitted By: %s\n", f.getUserEmail()));
            String text = (f.getFeedback() != null && !f.getFeedback().isBlank()) ? f.getFeedback() : f.getComment();
            if (text != null && !text.isBlank()) {
                sb.append("\nCustomer Message:\n").append(text).append("\n");
            }
        }

        // Deep link to task in Admin Agents page
        String url = String.format("%s/admin/agents?taskId=%d", uiBaseUrl != null ? uiBaseUrl : "http://localhost:3000", task.getId());
        sb.append("\nOpen Task: ").append(url).append("\n");

        sb.append("\nThanks,\nDBS Feedback System\n");
        return sb.toString();
    }

    private String safe(String s) { return s == null ? "" : s; }

    private String buildAssignmentEmailHtml(FeedbackTask task) {
        String url = String.format("%s/admin/agents?taskId=%d", uiBaseUrl != null ? uiBaseUrl : "http://localhost:3000", task.getId());
        StringBuilder fb = new StringBuilder();
        Feedback f = task.getFeedback();
        if (f != null) {
            fb.append("<ul style=\"margin:8px 0 0 16px; padding:0;\">");
            fb.append(String.format("<li><b>Feedback ID:</b> %d</li>", f.getId()));
            if (f.getRating() > 0) fb.append(String.format("<li><b>Rating:</b> %d/5</li>", f.getRating()));
            if (f.getSentimentLabel() != null) fb.append(String.format("<li><b>Sentiment:</b> %s</li>", f.getSentimentLabel()));
            if (f.getTopic() != null) fb.append(String.format("<li><b>Topic:</b> %s</li>", f.getTopic()));
            if (f.getServiceCategory() != null) fb.append(String.format("<li><b>Service:</b> %s</li>", f.getServiceCategory()));
            if (f.getCustomerName() != null) fb.append(String.format("<li><b>Customer Name:</b> %s</li>", f.getCustomerName()));
            if (f.getEmail() != null) fb.append(String.format("<li><b>Customer Email:</b> %s</li>", f.getEmail()));
            if (f.getUserEmail() != null) fb.append(String.format("<li><b>Submitted By:</b> %s</li>", f.getUserEmail()));
            String text = (f.getFeedback() != null && !f.getFeedback().isBlank()) ? f.getFeedback() : f.getComment();
            if (text != null && !text.isBlank()) {
                fb.append(String.format("<li><b>Message:</b> %s</li>", escapeHtml(text)));
            }
            fb.append("</ul>");
        }

        String description = (task.getDescription() != null && !task.getDescription().isBlank())
                ? String.format("<p style=\"margin:8px 0;\"><b>Description:</b><br/>%s</p>", escapeHtml(task.getDescription()))
                : "";

        return "" +
                "<div style=\"font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#0b0f19;\">" +
                "  <h2 style=\"font-weight:700; margin:0 0 8px;\">Task Assigned</h2>" +
                String.format("  <p style=\"margin:4px 0;\"><b>Task ID:</b> #%d</p>", task.getId()) +
                String.format("  <p style=\"margin:4px 0;\"><b>Title:</b> %s</p>", escapeHtml(safe(task.getTitle()))) +
                String.format("  <p style=\"margin:4px 0;\"><b>Priority:</b> %s</p>", escapeHtml(safe(task.getPriority()))) +
                String.format("  <p style=\"margin:4px 0 12px;\"><b>Status:</b> %s</p>", escapeHtml(safe(task.getStatus()))) +
                description +
                (f != null ? "  <p style=\"margin:12px 0 4px;\"><b>Linked Feedback:</b></p>" + fb.toString() : "") +
                String.format("  <p style=\"margin:16px 0;\"><a href=\"%s\" style=\"display:inline-block; background:#0b0f19; color:#fff; text-decoration:none; padding:10px 16px; border-radius:8px; font-weight:600;\">Open Task</a></p>", url) +
                "  <p style=\"margin:8px 0; color:#6b7280; font-size:12px;\">If the button doesn’t work, copy and paste this link into your browser:<br/><span>" +
                escapeHtml(url) + "</span></p>" +
                "  <p style=\"margin:16px 0 0; color:#6b7280; font-size:12px;\">Thanks,<br/>DBS Feedback System</p>" +
                "</div>";
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
