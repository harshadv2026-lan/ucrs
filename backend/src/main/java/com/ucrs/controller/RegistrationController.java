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
            @PathVariable String studentRegNo) {
        return ResponseEntity.ok(ApiResponse.success(registrationService.findByStudent(studentRegNo)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Registration>> register(
            @Valid @RequestBody RegistrationRequest request) {
        Registration registration = registrationService.register(
                request.getStudentRegNo(), request.getOfferingId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(registration, "Registration successful"));
    }

    @DeleteMapping("/{regId}")
    public ResponseEntity<ApiResponse<Registration>> drop(@PathVariable Long regId) {
        Registration dropped = registrationService.dropRegistration(regId);
        return ResponseEntity.ok(ApiResponse.success(dropped, "Registration dropped successfully"));
    }

    @PutMapping("/{regId}/grade")
    public ResponseEntity<ApiResponse<Registration>> updateGrade(
            @PathVariable Long regId,
            @RequestBody GradeUpdateRequest request) {
        Registration updated = registrationService.updateGrade(regId, request.getGrade());
        return ResponseEntity.ok(ApiResponse.success(updated, "Grade updated successfully"));
    }

    @GetMapping("/{studentRegNo}/credits")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTotalCredits(
            @PathVariable String studentRegNo) {
        int credits = registrationService.getTotalCredits(studentRegNo);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("studentRegNo", studentRegNo, "totalCredits", credits)));
    }
}
