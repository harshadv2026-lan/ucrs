package com.ucrs.service;

import com.ucrs.exception.DataDependencyException;
import com.ucrs.exception.ResourceNotFoundException;
import com.ucrs.model.CourseOffering;
import com.ucrs.model.Semester;
import com.ucrs.repository.CourseOfferingRepository;
import com.ucrs.repository.RegistrationRepository;
import com.ucrs.repository.SemesterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SemesterService {

    private final SemesterRepository semesterRepository;
    private final CourseOfferingRepository offeringRepository;
    private final RegistrationRepository registrationRepository;

    public List<Semester> findAll() {
        return semesterRepository.findAll();
    }

    public Semester findById(Long id) {
        return semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", "id", id));
    }

    public List<Semester> findActive() {
        return semesterRepository.findByIsActive(true);
    }

    @Transactional
    public Semester create(Semester semester) {
        return semesterRepository.save(semester);
    }

    @Transactional
    public Semester update(Long id, Semester updated) {
        Semester existing = findById(id);
        existing.setSemesterName(updated.getSemesterName());
        existing.setAcademicYear(updated.getAcademicYear());
        existing.setStartDate(updated.getStartDate());
        existing.setEndDate(updated.getEndDate());
        existing.setIsActive(updated.getIsActive());
        return semesterRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Semester semester = findById(id);

        // 1. Block deleting the active semester
        if (Boolean.TRUE.equals(semester.getIsActive())) {
            throw new DataDependencyException("SEMESTER", id,
                    String.format("Cannot delete semester '%s' (ID: %d): Currently marked as the ACTIVE semester. Activate an alternate semester first.",
                            semester.getSemesterName(), id));
        }

        // 2. Check for course offerings in this semester
        List<CourseOffering> offerings = offeringRepository.findBySemester_SemesterId(id);
        if (!offerings.isEmpty()) {
            long totalRegistrations = 0;
            for (CourseOffering offering : offerings) {
                totalRegistrations += registrationRepository.countByOffering_OfferingId(offering.getOfferingId());
            }
            if (totalRegistrations > 0) {
                throw new DataDependencyException("SEMESTER", id,
                        String.format("Cannot delete semester '%s' (ID: %d): %d course offering(s) exist with student registrations (%d record(s)). Academic history must be preserved.",
                                semester.getSemesterName(), id, offerings.size(), totalRegistrations));
            } else {
                throw new DataDependencyException("SEMESTER", id,
                        String.format("Cannot delete semester '%s' (ID: %d): %d course offering(s) exist in this semester. Delete the course offering(s) first.",
                                semester.getSemesterName(), id, offerings.size()));
            }
        }

        // 3. Delete semester
        semesterRepository.delete(semester);
    }
}
