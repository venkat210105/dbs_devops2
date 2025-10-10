package com.dbs.feedback.controller;

import com.dbs.feedback.model.Feedback;
import com.dbs.feedback.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/feedback")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"}, 
             allowCredentials = "true",
             maxAge = 3600)
public class FeedbackController {

    private static final Logger logger = LoggerFactory.getLogger(FeedbackController.class);

    @Autowired
    private FeedbackService feedbackService;

    @PostMapping("/submit")
    public ResponseEntity<?> submitFeedback(@RequestBody Feedback feedback) {
        try {
            logger.info("Received feedback submission: {}", feedback);
            
            // Set default values for required fields if missing
            if (feedback.getRating() == 0) {
                feedback.setRating(5);
            }
            if (feedback.getProductId() == null) {
                feedback.setProductId(1L);
            }
            
            Feedback savedFeedback = feedbackService.saveFeedback(feedback);
            logger.info("Successfully saved feedback with ID: {}", savedFeedback.getId());
            return ResponseEntity.ok(savedFeedback);
            
        } catch (Exception e) {
            logger.error("Error submitting feedback", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("type", e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/submit-fast")
    public Feedback submitFeedbackFast(@Valid @RequestBody Feedback feedback) {
        return feedbackService.saveFeedbackWithTimeoutControl(feedback);
    }

    @GetMapping("/ml-status")
    public Map<String, Object> getMLServiceStatus() {
        Map<String, Object> status = new HashMap<>();
        boolean available = feedbackService.isMLServiceAvailable();
        status.put("mlServiceAvailable", available);
        status.put("message", available ? "ML service is running" : "ML service is not available");
        return status;
    }

    @GetMapping("/all")
    public List<Feedback> getAllFeedback() {
        return feedbackService.getAllFeedback();
    }

    @DeleteMapping("/{id}")
    public String deleteFeedback(@PathVariable Long id) {
        boolean deleted = feedbackService.deleteFeedbackById(id);
        return deleted ? "Deleted successfully" : "Feedback not found";
    }

    @PutMapping("/{id}")
    public Feedback updateFeedback(@PathVariable Long id, @RequestBody Feedback feedback) {
        return feedbackService.updateFeedback(id, feedback);
    }

}
