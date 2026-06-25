package com.universal.feedback.admin;

import com.universal.feedback.model.PageView;
import com.universal.feedback.model.FeedbackTask;
import com.universal.feedback.repository.PageViewRepository;
import com.universal.feedback.repository.FeedbackTaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/implicit")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
             allowCredentials = "true",
             maxAge = 3600)
public class ImplicitAnalyticsController {
    private static final Logger log = LoggerFactory.getLogger(ImplicitAnalyticsController.class);
    private final PageViewRepository pageViewRepository;
    private final FeedbackTaskRepository taskRepository;

    @Value("${orchestrator.url:http://orchestrator:5050}")
    private String orchestratorUrl;

    @Value("${orchestrator.connect-timeout-ms:5000}")
    private int orchestratorConnectTimeoutMs;

    @Value("${orchestrator.read-timeout-ms:120000}")
    private int orchestratorReadTimeoutMs;

    public ImplicitAnalyticsController(PageViewRepository pageViewRepository, FeedbackTaskRepository taskRepository) {
        this.pageViewRepository = pageViewRepository;
        this.taskRepository = taskRepository;
    }

    @GetMapping("/analytics")
    public Map<String, Object> getImplicitAnalytics(@RequestParam(value = "sinceMinutes", defaultValue = "60") int sinceMinutes) {
        long now = Instant.now().toEpochMilli();
        Timestamp since = new Timestamp(now - sinceMinutes * 60L * 1000L);
        List<PageView> recent = pageViewRepository.findAll().stream()
                .filter(pv -> pv.getCreatedAt() != null && pv.getCreatedAt().after(since) && pv.getDurationMs() != null && pv.getDurationMs() > 0)
                .collect(Collectors.toList());

        Map<String, List<PageView>> byPath = recent.stream().collect(Collectors.groupingBy(PageView::getPath));
        List<Map<String, Object>> perPath = new ArrayList<>();
        for (Map.Entry<String, List<PageView>> e : byPath.entrySet()) {
            String path = e.getKey();
            List<PageView> views = e.getValue().stream()
                    .sorted(Comparator.comparingLong(v -> v.getDurationMs()))
                    .toList();
            long p95 = percentile(views, 0.95);
            long p99 = percentile(views, 0.99);
            long count = views.size();
            perPath.add(Map.of(
                    "path", path,
                    "count", count,
                    "p95", p95,
                    "p99", p99
            ));
        }
        perPath.sort(Comparator.comparingLong(m -> -((Number)m.get("p99")).longValue()));

        Map<String, Object> out = new HashMap<>();
        out.put("sinceMinutes", sinceMinutes);
        out.put("perPath", perPath);
        return out;
    }

    @GetMapping("/alerts")
    public List<Map<String, Object>> getRecentAlerts(@RequestParam(value = "limit", defaultValue = "20") int limit) {
        // Use FeedbackTask entries without feedback (system tasks) or by title prefix
        List<FeedbackTask> all = taskRepository.findAll();
        List<FeedbackTask> alerts = all.stream()
                .filter(t -> t.getFeedback() == null ||
                        (t.getTitle() != null && (t.getTitle().toLowerCase().contains("unusual time-on-page") || t.getTitle().toLowerCase().contains("fraud"))))
                .sorted(Comparator.comparing(FeedbackTask::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(limit)
                .toList();
        List<Map<String, Object>> dto = new ArrayList<>();
        for (FeedbackTask t : alerts) {
            dto.add(Map.of(
                    "id", t.getId(),
                    "title", t.getTitle(),
                    "priority", t.getPriority(),
                    "status", t.getStatus(),
                    "createdAt", t.getCreatedAt(),
                    "description", t.getDescription()
            ));
        }
        return dto;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadCsv(@RequestParam(value = "file", required = false) MultipartFile file,
                                       HttpServletRequest rawRequest) {
        try {
            log.info("/admin/implicit/upload (multipart) received: contentType={}, length={}",
                    file != null ? file.getContentType() : (rawRequest != null ? rawRequest.getContentType() : null),
                    file != null ? file.getSize() : null);
            // Fallback: if 'file' param is missing, try to pick the first multipart file provided
            if (file == null || file.isEmpty()) {
                if (rawRequest instanceof MultipartHttpServletRequest mreq) {
                    for (Map.Entry<String, List<MultipartFile>> e : mreq.getMultiFileMap().entrySet()) {
                        for (MultipartFile f : e.getValue()) {
                            if (f != null && !f.isEmpty()) { file = f; break; }
                        }
                        if (file != null && !file.isEmpty()) break;
                    }
                }
            }
            if (file == null || file.isEmpty()) {
                log.warn("Upload rejected: no file found in multipart request");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Empty file"));
            }
            // Parse CSV into sessions list and forward to orchestrator /implicit/import
            List<Map<String, Object>> sessions = parseCsv(file);
            log.info("Parsed CSV sessions: {} rows", sessions.size());
            if (sessions.isEmpty()) {
                // Do not call orchestrator when nothing to import
                return ResponseEntity.ok(Map.of(
                        "processed", 0,
                        "created", List.of(),
                        "note", "No valid rows parsed. Ensure CSV has a 'pageUrl' column (case-insensitive) and at least one non-empty row."
                ));
            }
            Map<String, Object> payload = Map.of("sessions", sessions);
            return forwardToOrchestrator(payload);
        } catch (Exception ex) {
            log.error("Upload processing failed: {}", ex.toString(), ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "error", "Upload failed",
                            "cause", ex.getClass().getSimpleName(),
                            "message", ex.getMessage(),
                            "orchestratorUrl", orchestratorUrl
                    ));
        }
    }

    // Generic fallback handler: accepts raw text/csv or octet-stream bodies to avoid 415 Unsupported Media Type
    @PostMapping(value = "/upload", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> uploadCsvAny(HttpServletRequest request) {
        try {
            String ct = Optional.ofNullable(request.getContentType()).orElse("").toLowerCase(Locale.ROOT);
        log.info("/admin/implicit/upload (generic) received: contentType={}", ct);
            if (ct.contains("multipart/form-data")) {
                // Delegate to the multipart handler
                return uploadCsv(null, request);
            }
            // Read raw body
            InputStream is = request.getInputStream();
            byte[] bytes = is.readAllBytes();
            if (bytes == null || bytes.length == 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Empty body"));
            }
            List<Map<String, Object>> sessions = parseCsvFromStream(new ByteArrayInputStream(bytes));
        log.info("Parsed CSV sessions (raw): {} rows", sessions.size());
            if (sessions.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "processed", 0,
                        "created", List.of(),
                        "note", "No valid rows parsed from raw body. Ensure CSV has a 'pageUrl' column (case-insensitive)."
                ));
            }
        Map<String, Object> payload = Map.of("sessions", sessions);
        return forwardToOrchestrator(payload);
        } catch (Exception ex) {
        log.error("Upload (generic) failed: {}", ex.toString(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of(
                "error", "Upload failed",
                "cause", ex.getClass().getSimpleName(),
                "message", ex.getMessage(),
                "orchestratorUrl", orchestratorUrl
            ));
        }
    }

    private ResponseEntity<?> forwardToOrchestrator(Map<String, Object> payload) {
    try {
        String endpoint = orchestratorUrl + "/implicit/import";
        String bodyJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);
        java.net.URL url = new java.net.URL(endpoint);
        java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
    conn.setConnectTimeout(orchestratorConnectTimeoutMs);
    conn.setReadTimeout(orchestratorReadTimeoutMs);
        byte[] out = bodyJson.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        conn.setFixedLengthStreamingMode(out.length);
        try (java.io.OutputStream os = conn.getOutputStream()) {
            os.write(out);
        }
        int sc = conn.getResponseCode();
        String body;
        try (java.io.InputStream is = (sc >= 200 && sc < 400) ? conn.getInputStream() : conn.getErrorStream()) {
            body = (is != null) ? new String(is.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8) : "";
        }
        log.info("Forwarded to orchestrator {} -> status {}", endpoint, sc);
        if (sc >= 200 && sc < 300) {
        return ResponseEntity.status(sc)
            .contentType(MediaType.APPLICATION_JSON)
            .body(body);
        }
        if (sc == 404) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of(
                "error", "Orchestrator endpoint '/implicit/import' not found. Please rebuild/start the orchestrator.",
                "orchestratorUrl", orchestratorUrl
            ));
        }
        return ResponseEntity.status(sc)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of(
                "error", "Orchestrator responded with error",
                "status", sc,
                "response", body
            ));
    } catch (java.net.SocketTimeoutException tex) {
        log.error("Forwarding to orchestrator timed out after {} ms: {}", orchestratorReadTimeoutMs, tex.toString());
        return ResponseEntity.status(HttpStatus.GATEWAY_TIMEOUT)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of(
                "error", "Orchestrator import is taking longer than expected",
                "cause", "SocketTimeoutException",
                "message", "The import is still processing in the orchestrator. Please check Recent Alerts in a moment.",
                "timeoutMs", orchestratorReadTimeoutMs,
                "orchestratorUrl", orchestratorUrl
            ));
    } catch (Exception ex) {
        log.error("Forwarding to orchestrator failed: {}", ex.toString(), ex);
        String cause = ex.getClass().getSimpleName();
        String msg = ex.getMessage();
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of(
                "error", "Failed to reach orchestrator",
                "cause", cause,
                "message", msg,
                "orchestratorUrl", orchestratorUrl
            ));
    }
    }

    private static long percentile(List<PageView> sortedByDuration, double p) {
        if (sortedByDuration == null || sortedByDuration.isEmpty()) return 0L;
        int idx = (int) Math.floor(p * (sortedByDuration.size() - 1));
        idx = Math.max(0, Math.min(idx, sortedByDuration.size() - 1));
        return sortedByDuration.get(idx).getDurationMs();
    }

    private List<Map<String, Object>> parseCsv(MultipartFile file) throws Exception {
        List<Map<String, Object>> sessions = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String header = reader.readLine();
            if (header == null) return sessions;
            String[] cols = header.split(",");

            // Build a flexible header index using normalized keys and synonyms
            Map<String, Integer> rawIdx = new HashMap<>();
            for (int i = 0; i < cols.length; i++) rawIdx.put(normalize(cols[i]), i);

        Map<String, String[]> synonyms = Map.ofEntries(
            Map.entry("userid", new String[]{"userid", "user_id", "user", "email"}),
            Map.entry("pageurl", new String[]{"pageurl", "page_url", "page url", "url", "page"}),
            Map.entry("pagetitle", new String[]{"pagetitle", "page_title", "page title", "title"}),
            Map.entry("timespentseconds", new String[]{"timespentseconds", "time_spent_seconds", "time spent seconds", "timespent", "dwell", "seconds"}),
            Map.entry("clickcount", new String[]{"clickcount", "click_count", "clicks"}),
            Map.entry("scrolldepthpercent", new String[]{"scrolldepthpercent", "scroll_depth_percent", "scroll depth percent", "scroll", "scrollpercent"}),
            Map.entry("timestamp", new String[]{"timestamp", "time", "ts", "datetime", "date"}),
            Map.entry("devicetype", new String[]{"devicetype", "device_type", "device"}),
            Map.entry("browser", new String[]{"browser", "useragent"}),
            Map.entry("sessionid", new String[]{"sessionid", "session_id", "sid"}),
            Map.entry("additionalnotes", new String[]{"additionalnotes", "notes", "note", "comment"})
        );

            Map<String, Integer> idx = new HashMap<>();
            for (Map.Entry<String, String[]> e : synonyms.entrySet()) {
                for (String alt : e.getValue()) {
                    Integer i = rawIdx.get(normalize(alt));
                    if (i != null) { idx.put(e.getKey(), i); break; }
                }
            }

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] parts = splitCsv(line, cols.length);
                String pageUrl = get(parts, idx, "pageurl");
                String pageTitle = get(parts, idx, "pagetitle");
                String timeSpentStr = get(parts, idx, "timespentseconds");
                String clickCountStr = get(parts, idx, "clickcount");
                String scrollStr = get(parts, idx, "scrolldepthpercent");
                String timestamp = get(parts, idx, "timestamp");
                String deviceType = get(parts, idx, "devicetype");
                String browser = get(parts, idx, "browser");
                String sessionId = get(parts, idx, "sessionid");
                String userId = get(parts, idx, "userid");
                String notes = get(parts, idx, "additionalnotes");

                if (pageUrl == null || pageUrl.isBlank()) continue;
                int timeSpent = safeInt(timeSpentStr, 0);
                int clickCount = safeInt(clickCountStr, 0);
                double scroll = safeDouble(scrollStr, 0.0);

                Map<String, Object> s = new HashMap<>();
                s.put("userId", emptyToNull(userId));
                s.put("pageUrl", pageUrl);
                s.put("pageTitle", emptyToNull(pageTitle));
                s.put("timeSpentSeconds", timeSpent);
                s.put("clickCount", clickCount);
                s.put("scrollDepthPercent", scroll);
                s.put("timestamp", emptyToNull(timestamp));
                s.put("deviceType", emptyToNull(deviceType));
                s.put("browser", emptyToNull(browser));
                s.put("sessionId", emptyToNull(sessionId));
                s.put("additionalNotes", emptyToNull(notes));
                sessions.add(s);
            }
        }
        return sessions;
    }

    private List<Map<String, Object>> parseCsvFromStream(InputStream inputStream) throws Exception {
        List<Map<String, Object>> sessions = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String header = reader.readLine();
            if (header == null) return sessions;
            String[] cols = header.split(",");

            Map<String, Integer> rawIdx = new HashMap<>();
            for (int i = 0; i < cols.length; i++) rawIdx.put(normalize(cols[i]), i);

            Map<String, String[]> synonyms = Map.ofEntries(
                    Map.entry("userid", new String[]{"userid", "user_id", "user", "email"}),
                    Map.entry("pageurl", new String[]{"pageurl", "page_url", "page url", "url", "page"}),
                    Map.entry("pagetitle", new String[]{"pagetitle", "page_title", "page title", "title"}),
                    Map.entry("timespentseconds", new String[]{"timespentseconds", "time_spent_seconds", "time spent seconds", "timespent", "dwell", "seconds"}),
                    Map.entry("clickcount", new String[]{"clickcount", "click_count", "clicks"}),
                    Map.entry("scrolldepthpercent", new String[]{"scrolldepthpercent", "scroll_depth_percent", "scroll depth percent", "scroll", "scrollpercent"}),
                    Map.entry("timestamp", new String[]{"timestamp", "time", "ts", "datetime", "date"}),
                    Map.entry("devicetype", new String[]{"devicetype", "device_type", "device"}),
                    Map.entry("browser", new String[]{"browser", "useragent"}),
                    Map.entry("sessionid", new String[]{"sessionid", "session_id", "sid"}),
                    Map.entry("additionalnotes", new String[]{"additionalnotes", "notes", "note", "comment"})
            );

            Map<String, Integer> idx = new HashMap<>();
            for (Map.Entry<String, String[]> e : synonyms.entrySet()) {
                for (String alt : e.getValue()) {
                    Integer i = rawIdx.get(normalize(alt));
                    if (i != null) { idx.put(e.getKey(), i); break; }
                }
            }

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] parts = splitCsv(line, cols.length);
                String pageUrl = get(parts, idx, "pageurl");
                String pageTitle = get(parts, idx, "pagetitle");
                String timeSpentStr = get(parts, idx, "timespentseconds");
                String clickCountStr = get(parts, idx, "clickcount");
                String scrollStr = get(parts, idx, "scrolldepthpercent");
                String timestamp = get(parts, idx, "timestamp");
                String deviceType = get(parts, idx, "devicetype");
                String browser = get(parts, idx, "browser");
                String sessionId = get(parts, idx, "sessionid");
                String userId = get(parts, idx, "userid");
                String notes = get(parts, idx, "additionalnotes");

                if (pageUrl == null || pageUrl.isBlank()) continue;
                int timeSpent = safeInt(timeSpentStr, 0);
                int clickCount = safeInt(clickCountStr, 0);
                double scroll = safeDouble(scrollStr, 0.0);

                Map<String, Object> s = new HashMap<>();
                s.put("userId", emptyToNull(userId));
                s.put("pageUrl", pageUrl);
                s.put("pageTitle", emptyToNull(pageTitle));
                s.put("timeSpentSeconds", timeSpent);
                s.put("clickCount", clickCount);
                s.put("scrollDepthPercent", scroll);
                s.put("timestamp", emptyToNull(timestamp));
                s.put("deviceType", emptyToNull(deviceType));
                s.put("browser", emptyToNull(browser));
                s.put("sessionId", emptyToNull(sessionId));
                s.put("additionalNotes", emptyToNull(notes));
                sessions.add(s);
            }
        }
        return sessions;
    }

    private static String[] splitCsv(String line, int expectedCols) {
        // Basic CSV split handling quotes
        List<String> out = new ArrayList<>();
        boolean inQuotes = false; StringBuilder sb = new StringBuilder();
        for (int i=0;i<line.length();i++) {
            char c = line.charAt(i);
            if (c == '"') { inQuotes = !inQuotes; continue; }
            if (c == ',' && !inQuotes) {
                out.add(sb.toString()); sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        out.add(sb.toString());
        while (out.size() < expectedCols) out.add("");
        return out.toArray(new String[0]);
    }

    private static String get(String[] parts, Map<String, Integer> idx, String key) {
        Integer i = idx.get(key);
        if (i == null || i < 0 || i >= parts.length) return null;
        String v = parts[i];
        if (v == null) return null;
        v = v.trim();
        if (v.startsWith("\"") && v.endsWith("\"")) v = v.substring(1, v.length()-1);
        return v;
    }

    private static String emptyToNull(String s) { return (s == null || s.isBlank()) ? null : s; }
    private static int safeInt(String s, int d) { try { return Integer.parseInt(s); } catch (Exception e) { return d; } }
    private static double safeDouble(String s, double d) { try { return Double.parseDouble(s); } catch (Exception e) { return d; } }

    private static String normalize(String s) {
        if (s == null) return "";
        String t = s.trim().toLowerCase(Locale.ROOT);
        // Remove all non-alphanumeric characters
        return t.replaceAll("[^a-z0-9]", "");
    }
}
