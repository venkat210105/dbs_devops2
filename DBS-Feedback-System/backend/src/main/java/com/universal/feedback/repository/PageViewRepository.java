package com.universal.feedback.repository;

import com.universal.feedback.model.PageView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

@Repository
public interface PageViewRepository extends JpaRepository<PageView, Long> {
    List<PageView> findByPathAndCreatedAtAfter(String path, Timestamp after);
}
