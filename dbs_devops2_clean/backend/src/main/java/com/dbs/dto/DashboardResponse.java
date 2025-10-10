package com.dbs.dto;

import java.util.List;
import java.util.Map;

public class DashboardResponse {
    private Map<String, Long> sentimentCounts;
    private List<TrendData> trends;
    private List<RecentFeedback> recentFeedback;

    public Map<String, Long> getSentimentCounts() {
        return sentimentCounts;
    }

    public void setSentimentCounts(Map<String, Long> sentimentCounts) {
        this.sentimentCounts = sentimentCounts;
    }

    public List<TrendData> getTrends() {
        return trends;
    }

    public void setTrends(List<TrendData> trends) {
        this.trends = trends;
    }

    public List<RecentFeedback> getRecentFeedback() {
        return recentFeedback;
    }

    public void setRecentFeedback(List<RecentFeedback> recentFeedback) {
        this.recentFeedback = recentFeedback;
    }

    public static class TrendData {
        private String date;
        private Long count;

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public Long getCount() { return count; }
        public void setCount(Long count) { this.count = count; }
    }

    public static class RecentFeedback {
        private Long id;
        private String comment;
        private String label;
        private String customerName;
        private String email;
        private String serviceCategory;
        private String serviceChannel;
        private String customerType;
        private String businessUnit;
        private String feedback;
        private int rating;
        private String createdAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }

        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getServiceCategory() { return serviceCategory; }
        public void setServiceCategory(String serviceCategory) { this.serviceCategory = serviceCategory; }

        public String getServiceChannel() { return serviceChannel; }
        public void setServiceChannel(String serviceChannel) { this.serviceChannel = serviceChannel; }

        public String getCustomerType() { return customerType; }
        public void setCustomerType(String customerType) { this.customerType = customerType; }

        public String getBusinessUnit() { return businessUnit; }
        public void setBusinessUnit(String businessUnit) { this.businessUnit = businessUnit; }

        public String getFeedback() { return feedback; }
        public void setFeedback(String feedback) { this.feedback = feedback; }

        public int getRating() { return rating; }
        public void setRating(int rating) { this.rating = rating; }

        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    }
}
