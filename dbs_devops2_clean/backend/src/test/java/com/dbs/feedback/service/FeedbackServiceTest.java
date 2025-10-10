package com.dbs.feedback.service;

import com.dbs.feedback.model.Feedback;
import com.dbs.feedback.repository.FeedbackRepository;

import com.dbs.feedback.service.FeedbackService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

public class FeedbackServiceTest {

    @Mock
    private FeedbackRepository feedbackRepository;

    @InjectMocks
    private FeedbackService feedbackService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testSaveFeedback() {
        Feedback feedback = new Feedback();
        feedback.setUserName("Bob");
        feedback.setUserEmail("bob@example.com");
        feedback.setProductId(101L);
        feedback.setCustomerName("Bob");
        feedback.setComment("Good");
        feedback.setRating(4);

        when(feedbackRepository.save(feedback)).thenReturn(feedback);

        Feedback saved = feedbackService.saveFeedback(feedback);

       
        
        verify(feedbackRepository, times(1)).save(feedback);
    }

    @Test
    void testGetAllFeedback() {
        Feedback f1 = new Feedback();
        f1.setUserName("Bob");
        f1.setUserEmail("bob@example.com");
        f1.setProductId(101L);
        f1.setCustomerName("Bob");
        f1.setComment("Good");
        f1.setRating(4);

        Feedback f2 = new Feedback();
        f2.setUserName("Carol");
        f2.setUserEmail("carol@example.com");
        f2.setProductId(102L);
        f2.setCustomerName("Carol");
        f2.setComment("Average");
        f2.setRating(3);


        when(feedbackRepository.findAll()).thenReturn(Arrays.asList(f1, f2));

        List<Feedback> allFeedback = feedbackService.getAllFeedback();

        assertEquals(2, allFeedback.size());
        assertEquals("Bob", allFeedback.get(0).getCustomerName());
        assertEquals("Carol", allFeedback.get(1).getCustomerName());

        verify(feedbackRepository, times(1)).findAll();
    }
}
