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
        // For demo, fetch refresh token from GoogleAuthController (ideally use secure storage)
        private String getRefreshToken() {
                try {
                        java.net.URL url = new java.net.URL("http://localhost:8080/feedback/refresh-token");
                        java.net.HttpURLConnection con = (java.net.HttpURLConnection) url.openConnection();
                        con.setRequestMethod("GET");
                        int status = con.getResponseCode();
                        if (status == 200) {
                                java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(con.getInputStream()));
                                String inputLine;
                                StringBuilder content = new StringBuilder();
                                while ((inputLine = in.readLine()) != null) {
                                        content.append(inputLine);
                                }
                                in.close();
                                con.disconnect();
                                return content.toString();
                        }
                } catch (Exception e) {
                        e.printStackTrace();
                }
                return null;
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
        // Try to use provided access token, if fails, refresh it
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
        if (userEmail != null) {
            event.setAttendees(List.of(new EventAttendee().setEmail(userEmail)));
        }
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
        } catch (com.google.api.client.googleapis.json.GoogleJsonResponseException ex) {
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
                } else {
                    throw new Exception("No refresh token available to refresh access token.");
                }
            } else {
                throw ex;
            }
        }
        return event.getHtmlLink();
    }
}
