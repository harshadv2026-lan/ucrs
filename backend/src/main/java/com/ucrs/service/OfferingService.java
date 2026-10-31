package com.ucrs.service;

import com.ucrs.dto.CourseOfferingDTO;
import com.ucrs.exception.DataDependencyException;
import com.ucrs.exception.ResourceNotFoundException;
import com.ucrs.model.Course;
import com.ucrs.model.CourseOffering;
import com.ucrs.model.Faculty;
import com.ucrs.model.Registration;
import com.ucrs.model.Semester;
import com.ucrs.repository.CourseOfferingRepository;
import com.ucrs.repository.CourseRepository;
import com.ucrs.repository.FacultyRepository;
import com.ucrs.repository.PrerequisiteRepository;
import com.ucrs.repository.RegistrationRepository;
import com.ucrs.repository.SemesterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OfferingService {

    private final CourseOfferingRepository offeringRepository;
    private final RegistrationRepository registrationRepository;
    private final PrerequisiteRepository prerequisiteRepository;
    private final CourseRepository courseRepository;
    private final SemesterRepository semesterRepository;
    private final FacultyRepository facultyRepository;

    public List<CourseOfferingDTO> findAll(Long semesterId, Long deptId, Long facultyId) {
        List<CourseOffering> offerings;

        if (semesterId != null && deptId != null) {
            offerings = offeringRepository.findBySemester_SemesterIdAndCourse_Department_DeptId(semesterId, deptId);
        } else if (semesterId != null) {
            offerings = offeringRepository.findBySemester_SemesterId(semesterId);
        } else if (deptId != null) {
            offerings = offeringRepository.findByCourse_Department_DeptId(deptId);
        } else if (facultyId != null) {
            offerings = offeringRepository.findByFaculty_FacultyId(facultyId);
        } else {
            offerings = offeringRepository.findAll();
        }

        return offerings.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public CourseOfferingDTO findById(Long id) {
        CourseOffering offering = offeringRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CourseOffering", "id", id));
        return toDTO(offering);
    }

    public List<Registration> findRegisteredStudents(Long offeringId) {
        offeringRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException("CourseOffering", "id", offeringId));
        return registrationRepository.findByOffering_OfferingId(offeringId);
    }

    @Transactional
    public CourseOffering create(CourseOffering offering) {
        // Resolve Course
        String courseId = null;
        if (offering.getCourse() != null && offering.getCourse().getCourseId() != null) {
            courseId = offering.getCourse().getCourseId();
        } else if (offering.getCourseId() != null) {
            courseId = offering.getCourseId();
        }
        if (courseId == null || courseId.isBlank()) {
            throw new IllegalArgumentException("Course is required for course offering");
        }
        final String targetCourseId = courseId;
        Course course = courseRepository.findById(targetCourseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", targetCourseId));
        offering.setCourse(course);

        // Resolve Semester
        Long semesterId = null;
        if (offering.getSemester() != null && offering.getSemester().getSemesterId() != null) {
            semesterId = offering.getSemester().getSemesterId();
        } else if (offering.getSemesterId() != null) {
            semesterId = offering.getSemesterId();
        }
        if (semesterId == null) {
            throw new IllegalArgumentException("Semester is required for course offering");
        }
        final Long targetSemesterId = semesterId;
        Semester semester = semesterRepository.findById(targetSemesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", "id", targetSemesterId));
        offering.setSemester(semester);

        // Resolve Faculty (optional)
        Long facultyId = null;
        if (offering.getFaculty() != null && offering.getFaculty().getFacultyId() != null) {
            facultyId = offering.getFaculty().getFacultyId();
        } else if (offering.getFacultyId() != null) {
            facultyId = offering.getFacultyId();
        }
        if (facultyId != null) {
            final Long targetFacultyId = facultyId;
            Faculty faculty = facultyRepository.findById(targetFacultyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", targetFacultyId));
            offering.setFaculty(faculty);
        }

        if (offering.getMaxSeats() == null || offering.getMaxSeats() <= 0) {
            offering.setMaxSeats(60);
        }

        return offeringRepository.save(offering);
    }

    @Transactional
    public CourseOffering update(Long id, CourseOffering updated) {
        CourseOffering existing = offeringRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CourseOffering", "id", id));

        if (updated.getMaxSeats() != null) {
            existing.setMaxSeats(updated.getMaxSeats());
        }
        if (updated.getSchedule() != null) {
            existing.setSchedule(updated.getSchedule());
        }

        // Faculty update
        Long facultyId = null;
        if (updated.getFaculty() != null && updated.getFaculty().getFacultyId() != null) {
            facultyId = updated.getFaculty().getFacultyId();
        } else if (updated.getFacultyId() != null) {
            facultyId = updated.getFacultyId();
        }
        if (facultyId != null) {
            final Long targetFacultyId = facultyId;
            Faculty faculty = facultyRepository.findById(targetFacultyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", targetFacultyId));
            existing.setFaculty(faculty);
        }

        // Semester update if provided
        Long semId = null;
        if (updated.getSemester() != null && updated.getSemester().getSemesterId() != null) {
            semId = updated.getSemester().getSemesterId();
        } else if (updated.getSemesterId() != null) {
            semId = updated.getSemesterId();
        }
        if (semId != null) {
            final Long targetSemId = semId;
            Semester sem = semesterRepository.findById(targetSemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Semester", "id", targetSemId));
            existing.setSemester(sem);
        }

        // Course update if provided
        String courseId = null;
        if (updated.getCourse() != null && updated.getCourse().getCourseId() != null) {
            courseId = updated.getCourse().getCourseId();
        } else if (updated.getCourseId() != null) {
            courseId = updated.getCourseId();
        }
        if (courseId != null) {
            final String targetCourseId = courseId;
            Course course = courseRepository.findById(targetCourseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", targetCourseId));
            existing.setCourse(course);
        }

        return offeringRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        CourseOffering offering = offeringRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CourseOffering", "id", id));

        String courseLabel = offering.getCourse() != null ? offering.getCourse().getCourseName() : "Course";

        // 1. Check for COMPLETED registrations (grades / academic records)
        List<Registration> completed = registrationRepository.findByOffering_OfferingIdAndStatus(id, "COMPLETED");
        if (!completed.isEmpty()) {
            throw new DataDependencyException("COURSE_OFFERING", id,
                    String.format("Cannot delete course offering #%d (%s): %d completed student grade record(s) exist. Historical academic transcripts must be preserved.",
                            id, courseLabel, completed.size()));
        }

        // 2. Check for active (REGISTERED) students
        List<Registration> active = registrationRepository.findByOffering_OfferingIdAndStatus(id, "REGISTERED");
        if (!active.isEmpty()) {
            throw new DataDependencyException("COURSE_OFFERING", id,
                    String.format("Cannot delete course offering #%d (%s): %d student(s) are actively registered. Students must drop or be un-enrolled before deletion.",
                            id, courseLabel, active.size()));
        }

        // 3. Purge dropped registration history for this offering safely in this transaction
        registrationRepository.deleteByOffering_OfferingId(id);

        // 4. Delete offering
        offeringRepository.delete(offering);
    }

    public CourseOfferingDTO toDTO(CourseOffering o) {
        Long registered = offeringRepository.countActiveRegistrations(o.getOfferingId());
        long available = Math.max(0, o.getMaxSeats() - registered);

        List<String> prereqs = prerequisiteRepository.findByCourseId(o.getCourse().getCourseId())
                .stream()
                .map(com.ucrs.model.Prerequisite::getPrereqCourseId)
                .collect(Collectors.toList());

        return CourseOfferingDTO.builder()
                .offeringId(o.getOfferingId())
                .courseId(o.getCourse().getCourseId())
                .courseName(o.getCourse().getCourseName())
                .description(o.getCourse().getDescription())
                .credits(o.getCourse().getCredits())
                .departmentId(o.getCourse().getDepartment() != null ? o.getCourse().getDepartment().getDeptId() : null)
                .departmentName(o.getCourse().getDepartment() != null ? o.getCourse().getDepartment().getDeptName() : null)
                .semesterId(o.getSemester().getSemesterId())
                .semesterName(o.getSemester().getSemesterName())
                .academicYear(o.getSemester().getAcademicYear())
                .facultyId(o.getFaculty() != null ? o.getFaculty().getFacultyId() : null)
                .facultyName(o.getFaculty() != null ? o.getFaculty().getFirstName() + " " + o.getFaculty().getLastName() : null)
                .maxSeats(o.getMaxSeats())
                .registeredCount(registered)
                .availableSeats(available)
                .schedule(o.getSchedule())
                .prerequisites(prereqs)
                .build();
    }
}
