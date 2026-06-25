
package com.universal.feedback.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import com.universal.feedback.model.Feedback;
import com.universal.feedback.model.UserProfile;
import com.universal.feedback.repository.FeedbackRepository;
import com.universal.feedback.repository.UserProfileRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.HttpMethod;
import org.springframework.core.ParameterizedTypeReference;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FeedbackService {

    private final FeedbackRepository repository;
    private final RestTemplate restTemplate;
    private final String mlAnalyzeUrl;
    private final UserProfileRepository userProfileRepository;
    private final FeedbackAgentService feedbackAgentService;

    public FeedbackService(FeedbackRepository repository,
                           UserProfileRepository userProfileRepository,
                           FeedbackAgentService feedbackAgentService,
                           @Value("${ML_SERVICE_URL:http://localhost:5000}") String mlServiceBaseUrl) {
        this.repository = repository;
        this.userProfileRepository = userProfileRepository;
        this.feedbackAgentService = feedbackAgentService;
        
        // Configure RestTemplate with timeouts
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); // 5 seconds connection timeout
        factory.setReadTimeout(10000);   // 10 seconds read timeout
        this.restTemplate = new RestTemplate(factory);

        // Ensure a sensible default when not running within a Spring context (e.g., plain Mockito tests)
        String baseUrl = (mlServiceBaseUrl == null || mlServiceBaseUrl.isBlank())
                ? "http://localhost:5000"
                : mlServiceBaseUrl;

        // Normalize analyze endpoint from base URL or full URL
        if (baseUrl.endsWith("/analyze")) {
            this.mlAnalyzeUrl = baseUrl;
        } else {
            this.mlAnalyzeUrl = baseUrl.replaceAll("/+$", "") + "/analyze";
        }
    }

    

    // Save feedback with sentiment analysis and agent service processing
    public Feedback saveFeedback(Feedback feedback) {
        attachUserProfile(feedback);
        // Perform sentiment analysis first before saving
        performSentimentAnalysis(feedback);
        Feedback saved = repository.save(feedback);
        if (feedbackAgentService != null) {
            feedbackAgentService.processFeedback(saved);
        }
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

    // Keep user profile in sync
    attachUserProfile(existing);

    // Perform sentiment analysis before saving if comment or feedback is provided
        String textToAnalyze = updated.getComment() != null && !updated.getComment().isEmpty() ? 
                              updated.getComment() : updated.getFeedback();
        if (textToAnalyze != null && !textToAnalyze.isEmpty()) {
            performSentimentAnalysis(existing);
        }

        return repository.save(existing);
    }

    private void attachUserProfile(Feedback feedback) {
        try {
            String email = (feedback.getUserEmail() != null && !feedback.getUserEmail().isBlank()) ? feedback.getUserEmail().trim().toLowerCase() : null;
            String userName = (feedback.getUserName() != null && !feedback.getUserName().isBlank()) ? feedback.getUserName().trim() : null;
            String customerName = (feedback.getCustomerName() != null && !feedback.getCustomerName().isBlank()) ? feedback.getCustomerName().trim() : null;

            if (email == null && (userName == null && customerName == null)) {
                return; // nothing to attach
            }

            UserProfile profile = null;
            if (email != null) {
                profile = userProfileRepository.findByEmail(email).orElse(null);
            }
            if (profile == null) {
                profile = new UserProfile();
                profile.setEmail(email);
                profile.setUserName(userName);
                profile.setCustomerName(customerName);
                profile = userProfileRepository.save(profile);
            } else {
                // update names if newly provided
                boolean changed = false;
                if (userName != null && (profile.getUserName() == null || !profile.getUserName().equals(userName))) {
                    profile.setUserName(userName); changed = true;
                }
                if (customerName != null && (profile.getCustomerName() == null || !profile.getCustomerName().equals(customerName))) {
                    profile.setCustomerName(customerName); changed = true;
                }
                if (changed) userProfileRepository.save(profile);
            }
            feedback.setUserProfile(profile);
        } catch (Exception ignored) {
        }
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
            // Prefer concise comment, fall back to full feedback text
            String text = (feedback.getComment() != null && !feedback.getComment().trim().isEmpty())
                    ? feedback.getComment().trim()
                    : (feedback.getFeedback() != null ? feedback.getFeedback().trim() : "");

            if (text.isEmpty()) {
                // No text to analyze: set sensible defaults including topic/service
                feedback.setSentimentLabel("NEUTRAL");
                feedback.setSentimentScore(0.5);
                feedback.setTopic("general");
                feedback.setServiceCategory("general");
                return;
            }

            System.out.println("Starting sentiment analysis for: " + text);

            Map<String, String> request = new HashMap<>();
            request.put("text", text);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

            long startTime = System.currentTimeMillis();
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
            mlAnalyzeUrl,
            HttpMethod.POST,
            entity,
            new ParameterizedTypeReference<Map<String, Object>>() {}
        );
            long endTime = System.currentTimeMillis();

            System.out.println("Sentiment analysis completed in " + (endTime - startTime) + "ms");

            Map<String, Object> body = response.getBody();
            if (body != null) {
                String label = (String) body.get("label");
                Double score = Double.valueOf(body.get("score").toString());
                String topic = body.get("topic") != null ? body.get("topic").toString() : "general";


                feedback.setSentimentLabel(label != null ? label : "UNKNOWN");
                feedback.setSentimentScore(score != null ? score : 0.0);
                feedback.setTopic(topic);
                feedback.setServiceCategory(topic); // Map topic to serviceCategory for now

                System.out.println("Sentiment result: " + label + " (score: " + score + ") Topic: " + topic);
            } else {
                feedback.setSentimentLabel("UNKNOWN");
                feedback.setSentimentScore(0.0);
                feedback.setTopic("general");
                feedback.setServiceCategory("general");
                System.out.println("No response body from sentiment analysis service");
            }

        } catch (Exception e) {
            System.err.println("Sentiment analysis failed: " + e.getMessage());
            e.printStackTrace();
            
            // Provide a simple rule-based fallback
            String base = (feedback.getComment() != null && !feedback.getComment().isEmpty())
                    ? feedback.getComment()
                    : (feedback.getFeedback() != null ? feedback.getFeedback() : "");
            String comment = base.toLowerCase();
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
            // Ensure topic/serviceCategory are never left empty in fallback
            if (feedback.getTopic() == null || feedback.getTopic().isEmpty()) {
                feedback.setTopic("general");
            }
            if (feedback.getServiceCategory() == null || feedback.getServiceCategory().isEmpty()) {
                feedback.setServiceCategory("general");
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
            
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
            mlAnalyzeUrl,
            HttpMethod.POST,
            entity,
            new ParameterizedTypeReference<Map<String, Object>>() {}
        );
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

    // Backfill topics for existing feedback records where topic is null/empty
    public Map<String, Object> backfillMissingTopics() {
        List<Feedback> all = repository.findAll();
        int total = all.size();
        int missing = 0;
        int updated = 0;
        int skipped = 0;
        int errors = 0;

        for (Feedback f : all) {
            String t = f.getTopic();
            boolean needs = (t == null || t.trim().isEmpty());
            if (!needs) {
                skipped++;
                continue;
            }
            missing++;
            try {
                performSentimentAnalysis(f);
                // Ensure defaults even if analysis had no text
                if (f.getTopic() == null || f.getTopic().trim().isEmpty()) {
                    f.setTopic("general");
                }
                if (f.getServiceCategory() == null || f.getServiceCategory().trim().isEmpty()) {
                    f.setServiceCategory("general");
                }
                repository.save(f);
                updated++;
            } catch (Exception ex) {
                errors++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("missing", missing);
        result.put("updated", updated);
        result.put("skipped", skipped);
        result.put("errors", errors);
        return result;
    }
}
