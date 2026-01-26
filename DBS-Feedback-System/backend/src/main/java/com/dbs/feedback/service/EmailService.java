package com.dbs.feedback.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class EmailService {

    @Autowired
    private ResendEmailService resendEmailService;

    public void sendEmail(String to, String subject, String body) throws Exception {
        resendEmailService.sendEmail(to, subject, body);
    }

    public void sendHtmlEmail(String to, String subject, String htmlBody) throws Exception {
        resendEmailService.sendHtmlEmail(to, subject, htmlBody);
    }
}
        