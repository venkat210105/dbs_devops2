
package com.dbs.feedback.service;

import org.springframework.beans.factory.annotation.Autowired;
import com.dbs.feedback.model.Feedback;
import com.dbs.feedback.repository.FeedbackRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.dbs.feedback.model.Feedback;
import com.dbs.feedback.repository.FeedbackRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FeedbackService {

    private final FeedbackRepository repository;
    private final RestTemplate restTemplate;
    private final String ML_URL = "http://localhost:5000/analyze";

    public FeedbackService(FeedbackRepository repository) {
        this.repository = repository;
        
        // Configure RestTemplate with timeouts
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); // 5 seconds connection timeout
        factory.setReadTimeout(10000);   // 10 seconds read timeout
        this.restTemplate = new RestTemplate(factory);
    }

    @Autowired
    private FeedbackAgentService feedbackAgentService;

    // Save feedback with sentiment analysis and agent service processing
    public Feedback saveFeedback(Feedback feedback) {
        // Perform sentiment analysis first before saving
        performSentimentAnalysis(feedback);
        Feedback saved = repository.save(feedback);
        feedbackAgentService.processFeedback(saved);
        return saved;
    }


    public List<Feedback> getAllFeedback() {
        return repository.findAll();
    }

    public Feedback updateFeedback(Long id, Feedback updated) {
        Feedback existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        // Basic fields
        existing.setCustomerName(updated.getCustomerName());
        existing.setComment(updated.getComment());
        existing.setRating(updated.getRating());
        existing.setUserName(updated.getUserName());
        existing.setUserEmail(updated.getUserEmail());
        existing.setProductId(updated.getProductId());

        // Enhanced fields
        if (updated.getServiceCategory() != null) {
            existing.setServiceCategory(updated.getServiceCategory());
        }
        if (updated.getServiceChannel() != null) {
            existing.setServiceChannel(updated.getServiceChannel());
        }
        if (updated.getCustomerType() != null) {
            existing.setCustomerType(updated.getCustomerType());
        }
        if (updated.getBusinessUnit() != null) {
            existing.setBusinessUnit(updated.getBusinessUnit());
        }
        if (updated.getFeedback() != null) {
            existing.setFeedback(updated.getFeedback());
        }
        if (updated.getEmail() != null) {
            existing.setEmail(updated.getEmail());
        }

        // Perform sentiment analysis before saving if comment or feedback is provided
        String textToAnalyze = updated.getComment() != null && !updated.getComment().isEmpty() ? 
                              updated.getComment() : updated.getFeedback();
        if (textToAnalyze != null && !textToAnalyze.isEmpty()) {
            performSentimentAnalysis(existing);
        }

        return repository.save(existing);
    }

    public boolean deleteFeedbackById(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }

    // Synchronous method to call ML service and populate sentiment
    public void performSentimentAnalysis(Feedback feedback) {
        try {
            if (feedback.getComment() == null || feedback.getComment().trim().isEmpty()) {
                feedback.setSentimentLabel("NEUTRAL");
                feedback.setSentimentScore(0.5);
                return;
            }

            System.out.println("Starting sentiment analysis for: " + feedback.getComment());

            Map<String, String> request = new HashMap<>();
            request.put("text", feedback.getComment());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

            long startTime = System.currentTimeMillis();
            ResponseEntity<Map> response = restTemplate.postForEntity(ML_URL, entity, Map.class);
            long endTime = System.currentTimeMillis();

            System.out.println("Sentiment analysis completed in " + (endTime - startTime) + "ms");

            if (response.getBody() != null) {
                String label = (String) response.getBody().get("label");
                Double score = Double.valueOf(response.getBody().get("score").toString());
                
                feedback.setSentimentLabel(label != null ? label : "UNKNOWN");
                feedback.setSentimentScore(score != null ? score : 0.0);
                
                System.out.println("Sentiment result: " + label + " (score: " + score + ")");
            } else {
                feedback.setSentimentLabel("UNKNOWN");
                feedback.setSentimentScore(0.0);
                System.out.println("No response body from sentiment analysis service");
            }

        } catch (Exception e) {
            System.err.println("Sentiment analysis failed: " + e.getMessage());
            e.printStackTrace();
            
            // Provide a simple rule-based fallback
            String comment = feedback.getComment().toLowerCase();
            if (comment.contains("good") || comment.contains("great") || comment.contains("excellent") || 
                comment.contains("amazing") || comment.contains("love") || comment.contains("perfect")) {
                feedback.setSentimentLabel("POSITIVE");
                feedback.setSentimentScore(0.7);
            } else if (comment.contains("bad") || comment.contains("terrible") || comment.contains("awful") || 
                       comment.contains("hate") || comment.contains("worst") || comment.contains("horrible")) {
                feedback.setSentimentLabel("NEGATIVE");
                feedback.setSentimentScore(0.3);
            } else {
                feedback.setSentimentLabel("NEUTRAL");
                feedback.setSentimentScore(0.5);
            }
            
            System.out.println("Using fallback sentiment: " + feedback.getSentimentLabel());
        }
    }

    // Keep async method for batch processing if needed
    @Async
    public void updateSentimentAsync(Feedback feedback) {
        performSentimentAnalysis(feedback);
        repository.save(feedback);
    }

    // Method to check if ML service is available
    public boolean isMLServiceAvailable() {
        try {
            Map<String, String> testRequest = new HashMap<>();
            testRequest.put("text", "test");
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(testRequest, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(ML_URL, entity, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    // Alternative method with timeout control
    public Feedback saveFeedbackWithTimeoutControl(Feedback feedback) {
        System.out.println("Saving feedback with sentiment analysis...");
        
        // Check if ML service is available first
        if (!isMLServiceAvailable()) {
            System.out.println("ML service not available, using fallback sentiment analysis");
            feedback.setSentimentLabel("PENDING");
            feedback.setSentimentScore(0.0);
            Feedback saved = repository.save(feedback);
            
            // Try async update later
            updateSentimentAsync(saved);
            return saved;
        }
        
        // ML service is available, do synchronous analysis
        performSentimentAnalysis(feedback);
        return repository.save(feedback);
    }
}
