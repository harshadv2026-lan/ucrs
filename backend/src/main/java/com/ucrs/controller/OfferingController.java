package com.ucrs.controller;

import com.ucrs.dto.ApiResponse;
import com.ucrs.dto.CourseOfferingDTO;
import com.ucrs.model.CourseOffering;
import com.ucrs.model.Registration;
import com.ucrs.service.OfferingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/offerings")
@RequiredArgsConstructor
public class OfferingController {

    private final OfferingService offeringService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseOfferingDTO>>> getAll(
            @RequestParam(required = false) Long semesterId,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Long facultyId) {
        return ResponseEntity.ok(ApiResponse.success(offeringService.findAll(semesterId, deptId, facultyId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseOfferingDTO>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(offeringService.findById(id)));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<ApiResponse<List<Registration>>> getStudents(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole) && !"FACULTY".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only ADMIN or FACULTY can view student lists"));
        }
        return ResponseEntity.ok(ApiResponse.success(offeringService.findRegisteredStudents(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CourseOffering>> create(
            @RequestBody CourseOffering offering,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only ADMIN can create offerings"));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(offeringService.create(offering), "Offering created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseOffering>> update(
            @PathVariable Long id,
            @RequestBody CourseOffering offering,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only ADMIN can update offerings"));
        }
        return ResponseEntity.ok(ApiResponse.success(offeringService.update(id, offering), "Offering updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only ADMIN can delete offerings"));
        }
        offeringService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Offering deleted"));
    }
}
