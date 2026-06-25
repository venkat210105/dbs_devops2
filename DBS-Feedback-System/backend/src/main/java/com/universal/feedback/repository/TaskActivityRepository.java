package com.universal.feedback.repository;

import com.universal.feedback.model.TaskActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskActivityRepository extends JpaRepository<TaskActivity, Long> {
    List<TaskActivity> findByTask_IdOrderByCreatedAtAsc(Long taskId);
    TaskActivity findTopByTask_IdAndActionOrderByCreatedAtDesc(Long taskId, String action);
}
