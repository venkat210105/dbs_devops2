package com.dbs.feedback.admin;

import com.dbs.feedback.model.Feedback;
import com.dbs.feedback.repository.FeedbackRepository;
import com.dbs.feedback.service.FeedbackService;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.List;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
             allowCredentials = "true",
             maxAge = 3600)
public class AdminDashboardController {
    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private FeedbackService feedbackService;

    // List all feedback
    @GetMapping("/feedbacks")
    public ResponseEntity<List<Feedback>> getAllFeedbacks() {
        List<Feedback> feedbacks = feedbackRepository.findAll();
        return new ResponseEntity<>(feedbacks, HttpStatus.OK);
    }

    // Get feedback details
    @GetMapping("/feedback/{id}")
    public ResponseEntity<Feedback> getFeedbackById(@PathVariable Long id) {
        return feedbackRepository.findById(id)
            .map(f -> new ResponseEntity<>(f, HttpStatus.OK))
            .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // (Add more endpoints for users, meetings, export, etc.)

    // Maintenance: Backfill topics for records missing topic
    @PostMapping("/maintenance/backfill-topics")
    public ResponseEntity<java.util.Map<String, Object>> backfillTopics() {
        java.util.Map<String, Object> stats = feedbackService.backfillMissingTopics();
        return new ResponseEntity<>(stats, HttpStatus.OK);
    }
}
