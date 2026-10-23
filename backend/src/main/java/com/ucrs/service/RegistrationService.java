package com.ucrs.service;

import com.ucrs.dto.StudentRegistrationDTO;
import com.ucrs.exception.DuplicateRegistrationException;
import com.ucrs.exception.RegistrationException;
import com.ucrs.exception.ResourceNotFoundException;
import com.ucrs.model.*;
import com.ucrs.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final StudentRepository studentRepository;
    private final CourseOfferingRepository offeringRepository;
    private final PrerequisiteRepository prerequisiteRepository;

    public List<StudentRegistrationDTO> findByStudent(String studentRegNo) {
        studentRepository.findById(studentRegNo)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "regNo", studentRegNo));
        return registrationRepository.findByStudent_StudentRegNo(studentRegNo)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public synchronized Registration register(String studentRegNo, Long offeringId) {
        // 1. Validate student exists
        Student student = studentRepository.findById(studentRegNo)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "regNo", studentRegNo));

        // 2. Validate offering exists
        CourseOffering offering = offeringRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("CourseOffering", "id", offeringId));

        // 3. Check for duplicate registration (ignore DROPPED rows — re-registration after drop is allowed)
        if (registrationRepository.existsActiveByStudentAndOffering(studentRegNo, offeringId)) {
            throw new DuplicateRegistrationException(
                    "Student " + studentRegNo + " is already registered for offering " + offeringId);
        }

        // 4. Check seat availability (pessimistic locking via count query in same tx)
        Long activeCount = registrationRepository.countActiveRegistrations(offeringId);
        if (activeCount >= offering.getMaxSeats()) {
            throw new RegistrationException("No seats available for offering: " + offeringId
                    + " (max: " + offering.getMaxSeats() + ", registered: " + activeCount + ")");
        }

        // 5. Check prerequisites
        validatePrerequisites(student, offering.getCourse());

        // 6. Create registration
        Registration registration = Registration.builder()
                .student(student)
                .offering(offering)
                .registrationDate(LocalDate.now())
                .status("REGISTERED")
                .build();

        return registrationRepository.save(registration);
    }

    /**
     * Validates that the student has completed all prerequisite courses.
     * A prerequisite is considered met if the student has a COMPLETED registration
     * for the prerequisite course with a non-null grade.
     */
    private void validatePrerequisites(Student student, Course course) {
        List<Prerequisite> prerequisites = prerequisiteRepository.findByCourseId(course.getCourseId());
        if (prerequisites.isEmpty()) return;

        // Gather all course IDs the student has successfully completed
        Set<String> completedCourseIds = registrationRepository
                .findByStudent_StudentRegNo(student.getStudentRegNo())
                .stream()
                .filter(r -> "COMPLETED".equals(r.getStatus()) && r.getGrade() != null)
                .map(r -> r.getOffering().getCourse().getCourseId())
                .collect(Collectors.toSet());

        for (Prerequisite prereq : prerequisites) {
            if (!completedCourseIds.contains(prereq.getPrereqCourseId())) {
                throw new RegistrationException(
                        "Prerequisite not satisfied: must complete course " + prereq.getPrereqCourseId()
                                + " before registering for " + course.getCourseId());
            }
        }
    }

    @Transactional
    public Registration dropRegistration(Long regId) {
        Registration registration = registrationRepository.findById(regId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "id", regId));
        if ("DROPPED".equals(registration.getStatus())) {
            throw new RegistrationException("Registration " + regId + " is already dropped");
        }
        registration.setStatus("DROPPED");
        return registrationRepository.save(registration);
    }

    @Transactional
    public Registration updateGrade(Long regId, String grade) {
        Registration registration = registrationRepository.findById(regId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "id", regId));
        if ("DROPPED".equals(registration.getStatus())) {
            throw new RegistrationException("Cannot update grade for a dropped registration (id: " + regId + ")");
        }
        registration.setGrade(grade);
        registration.setStatus("COMPLETED");
        return registrationRepository.save(registration);
    }

    public int getTotalCredits(String studentRegNo) {
        studentRepository.findById(studentRegNo)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "regNo", studentRegNo));
        Integer credits = registrationRepository.sumCreditsByStudentRegNo(studentRegNo);
        return credits != null ? credits : 0;
    }

    private StudentRegistrationDTO toDTO(Registration r) {
        CourseOffering offering = r.getOffering();
        return StudentRegistrationDTO.builder()
                .regId(r.getRegId())
                .studentRegNo(r.getStudent().getStudentRegNo())
                .studentName(r.getStudent().getFirstName() + " " + r.getStudent().getLastName())
                .offeringId(offering.getOfferingId())
                .courseId(offering.getCourse().getCourseId())
                .courseName(offering.getCourse().getCourseName())
                .semesterName(offering.getSemester().getSemesterName())
                .facultyName(offering.getFaculty() != null
                        ? offering.getFaculty().getFirstName() + " " + offering.getFaculty().getLastName()
                        : null)
                .registrationDate(r.getRegistrationDate())
                .grade(r.getGrade())
                .status(r.getStatus())
                .credits(offering.getCourse().getCredits())
                .build();
    }
}
