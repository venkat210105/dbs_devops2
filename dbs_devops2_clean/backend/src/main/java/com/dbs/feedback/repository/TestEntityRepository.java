package com.dbs.feedback.repository;

import com.dbs.feedback.model.TestEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestEntityRepository extends JpaRepository<TestEntity, Long> {}
