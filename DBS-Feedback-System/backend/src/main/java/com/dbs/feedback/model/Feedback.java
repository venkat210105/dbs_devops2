package com.dbs.feedback.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.sql.Timestamp;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "product_id")
    private Long productId;

    @Min(1)
    @Max(5)
    private int rating = 1;

    @Column(length = 1000)
    private String comment;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "sentiment_label")
    private String sentimentLabel;   // POSITIVE / NEGATIVE / NEUTRAL

    @Column(name = "sentiment_score")
    private Double sentimentScore;   // 0.0 - 1.0

    // Enhanced feedback fields
    @Column(name = "service_category")
    private String serviceCategory;  // Account Services, Loan Services, etc.

    @Column(name = "service_channel")
    private String serviceChannel;   // Branch, Online, Mobile App, etc.

    @Column(name = "customer_type")
    private String customerType;     // Individual, Business, Corporate, etc.

    @Column(name = "business_unit")
    private String businessUnit;     // Retail Banking, Corporate Banking, etc.

    @Column(name = "feedback_detail", length = 1000)
    private String feedback;         // Detailed feedback text

    @Column(name = "email")
    private String email;            // Customer's email from enhanced form

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Timestamp updatedAt;

    // Constructors
    public Feedback() {}

    public Feedback(String userName, String userEmail, Long productId, int rating, String comment, String customerName) {
        this.userName = userName;
        this.userEmail = userEmail;
        this.productId = productId;
        this.rating = rating;
        this.comment = comment;
        this.customerName = customerName;
    }

    // Enhanced constructor for all fields
    public Feedback(String userName, String userEmail, Long productId, int rating, String comment, 
                   String customerName, String email, String feedback, String serviceCategory, 
                   String serviceChannel, String customerType, String businessUnit) {
        this.userName = userName;
        this.userEmail = userEmail;
        this.productId = productId;
        this.rating = rating;
        this.comment = comment;
        this.customerName = customerName;
        this.email = email;
        this.feedback = feedback;
        this.serviceCategory = serviceCategory;
        this.serviceChannel = serviceChannel;
        this.customerType = customerType;
        this.businessUnit = businessUnit;
    }

    // Getters & Setters
    public Long getId() { return id; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getSentimentLabel() { return sentimentLabel; }
    public void setSentimentLabel(String sentimentLabel) { this.sentimentLabel = sentimentLabel; }

    public Double getSentimentScore() { return sentimentScore; }
    public void setSentimentScore(Double sentimentScore) { this.sentimentScore = sentimentScore; }

    // Enhanced field getters and setters
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

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Timestamp getCreatedAt() { return createdAt; }
    public Timestamp getUpdatedAt() { return updatedAt; }

    @Override
    public String toString() {
        return "Feedback{" +
                "id=" + id +
                ", userName='" + userName + '\'' +
                ", userEmail='" + userEmail + '\'' +
                ", productId=" + productId +
                ", rating=" + rating +
                ", comment='" + comment + '\'' +
                ", customerName='" + customerName + '\'' +
                ", serviceCategory='" + serviceCategory + '\'' +
                ", serviceChannel='" + serviceChannel + '\'' +
                ", customerType='" + customerType + '\'' +
                ", businessUnit='" + businessUnit + '\'' +
                ", feedback='" + feedback + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}
