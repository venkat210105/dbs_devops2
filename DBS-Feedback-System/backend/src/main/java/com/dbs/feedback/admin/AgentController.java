package com.dbs.feedback.admin;

import com.dbs.feedback.model.FeedbackTask;
import com.dbs.feedback.model.TaskActivity;
import com.dbs.feedback.repository.FeedbackTaskRepository;
import com.dbs.feedback.repository.TaskActivityRepository;
import com.dbs.feedback.service.FollowUpAgentService;
import com.dbs.feedback.service.AssignmentAgentService;
import com.dbs.feedback.service.DigestAgentService;
import com.dbs.feedback.service.SLAAgentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/agents")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true",
        maxAge = 3600)
public class AgentController {
    private final TaskActivityRepository activityRepo;
    private final FeedbackTaskRepository taskRepo;
    private final FollowUpAgentService followUpAgentService;
    private final AssignmentAgentService assignmentAgentService;
    private final DigestAgentService digestAgentService;
    private final SLAAgentService slaAgentService;

    public AgentController(TaskActivityRepository activityRepo, FeedbackTaskRepository taskRepo, FollowUpAgentService followUpAgentService, AssignmentAgentService assignmentAgentService, DigestAgentService digestAgentService, SLAAgentService slaAgentService) {
        this.activityRepo = activityRepo;
        this.taskRepo = taskRepo;
        this.followUpAgentService = followUpAgentService;
        this.assignmentAgentService = assignmentAgentService;
        this.digestAgentService = digestAgentService;
        this.slaAgentService = slaAgentService;
    }

    @PostMapping("/activity")
    public ResponseEntity<?> logActivity(@RequestBody Map<String, String> body) {
        try {
            Long taskId = Long.valueOf(body.get("taskId"));
            String agent = body.getOrDefault("agent", "UNKNOWN");
            String action = body.getOrDefault("action", "COMMENT");
            String note = body.getOrDefault("note", "");
            FeedbackTask task = taskRepo.findById(taskId).orElseThrow();
            TaskActivity a = new TaskActivity();
            a.setTask(task); a.setAgent(agent); a.setAction(action); a.setNote(note);
            return new ResponseEntity<>(activityRepo.save(a), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/activity/{taskId}")
    public List<TaskActivity> list(@PathVariable Long taskId) {
        return activityRepo.findByTask_IdOrderByCreatedAtAsc(taskId);
    }

    @PostMapping("/followup/run")
    public ResponseEntity<Map<String, Object>> runFollowUpAgent() {
        Map<String, Object> result = followUpAgentService.runFollowUp();
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PostMapping("/assignment/auto")
    public ResponseEntity<Map<String, Object>> runAutoAssignment(@RequestBody(required = false) Map<String, Object> body) {
        boolean onlyCriticalHigh = false;
        List<String> pool = null;
        if (body != null) {
            Object och = body.get("onlyCriticalHigh");
            if (och instanceof Boolean b) { onlyCriticalHigh = b; }
            Object p = body.get("pool");
            if (p instanceof List<?> l) {
                pool = new java.util.ArrayList<>();
                for (Object o : l) { if (o != null) pool.add(String.valueOf(o)); }
            } else if (p instanceof String s) {
                pool = java.util.Arrays.stream(s.split(",")).map(String::trim).filter(x -> !x.isBlank()).toList();
            }
        }
        Map<String, Object> result = assignmentAgentService.autoAssign(onlyCriticalHigh, pool);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @PostMapping("/digest/send")
    public ResponseEntity<Map<String, Object>> sendDigest(@RequestBody(required = false) Map<String, Object> body) {
        boolean onlyCriticalHigh = false;
        boolean dryRun = true;
        List<String> recipients = null;
        if (body != null) {
            Object och = body.get("onlyCriticalHigh");
            if (och instanceof Boolean b) onlyCriticalHigh = b;
            Object dr = body.get("dryRun");
            if (dr instanceof Boolean b) dryRun = b;
            Object r = body.get("recipients");
            if (r instanceof List<?> l) {
                recipients = new java.util.ArrayList<>();
                for (Object o : l) { if (o != null) recipients.add(String.valueOf(o)); }
            } else if (r instanceof String s) {
                recipients = java.util.Arrays.stream(s.split(",")).map(String::trim).filter(x -> !x.isBlank()).toList();
            }
        }
        Map<String, Object> result = digestAgentService.sendDigest(onlyCriticalHigh, recipients, dryRun);
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/digest/config")
    public ResponseEntity<Map<String, Object>> getDigestConfig() {
        return new ResponseEntity<>(digestAgentService.getConfig(), HttpStatus.OK);
    }

    // SLA Agent
    @PostMapping("/sla/run")
    public ResponseEntity<Map<String, Object>> runSla(@RequestBody(required = false) Map<String, Object> body) {
        boolean dryRun = true;
        if (body != null) {
            Object dr = body.get("dryRun");
            if (dr instanceof Boolean b) dryRun = b;
        }
        return new ResponseEntity<>(slaAgentService.run(dryRun), HttpStatus.OK);
    }

    @GetMapping("/sla/config")
    public ResponseEntity<Map<String, Object>> getSlaConfig() {
        return new ResponseEntity<>(slaAgentService.getConfig(), HttpStatus.OK);
    }
}
