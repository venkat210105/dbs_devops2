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
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SLAAgentService {
    private final FeedbackTaskRepository taskRepo;
    private final TaskActivityRepository activityRepo;
    private final EmailService emailService;

    @Value("${app.ui.base-url:http://localhost:3000}")
    private String uiBaseUrl;

    @Value("${app.agents.sla.enabled:false}")
    private boolean enabled;

    @Value("${app.agents.sla.cron:0 */30 * * * *}")
    private String cronExpr;

    @Value("${app.agents.sla.windows.CRITICAL:4}")
    private int winCriticalHours;

    @Value("${app.agents.sla.windows.HIGH:24}")
    private int winHighHours;

    @Value("${app.agents.sla.windows.MEDIUM:72}")
    private int winMediumHours;

    @Value("${app.agents.sla.windows.LOW:120}")
    private int winLowHours;

    @Value("${app.agents.sla.escalationRecipients:}")
    private String escalationRecipientsCsv;

    private volatile Map<String, Object> lastRun;

    public SLAAgentService(FeedbackTaskRepository taskRepo, TaskActivityRepository activityRepo, EmailService emailService) {
        this.taskRepo = taskRepo;
        this.activityRepo = activityRepo;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> run(boolean dryRun) {
        List<FeedbackTask> open = taskRepo.findByStatusOrderByCreatedAtDesc("TODO");
        int reminded = 0, escalated = 0;
        LocalDateTime now = LocalDateTime.now();
        for (FeedbackTask t : open) {
            String p = Optional.ofNullable(t.getPriority()).orElse("MEDIUM").toUpperCase(Locale.ROOT);
            int hours = switch (p) {
                case "CRITICAL" -> winCriticalHours;
                case "HIGH" -> winHighHours;
                case "LOW" -> winLowHours;
                default -> winMediumHours;
            };
            if (t.getCreatedAt() == null) continue;
            LocalDateTime created = t.getCreatedAt();
            LocalDateTime due = created.plusHours(hours);
            LocalDateTime remindAt = created.plusSeconds((long) (hours * 3600 * 0.8)); // 80%

            boolean pastDue = !now.isBefore(due);
            boolean pastRemind = !now.isBefore(remindAt);

            if (pastDue) {
                // Skip if already escalated once
                TaskActivity prev = activityRepo.findTopByTask_IdAndActionOrderByCreatedAtDesc(t.getId(), "SLA_ESCALATED");
                if (prev != null) continue;
                if (!dryRun) {
                    sendEscalation(t, due);
                    log(t, "SLA_ESCALATED", "SLA breached; due=" + due);
                }
                escalated++;
            } else if (pastRemind) {
                TaskActivity prev = activityRepo.findTopByTask_IdAndActionOrderByCreatedAtDesc(t.getId(), "SLA_REMINDER");
                if (prev != null) continue;
                if (!dryRun) {
                    sendReminder(t, due);
                    log(t, "SLA_REMINDER", "Approaching SLA; due=" + due);
                }
                reminded++;
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("considered", open.size());
        out.put("reminded", reminded);
        out.put("escalated", escalated);
        out.put("dryRun", dryRun);
        out.put("runAt", LocalDateTime.now().toString());
        lastRun = out;
        return out;
    }

    private void sendReminder(FeedbackTask t, LocalDateTime due) {
        String to = t.getAssignedTo();
        if (isLikelyEmail(to)) {
            String subject = String.format("SLA Reminder: Task #%d due by %s", t.getId(), due);
            String body = buildHtml(t, "This is a friendly reminder that the task is approaching its SLA due time.", due);
            try { emailService.sendHtmlEmail(to, subject, body); } catch (Exception ignore) {}
        }
    }

    private void sendEscalation(FeedbackTask t, LocalDateTime due) {
        List<String> recipients = parseRecipients(escalationRecipientsCsv);
        if (isLikelyEmail(t.getAssignedTo())) recipients.add(t.getAssignedTo());
        String subject = String.format("SLA Breach: Task #%d overdue", t.getId());
        String body = buildHtml(t, "The task has breached its SLA due time and requires immediate attention.", due);
        for (String r : recipients) {
            try { emailService.sendHtmlEmail(r, subject, body); } catch (Exception ignore) {}
        }
    }

    private String buildHtml(FeedbackTask t, String message, LocalDateTime due) {
        String url = String.format("%s/admin/agents?taskId=%d", (uiBaseUrl != null && !uiBaseUrl.isBlank()) ? uiBaseUrl : "http://localhost:3000", t.getId());
        return "<div style=\"font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif\">" +
                String.format("<h3 style=\"margin:0 0 8px\">Task #%d - %s</h3>", t.getId(), escape(safe(t.getTitle()))) +
                String.format("<p style=\"margin:0 0 8px\"><b>Priority:</b> %s &nbsp; <b>Due:</b> %s</p>", escape(safe(t.getPriority())), due) +
                String.format("<p style=\"margin:0 0 12px\">%s</p>", escape(message)) +
                String.format("<p><a href=\"%s\">Open Task</a></p>", url) +
                "</div>";
    }

    private void log(FeedbackTask t, String action, String note) {
        TaskActivity a = new TaskActivity();
        a.setTask(t);
        a.setAgent("SLA");
        a.setAction(action);
        a.setNote(note);
        activityRepo.save(a);
    }

    private boolean isLikelyEmail(String s) { return s != null && s.contains("@") && s.contains(".") && !s.contains(" "); }
    private List<String> parseRecipients(String csv) {
        if (csv == null || csv.isBlank()) return new ArrayList<>();
        return Arrays.stream(csv.split(",")).map(String::trim).filter(x -> !x.isEmpty()).collect(Collectors.toList());
    }
    private String safe(String s) { return s == null ? "" : s; }
    private String escape(String s) { return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;"); }

    @Scheduled(cron = "${app.agents.sla.cron:0 */30 * * * *}")
    public void scheduled() {
        if (!enabled) return;
        try { run(false); } catch (Exception ignore) {}
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getConfig() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("enabled", enabled);
        m.put("cron", cronExpr);
        Map<String, Integer> windows = new LinkedHashMap<>();
        windows.put("CRITICAL", winCriticalHours);
        windows.put("HIGH", winHighHours);
        windows.put("MEDIUM", winMediumHours);
        windows.put("LOW", winLowHours);
        m.put("windows", windows);
        m.put("escalationRecipients", parseRecipients(escalationRecipientsCsv));
        if (lastRun != null) m.put("lastRun", lastRun);
        return m;
    }
}
