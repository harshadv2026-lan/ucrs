package com.ucrs.service;

import com.ucrs.dto.CourseRecommendationDTO;
import com.ucrs.dto.IneligibleCourseDTO;
import com.ucrs.dto.StudentRecommendationResponse;
import com.ucrs.dto.TopicInterestDTO;
import com.ucrs.exception.ResourceNotFoundException;
import com.ucrs.graph.Neo4jGraphService;
import com.ucrs.model.*;
import com.ucrs.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final CourseOfferingRepository courseOfferingRepository;
    private final PrerequisiteRepository prerequisiteRepository;
    private final RegistrationRepository registrationRepository;
    private final SemesterRepository semesterRepository;
    private final DepartmentRepository departmentRepository;
    private final Neo4jGraphService neo4jGraphService;

    @Value("${ucrs.registration.max-semester-credits:20}")
    private int maxSemesterCredits;

    // Curated Topics across computer science, information technology, electronics, mathematics
    private static final List<TopicInterestDTO> TOPIC_CATALOG = List.of(
            TopicInterestDTO.builder().name("Artificial Intelligence & Machine Learning").category("AI / Data")
                    .icon("Brain").description("Machine learning models, algorithms, intelligent agents, and neural networks.").courseCount(2).build(),
            TopicInterestDTO.builder().name("Cloud Computing & DevOps").category("Infrastructure")
                    .icon("Cloud").description("Cloud architectures, AWS/Azure, virtualization, CI/CD, and distributed systems.").courseCount(2).build(),
            TopicInterestDTO.builder().name("Web & Full-Stack Development").category("Software")
                    .icon("Globe").description("Modern frontend frameworks, responsive UI, backend REST APIs, and web protocols.").courseCount(2).build(),
            TopicInterestDTO.builder().name("Cybersecurity & Network Defense").category("Security")
                    .icon("Shield").description("Network security protocols, cryptography, ethical hacking, and defense in depth.").courseCount(2).build(),
            TopicInterestDTO.builder().name("Database Systems & Big Data").category("AI / Data")
                    .icon("Database").description("Relational schema design, SQL, normalization, transaction processing, and data stores.").courseCount(2).build(),
            TopicInterestDTO.builder().name("Algorithms & Complexity").category("Theory")
                    .icon("Cpu").description("Data structures, asymptotic analysis, dynamic programming, and graph algorithms.").courseCount(3).build(),
            TopicInterestDTO.builder().name("Software Engineering & Architecture").category("Software")
                    .icon("Layers").description("Design patterns, SDLC, testing pipelines, agile workflows, and system architecture.").courseCount(2).build(),
            TopicInterestDTO.builder().name("Hardware & Embedded Systems").category("Hardware")
                    .icon("HardDrive").description("Digital electronics, flip-flops, logic gates, FPGA, and computer architecture.").courseCount(2).build(),
            TopicInterestDTO.builder().name("Discrete Mathematics & Foundations").category("Theory")
                    .icon("Binary").description("Combinatorics, formal logic, set theory, graph theory, and mathematical proofs.").courseCount(2).build()
    );

    // Static Course-to-Topic Mapping
    private static final Map<String, List<String>> COURSE_TOPIC_MAP = Map.of(
            "CS101", List.of("Algorithms & Complexity", "Software Engineering & Architecture"),
            "CS201", List.of("Algorithms & Complexity", "Software Engineering & Architecture"),
            "CS301", List.of("Algorithms & Complexity", "Artificial Intelligence & Machine Learning"),
            "CS401", List.of("Database Systems & Big Data", "Web & Full-Stack Development"),
            "CS501", List.of("Software Engineering & Architecture", "Web & Full-Stack Development", "Cloud Computing & DevOps"),
            "IT101", List.of("Web & Full-Stack Development", "Database Systems & Big Data"),
            "IT201", List.of("Cloud Computing & DevOps", "Web & Full-Stack Development"),
            "IT301", List.of("Cybersecurity & Network Defense", "Cloud Computing & DevOps"),
            "EC101", List.of("Hardware & Embedded Systems"),
            "MA101", List.of("Discrete Mathematics & Foundations", "Algorithms & Complexity")
    );

    @PostConstruct
    public void initGraph() {
        try {
            syncGraphFromDatabase();
        } catch (Exception e) {
            log.warn("Deferred graph sync during startup: {}", e.getMessage());
        }
    }

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("Application ready: syncing Neo4j graph with initialized database data");
        syncGraphFromDatabase();
    }

    /**
     * Synchronizes H2 relational data into Neo4j graph nodes and relationships.
     */
    @Transactional(readOnly = true)
    public synchronized void syncGraphFromDatabase() {
        log.info("Synchronizing UCRS relational database entities into Neo4j graph...");
        neo4jGraphService.resetGraph();

        // 1. Departments
        departmentRepository.findAll().forEach(dept ->
                neo4jGraphService.mergeDepartment(dept.getDeptId(), dept.getDeptName()));

        // 2. Courses
        courseRepository.findAll().forEach(course -> {
            String deptName = course.getDepartment() != null ? course.getDepartment().getDeptName() : "General";
            neo4jGraphService.mergeCourse(course.getCourseId(), course.getCourseName(),
                    course.getCredits(), course.getDescription(), deptName);

            // Seed Topics for this course
            List<String> topics = COURSE_TOPIC_MAP.getOrDefault(course.getCourseId(), List.of("General Computer Science"));
            for (String topic : topics) {
                neo4jGraphService.mergeCourseTopic(course.getCourseId(), topic, "Core Discipline");
            }
        });

        // 3. Prerequisites
        prerequisiteRepository.findAll().forEach(prereq ->
                neo4jGraphService.mergePrerequisite(prereq.getCourseId(), prereq.getPrereqCourseId()));

        // 4. Students
        studentRepository.findAll().forEach(student -> {
            String deptName = student.getDepartment() != null ? student.getDepartment().getDeptName() : "General";
            neo4jGraphService.mergeStudent(student.getStudentRegNo(), student.getFirstName(),
                    student.getLastName(), deptName,
                    student.getSemesterNo() != null ? student.getSemesterNo() : 1,
                    student.getCgpa() != null ? student.getCgpa() : 0.0);
        });

        // 5. Registrations (Completed & Enrolled)
        registrationRepository.findAll().forEach(reg -> {
            if ("COMPLETED".equalsIgnoreCase(reg.getStatus())) {
                neo4jGraphService.mergeCompletedCourse(
                        reg.getStudent().getStudentRegNo(),
                        reg.getOffering().getCourse().getCourseId(),
                        reg.getGrade());
            } else if ("REGISTERED".equalsIgnoreCase(reg.getStatus())) {
                neo4jGraphService.mergeCurrentlyEnrolled(
                        reg.getStudent().getStudentRegNo(),
                        reg.getOffering().getCourse().getCourseId(),
                        reg.getOffering().getSemester() != null ? reg.getOffering().getSemester().getSemesterId() : 0L);
            }
        });

        log.info("Neo4j graph synchronized successfully. Stats: {}", neo4jGraphService.getStats());
    }

    /**
     * Generates personalized course recommendations for a student.
     */
    @Transactional(readOnly = true)
    public StudentRecommendationResponse getRecommendations(String studentRegNo, Long requestedSemesterId, List<String> requestedInterests) {
        if (neo4jGraphService.getStats().getTotalNodes() == 0) {
            syncGraphFromDatabase();
        }

        Student student = studentRepository.findById(studentRegNo)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentRegNo));

        // 1. Identify target semester (active semester if not explicitly provided)
        Semester semester;
        if (requestedSemesterId != null) {
            semester = semesterRepository.findById(requestedSemesterId)
                    .orElseGet(() -> semesterRepository.findFirstByIsActiveTrue()
                            .orElseThrow(() -> new ResourceNotFoundException("No active semester found")));
        } else {
            semester = semesterRepository.findFirstByIsActiveTrue()
                    .orElseGet(() -> semesterRepository.findAll().stream().findFirst()
                            .orElseThrow(() -> new ResourceNotFoundException("No semesters found")));
        }

        // 2. Query student's historical and active registrations from H2
        List<Registration> studentRegistrations = registrationRepository.findByStudent_StudentRegNo(studentRegNo);

        // Completed courses & grades
        Map<String, String> completedCourseGrades = new HashMap<>();
        studentRegistrations.stream()
                .filter(r -> "COMPLETED".equalsIgnoreCase(r.getStatus()))
                .forEach(r -> completedCourseGrades.put(r.getOffering().getCourse().getCourseId(), r.getGrade() != null ? r.getGrade() : ""));

        // Currently enrolled in this target semester
        Set<String> currentlyEnrolledCourseIds = studentRegistrations.stream()
                .filter(r -> "REGISTERED".equalsIgnoreCase(r.getStatus()) &&
                        r.getOffering().getSemester() != null &&
                        r.getOffering().getSemester().getSemesterId().equals(semester.getSemesterId()))
                .map(r -> r.getOffering().getCourse().getCourseId())
                .collect(Collectors.toSet());

        // Calculate credit load in target semester
        int currentSemesterCredits = studentRegistrations.stream()
                .filter(r -> "REGISTERED".equalsIgnoreCase(r.getStatus()) &&
                        r.getOffering().getSemester() != null &&
                        r.getOffering().getSemester().getSemesterId().equals(semester.getSemesterId()))
                .mapToInt(r -> r.getOffering().getCourse().getCredits())
                .sum();

        int remainingCredits = Math.max(0, maxSemesterCredits - currentSemesterCredits);

        // 3. Determine effective interests
        List<String> effectiveInterests = (requestedInterests != null && !requestedInterests.isEmpty())
                ? requestedInterests
                : getDefaultInterestsForDepartment(student.getDepartment() != null ? student.getDepartment().getDeptName() : "");

        // 4. Fetch all active offerings for target semester
        List<CourseOffering> offerings = courseOfferingRepository.findBySemester_SemesterId(semester.getSemesterId());

        // Map courseId to Course entity for quick lookup of names
        Map<String, Course> courseCatalog = courseRepository.findAll().stream()
                .collect(Collectors.toMap(Course::getCourseId, c -> c));

        List<CourseRecommendationDTO> eligibleRecommendations = new ArrayList<>();
        List<IneligibleCourseDTO> ineligibleCourses = new ArrayList<>();

        Set<String> processedCourses = new HashSet<>();

        for (CourseOffering offering : offerings) {
            Course course = offering.getCourse();
            String courseId = course.getCourseId();

            if (!processedCourses.add(courseId)) {
                // Already evaluated this course for this semester
                continue;
            }

            // Available seats calculation
            Long activeCount = registrationRepository.countActiveRegistrations(offering.getOfferingId());
            int registeredSeats = activeCount != null ? activeCount.intValue() : 0;
            int availableSeats = Math.max(0, offering.getMaxSeats() - registeredSeats);

            // Check if student has already completed this course
            if (completedCourseGrades.containsKey(courseId)) {
                ineligibleCourses.add(IneligibleCourseDTO.builder()
                        .courseId(courseId)
                        .courseName(course.getCourseName())
                        .credits(course.getCredits())
                        .departmentName(course.getDepartment() != null ? course.getDepartment().getDeptName() : "General")
                        .offeringId(offering.getOfferingId())
                        .reasonCode("ALREADY_COMPLETED")
                        .reasonTitle("Already Completed")
                        .details("You completed this course with grade " + completedCourseGrades.get(courseId) + " in a prior semester.")
                        .unmetPrerequisites(Collections.emptyList())
                        .canTakeWhen("Completed on record.")
                        .build());
                continue;
            }

            // Check if student is already enrolled in this semester
            if (currentlyEnrolledCourseIds.contains(courseId)) {
                ineligibleCourses.add(IneligibleCourseDTO.builder()
                        .courseId(courseId)
                        .courseName(course.getCourseName())
                        .credits(course.getCredits())
                        .departmentName(course.getDepartment() != null ? course.getDepartment().getDeptName() : "General")
                        .offeringId(offering.getOfferingId())
                        .reasonCode("ALREADY_ENROLLED")
                        .reasonTitle("Currently Enrolled")
                        .details("You are actively registered for this course offering in " + semester.getSemesterName() + ".")
                        .unmetPrerequisites(Collections.emptyList())
                        .canTakeWhen("Already active on schedule.")
                        .build());
                continue;
            }

            // 5. Query Neo4j Graph for prerequisite satisfaction
            Set<String> prerequisites = neo4jGraphService.getPrerequisites(courseId);
            List<String> unmetPrereqIds = prerequisites.stream()
                    .filter(prereqId -> !completedCourseGrades.containsKey(prereqId))
                    .collect(Collectors.toList());

            if (!unmetPrereqIds.isEmpty()) {
                // Ineligible: Unmet prerequisites
                List<String> unmetFormatted = unmetPrereqIds.stream()
                        .map(pid -> {
                            Course pCourse = courseCatalog.get(pid);
                            return pCourse != null ? pid + " (" + pCourse.getCourseName() + ")" : pid;
                        })
                        .collect(Collectors.toList());

                ineligibleCourses.add(IneligibleCourseDTO.builder()
                        .courseId(courseId)
                        .courseName(course.getCourseName())
                        .credits(course.getCredits())
                        .departmentName(course.getDepartment() != null ? course.getDepartment().getDeptName() : "General")
                        .offeringId(offering.getOfferingId())
                        .reasonCode("UNMET_PREREQUISITES")
                        .reasonTitle("Missing Prerequisites")
                        .details("Requires completion of " + String.join(", ", unmetFormatted) + ".")
                        .unmetPrerequisites(unmetFormatted)
                        .canTakeWhen("Complete " + String.join(" and ", unmetPrereqIds) + " with a passing grade first.")
                        .build());
                continue;
            }

            // 6. Check credit limit fit
            if (course.getCredits() > remainingCredits) {
                // Ineligible: Exceeds remaining credit limit
                ineligibleCourses.add(IneligibleCourseDTO.builder()
                        .courseId(courseId)
                        .courseName(course.getCourseName())
                        .credits(course.getCredits())
                        .departmentName(course.getDepartment() != null ? course.getDepartment().getDeptName() : "General")
                        .offeringId(offering.getOfferingId())
                        .reasonCode("EXCEEDS_CREDIT_LIMIT")
                        .reasonTitle("Credit Limit Exceeded")
                        .details("Course requires " + course.getCredits() + " credits, but you only have " + remainingCredits + " credits remaining of the " + maxSemesterCredits + " limit.")
                        .unmetPrerequisites(Collections.emptyList())
                        .canTakeWhen("Drop an active registration to release credit capacity, or register next semester.")
                        .build());
                continue;
            }

            // 7. COURSE IS FULLY ELIGIBLE! Compute relevance score & explainable AI reasons
            List<String> reasons = new ArrayList<>();
            int score = 0;

            // a. Interest alignment from Neo4j topic graph
            List<String> matchedTopics = neo4jGraphService.getMatchingTopics(courseId, effectiveInterests);
            if (!matchedTopics.isEmpty()) {
                int topicPoints = Math.min(40, matchedTopics.size() * 20);
                score += topicPoints;
                reasons.add("Aligns with your selected interest in " + String.join(", ", matchedTopics) + " (+" + topicPoints + " pts)");
            }

            // b. Academic program alignment
            String studentDept = student.getDepartment() != null ? student.getDepartment().getDeptName() : "";
            String courseDept = course.getDepartment() != null ? course.getDepartment().getDeptName() : "";
            boolean isHomeDept = !studentDept.isEmpty() && studentDept.equalsIgnoreCase(courseDept);

            if (isHomeDept) {
                score += 30;
                reasons.add("Major core requirement for your department: " + studentDept + " (+30 pts)");
            } else if (isAlliedElective(studentDept, courseDept)) {
                score += 18;
                reasons.add("Approved interdisciplinary elective in " + courseDept + " (+18 pts)");
            } else {
                score += 10;
                reasons.add("General university elective course (+10 pts)");
            }

            // c. Curriculum progression / prerequisite mastery
            List<String> metPrereqList = new ArrayList<>();
            if (!prerequisites.isEmpty()) {
                boolean hasHighGrade = false;
                for (String pId : prerequisites) {
                    String grade = completedCourseGrades.get(pId);
                    Course pCourse = courseCatalog.get(pId);
                    String title = pCourse != null ? pCourse.getCourseName() : pId;
                    metPrereqList.add(pId + " (" + title + ") [Grade: " + grade + "]");
                    if ("A+".equalsIgnoreCase(grade) || "A".equalsIgnoreCase(grade)) {
                        hasHighGrade = true;
                    }
                }
                if (hasHighGrade) {
                    score += 20;
                    reasons.add("Curriculum progression: You excelled in prerequisite coursework with honors (" + String.join(", ", metPrereqList) + ") (+20 pts)");
                } else {
                    score += 14;
                    reasons.add("All prerequisite requirements successfully verified: " + String.join(", ", metPrereqList) + " (+14 pts)");
                }
            } else {
                score += 10;
                reasons.add("Foundational curriculum offering with zero prerequisite barriers (+10 pts)");
            }

            // d. Seat capacity & semester credit fit
            if (availableSeats >= 20) {
                score += 10;
                reasons.add("Optimal seat availability: " + availableSeats + " open seats out of " + offering.getMaxSeats() + " (+10 pts)");
            } else if (availableSeats > 0) {
                score += 6;
                reasons.add("Confirmed seat availability: " + availableSeats + " seats remaining (+6 pts)");
            }

            reasons.add("Fits smoothly within your semester allowance (" + course.getCredits() + " cr needed, " + remainingCredits + " cr available)");

            int finalScore = Math.min(100, Math.max(15, score));
            String matchLevel = finalScore >= 80 ? "EXCELLENT" : finalScore >= 60 ? "HIGH" : "GOOD";

            eligibleRecommendations.add(CourseRecommendationDTO.builder()
                    .courseId(courseId)
                    .courseName(course.getCourseName())
                    .credits(course.getCredits())
                    .departmentName(courseDept)
                    .description(course.getDescription())
                    .offeringId(offering.getOfferingId())
                    .schedule(offering.getSchedule())
                    .facultyName(offering.getFaculty() != null ? offering.getFaculty().getFirstName() + " " + offering.getFaculty().getLastName() : "Faculty TBA")
                    .availableSeats(availableSeats)
                    .maxSeats(offering.getMaxSeats())
                    .matchScore(finalScore)
                    .matchLevel(matchLevel)
                    .reasons(reasons)
                    .matchedTopics(matchedTopics)
                    .prerequisitesMet(metPrereqList)
                    .homeDepartmentCore(isHomeDept)
                    .build());
        }

        // Rank eligible courses by relevance score descending
        eligibleRecommendations.sort((a, b) -> Integer.compare(b.getMatchScore(), a.getMatchScore()));

        return StudentRecommendationResponse.builder()
                .studentRegNo(student.getStudentRegNo())
                .studentName(student.getFirstName() + " " + student.getLastName())
                .departmentName(student.getDepartment() != null ? student.getDepartment().getDeptName() : "General")
                .semesterId(semester.getSemesterId())
                .semesterName(semester.getSemesterName())
                .currentSemesterCredits(currentSemesterCredits)
                .remainingCredits(remainingCredits)
                .maxSemesterCredits(maxSemesterCredits)
                .selectedInterests(effectiveInterests)
                .availableInterests(TOPIC_CATALOG.stream().map(TopicInterestDTO::getName).collect(Collectors.toList()))
                .recommendations(eligibleRecommendations)
                .ineligibleCourses(ineligibleCourses)
                .graphEngineMode(neo4jGraphService.getEngineMode())
                .graphStats(neo4jGraphService.getStats())
                .cypherQueries(neo4jGraphService.getExecutedCypherQueries())
                .build();
    }

    public List<TopicInterestDTO> getTopicCatalog() {
        return TOPIC_CATALOG;
    }

    private boolean isAlliedElective(String studentDept, String courseDept) {
        if (studentDept.equalsIgnoreCase(courseDept)) return true;
        if ("Computer Science".equalsIgnoreCase(studentDept) && "Information Technology".equalsIgnoreCase(courseDept)) return true;
        if ("Information Technology".equalsIgnoreCase(studentDept) && "Computer Science".equalsIgnoreCase(courseDept)) return true;
        if ("Computer Science".equalsIgnoreCase(studentDept) && "Mathematics".equalsIgnoreCase(courseDept)) return true;
        if ("Electronics & Communication".equalsIgnoreCase(studentDept) && "Computer Science".equalsIgnoreCase(courseDept)) return true;
        return false;
    }

    private List<String> getDefaultInterestsForDepartment(String deptName) {
        if ("Computer Science".equalsIgnoreCase(deptName)) {
            return List.of("Algorithms & Complexity", "Database Systems & Big Data", "Artificial Intelligence & Machine Learning");
        } else if ("Information Technology".equalsIgnoreCase(deptName)) {
            return List.of("Web & Full-Stack Development", "Cloud Computing & DevOps", "Cybersecurity & Network Defense");
        } else if ("Electronics & Communication".equalsIgnoreCase(deptName)) {
            return List.of("Hardware & Embedded Systems", "Artificial Intelligence & Machine Learning");
        }
        return List.of("Algorithms & Complexity", "Software Engineering & Architecture");
    }
}
