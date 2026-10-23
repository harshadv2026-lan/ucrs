package com.ucrs.controller;

import com.ucrs.dto.ApiResponse;
import com.ucrs.model.Course;
import com.ucrs.model.Prerequisite;
import com.ucrs.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Course>>> getAll(
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.success(courseService.findAll(deptId, search)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(@PathVariable String id) {
        Course course = courseService.findById(id);
        List<Prerequisite> prerequisites = courseService.findPrerequisites(id);
        Map<String, Object> result = new HashMap<>();
        result.put("course", course);
        result.put("prerequisites", prerequisites);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Course>> create(
            @RequestBody Course course,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only ADMIN can create courses"));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(courseService.create(course), "Course created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Course>> update(
            @PathVariable String id,
            @RequestBody Course course,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only ADMIN can update courses"));
        }
        return ResponseEntity.ok(ApiResponse.success(courseService.update(id, course), "Course updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only ADMIN can delete courses"));
        }
        courseService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Course deleted"));
    }
}
