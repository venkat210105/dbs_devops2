package com.dbs.feedback.controller;

import com.dbs.dto.DashboardResponse;
import com.dbs.feedback.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/api/dashboard")
    public DashboardResponse getDashboard() {
        return dashboardService.getDashboardData();
    }
}
