package com.universal.feedback.controller;

import com.universal.dto.DashboardResponse;
import com.universal.feedback.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DashboardController {

    private final DashboardService dashboardService;

        private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(DashboardController.class);

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

        @GetMapping("/api/dashboard")
        public org.springframework.http.ResponseEntity<?> getDashboard() {
            logger.info("/api/dashboard endpoint called");
            try {
                logger.info("Calling dashboardService.getDashboardData()");
                DashboardResponse response = dashboardService.getDashboardData();
                logger.info("dashboardService.getDashboardData() returned successfully");
                return org.springframework.http.ResponseEntity.ok(response);
            } catch (Exception e) {
                logger.error("Error loading dashboard data", e);
                java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
                errorResponse.put("error", e.getMessage());
                errorResponse.put("type", e.getClass().getSimpleName());
                return org.springframework.http.ResponseEntity.status(500).body(errorResponse);
            }
        }
}
