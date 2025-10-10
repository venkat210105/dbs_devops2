package com.dbs.feedback;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import java.util.List;

@RestController
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
}
