package com.universal.feedback.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.Map;

@Service
public class ResendEmailService {

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${resend.from.email:onboarding@resend.dev}")
    private String fromEmail;

    @Value("${resend.testing.mode:true}")
    private boolean testingMode;

    @Value("${resend.testing.email:venkatmariserla001@gmail.com}")
    private String testingEmail;

    private final RestTemplate restTemplate = new RestTemplate();

    private String getRecipient(String to) {
        // In testing mode, override recipient with testing email
        if (testingMode) {
            System.out.println("[Resend Testing Mode] Redirecting email from " + to + " to " + testingEmail);
            return testingEmail;
        }
        return to;
    }

    public void sendEmail(String to, String subject, String body) throws Exception {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            throw new IllegalStateException("Resend API key not configured");
        }

        String recipient = getRecipient(to);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("from", fromEmail);
        requestBody.put("to", new String[]{recipient});
        requestBody.put("subject", subject);
        requestBody.put("text", body + (testingMode ? "\n\n[Original recipient: " + to + "]" : ""));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        String url = "https://api.resend.com/emails";
        Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
        
        System.out.println("Email sent via Resend: " + response.get("id"));
    }

    public void sendHtmlEmail(String to, String subject, String htmlBody) throws Exception {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            throw new IllegalStateException("Resend API key not configured");
        }

        String recipient = getRecipient(to);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("from", fromEmail);
        requestBody.put("to", new String[]{recipient});
        requestBody.put("subject", subject);
        requestBody.put("html", htmlBody + (testingMode ? "<p><small>[Original recipient: " + to + "]</small></p>" : ""));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        String url = "https://api.resend.com/emails";
        Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
        
        System.out.println("HTML email sent via Resend: " + response.get("id"));
    }
}
