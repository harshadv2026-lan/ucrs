package com.ucrs.demo;

import com.ucrs.model.*;
import com.ucrs.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * DemoDataService seeds the in-memory H2 database with realistic university data
 * when the application runs in demo mode (ucrs.demo.mode=true).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DemoDataService implements ApplicationRunner {

    private final DepartmentRepository departmentRepository;
    private final FacultyRepository facultyRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final SemesterRepository semesterRepository;
    private final CourseOfferingRepository courseOfferingRepository;
    private final RegistrationRepository registrationRepository;
    private final PrerequisiteRepository prerequisiteRepository;

    @Value("${ucrs.demo.mode:true}")
    private boolean demoMode;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!demoMode) {
            log.info("Demo mode is disabled. Skipping demo data seeding.");
            return;
        }
        log.info("=== UCRS Demo Mode: Seeding demo data ===");
        seedDepartments();
        seedFaculty();
        seedStudents();
        seedCourses();
        seedSemesters();
        seedCourseOfferings();
        seedPrerequisites();
        seedRegistrations();
        log.info("=== Demo data seeding complete ===");
    }

    // -------------------------------------------------------------------------
    // Departments
    // -------------------------------------------------------------------------
    private void seedDepartments() {
        if (departmentRepository.count() > 0) return;

        List<Department> departments = List.of(
                Department.builder().deptName("Computer Science").build(),
                Department.builder().deptName("Information Technology").build(),
                Department.builder().deptName("Electronics & Communication").build(),
                Department.builder().deptName("Mechanical Engineering").build(),
                Department.builder().deptName("Mathematics").build()
        );
        departmentRepository.saveAll(departments);
        log.info("Seeded {} departments", departments.size());
    }

    // -------------------------------------------------------------------------
    // Faculty
    // -------------------------------------------------------------------------
    private void seedFaculty() {
        if (facultyRepository.count() > 0) return;

        Department cs = departmentRepository.findByDeptName("Computer Science").orElseThrow();
        Department it = departmentRepository.findByDeptName("Information Technology").orElseThrow();
        Department ece = departmentRepository.findByDeptName("Electronics & Communication").orElseThrow();
        Department maths = departmentRepository.findByDeptName("Mathematics").orElseThrow();

        List<Faculty> facultyList = List.of(
                Faculty.builder().firstName("Alice").lastName("Johnson").email("alice.johnson@ucrs.edu")
                        .phone("555-1001").designation("Professor").password("faculty123").department(cs).build(),
                Faculty.builder().firstName("Bob").lastName("Smith").email("bob.smith@ucrs.edu")
                        .phone("555-1002").designation("Associate Professor").password("faculty123").department(cs).build(),
                Faculty.builder().firstName("Carol").lastName("Williams").email("carol.williams@ucrs.edu")
                        .phone("555-1003").designation("Assistant Professor").password("faculty123").department(it).build(),
                Faculty.builder().firstName("David").lastName("Brown").email("david.brown@ucrs.edu")
                        .phone("555-1004").designation("Professor").password("faculty123").department(it).build(),
                Faculty.builder().firstName("Eve").lastName("Davis").email("eve.davis@ucrs.edu")
                        .phone("555-1005").designation("Associate Professor").password("faculty123").department(ece).build(),
                Faculty.builder().firstName("Frank").lastName("Miller").email("frank.miller@ucrs.edu")
                        .phone("555-1006").designation("Assistant Professor").password("faculty123").department(ece).build(),
                Faculty.builder().firstName("Grace").lastName("Wilson").email("grace.wilson@ucrs.edu")
                        .phone("555-1007").designation("Professor").password("faculty123").department(maths).build(),
                Faculty.builder().firstName("Henry").lastName("Moore").email("henry.moore@ucrs.edu")
                        .phone("555-1008").designation("Associate Professor").password("faculty123").department(maths).build()
        );
        facultyRepository.saveAll(facultyList);
        log.info("Seeded {} faculty members", facultyList.size());
    }

    // -------------------------------------------------------------------------
    // Students
    // -------------------------------------------------------------------------
    private void seedStudents() {
        if (studentRepository.count() > 0) return;

        Department cs = departmentRepository.findByDeptName("Computer Science").orElseThrow();
        Department it = departmentRepository.findByDeptName("Information Technology").orElseThrow();
        Department ece = departmentRepository.findByDeptName("Electronics & Communication").orElseThrow();

        List<Student> students = List.of(
                Student.builder().studentRegNo("2021CS001").firstName("Liam").lastName("Anderson")
                        .email("liam.anderson@student.ucrs.edu").phone("555-2001")
                        .dob(LocalDate.of(2003, 5, 10)).gender("Male").address("101 Maple St")
                        .department(cs).semesterNo(6).cgpa(8.5).password("student123").build(),
                Student.builder().studentRegNo("2021CS002").firstName("Olivia").lastName("Taylor")
                        .email("olivia.taylor@student.ucrs.edu").phone("555-2002")
                        .dob(LocalDate.of(2003, 7, 22)).gender("Female").address("102 Oak Ave")
                        .department(cs).semesterNo(6).cgpa(9.1).password("student123").build(),
                Student.builder().studentRegNo("2021CS003").firstName("Noah").lastName("Thomas")
                        .email("noah.thomas@student.ucrs.edu").phone("555-2003")
                        .dob(LocalDate.of(2003, 2, 15)).gender("Male").address("103 Pine Rd")
                        .department(cs).semesterNo(6).cgpa(7.8).password("student123").build(),
                Student.builder().studentRegNo("2021CS004").firstName("Emma").lastName("Jackson")
                        .email("emma.jackson@student.ucrs.edu").phone("555-2004")
                        .dob(LocalDate.of(2003, 9, 30)).gender("Female").address("104 Cedar Ln")
                        .department(cs).semesterNo(6).cgpa(8.9).password("student123").build(),
                Student.builder().studentRegNo("2021CS005").firstName("William").lastName("White")
                        .email("william.white@student.ucrs.edu").phone("555-2005")
                        .dob(LocalDate.of(2003, 11, 5)).gender("Male").address("105 Birch Blvd")
                        .department(cs).semesterNo(6).cgpa(7.2).password("student123").build(),
                Student.builder().studentRegNo("2021CS006").firstName("Ava").lastName("Harris")
                        .email("ava.harris@student.ucrs.edu").phone("555-2006")
                        .dob(LocalDate.of(2003, 4, 18)).gender("Female").address("106 Elm St")
                        .department(cs).semesterNo(6).cgpa(9.4).password("student123").build(),
                Student.builder().studentRegNo("2021IT001").firstName("James").lastName("Martin")
                        .email("james.martin@student.ucrs.edu").phone("555-2007")
                        .dob(LocalDate.of(2003, 6, 25)).gender("Male").address("201 Walnut Dr")
                        .department(it).semesterNo(6).cgpa(8.0).password("student123").build(),
                Student.builder().studentRegNo("2021IT002").firstName("Isabella").lastName("Garcia")
                        .email("isabella.garcia@student.ucrs.edu").phone("555-2008")
                        .dob(LocalDate.of(2003, 8, 12)).gender("Female").address("202 Willow Way")
                        .department(it).semesterNo(6).cgpa(8.7).password("student123").build(),
                Student.builder().studentRegNo("2021IT003").firstName("Oliver").lastName("Martinez")
                        .email("oliver.martinez@student.ucrs.edu").phone("555-2009")
                        .dob(LocalDate.of(2003, 3, 7)).gender("Male").address("203 Spruce St")
                        .department(it).semesterNo(6).cgpa(7.5).password("student123").build(),
                Student.builder().studentRegNo("2021IT004").firstName("Sophia").lastName("Robinson")
                        .email("sophia.robinson@student.ucrs.edu").phone("555-2010")
                        .dob(LocalDate.of(2003, 1, 20)).gender("Female").address("204 Ash Ave")
                        .department(it).semesterNo(6).cgpa(9.0).password("student123").build(),
                Student.builder().studentRegNo("2021EC001").firstName("Benjamin").lastName("Clark")
                        .email("benjamin.clark@student.ucrs.edu").phone("555-2011")
                        .dob(LocalDate.of(2003, 10, 3)).gender("Male").address("301 Magnolia Ct")
                        .department(ece).semesterNo(6).cgpa(7.9).password("student123").build(),
                Student.builder().studentRegNo("2021EC002").firstName("Mia").lastName("Lewis")
                        .email("mia.lewis@student.ucrs.edu").phone("555-2012")
                        .dob(LocalDate.of(2003, 12, 14)).gender("Female").address("302 Poplar Pl")
                        .department(ece).semesterNo(6).cgpa(8.3).password("student123").build()
        );
        studentRepository.saveAll(students);
        log.info("Seeded {} students", students.size());
    }

    // -------------------------------------------------------------------------
    // Courses
    // -------------------------------------------------------------------------
    private void seedCourses() {
        if (courseRepository.count() > 0) return;

        Department cs = departmentRepository.findByDeptName("Computer Science").orElseThrow();
        Department it = departmentRepository.findByDeptName("Information Technology").orElseThrow();
        Department ece = departmentRepository.findByDeptName("Electronics & Communication").orElseThrow();
        Department maths = departmentRepository.findByDeptName("Mathematics").orElseThrow();

        List<Course> courses = List.of(
                Course.builder().courseId("CS101").courseName("Introduction to Programming")
                        .credits(4).description("Fundamentals of programming using Python").department(cs).build(),
                Course.builder().courseId("CS201").courseName("Data Structures")
                        .credits(4).description("Arrays, linked lists, stacks, queues, trees, graphs").department(cs).build(),
                Course.builder().courseId("CS301").courseName("Algorithms")
                        .credits(3).description("Design and analysis of algorithms").department(cs).build(),
                Course.builder().courseId("CS401").courseName("Database Systems")
                        .credits(3).description("Relational databases, SQL, normalization, transactions").department(cs).build(),
                Course.builder().courseId("CS501").courseName("Software Engineering")
                        .credits(3).description("SDLC, agile, design patterns, testing").department(cs).build(),
                Course.builder().courseId("IT101").courseName("Web Technologies")
                        .credits(3).description("HTML, CSS, JavaScript, REST APIs").department(it).build(),
                Course.builder().courseId("IT201").courseName("Cloud Computing")
                        .credits(3).description("Cloud models, AWS, Azure, containerization").department(it).build(),
                Course.builder().courseId("IT301").courseName("Cybersecurity")
                        .credits(3).description("Network security, cryptography, ethical hacking").department(it).build(),
                Course.builder().courseId("EC101").courseName("Digital Electronics")
                        .credits(4).description("Logic gates, flip-flops, counters, ADC/DAC").department(ece).build(),
                Course.builder().courseId("MA101").courseName("Discrete Mathematics")
                        .credits(4).description("Sets, logic, combinatorics, graph theory").department(maths).build()
        );
        courseRepository.saveAll(courses);
        log.info("Seeded {} courses", courses.size());
    }

    // -------------------------------------------------------------------------
    // Semesters
    // -------------------------------------------------------------------------
    private void seedSemesters() {
        if (semesterRepository.count() > 0) return;

        List<Semester> semesters = List.of(
                Semester.builder().semesterName("Spring 2024").academicYear("2023-24")
                        .startDate(LocalDate.of(2024, 1, 10)).endDate(LocalDate.of(2024, 5, 31))
                        .isActive(false).build(),
                Semester.builder().semesterName("Fall 2024").academicYear("2024-25")
                        .startDate(LocalDate.of(2024, 8, 1)).endDate(LocalDate.of(2024, 12, 20))
                        .isActive(true).build()
        );
        semesterRepository.saveAll(semesters);
        log.info("Seeded {} semesters", semesters.size());
    }

    // -------------------------------------------------------------------------
    // Course Offerings
    // -------------------------------------------------------------------------
    private void seedCourseOfferings() {
        if (courseOfferingRepository.count() > 0) return;

        Course cs101 = courseRepository.findById("CS101").orElseThrow();
        Course cs201 = courseRepository.findById("CS201").orElseThrow();
        Course cs301 = courseRepository.findById("CS301").orElseThrow();
        Course cs401 = courseRepository.findById("CS401").orElseThrow();
        Course cs501 = courseRepository.findById("CS501").orElseThrow();
        Course it101 = courseRepository.findById("IT101").orElseThrow();
        Course it201 = courseRepository.findById("IT201").orElseThrow();
        Course it301 = courseRepository.findById("IT301").orElseThrow();
        Course ec101 = courseRepository.findById("EC101").orElseThrow();
        Course ma101 = courseRepository.findById("MA101").orElseThrow();

        Semester spring2024 = semesterRepository.findByIsActive(false).stream()
                .filter(s -> s.getSemesterName().equals("Spring 2024")).findFirst().orElseThrow();
        Semester fall2024 = semesterRepository.findFirstByIsActiveTrue().orElseThrow();

        Faculty alice = facultyRepository.findByEmail("alice.johnson@ucrs.edu").orElseThrow();
        Faculty bob = facultyRepository.findByEmail("bob.smith@ucrs.edu").orElseThrow();
        Faculty carol = facultyRepository.findByEmail("carol.williams@ucrs.edu").orElseThrow();
        Faculty david = facultyRepository.findByEmail("david.brown@ucrs.edu").orElseThrow();
        Faculty eve = facultyRepository.findByEmail("eve.davis@ucrs.edu").orElseThrow();
        Faculty grace = facultyRepository.findByEmail("grace.wilson@ucrs.edu").orElseThrow();

        List<CourseOffering> offerings = List.of(
                // Spring 2024 (past semester)
                CourseOffering.builder().course(cs101).semester(spring2024).faculty(alice).maxSeats(60).schedule("Mon/Wed 09:00-10:30").build(),
                CourseOffering.builder().course(cs201).semester(spring2024).faculty(bob).maxSeats(50).schedule("Tue/Thu 11:00-12:30").build(),
                CourseOffering.builder().course(ma101).semester(spring2024).faculty(grace).maxSeats(80).schedule("Mon/Wed/Fri 08:00-09:00").build(),
                CourseOffering.builder().course(it101).semester(spring2024).faculty(carol).maxSeats(55).schedule("Tue/Thu 14:00-15:30").build(),
                CourseOffering.builder().course(ec101).semester(spring2024).faculty(eve).maxSeats(45).schedule("Mon/Wed 13:00-14:30").build(),

                // Fall 2024 (active semester)
                CourseOffering.builder().course(cs201).semester(fall2024).faculty(bob).maxSeats(50).schedule("Mon/Wed 10:00-11:30").build(),
                CourseOffering.builder().course(cs301).semester(fall2024).faculty(alice).maxSeats(45).schedule("Tue/Thu 09:00-10:30").build(),
                CourseOffering.builder().course(cs401).semester(fall2024).faculty(bob).maxSeats(40).schedule("Mon/Wed 13:00-14:30").build(),
                CourseOffering.builder().course(cs501).semester(fall2024).faculty(alice).maxSeats(35).schedule("Fri 10:00-13:00").build(),
                CourseOffering.builder().course(it101).semester(fall2024).faculty(carol).maxSeats(55).schedule("Tue/Thu 11:00-12:30").build(),
                CourseOffering.builder().course(it201).semester(fall2024).faculty(david).maxSeats(40).schedule("Mon/Wed 15:00-16:30").build(),
                CourseOffering.builder().course(it301).semester(fall2024).faculty(carol).maxSeats(35).schedule("Tue/Thu 14:00-15:30").build()
        );
        courseOfferingRepository.saveAll(offerings);
        log.info("Seeded {} course offerings", offerings.size());
    }

    // -------------------------------------------------------------------------
    // Prerequisites
    // -------------------------------------------------------------------------
    private void seedPrerequisites() {
        if (prerequisiteRepository.count() > 0) return;

        List<Prerequisite> prerequisites = List.of(
                // CS201 (Data Structures) requires CS101 (Intro to Programming)
                Prerequisite.builder().courseId("CS201").prereqCourseId("CS101").build(),
                // CS301 (Algorithms) requires CS201 (Data Structures)
                Prerequisite.builder().courseId("CS301").prereqCourseId("CS201").build(),
                // CS401 (Database Systems) requires CS101
                Prerequisite.builder().courseId("CS401").prereqCourseId("CS101").build(),
                // CS501 (Software Engineering) requires CS201 and CS401
                Prerequisite.builder().courseId("CS501").prereqCourseId("CS201").build(),
                Prerequisite.builder().courseId("CS501").prereqCourseId("CS401").build(),
                // IT301 (Cybersecurity) requires IT101
                Prerequisite.builder().courseId("IT301").prereqCourseId("IT101").build(),
                // IT201 (Cloud Computing) requires IT101
                Prerequisite.builder().courseId("IT201").prereqCourseId("IT101").build()
        );
        prerequisiteRepository.saveAll(prerequisites);
        log.info("Seeded {} prerequisites", prerequisites.size());
    }

    // -------------------------------------------------------------------------
    // Registrations
    // -------------------------------------------------------------------------
    private void seedRegistrations() {
        if (registrationRepository.count() > 0) return;

        Student s1 = studentRepository.findById("2021CS001").orElseThrow();
        Student s2 = studentRepository.findById("2021CS002").orElseThrow();
        Student s3 = studentRepository.findById("2021CS003").orElseThrow();
        Student s4 = studentRepository.findById("2021CS004").orElseThrow();
        Student s5 = studentRepository.findById("2021CS005").orElseThrow();
        Student s6 = studentRepository.findById("2021CS006").orElseThrow();
        Student it1 = studentRepository.findById("2021IT001").orElseThrow();
        Student it2 = studentRepository.findById("2021IT002").orElseThrow();
        Student ec1 = studentRepository.findById("2021EC001").orElseThrow();

        // Offerings: spring offerings are indices 0-4, fall offerings are 5-11
        List<CourseOffering> all = courseOfferingRepository.findAll();
        // Spring 2024
        CourseOffering spCS101 = findOffering(all, "CS101", false);
        CourseOffering spCS201 = findOffering(all, "CS201", false);
        CourseOffering spMA101 = findOffering(all, "MA101", false);
        CourseOffering spIT101 = findOffering(all, "IT101", false);
        // Fall 2024
        CourseOffering faCS201 = findOffering(all, "CS201", true);
        CourseOffering faCS301 = findOffering(all, "CS301", true);
        CourseOffering faCS401 = findOffering(all, "CS401", true);
        CourseOffering faIT101 = findOffering(all, "IT101", true);
        CourseOffering faIT201 = findOffering(all, "IT201", true);
        CourseOffering faIT301 = findOffering(all, "IT301", true);

        List<Registration> registrations = List.of(
                // --- Completed spring registrations (to satisfy prerequisites) ---
                reg(s1, spCS101, LocalDate.of(2024, 1, 12), "A", "COMPLETED"),
                reg(s2, spCS101, LocalDate.of(2024, 1, 12), "A+", "COMPLETED"),
                reg(s3, spCS101, LocalDate.of(2024, 1, 13), "B", "COMPLETED"),
                reg(s4, spCS101, LocalDate.of(2024, 1, 13), "A", "COMPLETED"),
                reg(s5, spCS101, LocalDate.of(2024, 1, 14), "C", "COMPLETED"),
                reg(s6, spCS101, LocalDate.of(2024, 1, 14), "A+", "COMPLETED"),

                reg(s1, spCS201, LocalDate.of(2024, 1, 12), "B+", "COMPLETED"),
                reg(s2, spCS201, LocalDate.of(2024, 1, 12), "A", "COMPLETED"),
                reg(it1, spIT101, LocalDate.of(2024, 1, 15), "A", "COMPLETED"),
                reg(it2, spIT101, LocalDate.of(2024, 1, 15), "A+", "COMPLETED"),

                // --- Active fall registrations ---
                reg(s1, faCS301, LocalDate.of(2024, 8, 5), null, "REGISTERED"),
                reg(s1, faCS401, LocalDate.of(2024, 8, 5), null, "REGISTERED"),
                reg(s2, faCS301, LocalDate.of(2024, 8, 5), null, "REGISTERED"),
                reg(s3, faCS201, LocalDate.of(2024, 8, 6), null, "REGISTERED"),
                reg(it1, faIT201, LocalDate.of(2024, 8, 7), null, "REGISTERED"),
                reg(it1, faIT301, LocalDate.of(2024, 8, 7), null, "REGISTERED"),

                // --- Dropped registration ---
                reg(s5, faCS201, LocalDate.of(2024, 8, 8), null, "DROPPED")
        );
        registrationRepository.saveAll(registrations);
        log.info("Seeded {} registrations", registrations.size());
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    private CourseOffering findOffering(List<CourseOffering> all, String courseId, boolean active) {
        return all.stream()
                .filter(o -> o.getCourse().getCourseId().equals(courseId)
                        && o.getSemester().getIsActive().equals(active))
                .findFirst()
                .orElseThrow(() -> new RuntimeException(
                        "Demo data error: no offering for courseId=" + courseId + " active=" + active));
    }

    private Registration reg(Student student, CourseOffering offering, LocalDate date, String grade, String status) {
        return Registration.builder()
                .student(student)
                .offering(offering)
                .registrationDate(date)
                .grade(grade)
                .status(status)
                .build();
    }
}
