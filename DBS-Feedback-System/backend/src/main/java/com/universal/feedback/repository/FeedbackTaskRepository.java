package com.universal.feedback.repository;

import com.universal.feedback.model.FeedbackTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackTaskRepository extends JpaRepository<FeedbackTask, Long> {
    boolean existsByFeedback_IdAndStatus(Long feedbackId, String status);
    List<FeedbackTask> findByStatusOrderByCreatedAtDesc(String status);
    List<FeedbackTask> findByFeedback_Id(Long feedbackId);
    Optional<FeedbackTask> findTopByFeedback_IdOrderByCreatedAtDesc(Long feedbackId);
    List<FeedbackTask> findByStatusAndAssignedToIsNotNullAndUpdatedAtBefore(String status, java.time.LocalDateTime cutoff);
    List<FeedbackTask> findByStatusAndAssignedToIsNullOrderByCreatedAtAsc(String status);
    List<FeedbackTask> findByAssignedToIsNotNullOrderByUpdatedAtDesc();
}
