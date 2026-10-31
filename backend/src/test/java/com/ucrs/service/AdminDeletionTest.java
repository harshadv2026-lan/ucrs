package com.ucrs.service;

import com.ucrs.exception.DataDependencyException;
import com.ucrs.model.*;
import com.ucrs.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("demo")
public class AdminDeletionTest {

    @Autowired
    private StudentService studentService;

    @Autowired
    private FacultyService facultyService;

    @Autowired
    private CourseService courseService;

    @Autowired
    private DepartmentService departmentService;

    @Autowired
    private SemesterService semesterService;

    @Autowired
    private OfferingService offeringService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private SemesterRepository semesterRepository;

    @Autowired
    private CourseOfferingRepository offeringRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Test
    @DisplayName("Block deleting student with completed course grades")
    void testDeleteStudentWithCompletedRegistrationsBlocked() {
        // 2021CS001 has COMPLETED records from demo data
        DataDependencyException ex = assertThrows(DataDependencyException.class, () -> {
            studentService.delete("2021CS001");
        });
        assertTrue(ex.getMessage().contains("completed course record(s) with academic grades exist"));
        assertTrue(ex.getMessage().contains("Academic history must be preserved"));

        // Verify student still exists
        assertTrue(studentRepository.findById("2021CS001").isPresent());
    }

    @Test
    @DisplayName("Allow deleting student with zero registrations")
    void testDeleteIndependentStudentSuccess() {
        Department dept = departmentRepository.findAll().get(0);
        Student temp = Student.builder()
                .studentRegNo("TEMP_STU_001")
                .firstName("Test")
                .lastName("Student")
                .email("temp.stu@ucrs.edu")
                .department(dept)
                .semesterNo(1)
                .cgpa(3.5)
                .build();
        studentService.create(temp);
        assertTrue(studentRepository.findById("TEMP_STU_001").isPresent());

        // Deleting independent student should succeed
        assertDoesNotThrow(() -> studentService.delete("TEMP_STU_001"));
        assertFalse(studentRepository.findById("TEMP_STU_001").isPresent());
    }

    @Test
    @DisplayName("Block deleting faculty member with assigned course offerings")
    void testDeleteFacultyWithAssignedOfferingsBlocked() {
        Faculty facultyWithOfferings = facultyRepository.findAll().stream()
                .filter(f -> offeringRepository.countByFaculty_FacultyId(f.getFacultyId()) > 0)
                .findFirst()
                .orElseThrow();

        DataDependencyException ex = assertThrows(DataDependencyException.class, () -> {
            facultyService.delete(facultyWithOfferings.getFacultyId());
        });
        assertTrue(ex.getMessage().contains("Assigned as instructor for") || ex.getMessage().contains("assigned to"));

        // Verify faculty still exists
        assertTrue(facultyRepository.findById(facultyWithOfferings.getFacultyId()).isPresent());
    }

    @Test
    @DisplayName("Allow deleting faculty not assigned to any offerings")
    void testDeleteIndependentFacultySuccess() {
        Department dept = departmentRepository.findAll().get(0);
        Faculty tempFaculty = Faculty.builder()
                .firstName("Independent")
                .lastName("Professor")
                .email("indep.prof@ucrs.edu")
                .designation("Visiting Faculty")
                .department(dept)
                .build();
        Faculty saved = facultyService.create(tempFaculty);
        Long id = saved.getFacultyId();
        assertTrue(facultyRepository.findById(id).isPresent());

        // Deleting unassigned faculty should succeed
        assertDoesNotThrow(() -> facultyService.delete(id));
        assertFalse(facultyRepository.findById(id).isPresent());
    }

    @Test
    @DisplayName("Block deleting course when required as prerequisite for other courses")
    void testDeleteCourseAsPrerequisiteBlocked() {
        // CS101 is prerequisite for CS201 and CS202
        DataDependencyException ex = assertThrows(DataDependencyException.class, () -> {
            courseService.delete("CS101");
        });
        assertTrue(ex.getMessage().contains("Required as a prerequisite for"));

        // Verify course still exists
        assertTrue(courseRepository.findById("CS101").isPresent());
    }

    @Test
    @DisplayName("Allow deleting course with no dependents")
    void testDeleteIndependentCourseSuccess() {
        Department dept = departmentRepository.findAll().get(0);
        Course tempCourse = Course.builder()
                .courseId("CS999")
                .courseName("Special Topics in Quantum Computing")
                .credits(3)
                .description("Standalone elective")
                .department(dept)
                .build();
        courseService.create(tempCourse);
        assertTrue(courseRepository.findById("CS999").isPresent());

        // Deleting standalone course should succeed
        assertDoesNotThrow(() -> courseService.delete("CS999"));
        assertFalse(courseRepository.findById("CS999").isPresent());
    }

    @Test
    @DisplayName("Block deleting department with enrolled students")
    void testDeleteDepartmentWithStudentsBlocked() {
        Department deptWithStudents = departmentRepository.findAll().stream()
                .filter(d -> studentRepository.countByDepartment_DeptId(d.getDeptId()) > 0)
                .findFirst()
                .orElseThrow();

        DataDependencyException ex = assertThrows(DataDependencyException.class, () -> {
            departmentService.delete(deptWithStudents.getDeptId());
        });
        assertTrue(ex.getMessage().contains("student(s) are currently enrolled in this department"));

        // Verify department still exists
        assertTrue(departmentRepository.findById(deptWithStudents.getDeptId()).isPresent());
    }

    @Test
    @DisplayName("Allow deleting empty department")
    void testDeleteIndependentDepartmentSuccess() {
        Department emptyDept = Department.builder()
                .deptName("Astronomy & Astrophysics")
                .build();
        Department saved = departmentService.create(emptyDept);
        Long id = saved.getDeptId();
        assertTrue(departmentRepository.findById(id).isPresent());

        // Deleting empty department should succeed
        assertDoesNotThrow(() -> departmentService.delete(id));
        assertFalse(departmentRepository.findById(id).isPresent());
    }

    @Test
    @DisplayName("Block deleting active semester")
    void testDeleteActiveSemesterBlocked() {
        Semester activeSemester = semesterRepository.findFirstByIsActiveTrue().orElseThrow();
        DataDependencyException ex = assertThrows(DataDependencyException.class, () -> {
            semesterService.delete(activeSemester.getSemesterId());
        });
        assertTrue(ex.getMessage().contains("ACTIVE semester"));

        // Verify semester still exists
        assertTrue(semesterRepository.findById(activeSemester.getSemesterId()).isPresent());
    }

    @Test
    @DisplayName("Block deleting semester with course offerings and registrations")
    void testDeleteSemesterWithOfferingsBlocked() {
        Semester inactiveSemester = semesterRepository.findByIsActive(false).stream()
                .filter(s -> offeringRepository.countBySemester_SemesterId(s.getSemesterId()) > 0)
                .findFirst()
                .orElseThrow();

        DataDependencyException ex = assertThrows(DataDependencyException.class, () -> {
            semesterService.delete(inactiveSemester.getSemesterId());
        });
        assertTrue(ex.getMessage().contains("course offering(s) exist with student registrations"));

        // Verify semester still exists
        assertTrue(semesterRepository.findById(inactiveSemester.getSemesterId()).isPresent());
    }

    @Test
    @DisplayName("Allow deleting inactive semester with no offerings")
    void testDeleteIndependentSemesterSuccess() {
        Semester tempSemester = Semester.builder()
                .semesterName("Summer 2026")
                .academicYear("2025-2026")
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2026, 7, 31))
                .isActive(false)
                .build();
        Semester saved = semesterService.create(tempSemester);
        Long id = saved.getSemesterId();
        assertTrue(semesterRepository.findById(id).isPresent());

        // Deleting empty inactive semester should succeed
        assertDoesNotThrow(() -> semesterService.delete(id));
        assertFalse(semesterRepository.findById(id).isPresent());
    }

    @Test
    @DisplayName("Block deleting offering with student registrations")
    void testDeleteOfferingWithRegistrationsBlocked() {
        CourseOffering offeringWithRegs = offeringRepository.findAll().stream()
                .filter(o -> registrationRepository.countByOffering_OfferingId(o.getOfferingId()) > 0)
                .findFirst()
                .orElseThrow();

        DataDependencyException ex = assertThrows(DataDependencyException.class, () -> {
            offeringService.delete(offeringWithRegs.getOfferingId());
        });
        assertTrue(ex.getMessage().contains("actively registered") || ex.getMessage().contains("completed student grade record(s)"));

        // Verify offering still exists
        assertTrue(offeringRepository.findById(offeringWithRegs.getOfferingId()).isPresent());
    }

    @Test
    @DisplayName("Allow deleting offering with zero registrations")
    void testDeleteIndependentOfferingSuccess() {
        Course course = courseRepository.findById("CS101").orElseThrow();
        Semester semester = semesterRepository.findFirstByIsActiveTrue().orElseThrow();
        Faculty faculty = facultyRepository.findAll().get(0);

        CourseOffering tempOffering = CourseOffering.builder()
                .course(course)
                .semester(semester)
                .faculty(faculty)
                .maxSeats(40)
                .schedule("Fri 14:00 - 16:00")
                .build();
        CourseOffering saved = offeringService.create(tempOffering);
        Long id = saved.getOfferingId();
        assertTrue(offeringRepository.findById(id).isPresent());

        // Deleting offering without registrations should succeed
        assertDoesNotThrow(() -> offeringService.delete(id));
        assertFalse(offeringRepository.findById(id).isPresent());
    }

    @Test
    @DisplayName("Ensure rollback on failed deletion and preservation of existing records")
    void testTransactionRollbackOnFailure() {
        long studentCountBefore = studentRepository.count();
        long registrationCountBefore = registrationRepository.count();
        long courseCountBefore = courseRepository.count();

        // Attempt invalid deletion
        assertThrows(DataDependencyException.class, () -> studentService.delete("2021CS001"));
        assertThrows(DataDependencyException.class, () -> courseService.delete("CS101"));

        // Verify counts remain unchanged
        assertEquals(studentCountBefore, studentRepository.count());
        assertEquals(registrationCountBefore, registrationRepository.count());
        assertEquals(courseCountBefore, courseRepository.count());
    }
}
