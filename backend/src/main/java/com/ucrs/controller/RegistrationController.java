package com.ucrs.controller;

import com.ucrs.dto.ApiResponse;
import com.ucrs.dto.GradeUpdateRequest;
import com.ucrs.dto.RegistrationRequest;
import com.ucrs.dto.StudentRegistrationDTO;
import com.ucrs.model.Registration;
import com.ucrs.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    @GetMapping("/{studentRegNo}")
    public ResponseEntity<ApiResponse<List<StudentRegistrationDTO>>> getByStudent(
            @PathVariable String studentRegNo,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if ("STUDENT".equalsIgnoreCase(userRole) && userId != null && !userId.trim().isEmpty()) {
            if (!studentRegNo.equalsIgnoreCase(userId.trim())) {
                throw new SecurityException("Access denied: You can only view your own course registrations");
            }
        }
        return ResponseEntity.ok(ApiResponse.success(registrationService.findByStudent(studentRegNo)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Registration>> register(
            @Valid @RequestBody RegistrationRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if ("STUDENT".equalsIgnoreCase(userRole) && userId != null && !userId.trim().isEmpty()) {
            if (!request.getStudentRegNo().equalsIgnoreCase(userId.trim())) {
                throw new SecurityException("Access denied: Students can only register courses for themselves");
            }
        }
        Registration registration = registrationService.register(
                request.getStudentRegNo(), request.getOfferingId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(registration, "Registration successful"));
    }

    @DeleteMapping("/{regId}")
    public ResponseEntity<ApiResponse<Registration>> drop(
            @PathVariable Long regId,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        Registration dropped = registrationService.dropRegistration(regId, userId, userRole);
        return ResponseEntity.ok(ApiResponse.success(dropped, "Registration dropped successfully"));
    }

    @PutMapping("/{regId}/grade")
    public ResponseEntity<ApiResponse<Registration>> updateGrade(
            @PathVariable Long regId,
            @RequestBody GradeUpdateRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"FACULTY".equalsIgnoreCase(userRole) && !"ADMIN".equalsIgnoreCase(userRole)) {
            throw new SecurityException("Access denied: Only FACULTY or ADMIN can assign grades");
        }
        Registration updated = registrationService.updateGrade(regId, request.getGrade());
        return ResponseEntity.ok(ApiResponse.success(updated, "Grade updated successfully"));
    }

    @GetMapping("/{studentRegNo}/credits")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTotalCredits(
            @PathVariable String studentRegNo,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if ("STUDENT".equalsIgnoreCase(userRole) && userId != null && !userId.trim().isEmpty()) {
            if (!studentRegNo.equalsIgnoreCase(userId.trim())) {
                throw new SecurityException("Access denied: You can only view your own credit total");
            }
        }
        int credits = registrationService.getTotalCredits(studentRegNo);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("studentRegNo", studentRegNo, "totalCredits", credits)));
    }
}
