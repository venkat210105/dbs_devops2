package com.dbs.feedback.service;

import com.dbs.feedback.model.PageView;
import com.dbs.feedback.repository.PageViewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnomalyDetectionService {
    private static final Logger log = LoggerFactory.getLogger(AnomalyDetectionService.class);
    private final PageViewRepository pageViewRepository;
    private final TaskService taskService;

    // Heuristics
    private static final long LONG_VIEW_MS = 5 * 60 * 1000; // 5 minutes
    private static final long FRAUD_VIEW_MS = 30 * 60 * 1000; // 30 minutes
    private static final int HEARTBEAT_MIN = 2; // at least 2 heartbeats to count as active

    public AnomalyDetectionService(PageViewRepository pageViewRepository, TaskService taskService) {
        this.pageViewRepository = pageViewRepository;
        this.taskService = taskService;
    }

    // Run every 2 minutes
    @Scheduled(fixedDelay = 120_000, initialDelay = 60_000)
    public void detectAnomalies() {
        long now = Instant.now().toEpochMilli();
        Timestamp since = new Timestamp(now - 60 * 60 * 1000); // last 60 minutes
        try {
            // Group by path and analyze
            Map<String, List<PageView>> byPath = pageViewRepository.findAll().stream()
                    .filter(pv -> pv.getCreatedAt() != null && pv.getCreatedAt().after(since))
                    .collect(Collectors.groupingBy(PageView::getPath));

            for (Map.Entry<String, List<PageView>> e : byPath.entrySet()) {
                String path = e.getKey();
                List<PageView> views = e.getValue().stream()
                        .filter(v -> v.getDurationMs() != null && v.getDurationMs() > 0)
                        .sorted(Comparator.comparingLong(v -> v.getDurationMs()))
                        .toList();
                if (views.isEmpty()) continue;

                long p95 = percentile(views, 0.95);
                long p99 = percentile(views, 0.99);

                // Flag extremely long single sessions as potential fraud
                List<PageView> frauds = views.stream()
                        .filter(v -> v.getDurationMs() >= FRAUD_VIEW_MS && (v.getHeartbeats() == null || v.getHeartbeats() < HEARTBEAT_MIN))
                        .toList();
                for (PageView v : frauds) {
                    String title = "Potential fraud session detected on " + path;
                    String desc = String.format("Session %s on %s lasted %d ms with %d heartbeats (uaHash=%s, ipHash=%s).",
                            v.getSessionId(), path, v.getDurationMs(), safe(v.getHeartbeats()), v.getUserAgentHash(), v.getIpHash());
                    taskService.createSystemTask(title, desc, "CRITICAL");
                }

                // Flag anomalies where duration > max(LONG_VIEW_MS, p99)
                long threshold = Math.max(LONG_VIEW_MS, p99);
                List<PageView> anomalies = views.stream()
                        .filter(v -> v.getDurationMs() >= threshold)
                        .toList();
                if (!anomalies.isEmpty()) {
                    String title = "Unusual time-on-page detected: " + path;
                    String desc = String.format("%d sessions over threshold %d ms. p95=%d ms, p99=%d ms.", anomalies.size(), threshold, p95, p99);
                    taskService.createSystemTask(title, desc, "HIGH");
                }
            }
        } catch (Exception ex) {
            log.warn("Anomaly detection error", ex);
        }
    }

    private static int safe(Integer n) { return n == null ? 0 : n; }

    private static long percentile(List<PageView> sortedByDuration, double p) {
        if (sortedByDuration.isEmpty()) return 0L;
        int idx = (int) Math.floor(p * (sortedByDuration.size() - 1));
        idx = Math.max(0, Math.min(idx, sortedByDuration.size() - 1));
        return sortedByDuration.get(idx).getDurationMs();
    }
}
