package com.ucrs.controller;

import com.ucrs.dto.ApiResponse;
import com.ucrs.repository.*;
import com.ucrs.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
    private final AnalyticsService analyticsService;

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

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Admin access required"));
        }
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getAnalytics(), "System analytics and seat occupancy"));
    }

    @GetMapping(value = "/reports/enrollments/csv", produces = "text/csv")
    public ResponseEntity<String> downloadEnrollmentReportCsv(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(403).body("Admin access required");
        }
        String csv = analyticsService.generateEnrollmentReportCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"enrollment_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    @GetMapping(value = "/reports/occupancy/csv", produces = "text/csv")
    public ResponseEntity<String> downloadOccupancyReportCsv(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(403).body("Admin access required");
        }
        String csv = analyticsService.generateOccupancyReportCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"seat_occupancy_report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    @GetMapping(value = "/reports/students/csv", produces = "text/csv")
    public ResponseEntity<String> downloadStudentDirectoryCsv(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(403).body("Admin access required");
        }
        String csv = analyticsService.generateStudentDirectoryCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"student_directory.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }
}
