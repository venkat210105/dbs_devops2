package com.universal.feedback.service;

import com.universal.dto.DashboardResponse;
import com.universal.feedback.model.Feedback;
import com.universal.feedback.model.FeedbackTask;
import com.universal.feedback.repository.FeedbackRepository;
import com.universal.feedback.repository.FeedbackTaskRepository;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackTaskRepository taskRepository;
    private final TaskService taskService;

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(DashboardService.class);

    public DashboardService(FeedbackRepository feedbackRepository, FeedbackTaskRepository taskRepository, TaskService taskService) {
        this.feedbackRepository = feedbackRepository;
        this.taskRepository = taskRepository;
        this.taskService = taskService;
    }

    public DashboardResponse getDashboardData() {
        try {
            List<Feedback> allFeedback = feedbackRepository.findAll();
            DashboardResponse response = new DashboardResponse();

        // 1️⃣ Sentiment counts
        Map<String, Long> sentimentCounts = allFeedback.stream()
            .collect(Collectors.groupingBy(
                f -> {
                    try {
                    String label = f.getSentimentLabel();
                    return (label == null || label.trim().isEmpty()) ? "Unknown" : label;
                    } catch (Exception ex) {
                    return "Unknown";
                    }
                },
                Collectors.counting()
            ));
        response.setSentimentCounts(sentimentCounts);

            // 1b️⃣ Urgency counts based on OPEN (TODO) tasks' priorities
            List<FeedbackTask> openTasks = taskRepository.findByStatusOrderByCreatedAtDesc("TODO");
            Map<String, Long> urgencyCounts = openTasks.stream()
                .collect(Collectors.groupingBy(
                    t -> Optional.ofNullable(t.getPriority()).orElse("UNKNOWN").toUpperCase(Locale.ROOT),
                    Collectors.counting()
                ));
            response.setUrgencyCounts(urgencyCounts);

            // 1c️⃣ Task status counts (TODO vs DONE)
            Map<String, Long> taskStatusCounts = new LinkedHashMap<>();
            long todoCount = Optional.ofNullable(taskRepository.findByStatusOrderByCreatedAtDesc("TODO")).orElseGet(List::of).size();
            long doneCount = Optional.ofNullable(taskRepository.findByStatusOrderByCreatedAtDesc("DONE")).orElseGet(List::of).size();
            taskStatusCounts.put("TODO", todoCount);
            taskStatusCounts.put("DONE", doneCount);
            response.setTaskStatusCounts(taskStatusCounts);

            // 2️⃣ Trends by date
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            List<DashboardResponse.TrendData> trends = allFeedback.stream()
                    .collect(Collectors.groupingBy(
                            f -> f.getCreatedAt().toLocalDateTime().toLocalDate().format(formatter),
                            Collectors.counting()
                    ))
                    .entrySet().stream()
                    .map(e -> {
                        DashboardResponse.TrendData td = new DashboardResponse.TrendData();
                        td.setDate(e.getKey());
                        td.setCount(e.getValue());
                        return td;
                    })
                    .collect(Collectors.toList());
            response.setTrends(trends);

            // 3️⃣ Recent feedback (last 5) with all fields
            List<DashboardResponse.RecentFeedback> recent = allFeedback.stream()
                    .sorted(Comparator.comparing(
                            Feedback::getCreatedAt,
                            Comparator.reverseOrder()
                    ))
                    .limit(5)
                    .map(f -> {
                        DashboardResponse.RecentFeedback rf = new DashboardResponse.RecentFeedback();
                        rf.setId(f.getId());
                        rf.setComment(f.getComment());
                            rf.setLabel(f.getSentimentLabel() != null ? f.getSentimentLabel() : "Unknown");
                        rf.setCustomerName(f.getCustomerName());
                        rf.setEmail(f.getEmail());
                        rf.setServiceCategory(f.getServiceCategory());
                        rf.setServiceChannel(f.getServiceChannel());
                        rf.setCustomerType(f.getCustomerType());
                        rf.setBusinessUnit(f.getBusinessUnit());
                        rf.setFeedback(f.getFeedback());
                        rf.setRating(f.getRating());

                        // Format timestamp for display
                        if (f.getCreatedAt() != null) {
                            rf.setCreatedAt(f.getCreatedAt().toLocalDateTime().format(formatter));
                        }

                        return rf;
                    })
                    .collect(Collectors.toList());
            response.setRecentFeedback(recent);

            return response;
        } catch (Exception e) {
            logger.error("Error in DashboardService.getDashboardData", e);
            throw e;
        }
    }
    }
