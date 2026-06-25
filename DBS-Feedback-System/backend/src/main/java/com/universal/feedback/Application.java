package com.universal.feedback;

import com.universal.feedback.model.TestEntity;
import com.universal.feedback.repository.TestEntityRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    CommandLineRunner run(TestEntityRepository repo) {
        return args -> {
            TestEntity t = new TestEntity();
            t.setName("Test Name");
            repo.save(t);
            System.out.println("Saved entity: " + t.getName());
        };
    }
}
