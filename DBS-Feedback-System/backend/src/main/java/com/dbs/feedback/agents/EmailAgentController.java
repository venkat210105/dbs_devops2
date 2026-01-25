package com.dbs.feedback.agents;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/agents/email")
public class EmailAgentController {

    private final EmailReviewAgent agent;

    public EmailAgentController(EmailReviewAgent agent) {
        this.agent = agent;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        Map<String, Object> res = new HashMap<>();
        res.put("enabled", agent.isEnabled());
        res.put("lastPollAt", agent.getLastPollAt());
        res.put("lastUnreadCount", agent.getLastUnreadCount());
        res.put("lastError", agent.getLastError());
        res.put("now", Instant.now());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/trigger")
    public ResponseEntity<Map<String, Object>> trigger() {
        agent.pollOnce();
        Map<String, Object> res = new HashMap<>();
        res.put("triggered", true);
        res.put("lastPollAt", agent.getLastPollAt());
        res.put("lastUnreadCount", agent.getLastUnreadCount());
        res.put("lastError", agent.getLastError());
        return ResponseEntity.ok(res);
    }
}
