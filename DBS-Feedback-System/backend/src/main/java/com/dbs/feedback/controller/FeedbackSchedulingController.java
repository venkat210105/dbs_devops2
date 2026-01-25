package com.dbs.feedback.controller;

import com.dbs.feedback.model.Feedback;
import com.dbs.feedback.repository.FeedbackRepository;
import com.dbs.feedback.service.SchedulingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/feedback")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true",
        maxAge = 3600)
public class FeedbackSchedulingController {

    private final FeedbackRepository repo;
    private final SchedulingService scheduling;

    public FeedbackSchedulingController(FeedbackRepository repo, SchedulingService scheduling) {
        this.repo = repo;
        this.scheduling = scheduling;
    }

    public record ScheduleBody(String desiredStartIso, Integer durationMinutes, String accessToken, List<String> attendees) {}

    @PostMapping("/{id}/schedule")
    public ResponseEntity<?> schedule(@PathVariable Long id, @RequestBody(required = false) ScheduleBody body) {
        Feedback fb = repo.findById(id).orElse(null);
        if (fb == null) return ResponseEntity.notFound().build();
        try {
            Instant desired = null;
            if (body != null && body.desiredStartIso() != null && !body.desiredStartIso().isBlank()) {
                desired = Instant.parse(body.desiredStartIso());
            }
            int duration = (body != null && body.durationMinutes() != null && body.durationMinutes() > 0) ? body.durationMinutes() : 30;
            var req = new SchedulingService.ScheduleRequest(desired, duration, body != null ? body.accessToken() : null, body != null ? body.attendees() : null);
            var result = scheduling.scheduleWithAutoConflictResolution(fb, req);
            return ResponseEntity.ok(Map.of(
                    "scheduledStart", result.scheduledStart().toString(),
                    "scheduledEnd", result.scheduledEnd().toString(),
                    "eventId", result.eventId(),
                    "htmlLink", result.htmlLink()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getMessage(),
                    "type", e.getClass().getSimpleName()
            ));
        }
    }

    @GetMapping("/{id}/schedule/status")
    public ResponseEntity<?> scheduleStatus(@PathVariable Long id) {
        Feedback fb = repo.findById(id).orElse(null);
        if (fb == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of(
                "schedulingStatus", fb.getSchedulingStatus(),
                "scheduledAt", fb.getScheduledAt() != null ? fb.getScheduledAt().toInstant().toString() : null,
                "durationMinutes", fb.getMeetingDurationMinutes(),
                "calendarEventId", fb.getCalendarEventId()
        ));
    }
}
