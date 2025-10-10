
package main.java.com.dbs.feedback;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestParam;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.EventAttendee;
import java.util.TimeZone;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.beans.factory.annotation.Autowired;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import java.util.List;

@RestController
@RequestMapping("/feedback")
public class GoogleAuthController {

    @Autowired
    private GoogleCalendarConfig config;

    @GetMapping("/authorize")
    public String authorize() throws Exception {
        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
            GoogleNetHttpTransport.newTrustedTransport(),
            JacksonFactory.getDefaultInstance(),
            config.getClientId(),
            config.getClientSecret(),
            List.of("https://www.googleapis.com/auth/calendar")
        ).setAccessType("offline").build();

        // Step 6: Generate authorization URL
        String authorizationUrl = flow.newAuthorizationUrl()
            .setRedirectUri(config.getRedirectUri())
            .build();

        return "Go to this URL to authorize: <a href='" + authorizationUrl + "'>Authorize</a>";
    }

    @GetMapping("/oauth2callback")
    public ResponseEntity<String> oauthCallback(@RequestParam String code) {
        try {
            // Exchange code for access token
            GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeFlow.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                JacksonFactory.getDefaultInstance(),
                config.getClientId(),
                config.getClientSecret(),
                List.of("https://www.googleapis.com/auth/calendar")
            ).setAccessType("offline").build()
             .newTokenRequest(code)
             .setRedirectUri(config.getRedirectUri())
             .execute();

            GoogleCredential credential = new GoogleCredential().setAccessToken(tokenResponse.getAccessToken());

            // Build Calendar service
            Calendar calendarService = new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                JacksonFactory.getDefaultInstance(),
                credential
            ).setApplicationName("DBS Feedback System").build();

            // Get the user's email from the ID token if available
            String userEmail = null;
            if (tokenResponse.getIdToken() != null) {
                com.google.api.client.json.webtoken.JsonWebSignature idToken =
                    com.google.api.client.json.webtoken.JsonWebSignature.parse(
                        JacksonFactory.getDefaultInstance(), tokenResponse.getIdToken());
                userEmail = (String) idToken.getPayload().get("email");
            }

            // Create a sample event
            Event event = new Event()
                .setSummary("DBS Feedback Meeting")
                .setDescription("Scheduled via OAuth integration")
                .setVisibility("default");

            if (userEmail != null) {
                event.setAttendees(List.of(new EventAttendee().setEmail(userEmail)));
            }

            EventDateTime start = new EventDateTime()
                .setDateTime(new com.google.api.client.util.DateTime(System.currentTimeMillis() + 3600000)) // 1 hour from now
                .setTimeZone(TimeZone.getDefault().getID());
            EventDateTime end = new EventDateTime()
                .setDateTime(new com.google.api.client.util.DateTime(System.currentTimeMillis() + 7200000)) // 2 hours from now
                .setTimeZone(TimeZone.getDefault().getID());
            event.setStart(start);
            event.setEnd(end);

            // Log event details for debugging
            System.out.println("Scheduling event for user: " + userEmail);
            System.out.println("Event details: " + event.toPrettyString());

            event = calendarService.events().insert("primary", event).execute();

            System.out.println("Created event: " + event.getHtmlLink());

            // List upcoming events to verify calendar connectivity
            Calendar.Events.List request = calendarService.events().list("primary")
                .setMaxResults(5)
                .setOrderBy("startTime")
                .setSingleEvents(true)
                .setTimeMin(new com.google.api.client.util.DateTime(System.currentTimeMillis()));
            com.google.api.services.calendar.model.Events events = request.execute();
            StringBuilder eventList = new StringBuilder();
            eventList.append("<br><b>Upcoming events:</b><ul>");
            for (Event e : events.getItems()) {
                eventList.append("<li>").append(e.getSummary()).append(" - ").append(e.getStart()).append("</li>");
            }
            eventList.append("</ul>");

            return ResponseEntity.ok("Event scheduled: " + event.getHtmlLink() + "<br>Event details: <pre>" + event.toPrettyString() + "</pre>" + eventList.toString());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error scheduling event: " + e.getMessage());
        }
    }
}
