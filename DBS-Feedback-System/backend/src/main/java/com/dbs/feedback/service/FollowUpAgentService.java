package com.dbs.feedback.service;

import com.dbs.feedback.model.FeedbackTask;
import com.dbs.feedback.model.TaskActivity;
import com.dbs.feedback.repository.FeedbackTaskRepository;
import com.dbs.feedback.repository.TaskActivityRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FollowUpAgentService {
    private final FeedbackTaskRepository taskRepo;
    private final TaskActivityRepository activityRepo;
    private final EmailService emailService;

    @Value("${app.ui.base-url:http://localhost:3000}")
    private String uiBaseUrl;

    // SLA thresholds
    @Value("${app.agents.followup.reminderHours:24}")
    private int reminderHours;

    @Value("${app.agents.followup.escalationHours:48}")
    private int escalationHours;

    public FollowUpAgentService(FeedbackTaskRepository taskRepo, TaskActivityRepository activityRepo, EmailService emailService) {
        this.taskRepo = taskRepo;
        this.activityRepo = activityRepo;
        this.emailService = emailService;
    }

    // Run every hour by default
    @Scheduled(fixedDelayString = "${app.agents.followup.intervalMs:3600000}", initialDelay = 120000)
    @Transactional
    public void scheduledRun() {
        try {
            runFollowUp();
        } catch (Exception ignored) {}
    }

    @Transactional
    public Map<String, Object> runFollowUp() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime remindCutoff = now.minusHours(reminderHours);
        LocalDateTime escalateCutoff = now.minusHours(escalationHours);

        int reminded = 0;
        int escalated = 0;

        // Find tasks assigned, still TODO, and stale by updatedAt
        List<FeedbackTask> toRemind = taskRepo.findByStatusAndAssignedToIsNotNullAndUpdatedAtBefore("TODO", remindCutoff);
        for (FeedbackTask t : toRemind) {
            // If we already reminded in last reminderHours, skip
            TaskActivity lastReminder = activityRepo.findTopByTask_IdAndActionOrderByCreatedAtDesc(t.getId(), "REMINDER");
            if (lastReminder != null && lastReminder.getCreatedAt() != null && lastReminder.getCreatedAt().isAfter(remindCutoff)) {
                continue;
            }
            if (sendReminderEmail(t)) {
                logActivity(t, "FOLLOWUP", "REMINDER", "Reminder email sent to assignee");
                reminded++;
            }
        }

        // Escalation: much older tasks
        List<FeedbackTask> toEscalate = taskRepo.findByStatusAndAssignedToIsNotNullAndUpdatedAtBefore("TODO", escalateCutoff);
        for (FeedbackTask t : toEscalate) {
            TaskActivity lastEsc = activityRepo.findTopByTask_IdAndActionOrderByCreatedAtDesc(t.getId(), "ESCALATED");
            if (lastEsc != null && lastEsc.getCreatedAt() != null && lastEsc.getCreatedAt().isAfter(escalateCutoff)) {
                continue;
            }
            if (sendEscalationEmail(t)) {
                logActivity(t, "FOLLOWUP", "ESCALATED", "Escalation email sent");
                escalated++;
            }
        }

        Map<String, Object> out = new HashMap<>();
        out.put("reminded", reminded);
        out.put("escalated", escalated);
        return out;
    }

    private void logActivity(FeedbackTask task, String agent, String action, String note) {
        TaskActivity a = new TaskActivity();
        a.setTask(task);
        a.setAgent(agent);
        a.setAction(action);
        a.setNote(note);
        activityRepo.save(a);
    }

    private boolean sendReminderEmail(FeedbackTask task) {
        String to = safe(task.getAssignedTo());
        if (!isLikelyEmail(to)) return false;
        String subject = String.format("Reminder: Task #%d pending [%s]", task.getId(), safe(task.getPriority()));
        String body = buildReminderEmailHtml(task, false);
        try {
            emailService.sendHtmlEmail(to, subject, body);
            return true;
        } catch (Exception ex) {
            try {
                emailService.sendEmail(to, subject, buildReminderEmailText(task, false));
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }
    }

    private boolean sendEscalationEmail(FeedbackTask task) {
        String to = safe(task.getAssignedTo());
        if (!isLikelyEmail(to)) return false;
        String subject = String.format("Escalation: Task #%d overdue [%s]", task.getId(), safe(task.getPriority()));
        String body = buildReminderEmailHtml(task, true);
        try {
            emailService.sendHtmlEmail(to, subject, body);
            return true;
        } catch (Exception ex) {
            try {
                emailService.sendEmail(to, subject, buildReminderEmailText(task, true));
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }
    }

    private String buildReminderEmailText(FeedbackTask task, boolean escalation) {
        String url = String.format("%s/admin/agents?taskId=%d", uiBaseUrl, task.getId());
        StringBuilder sb = new StringBuilder();
        sb.append(escalation ? "Escalation notice\n\n" : "Friendly reminder\n\n");
        sb.append(String.format("Task #%d is still open.\n", task.getId()));
        sb.append(String.format("Title: %s\n", safe(task.getTitle())));
        sb.append(String.format("Priority: %s\n", safe(task.getPriority())));
        sb.append("\nOpen Task: ").append(url).append("\n");
        return sb.toString();
    }

    private String buildReminderEmailHtml(FeedbackTask task, boolean escalation) {
        String url = String.format("%s/admin/agents?taskId=%d", uiBaseUrl, task.getId());
        String tone = escalation ? "color:#b91c1c;" : "color:#0b0f19;";
        String badgeBg = escalation ? "#fee2e2" : "#dbeafe";
        String badgeColor = escalation ? "#991b1b" : "#1d4ed8";
        return "" +
                "<div style=\"font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#0b0f19;\">" +
                String.format("  <h2 style=\"margin:0 0 8px; %s\">%s</h2>", tone, escalation ? "Escalation: Task Overdue" : "Task Reminder") +
                String.format("  <p style=\"margin:4px 0;\"><b>Task ID:</b> #%d</p>", task.getId()) +
                String.format("  <p style=\"margin:4px 0;\"><b>Title:</b> %s</p>", escapeHtml(safe(task.getTitle()))) +
                String.format("  <p style=\"margin:4px 0;\"><b>Priority:</b> <span style=\"background:%s;color:%s;padding:2px 8px;border-radius:999px;\">%s</span></p>", badgeBg, badgeColor, escapeHtml(safe(task.getPriority()))) +
                String.format("  <p style=\"margin:16px 0;\"><a href=\"%s\" style=\"display:inline-block; background:#0b0f19; color:#fff; text-decoration:none; padding:10px 16px; border-radius:8px; font-weight:600;\">Open Task</a></p>", url) +
                "  <p style=\"margin:8px 0; color:#6b7280; font-size:12px;\">If the button doesn’t work, copy and paste this link into your browser:<br/><span>" +
                escapeHtml(url) + "</span></p>" +
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

    private String safe(String s) { return s == null ? "" : s; }
    private boolean isLikelyEmail(String s) { return s != null && s.contains("@") && s.contains(".") && !s.contains(" "); }
}
