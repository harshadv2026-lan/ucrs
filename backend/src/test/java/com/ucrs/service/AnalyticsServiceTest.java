package com.ucrs.service;

import com.ucrs.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("demo")
public class AnalyticsServiceTest {

    @Autowired
    private AnalyticsService analyticsService;

    @Test
    public void testGetAnalyticsCalculations() {
        Map<String, Object> analytics = analyticsService.getAnalytics();
        assertNotNull(analytics);
        assertTrue(analytics.containsKey("summary"));
        assertTrue(analytics.containsKey("departmentStats"));
        assertTrue(analytics.containsKey("offeringOccupancy"));
        assertTrue(analytics.containsKey("statusBreakdown"));

        @SuppressWarnings("unchecked")
        Map<String, Object> summary = (Map<String, Object>) analytics.get("summary");
        assertTrue((Integer) summary.get("totalStudents") > 0);
        assertTrue((Integer) summary.get("totalCourses") > 0);
        assertTrue((Integer) summary.get("totalCapacity") > 0);
    }

    @Test
    public void testGenerateCsvReports() {
        String enrollmentCsv = analyticsService.generateEnrollmentReportCsv();
        assertNotNull(enrollmentCsv);
        assertTrue(enrollmentCsv.startsWith("Registration ID,Student Reg No,Student Name"));

        String occupancyCsv = analyticsService.generateOccupancyReportCsv();
        assertNotNull(occupancyCsv);
        assertTrue(occupancyCsv.startsWith("Offering ID,Course ID,Course Name"));

        String studentCsv = analyticsService.generateStudentDirectoryCsv();
        assertNotNull(studentCsv);
        assertTrue(studentCsv.startsWith("Registration Number,First Name,Last Name"));
    }
}
