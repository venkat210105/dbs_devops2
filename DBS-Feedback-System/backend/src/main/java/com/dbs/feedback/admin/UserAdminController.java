package com.dbs.feedback.admin;

import com.dbs.feedback.model.Feedback;
import com.dbs.feedback.model.UserProfile;
import com.dbs.feedback.repository.FeedbackRepository;
import com.dbs.feedback.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/admin/users")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true",
        maxAge = 3600)
public class UserAdminController {
    private final UserProfileRepository userRepo;
    private final FeedbackRepository feedbackRepo;

    public UserAdminController(UserProfileRepository userRepo, FeedbackRepository feedbackRepo) {
        this.userRepo = userRepo;
        this.feedbackRepo = feedbackRepo;
    }

    @GetMapping
    public List<UserProfile> listUsers() {
        return userRepo.findAll();
    }

    @GetMapping("/by-email")
    public ResponseEntity<?> getUserByEmail(@RequestParam(name = "email", required = false) String email) {
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "email is required"));
        }
        final String norm = email.trim().toLowerCase();
        java.util.Optional<UserProfile> existing = userRepo.findByEmail(norm);
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }
        // Best-effort: if profile missing, create one from any feedback with same email fields
        List<Feedback> fbByEmail = feedbackRepo.findByEmail(norm);
        List<Feedback> fbByUserEmail = fbByEmail.isEmpty() ? feedbackRepo.findByUserEmail(norm) : java.util.Collections.emptyList();
        Feedback source = !fbByEmail.isEmpty() ? fbByEmail.get(0) : (!fbByUserEmail.isEmpty() ? fbByUserEmail.get(0) : null);
        if (source == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Not found"));
        }
        UserProfile created = new UserProfile();
        created.setEmail(norm);
        created.setUserName(source.getUserName());
        created.setCustomerName(source.getCustomerName());
        created = userRepo.save(created);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/by-username")
    public ResponseEntity<?> getUserByUsername(@RequestParam(name = "userName", required = false) String userName) {
        if (userName == null || userName.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "userName is required"));
        }
        return userRepo.findFirstByUserNameIgnoreCase(userName.trim())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Not found")));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        java.util.Optional<UserProfile> opt = userRepo.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Not found"));
        }
        return ResponseEntity.ok(opt.get());
    }

    @GetMapping("/{id}/feedbacks")
    public ResponseEntity<?> getUserFeedbacks(
            @PathVariable Long id,
            @RequestParam(name = "from", required = false) String fromDateIso,
            @RequestParam(name = "to", required = false) String toDateIso,
            @RequestParam(name = "sentiment", required = false) String sentiment,
            @RequestParam(name = "topic", required = false) String topic
    ) {
        java.util.Optional<UserProfile> uopt = userRepo.findById(id);
        if (uopt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Not found"));
        }
        UserProfile profile = uopt.get();
        List<Feedback> list = feedbackRepo.findByUserProfile_Id(id);
        // On-demand backfill: if no linked feedbacks yet, try matching by email or username
        if (list.isEmpty()) {
            boolean changed = false;
            if (profile.getEmail() != null && !profile.getEmail().isBlank()) {
                String e = profile.getEmail().trim();
                List<Feedback> byE = feedbackRepo.findByEmailIgnoreCase(e);
                List<Feedback> byUE = feedbackRepo.findByUserEmailIgnoreCase(e);
                for (Feedback f : byE) { f.setUserProfile(profile); feedbackRepo.save(f); changed = true; }
                for (Feedback f : byUE) { f.setUserProfile(profile); feedbackRepo.save(f); changed = true; }
            }
            if (list.isEmpty() && !changed && profile.getUserName() != null && !profile.getUserName().isBlank()) {
                String un = profile.getUserName().trim();
                List<Feedback> byUN = feedbackRepo.findByUserNameIgnoreCase(un);
                for (Feedback f : byUN) { f.setUserProfile(profile); feedbackRepo.save(f); changed = true; }
            }
            if (changed) {
                list = feedbackRepo.findByUserProfile_Id(id);
            }
        }

        Stream<Feedback> stream = list.stream();

        // Filter by date range if provided (expects ISO-8601 date string like 2024-01-31 or full timestamp)
        java.time.Instant fromInstant = null;
        java.time.Instant toInstant = null;
        try {
            if (fromDateIso != null && !fromDateIso.isBlank()) {
                fromInstant = parseToInstant(fromDateIso.trim());
            }
            if (toDateIso != null && !toDateIso.isBlank()) {
                toInstant = parseToInstant(toDateIso.trim());
            }
        } catch (Exception ignored) {
            // ignore parse errors and treat as no filter
        }
        final java.time.Instant fFrom = fromInstant;
        final java.time.Instant fTo = toInstant;
        if (fFrom != null) {
            stream = stream.filter(fb -> {
                java.sql.Timestamp ts = fb.getCreatedAt();
                return ts == null || !ts.toInstant().isBefore(fFrom);
            });
        }
        if (fTo != null) {
            stream = stream.filter(fb -> {
                java.sql.Timestamp ts = fb.getCreatedAt();
                return ts == null || !ts.toInstant().isAfter(fTo);
            });
        }

        if (sentiment != null && !sentiment.isBlank()) {
            String s = sentiment.trim().toLowerCase();
            stream = stream.filter(fb -> {
                String label = (fb.getSentimentLabel() == null ? "" : fb.getSentimentLabel()).toLowerCase();
                return label.contains(s);
            });
        }
        if (topic != null && !topic.isBlank()) {
            String t = topic.trim().toLowerCase();
            stream = stream.filter(fb -> {
                String tp = (fb.getTopic() == null ? "" : fb.getTopic()).toLowerCase();
                return tp.contains(t);
            });
        }

        List<Feedback> filtered = stream.collect(Collectors.toList());
        return ResponseEntity.ok(filtered);
    }

    // Maintenance: ensure existing feedbacks with matching email/username attach to a profile
    @PostMapping("/maintenance/backfill-profiles")
    public ResponseEntity<?> backfillProfiles() {
        List<Feedback> all = feedbackRepo.findAll();
        int total = all.size();
        int updated = 0;
        for (Feedback f : all) {
            if (f.getUserProfile() != null) continue;
            String email = null;
            if (f.getEmail() != null && !f.getEmail().isBlank()) email = f.getEmail().trim().toLowerCase();
            else if (f.getUserEmail() != null && !f.getUserEmail().isBlank()) email = f.getUserEmail().trim().toLowerCase();
            String username = (f.getUserName() != null && !f.getUserName().isBlank()) ? f.getUserName().trim() : null;

            UserProfile profile = null;
            if (email != null) profile = userRepo.findByEmail(email).orElse(null);
            if (profile == null && (email != null || username != null)) {
                profile = new UserProfile();
                profile.setEmail(email);
                profile.setUserName(username);
                profile.setCustomerName(f.getCustomerName());
                profile = userRepo.save(profile);
            }
            if (profile != null) {
                f.setUserProfile(profile);
                feedbackRepo.save(f);
                updated++;
            }
        }
        return ResponseEntity.ok(Map.of("total", total, "updated", updated));
    }

    private java.time.Instant parseToInstant(String iso) {
        // Accept YYYY-MM-DD or full ISO datetime; interpret date-only as start of day (from) or as exact date
        if (iso.length() == 10 && iso.charAt(4) == '-' && iso.charAt(7) == '-') {
            return java.time.LocalDate.parse(iso).atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
        }
        return java.time.Instant.parse(iso);
    }
}
