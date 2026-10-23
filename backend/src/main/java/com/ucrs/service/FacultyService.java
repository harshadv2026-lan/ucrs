package com.ucrs.service;

import com.ucrs.exception.ResourceNotFoundException;
import com.ucrs.model.Faculty;
import com.ucrs.model.Department;
import com.ucrs.repository.FacultyRepository;
import com.ucrs.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacultyService {

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;

    public List<Faculty> findAll() {
        return facultyRepository.findAll();
    }

    public Faculty findById(Long id) {
        return facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", id));
    }

    @Transactional
    public Faculty create(Faculty faculty) {
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
        if (updated.getDepartment() != null && updated.getDepartment().getDeptId() != null) {
            Department dept = departmentRepository.findById(updated.getDepartment().getDeptId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", updated.getDepartment().getDeptId()));
            existing.setDepartment(dept);
        }
        return facultyRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        facultyRepository.deleteById(id);
    }
}
