package com.dbs.feedback.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String body) throws Exception {
        if (mailSender == null) {
            System.out.println("Email not sent - JavaMailSender not configured. To: " + to + ", Subject: " + subject);
            return;
        }
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        
        mailSender.send(message);
        System.out.println("Email sent successfully to: " + to);
    }

    public void sendHtmlEmail(String to, String subject, String htmlBody) throws Exception {
        if (mailSender == null) {
            System.out.println("Email not sent - JavaMailSender not configured. To: " + to + ", Subject: " + subject);
            return;
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        
        mailSender.send(message);
        System.out.println("HTML email sent successfully to: " + to);
    }
}
        