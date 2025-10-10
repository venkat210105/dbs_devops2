package com.dbs.feedback.service;

import com.dbs.dto.DashboardResponse;
import com.dbs.feedback.model.Feedback;
import com.dbs.feedback.repository.FeedbackRepository;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final FeedbackRepository feedbackRepository;

    public DashboardService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    public DashboardResponse getDashboardData() {
        List<Feedback> allFeedback = feedbackRepository.findAll();
        DashboardResponse response = new DashboardResponse();

        // 1️⃣ Sentiment counts
        Map<String, Long> sentimentCounts = allFeedback.stream()
                .collect(Collectors.groupingBy(
                        f -> f.getSentimentLabel(),  // Ensure getSentimentLabel() returns String
                        Collectors.counting()
                ));
        response.setSentimentCounts(sentimentCounts);

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
                    rf.setLabel(f.getSentimentLabel());
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
    }
}
