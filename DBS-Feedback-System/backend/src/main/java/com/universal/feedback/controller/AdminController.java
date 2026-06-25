package com.universal.feedback.controller;

import com.universal.feedback.model.Feedback;
import com.universal.feedback.repository.FeedbackRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
public class AdminController {

    private final FeedbackRepository feedbackRepository;

    public AdminController(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    @GetMapping("/dashboard")
    public String viewDashboard(Model model) {
        List<Feedback> allFeedback = feedbackRepository.findAll();
        model.addAttribute("feedbackList", allFeedback);
        return "dashboard"; // loads dashboard.html
    }
}
