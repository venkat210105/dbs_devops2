package com.universal.feedback.service;

import com.universal.feedback.model.Feedback;
import com.universal.feedback.model.FeedbackTask;
import com.universal.feedback.model.TaskActivity;
import com.universal.feedback.repository.FeedbackTaskRepository;
import com.universal.feedback.repository.TaskActivityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AssignmentAgentService {
    private final FeedbackTaskRepository taskRepo;
    private final TaskActivityRepository activityRepo;
    private final TaskService taskService;

    public AssignmentAgentService(FeedbackTaskRepository taskRepo, TaskActivityRepository activityRepo, TaskService taskService) {
        this.taskRepo = taskRepo;
        this.activityRepo = activityRepo;
        this.taskService = taskService;
    }

    public static class AssignmentResult {
        public int scanned;
        public int assigned;
        public Map<String, Integer> byAssignee = new HashMap<>();
    }

    @Transactional
    public AssignmentResult autoAssignInternal(boolean onlyCriticalHigh, List<String> poolOverride) {
        // Load candidate tasks
        List<FeedbackTask> candidates = taskRepo.findByStatusAndAssignedToIsNullOrderByCreatedAtAsc("TODO");
        AssignmentResult result = new AssignmentResult();
        result.scanned = candidates.size();

        if (candidates.isEmpty()) return result;

        // Determine pool
        List<String> pool = (poolOverride != null && !poolOverride.isEmpty())
                ? poolOverride.stream().filter(Objects::nonNull).map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList())
                : inferPoolFromHistory();

        if (pool.isEmpty()) return result;

        // Build per-topic ownership map from history (who handled which topics)
        Map<String, String> topicOwner = inferTopicOwnersFromHistory();

        // Load recent assignment order for round-robin fairness
        List<FeedbackTask> recentAssigned = taskRepo.findByAssignedToIsNotNullOrderByUpdatedAtDesc();
        List<String> rrOrder = recentAssigned.stream().map(FeedbackTask::getAssignedTo)
                .filter(Objects::nonNull).map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        // Normalize rr order to unique within pool
        LinkedHashSet<String> rrSeen = new LinkedHashSet<>();
        for (String a : rrOrder) if (pool.contains(a)) rrSeen.add(a);
        for (String a : pool) rrSeen.add(a);
        List<String> rr = new ArrayList<>(rrSeen);
        int rrIndex = 0;

        for (FeedbackTask t : candidates) {
            Feedback f = t.getFeedback();
            if (f == null) continue; // skip system tasks here

            if (onlyCriticalHigh) {
                String p = t.getPriority();
                if (p == null || !(p.equals("CRITICAL") || p.equals("HIGH"))) continue;
            }

            String topic = safeLower(f.getTopic());
            String owner = topicOwner.get(topic);
            if (owner == null || !pool.contains(owner)) {
                owner = rr.get(rrIndex % rr.size());
                rrIndex++;
            }
            if (owner == null) continue;

            // Assign via TaskService to reuse email + updatedAt logic
            taskService.assign(t.getId(), owner);

            // Log activity
            TaskActivity a = new TaskActivity();
            a.setTask(t);
            a.setAgent("ASSIGNMENT");
            a.setAction("ASSIGNED");
            a.setNote("Auto-assigned to " + owner);
            activityRepo.save(a);

            result.assigned++;
            result.byAssignee.put(owner, result.byAssignee.getOrDefault(owner, 0) + 1);
        }

        return result;
    }

    @Transactional
    public Map<String, Object> autoAssign(boolean onlyCriticalHigh, List<String> poolOverride) {
        AssignmentResult r = autoAssignInternal(onlyCriticalHigh, poolOverride);
        Map<String, Object> out = new HashMap<>();
        out.put("scanned", r.scanned);
        // For UI compatibility
        out.put("considered", r.scanned);
        out.put("assigned", r.assigned);
        out.put("byAssignee", r.byAssignee);
        return out;
    }

    // Infer a default pool from history (emails that have previously been assignees)
    private List<String> inferPoolFromHistory() {
        return taskRepo.findByAssignedToIsNotNullOrderByUpdatedAtDesc().stream()
                .map(FeedbackTask::getAssignedTo)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .limit(10)
                .collect(Collectors.toList());
    }

    // Assign topic ownership to the most recent handler of that topic
    private Map<String, String> inferTopicOwnersFromHistory() {
        Map<String, String> map = new HashMap<>();
        for (FeedbackTask t : taskRepo.findByAssignedToIsNotNullOrderByUpdatedAtDesc()) {
            Feedback f = t.getFeedback();
            if (f == null) continue;
            String topic = safeLower(f.getTopic());
            String owner = t.getAssignedTo();
            if (topic != null && owner != null && !map.containsKey(topic)) {
                map.put(topic, owner);
            }
        }
        return map;
    }

    private String safeLower(String s) {
        if (s == null) return null;
        String v = s.trim();
        return v.isEmpty() ? null : v.toLowerCase(Locale.ROOT);
    }
}
