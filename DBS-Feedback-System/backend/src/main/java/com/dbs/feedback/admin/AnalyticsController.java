package com.dbs.feedback.admin;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AnalyticsController {
    @Autowired
    private com.dbs.feedback.service.FeedbackAgentService feedbackAgentService;

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        Map<String, Object> analytics = feedbackAgentService.getFeedbackAnalytics();
        return new ResponseEntity<>(analytics, HttpStatus.OK);
    }
}
