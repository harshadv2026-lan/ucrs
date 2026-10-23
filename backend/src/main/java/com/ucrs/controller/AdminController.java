package com.ucrs.controller;

import com.ucrs.dto.ApiResponse;
import com.ucrs.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final CourseRepository courseRepository;
    private final CourseOfferingRepository offeringRepository;
    private final RegistrationRepository registrationRepository;
    private final DepartmentRepository departmentRepository;
    private final SemesterRepository semesterRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Admin access required"));
        }
        Map<String, Object> stats = Map.of(
                "totalStudents", studentRepository.count(),
                "totalFaculty", facultyRepository.count(),
                "totalCourses", courseRepository.count(),
                "totalOfferings", offeringRepository.count(),
                "totalRegistrations", registrationRepository.count(),
                "totalDepartments", departmentRepository.count(),
                "totalSemesters", semesterRepository.count()
        );
        return ResponseEntity.ok(ApiResponse.success(stats, "System statistics"));
    }
}
