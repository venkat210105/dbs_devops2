package com.dbs.feedback.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private SendGridEmailService sendGridEmailService;

    public void sendEmail(String to, String subject, String body) throws Exception {
        sendGridEmailService.sendEmail(to, subject, body);
    }

    public void sendHtmlEmail(String to, String subject, String htmlBody) throws Exception {
        sendGridEmailService.sendHtmlEmail(to, subject, htmlBody);
    }
}
        