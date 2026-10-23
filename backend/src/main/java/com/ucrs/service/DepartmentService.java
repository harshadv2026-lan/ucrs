package com.ucrs.service;

import com.ucrs.model.Department;
import com.ucrs.repository.DepartmentRepository;
import com.ucrs.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public List<Department> findAll() {
        return departmentRepository.findAll();
    }

    public Department findById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));
    }

    @Transactional
    public Department create(Department department) {
        return departmentRepository.save(department);
    }

    @Transactional
    public Department update(Long id, Department updated) {
        Department existing = findById(id);
        existing.setDeptName(updated.getDeptName());
        if (updated.getHodId() != null) {
            existing.setHodId(updated.getHodId());
        }
        return departmentRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        departmentRepository.deleteById(id);
    }
}
