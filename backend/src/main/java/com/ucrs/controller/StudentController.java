package com.ucrs.controller;

import com.ucrs.dto.ApiResponse;
import com.ucrs.model.Student;
import com.ucrs.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Student>>> getAll(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only ADMIN can list all students"));
        }
        return ResponseEntity.ok(ApiResponse.success(studentService.findAll()));
    }

    @GetMapping("/{regNo}")
    public ResponseEntity<ApiResponse<Student>> getById(@PathVariable String regNo) {
        return ResponseEntity.ok(ApiResponse.success(studentService.findById(regNo)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Student>> create(@RequestBody Student student) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(studentService.create(student), "Student created"));
    }

    @PutMapping("/{regNo}")
    public ResponseEntity<ApiResponse<Student>> update(
            @PathVariable String regNo, @RequestBody Student student) {
        return ResponseEntity.ok(ApiResponse.success(studentService.update(regNo, student), "Student updated"));
    }

    @DeleteMapping("/{regNo}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String regNo,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only ADMIN can delete students"));
        }
        studentService.delete(regNo);
        return ResponseEntity.ok(ApiResponse.success(null, "Student deleted"));
    }
}
