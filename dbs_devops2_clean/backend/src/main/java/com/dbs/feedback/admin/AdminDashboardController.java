package com.dbs.feedback.admin;

import com.dbs.feedback.model.Feedback;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminDashboardController {
    @Autowired
    private com.dbs.feedback.service.FeedbackAgentService feedbackAgentService;

    // List all feedback
    @GetMapping("/feedbacks")
    public ResponseEntity<List<Feedback>> getAllFeedbacks() {
        List<Feedback> feedbacks = feedbackAgentService.getAllFeedbacks();
        return new ResponseEntity<>(feedbacks, HttpStatus.OK);
    }

    // Get feedback details
    @GetMapping("/feedback/{id}")
    public ResponseEntity<Feedback> getFeedbackById(@PathVariable Long id) {
        Feedback feedback = feedbackAgentService.getFeedbackById(id);
        if (feedback != null) {
            return new ResponseEntity<>(feedback, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // (Add more endpoints for users, meetings, export, etc.)
}
