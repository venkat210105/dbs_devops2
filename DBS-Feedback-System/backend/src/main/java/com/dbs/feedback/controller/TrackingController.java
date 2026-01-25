package com.dbs.feedback.controller;

import com.dbs.feedback.model.PageView;
import com.dbs.feedback.repository.PageViewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/tracking")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true",
        maxAge = 3600)
public class TrackingController {

    private final PageViewRepository pageViewRepository;

    public TrackingController(PageViewRepository pageViewRepository) {
        this.pageViewRepository = pageViewRepository;
    }

    public record StartReq(String sessionId, String path, Long startAtMs, String uaHash, String ipHash) {}
    public record StartRes(Long pageViewId) {}
    public record HeartbeatReq(Long pageViewId, Long tsMs) {}
    public record EndReq(Long pageViewId, Long endAtMs, Long durationMs) {}

    @PostMapping("/page-view/start")
    public ResponseEntity<StartRes> start(@RequestBody StartReq req) {
        if (req == null || req.sessionId() == null || req.sessionId().isBlank() || req.path() == null || req.path().isBlank()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        PageView pv = new PageView();
        pv.setSessionId(req.sessionId());
        pv.setPath(req.path());
        pv.setStartAt(new Timestamp(req.startAtMs() != null ? req.startAtMs() : Instant.now().toEpochMilli()));
        pv.setUserAgentHash(req.uaHash());
        pv.setIpHash(req.ipHash());
        pv = pageViewRepository.save(pv);
        return new ResponseEntity<>(new StartRes(pv.getId()), HttpStatus.OK);
    }

    @PostMapping("/page-view/heartbeat")
    public ResponseEntity<Map<String, Object>> heartbeat(@RequestBody HeartbeatReq req) {
        Map<String, Object> res = new HashMap<>();
        if (req == null || req.pageViewId() == null) return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        PageView pv = pageViewRepository.findById(req.pageViewId()).orElse(null);
        if (pv == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        pv.setHeartbeats((pv.getHeartbeats() == null ? 0 : pv.getHeartbeats()) + 1);
        pageViewRepository.save(pv);
        res.put("ok", true);
        return new ResponseEntity<>(res, HttpStatus.OK);
    }

    @PostMapping("/page-view/end")
    public ResponseEntity<Map<String, Object>> end(@RequestBody EndReq req) {
        Map<String, Object> res = new HashMap<>();
        if (req == null || req.pageViewId() == null) return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        PageView pv = pageViewRepository.findById(req.pageViewId()).orElse(null);
        if (pv == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        if (req.endAtMs() != null) {
            pv.setEndAt(new Timestamp(req.endAtMs()));
        } else {
            pv.setEndAt(new Timestamp(Instant.now().toEpochMilli()));
        }
        if (req.durationMs() != null) {
            pv.setDurationMs(Math.max(0, req.durationMs()));
        } else if (pv.getStartAt() != null && pv.getEndAt() != null) {
            pv.setDurationMs(Math.max(0, pv.getEndAt().getTime() - pv.getStartAt().getTime()));
        }
        pageViewRepository.save(pv);
        res.put("ok", true);
        return new ResponseEntity<>(res, HttpStatus.OK);
    }
}
