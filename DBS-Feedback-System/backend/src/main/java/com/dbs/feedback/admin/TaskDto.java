package com.dbs.feedback.admin;

import com.dbs.feedback.model.FeedbackTask;

import java.time.LocalDateTime;

public class TaskDto {
    public Long id;
    public Long feedbackId;
    public String priority;
    public String status;
    public String assignedTo;
    public String title;
    public String description;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public LocalDateTime doneAt;
    public String resolutionNote;

    public static TaskDto from(FeedbackTask t) {
        TaskDto d = new TaskDto();
        d.id = t.getId();
        d.feedbackId = (t.getFeedback() != null ? t.getFeedback().getId() : null);
        d.priority = t.getPriority();
        d.status = t.getStatus();
        d.assignedTo = t.getAssignedTo();
        d.title = t.getTitle();
        d.description = t.getDescription();
        d.createdAt = t.getCreatedAt();
        d.updatedAt = t.getUpdatedAt();
        d.doneAt = t.getDoneAt();
        d.resolutionNote = t.getResolutionNote();
        return d;
    }
}
