package com.dbs.feedback.dto;

public class SentimentRequest {
    private String comment;

    public SentimentRequest() {}

    public SentimentRequest(String comment) {
        this.comment = comment;
    }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
