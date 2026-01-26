package com.dbs.feedback.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ResendEmailService {

    @Value("${resend.api.key:}")
    private String resendApiKey;

    @Value("${resend.from.email:onboarding@resend.dev}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String body) throws ResendException {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            throw new IllegalStateException("Resend API key not configured");
        }

        Resend resend = new Resend(resendApiKey);

        CreateEmailOptions params = CreateEmailOptions.builder()
            .from(fromEmail)
            .to(to)
            .subject(subject)
            .text(body)
            .build();

        CreateEmailResponse data = resend.emails.send(params);
        System.out.println("Email sent via Resend: " + data.getId());
    }

    public void sendHtmlEmail(String to, String subject, String htmlBody) throws ResendException {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            throw new IllegalStateException("Resend API key not configured");
        }

        Resend resend = new Resend(resendApiKey);

        CreateEmailOptions params = CreateEmailOptions.builder()
            .from(fromEmail)
            .to(to)
            .subject(subject)
            .html(htmlBody)
            .build();

        CreateEmailResponse data = resend.emails.send(params);
        System.out.println("HTML email sent via Resend: " + data.getId());
    }
}
