package com.dbs.feedback.model;
import org.junit.jupiter.api.Test;

import com.dbs.feedback.model.Feedback;

import static org.junit.jupiter.api.Assertions.*;

class FeedbackTest {

    @Test
    void testFeedbackCreation() {
        Feedback feedback = new Feedback();
        feedback.setUserName("Bob");
        feedback.setUserEmail("bob@example.com");
        feedback.setProductId(101L);
        feedback.setCustomerName("Bob");
        feedback.setComment("Good");
        feedback.setRating(4);

        assertEquals("Bob", feedback.getCustomerName());
        assertEquals("Good", feedback.getComment());
        assertEquals(4, feedback.getRating());
        
    }
}
