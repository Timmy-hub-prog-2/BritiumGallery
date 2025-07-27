package com.maven.demo.service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class  EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom("britiumgallery@gmail.com");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true); // true => html

        mailSender.send(message);
    }
    public void sendResetCode(String toEmail, String code) {
        String subject = "Your password reset code";
        String content = "<p>Hello,</p>" +
                "<p>Your password reset code is: <strong>" + code + "</strong></p>" +
                "<p>This code will expire in <b>10 minutes</b>.</p>" +
                "<br><p>Thanks,<br>Britium Gallery Team</p>";

        try {
            sendHtmlEmail(toEmail, subject, content);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

}
