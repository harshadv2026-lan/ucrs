package com.ucrs.controller;

import com.ucrs.dto.ApiResponse;
import com.ucrs.model.Semester;
import com.ucrs.service.SemesterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterService semesterService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Semester>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(semesterService.findAll()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<Semester>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(semesterService.findActive()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Semester>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(semesterService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Semester>> create(@RequestBody Semester semester) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(semesterService.create(semester), "Semester created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Semester>> update(@PathVariable Long id, @RequestBody Semester semester) {
        return ResponseEntity.ok(ApiResponse.success(semesterService.update(id, semester), "Semester updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        semesterService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Semester deleted"));
    }
}
