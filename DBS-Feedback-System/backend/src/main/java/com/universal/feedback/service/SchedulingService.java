package com.universal.feedback.service;

import com.universal.feedback.GoogleCalendarConfig;
import com.universal.feedback.model.Feedback;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.auth.oauth2.GoogleRefreshTokenRequest;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class SchedulingService {

    private final GoogleCalendarConfig config;
    private final FeedbackService feedbackService;

    @Value("${google.oauth.refreshToken:}")
    private String storedRefreshToken;

    @Value("${app.calendar.auto-schedule:false}")
    private boolean autoScheduleEnabled;

    @Value("${app.calendar.default-duration-mins:30}")
    private int defaultDurationMins;

    public SchedulingService(GoogleCalendarConfig config, FeedbackService feedbackService) {
        this.config = config;
        this.feedbackService = feedbackService;
    }

    public boolean isAutoScheduleEnabled() { return autoScheduleEnabled; }

    public record ScheduleRequest(Instant desiredStart, int durationMins, String accessToken, List<String> attendees){}

    public record ScheduleResult(Instant scheduledStart, Instant scheduledEnd, String eventId, String htmlLink){}

    // Entrypoint used by controllers/agents
    public ScheduleResult scheduleWithAutoConflictResolution(Feedback fb, ScheduleRequest req) throws Exception {
        int duration = req.durationMins() > 0 ? req.durationMins() : defaultDurationMins;
        Instant start = req.desiredStart() != null ? req.desiredStart() : Instant.now().plus(1, ChronoUnit.HOURS);
        Calendar calendar = buildCalendarClient(req.accessToken());

        // Build attendee list: admin + optional feedback submitter
        List<EventAttendee> attendees = new ArrayList<>();
        String adminEmail = System.getenv().getOrDefault("SMTP_USERNAME", "");
        if (adminEmail != null && !adminEmail.isBlank()) {
            attendees.add(new EventAttendee().setEmail(adminEmail));
        }
        if (fb.getUserEmail() != null && !fb.getUserEmail().isBlank()) {
            attendees.add(new EventAttendee().setEmail(fb.getUserEmail()));
        }
        if (req.attendees() != null) {
            for (String a : req.attendees()) {
                if (a != null && !a.isBlank()) attendees.add(new EventAttendee().setEmail(a));
            }
        }

        // Find next free slot within next 14 days, stepping 15 minutes
        Instant windowEnd = start.plus(14, ChronoUnit.DAYS);
        Instant slot = findNextFreeSlot(calendar, attendees, start, duration, windowEnd, 15);
        if (slot == null) {
            throw new IllegalStateException("No free slot found within 14 days");
        }
        Event event = buildEventForFeedback(fb, attendees, slot, duration);
        Event created = calendar.events().insert("primary", event).execute();

        // Update DB
        fb.setScheduledAt(java.sql.Timestamp.from(slot));
        fb.setMeetingDurationMinutes(duration);
        fb.setCalendarEventId(created.getId());
        fb.setSchedulingStatus("SCHEDULED");
        feedbackService.updateFeedback(fb.getId(), fb);

        return new ScheduleResult(slot, slot.plus(duration, ChronoUnit.MINUTES), created.getId(), created.getHtmlLink());
    }

    private Event buildEventForFeedback(Feedback fb, List<EventAttendee> attendees, Instant slotStart, int durationMins) {
        ZonedDateTime z = slotStart.atZone(ZoneId.systemDefault());
        DateTime start = new DateTime(Date.from(z.toInstant()));
        DateTime end = new DateTime(Date.from(z.plusMinutes(durationMins).toInstant()));
        String summary = "Feedback Review: " + (fb.getCustomerName() != null ? fb.getCustomerName() : (fb.getUserName() != null ? fb.getUserName() : "Customer"));
        String description = Optional.ofNullable(fb.getFeedback()).orElse(Optional.ofNullable(fb.getComment()).orElse(""));

        Event event = new Event()
                .setSummary(summary)
                .setDescription(description)
                .setStart(new EventDateTime().setDateTime(start))
                .setEnd(new EventDateTime().setDateTime(end));
        if (!attendees.isEmpty()) event.setAttendees(attendees);
        return event;
    }

    private Calendar buildCalendarClient(String accessToken) throws Exception {
        String token = accessToken;
        if ((token == null || token.isBlank()) && storedRefreshToken != null && !storedRefreshToken.isBlank()) {
            token = refreshAccessToken(storedRefreshToken);
        }
        if (token == null || token.isBlank()) throw new IllegalStateException("No access or refresh token available for Google Calendar");
        GoogleCredential credential = new GoogleCredential().setAccessToken(token);
        return new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                JacksonFactory.getDefaultInstance(),
                credential
        ).setApplicationName("Universal Feedback System").build();
    }

    private String refreshAccessToken(String refreshToken) throws Exception {
        return new GoogleRefreshTokenRequest(
                GoogleNetHttpTransport.newTrustedTransport(),
                JacksonFactory.getDefaultInstance(),
                refreshToken,
                config.getClientId(),
                config.getClientSecret()
        ).execute().getAccessToken();
    }

    private Instant findNextFreeSlot(Calendar calendar, List<EventAttendee> attendees, Instant start, int durationMins, Instant windowEnd, int stepMinutes) throws Exception {
        // Build free/busy request for primary calendar
        FreeBusyRequest req = new FreeBusyRequest();
        req.setTimeMin(new DateTime(Date.from(start)));
        req.setTimeMax(new DateTime(Date.from(windowEnd)));
        FreeBusyRequestItem item = new FreeBusyRequestItem();
        item.setId("primary");
        req.setItems(Collections.singletonList(item));
        FreeBusyResponse resp = calendar.freebusy().query(req).execute();
        List<TimePeriod> busy = Optional.ofNullable(resp.getCalendars().get("primary").getBusy()).orElse(List.of());

        // Iterate candidate starts
        Instant candidate = start.truncatedTo(ChronoUnit.MINUTES);
        long step = stepMinutes;
        while (!candidate.isAfter(windowEnd.minus(durationMins, ChronoUnit.MINUTES))) {
            Instant candidateEnd = candidate.plus(durationMins, ChronoUnit.MINUTES);
            boolean overlaps = false;
            for (TimePeriod p : busy) {
                Instant bStart = Instant.ofEpochMilli(p.getStart().getValue());
                Instant bEnd = Instant.ofEpochMilli(p.getEnd().getValue());
                if (!(candidateEnd.isBefore(bStart) || candidate.isAfter(bEnd) || candidateEnd.equals(bStart) || candidate.equals(bEnd))) {
                    overlaps = true; break;
                }
            }
            if (!overlaps) return candidate;
            candidate = candidate.plus(step, ChronoUnit.MINUTES);
        }
        return null;
    }
}
