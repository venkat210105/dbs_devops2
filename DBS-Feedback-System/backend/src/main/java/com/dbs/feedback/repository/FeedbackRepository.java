package com.dbs.feedback.repository;

import com.dbs.feedback.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    // add custom queries here if needed (e.g., findByRatingGreaterThan)
    java.util.List<Feedback> findByUserProfile_Id(Long userProfileId);
    java.util.List<Feedback> findByEmail(String email);
    java.util.List<Feedback> findByUserEmail(String userEmail);
    java.util.List<Feedback> findByEmailIgnoreCase(String email);
    java.util.List<Feedback> findByUserEmailIgnoreCase(String userEmail);
    java.util.List<Feedback> findByUserNameIgnoreCase(String userName);
}
