package com.dbs.feedback.admin;

import com.dbs.feedback.model.FeedbackTask;
import com.dbs.feedback.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
             allowCredentials = "true",
             maxAge = 3600)
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskDto>> listTasks(@RequestParam(defaultValue = "TODO") String status) {
        List<FeedbackTask> tasks = taskService.listByStatus(status);
        List<TaskDto> dtos = tasks.stream().map(TaskDto::from).toList();
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }

    @PostMapping("/tasks")
    public ResponseEntity<TaskDto> createTask(@RequestBody CreateTaskRequest req) {
        FeedbackTask t = taskService.createTaskForFeedback(req.feedbackId, req.title, req.description, req.assignedTo);
        return new ResponseEntity<>(TaskDto.from(t), HttpStatus.CREATED);
    }

    @PostMapping("/tasks/{id}/done")
    public ResponseEntity<TaskDto> markDone(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String note = body != null ? body.get("resolutionNote") : null;
        return new ResponseEntity<>(TaskDto.from(taskService.markDone(id, note)), HttpStatus.OK);
    }

    @PostMapping("/tasks/generate")
    public ResponseEntity<Map<String, Object>> generate(@RequestParam(defaultValue = "false") boolean onlyNegative) {
        return new ResponseEntity<>(taskService.generateTasks(onlyNegative), HttpStatus.OK);
    }

    @PostMapping("/tasks/{id}/assign")
    public ResponseEntity<TaskDto> assign(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String owner = body != null ? body.getOrDefault("assignedTo", null) : null;
        if (owner == null || owner.isBlank()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        FeedbackTask t = taskService.assign(id, owner.trim());
        return new ResponseEntity<>(TaskDto.from(t), HttpStatus.OK);
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        java.util.Optional<com.dbs.feedback.model.FeedbackTask> existing = taskService.findById(id);
        if (existing.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        taskService.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    public static class CreateTaskRequest {
        public Long feedbackId;
        public String title;
        public String description;
        public String assignedTo;
    }
}
