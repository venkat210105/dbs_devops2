package com.dbs.feedback.service;

import com.dbs.feedback.GoogleCalendarConfig;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventAttendee;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.TimeZone;

@Service
public class GoogleCalendarService {
    @org.springframework.beans.factory.annotation.Value("${google.oauth.refreshToken}")
    private String storedRefreshToken;

    private String getRefreshToken() {
        return storedRefreshToken;
    }

        private String refreshAccessToken(String refreshToken) throws Exception {
                com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse response =
                        new com.google.api.client.googleapis.auth.oauth2.GoogleRefreshTokenRequest(
                                GoogleNetHttpTransport.newTrustedTransport(),
                                JacksonFactory.getDefaultInstance(),
                                refreshToken,
                                config.getClientId(),
                                config.getClientSecret()
                        ).execute();
                return response.getAccessToken();
        }
    @Autowired
    private GoogleCalendarConfig config;

    public String scheduleMeeting(String accessToken, String userEmail, String summary, String description) throws Exception {
        System.out.println("[GoogleCalendarService] scheduleMeeting called. AccessToken: " + (accessToken != null ? "present" : "missing") + ", userEmail: " + userEmail);
        GoogleCredential credential = new GoogleCredential().setAccessToken(accessToken);
        Calendar calendarService = new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                JacksonFactory.getDefaultInstance(),
                credential
        ).setApplicationName("DBS Feedback System").build();
    Event event = new Event()
        .setSummary(summary)
        .setDescription(description)
        .setVisibility("default");
    // Add admin, dummy DBS tech guy, and customer as attendees
        String adminEmail = "venkatmariserla001@gmail.com";
        String techGuyEmail = "venkatmariserla02@gmail.com";
        List<EventAttendee> attendees = new java.util.ArrayList<>();
        attendees.add(new EventAttendee().setEmail(adminEmail));
        attendees.add(new EventAttendee().setEmail(techGuyEmail));
        // Always add userEmail if present and not duplicate
        if (userEmail != null && !userEmail.isEmpty() && !userEmail.equals(adminEmail) && !userEmail.equals(techGuyEmail)) {
            attendees.add(new EventAttendee().setEmail(userEmail));
        }
        event.setAttendees(attendees);
        EventDateTime start = new EventDateTime()
                .setDateTime(new com.google.api.client.util.DateTime(System.currentTimeMillis() + 3600000))
                .setTimeZone(TimeZone.getDefault().getID());
        EventDateTime end = new EventDateTime()
                .setDateTime(new com.google.api.client.util.DateTime(System.currentTimeMillis() + 7200000))
                .setTimeZone(TimeZone.getDefault().getID());
        event.setStart(start);
        event.setEnd(end);
        try {
            event = calendarService.events().insert("primary", event).execute();
            System.out.println("[GoogleCalendarService] Event created: " + event.getHtmlLink() + ", eventId: " + event.getId());
        } catch (com.google.api.client.googleapis.json.GoogleJsonResponseException ex) {
            System.out.println("[GoogleCalendarService] GoogleJsonResponseException: " + ex.getMessage() + ", statusCode: " + ex.getStatusCode());
            ex.printStackTrace();
            if (ex.getStatusCode() == 401) { // Unauthorized, token expired
                String refreshToken = getRefreshToken();
                if (refreshToken != null && !refreshToken.isEmpty()) {
                    String newAccessToken = refreshAccessToken(refreshToken);
                    GoogleCredential newCredential = new GoogleCredential().setAccessToken(newAccessToken);
                    Calendar newCalendarService = new Calendar.Builder(
                            GoogleNetHttpTransport.newTrustedTransport(),
                            JacksonFactory.getDefaultInstance(),
                            newCredential
                    ).setApplicationName("DBS Feedback System").build();
                    event = newCalendarService.events().insert("primary", event).execute();
                    System.out.println("[GoogleCalendarService] Event created after token refresh: " + event.getHtmlLink() + ", eventId: " + event.getId());
                } else {
                    System.out.println("[GoogleCalendarService] No refresh token available to refresh access token.");
                    throw new Exception("No refresh token available to refresh access token.");
                }
            } else {
                throw ex;
            }
        } catch (Exception e) {
            System.out.println("[GoogleCalendarService] Error creating event: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
        return event.getHtmlLink();
    }
}
