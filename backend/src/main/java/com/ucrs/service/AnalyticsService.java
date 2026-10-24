package com.ucrs.service;

import com.ucrs.model.*;
import com.ucrs.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final CourseRepository courseRepository;
    private final CourseOfferingRepository offeringRepository;
    private final RegistrationRepository registrationRepository;
    private final DepartmentRepository departmentRepository;
    private final SemesterRepository semesterRepository;

    public Map<String, Object> getAnalytics() {
        List<Student> students = studentRepository.findAll();
        List<Faculty> facultyList = facultyRepository.findAll();
        List<Course> courses = courseRepository.findAll();
        List<CourseOffering> offerings = offeringRepository.findAll();
        List<Registration> registrations = registrationRepository.findAll();
        List<Department> departments = departmentRepository.findAll();

        long registeredCount = registrations.stream().filter(r -> "REGISTERED".equalsIgnoreCase(r.getStatus())).count();
        long completedCount = registrations.stream().filter(r -> "COMPLETED".equalsIgnoreCase(r.getStatus())).count();
        long droppedCount = registrations.stream().filter(r -> "DROPPED".equalsIgnoreCase(r.getStatus())).count();

        // Active offerings in active semester (or all offerings)
        int totalCapacity = 0;
        int totalEnrolledSeats = 0;
        int fullOfferingsCount = 0;
        int nearFullOfferingsCount = 0;

        List<Map<String, Object>> offeringOccupancyList = new ArrayList<>();

        for (CourseOffering o : offerings) {
            long enrolled = offeringRepository.countActiveRegistrations(o.getOfferingId());
            int maxSeats = o.getMaxSeats() != null ? o.getMaxSeats() : 60;
            long available = Math.max(0, maxSeats - enrolled);
            double rate = maxSeats > 0 ? ((double) enrolled / maxSeats) * 100.0 : 0.0;
            rate = Math.round(rate * 10.0) / 10.0;

            totalCapacity += maxSeats;
            totalEnrolledSeats += enrolled;

            String status = "AVAILABLE";
            if (enrolled >= maxSeats) {
                status = "FULL";
                fullOfferingsCount++;
            } else if (rate >= 80.0) {
                status = "NEAR_FULL";
                nearFullOfferingsCount++;
            }

            Map<String, Object> item = new HashMap<>();
            item.put("offeringId", o.getOfferingId());
            item.put("courseId", o.getCourse().getCourseId());
            item.put("courseName", o.getCourse().getCourseName());
            item.put("credits", o.getCourse().getCredits());
            item.put("departmentName", o.getCourse().getDepartment() != null ? o.getCourse().getDepartment().getDeptName() : "General");
            item.put("facultyName", o.getFaculty() != null ? o.getFaculty().getFirstName() + " " + o.getFaculty().getLastName() : "Unassigned");
            item.put("semesterName", o.getSemester() != null ? o.getSemester().getSemesterName() : "N/A");
            item.put("schedule", o.getSchedule() != null ? o.getSchedule() : "TBA");
            item.put("maxSeats", maxSeats);
            item.put("registeredCount", enrolled);
            item.put("availableSeats", available);
            item.put("occupancyRate", rate);
            item.put("status", status);

            offeringOccupancyList.add(item);
        }

        // Sort by occupancy rate descending
        offeringOccupancyList.sort((a, b) -> Double.compare((Double) b.get("occupancyRate"), (Double) a.get("occupancyRate")));

        // Department-level metrics
        List<Map<String, Object>> departmentStats = new ArrayList<>();
        for (Department dept : departments) {
            long deptStudents = students.stream().filter(s -> s.getDepartment() != null && dept.getDeptId().equals(s.getDepartment().getDeptId())).count();
            long deptCourses = courses.stream().filter(c -> c.getDepartment() != null && dept.getDeptId().equals(c.getDepartment().getDeptId())).count();
            long deptOfferings = offerings.stream().filter(o -> o.getCourse().getDepartment() != null && dept.getDeptId().equals(o.getCourse().getDepartment().getDeptId())).count();
            long deptEnrollments = registrations.stream()
                    .filter(r -> "REGISTERED".equalsIgnoreCase(r.getStatus())
                            && r.getOffering().getCourse().getDepartment() != null
                            && dept.getDeptId().equals(r.getOffering().getCourse().getDepartment().getDeptId()))
                    .count();

            Map<String, Object> dMap = new HashMap<>();
            dMap.put("deptId", dept.getDeptId());
            dMap.put("deptName", dept.getDeptName());
            dMap.put("studentCount", deptStudents);
            dMap.put("courseCount", deptCourses);
            dMap.put("offeringCount", deptOfferings);
            dMap.put("enrollmentCount", deptEnrollments);
            departmentStats.add(dMap);
        }

        double overallOccupancy = totalCapacity > 0 ? Math.round(((double) totalEnrolledSeats / totalCapacity) * 1000.0) / 10.0 : 0.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalStudents", students.size());
        summary.put("totalFaculty", facultyList.size());
        summary.put("totalCourses", courses.size());
        summary.put("totalOfferings", offerings.size());
        summary.put("totalRegistrations", registrations.size());
        summary.put("activeRegistrations", registeredCount);
        summary.put("completedRegistrations", completedCount);
        summary.put("droppedRegistrations", droppedCount);
        summary.put("totalCapacity", totalCapacity);
        summary.put("totalEnrolledSeats", totalEnrolledSeats);
        summary.put("overallOccupancyRate", overallOccupancy);
        summary.put("fullOfferingsCount", fullOfferingsCount);
        summary.put("nearFullOfferingsCount", nearFullOfferingsCount);

        Map<String, Object> statusBreakdown = Map.of(
                "REGISTERED", registeredCount,
                "COMPLETED", completedCount,
                "DROPPED", droppedCount
        );

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("statusBreakdown", statusBreakdown);
        result.put("departmentStats", departmentStats);
        result.put("offeringOccupancy", offeringOccupancyList);

        return result;
    }

    public String generateEnrollmentReportCsv() {
        List<Registration> list = registrationRepository.findAll();
        StringBuilder sb = new StringBuilder();
        sb.append("Registration ID,Student Reg No,Student Name,Course ID,Course Name,Credits,Semester,Faculty,Schedule,Status,Grade,Registration Date\n");

        for (Registration r : list) {
            Student s = r.getStudent();
            CourseOffering o = r.getOffering();
            Course c = o.getCourse();
            Faculty f = o.getFaculty();
            Semester sem = o.getSemester();

            sb.append(escapeCsv(String.valueOf(r.getRegId()))).append(",")
              .append(escapeCsv(s.getStudentRegNo())).append(",")
              .append(escapeCsv(s.getFirstName() + " " + s.getLastName())).append(",")
              .append(escapeCsv(c.getCourseId())).append(",")
              .append(escapeCsv(c.getCourseName())).append(",")
              .append(c.getCredits()).append(",")
              .append(escapeCsv(sem != null ? sem.getSemesterName() : "")).append(",")
              .append(escapeCsv(f != null ? f.getFirstName() + " " + f.getLastName() : "Unassigned")).append(",")
              .append(escapeCsv(o.getSchedule() != null ? o.getSchedule() : "")).append(",")
              .append(escapeCsv(r.getStatus())).append(",")
              .append(escapeCsv(r.getGrade() != null ? r.getGrade() : "")).append(",")
              .append(escapeCsv(r.getRegistrationDate() != null ? r.getRegistrationDate().toString() : "")).append("\n");
        }
        return sb.toString();
    }

    public String generateOccupancyReportCsv() {
        List<CourseOffering> offerings = offeringRepository.findAll();
        StringBuilder sb = new StringBuilder();
        sb.append("Offering ID,Course ID,Course Name,Department,Faculty,Semester,Schedule,Max Seats,Enrolled,Available,Occupancy Rate (%)\n");

        for (CourseOffering o : offerings) {
            long enrolled = offeringRepository.countActiveRegistrations(o.getOfferingId());
            int max = o.getMaxSeats() != null ? o.getMaxSeats() : 60;
            long avail = Math.max(0, max - enrolled);
            double rate = max > 0 ? Math.round(((double) enrolled / max) * 1000.0) / 10.0 : 0.0;

            sb.append(o.getOfferingId()).append(",")
              .append(escapeCsv(o.getCourse().getCourseId())).append(",")
              .append(escapeCsv(o.getCourse().getCourseName())).append(",")
              .append(escapeCsv(o.getCourse().getDepartment() != null ? o.getCourse().getDepartment().getDeptName() : "")).append(",")
              .append(escapeCsv(o.getFaculty() != null ? o.getFaculty().getFirstName() + " " + o.getFaculty().getLastName() : "Unassigned")).append(",")
              .append(escapeCsv(o.getSemester() != null ? o.getSemester().getSemesterName() : "")).append(",")
              .append(escapeCsv(o.getSchedule() != null ? o.getSchedule() : "")).append(",")
              .append(max).append(",")
              .append(enrolled).append(",")
              .append(avail).append(",")
              .append(rate).append("\n");
        }
        return sb.toString();
    }

    public String generateStudentDirectoryCsv() {
        List<Student> students = studentRepository.findAll();
        StringBuilder sb = new StringBuilder();
        sb.append("Registration Number,First Name,Last Name,Email,Phone,Department,Semester,CGPA\n");

        for (Student s : students) {
            sb.append(escapeCsv(s.getStudentRegNo())).append(",")
              .append(escapeCsv(s.getFirstName())).append(",")
              .append(escapeCsv(s.getLastName())).append(",")
              .append(escapeCsv(s.getEmail())).append(",")
              .append(escapeCsv(s.getPhone() != null ? s.getPhone() : "")).append(",")
              .append(escapeCsv(s.getDepartment() != null ? s.getDepartment().getDeptName() : "")).append(",")
              .append(s.getSemesterNo() != null ? s.getSemesterNo() : 1).append(",")
              .append(s.getCgpa() != null ? s.getCgpa() : "").append("\n");
        }
        return sb.toString();
    }

    private String escapeCsv(String val) {
        if (val == null) return "\"\"";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }
}
