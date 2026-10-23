package com.ucrs.service;

import com.ucrs.dto.CourseOfferingDTO;
import com.ucrs.exception.ResourceNotFoundException;
import com.ucrs.model.CourseOffering;
import com.ucrs.model.Registration;
import com.ucrs.repository.CourseOfferingRepository;
import com.ucrs.repository.RegistrationRepository;
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
        return offeringRepository.save(offering);
    }

    @Transactional
    public CourseOffering update(Long id, CourseOffering updated) {
        CourseOffering existing = offeringRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CourseOffering", "id", id));
        existing.setMaxSeats(updated.getMaxSeats());
        existing.setSchedule(updated.getSchedule());
        if (updated.getFaculty() != null) {
            existing.setFaculty(updated.getFaculty());
        }
        return offeringRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        offeringRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CourseOffering", "id", id));
        offeringRepository.deleteById(id);
    }

    public CourseOfferingDTO toDTO(CourseOffering o) {
        Long registered = offeringRepository.countActiveRegistrations(o.getOfferingId());
        long available = Math.max(0, o.getMaxSeats() - registered);

        return CourseOfferingDTO.builder()
                .offeringId(o.getOfferingId())
                .courseId(o.getCourse().getCourseId())
                .courseName(o.getCourse().getCourseName())
                .credits(o.getCourse().getCredits())
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
                .build();
    }
}
