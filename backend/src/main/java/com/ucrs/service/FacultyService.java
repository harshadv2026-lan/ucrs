package com.ucrs.service;

import com.ucrs.exception.DataDependencyException;
import com.ucrs.exception.ResourceNotFoundException;
import com.ucrs.model.CourseOffering;
import com.ucrs.model.Department;
import com.ucrs.model.Faculty;
import com.ucrs.repository.CourseOfferingRepository;
import com.ucrs.repository.DepartmentRepository;
import com.ucrs.repository.FacultyRepository;
import com.ucrs.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacultyService {

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseOfferingRepository offeringRepository;
    private final RegistrationRepository registrationRepository;

    public List<Faculty> findAll() {
        return facultyRepository.findAll();
    }

    public Faculty findById(Long id) {
        return facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", id));
    }

    @Transactional
    public Faculty create(Faculty faculty) {
        Long deptId = null;
        if (faculty.getDepartment() != null && faculty.getDepartment().getDeptId() != null) {
            deptId = faculty.getDepartment().getDeptId();
        } else if (faculty.getDeptId() != null) {
            deptId = faculty.getDeptId();
        }

        if (deptId != null) {
            final Long finalDeptId = deptId;
            Department dept = departmentRepository.findById(finalDeptId)
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", finalDeptId));
            faculty.setDepartment(dept);
        }

        if (faculty.getPassword() == null || faculty.getPassword().isBlank()) {
            faculty.setPassword("faculty123");
        }

        return facultyRepository.save(faculty);
    }

    @Transactional
    public Faculty update(Long id, Faculty updated) {
        Faculty existing = findById(id);
        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setDesignation(updated.getDesignation());

        Long deptId = null;
        if (updated.getDepartment() != null && updated.getDepartment().getDeptId() != null) {
            deptId = updated.getDepartment().getDeptId();
        } else if (updated.getDeptId() != null) {
            deptId = updated.getDeptId();
        }

        if (deptId != null) {
            final Long finalDeptId = deptId;
            Department dept = departmentRepository.findById(finalDeptId)
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", finalDeptId));
            existing.setDepartment(dept);
        }

        return facultyRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Faculty faculty = findById(id);

        // 1. Check if assigned to any course offerings
        List<CourseOffering> offerings = offeringRepository.findByFaculty_FacultyId(id);
        if (!offerings.isEmpty()) {
            long totalRegistrations = 0;
            for (CourseOffering offering : offerings) {
                totalRegistrations += registrationRepository.countActiveRegistrations(offering.getOfferingId());
            }
            if (totalRegistrations > 0) {
                throw new DataDependencyException("FACULTY", id,
                        String.format("Cannot delete faculty '%s %s' (ID: %d): Currently assigned to %d course offering(s) with %d active student registration(s). Reassign an alternate instructor first.",
                                faculty.getFirstName(), faculty.getLastName(), id, offerings.size(), totalRegistrations));
            } else {
                throw new DataDependencyException("FACULTY", id,
                        String.format("Cannot delete faculty '%s %s' (ID: %d): Assigned as instructor for %d course offering(s). Reassign an alternate instructor or remove the offering(s) first.",
                                faculty.getFirstName(), faculty.getLastName(), id, offerings.size()));
            }
        }

        // 2. Clear HOD reference in departments if this faculty is designated as HOD
        List<Department> hodDepts = departmentRepository.findByHodId(id);
        for (Department d : hodDepts) {
            d.setHodId(null);
            departmentRepository.save(d);
        }

        // 3. Delete faculty member
        facultyRepository.delete(faculty);
    }
}
