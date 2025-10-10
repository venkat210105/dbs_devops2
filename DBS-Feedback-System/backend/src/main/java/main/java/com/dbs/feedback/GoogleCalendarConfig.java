package main.java.com.dbs.feedback;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GoogleCalendarConfig {
    @Value("${google.clientId}")
    private String clientId;

    @Value("${google.clientSecret}")
    private String clientSecret;

    @Value("${google.redirectUri}")
    private String redirectUri;

    public String getClientId() {
        return clientId;
    }
    public String getClientSecret() {
        return clientSecret;
    }
    public String getRedirectUri() {
        return redirectUri;
    }
}
