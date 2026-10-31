package com.ucrs.service;

import com.ucrs.exception.DataDependencyException;
import com.ucrs.exception.ResourceNotFoundException;
import com.ucrs.graph.Neo4jGraphService;
import com.ucrs.model.Department;
import com.ucrs.repository.CourseRepository;
import com.ucrs.repository.DepartmentRepository;
import com.ucrs.repository.FacultyRepository;
import com.ucrs.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final CourseRepository courseRepository;
    private final Neo4jGraphService neo4jGraphService;

    public List<Department> findAll() {
        return departmentRepository.findAll();
    }

    public Department findById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", "id", id));
    }

    @Transactional
    public Department create(Department department) {
        Department saved = departmentRepository.save(department);
        // Sync department to Neo4j graph
        neo4jGraphService.mergeDepartment(saved.getDeptId(), saved.getDeptName());
        return saved;
    }

    @Transactional
    public Department update(Long id, Department updated) {
        Department existing = findById(id);
        existing.setDeptName(updated.getDeptName());
        if (updated.getHodId() != null) {
            existing.setHodId(updated.getHodId());
        }
        Department saved = departmentRepository.save(existing);
        // Sync department to Neo4j graph
        neo4jGraphService.mergeDepartment(saved.getDeptId(), saved.getDeptName());
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        Department department = findById(id);

        // 1. Check for enrolled students
        long studentCount = studentRepository.countByDepartment_DeptId(id);
        if (studentCount > 0) {
            throw new DataDependencyException("DEPARTMENT", id,
                    String.format("Cannot delete department '%s' (ID: %d): %d student(s) are currently enrolled in this department. Reassign or graduate students first.",
                            department.getDeptName(), id, studentCount));
        }

        // 2. Check for faculty members
        long facultyCount = facultyRepository.countByDepartment_DeptId(id);
        if (facultyCount > 0) {
            throw new DataDependencyException("DEPARTMENT", id,
                    String.format("Cannot delete department '%s' (ID: %d): %d faculty member(s) belong to this department. Reassign faculty members first.",
                            department.getDeptName(), id, facultyCount));
        }

        // 3. Check for courses
        long courseCount = courseRepository.countByDepartment_DeptId(id);
        if (courseCount > 0) {
            throw new DataDependencyException("DEPARTMENT", id,
                    String.format("Cannot delete department '%s' (ID: %d): %d course(s) belong to this department. Reassign or remove courses first.",
                            department.getDeptName(), id, courseCount));
        }

        // 4. Delete department from relational database
        departmentRepository.delete(department);

        // 5. Synchronize Neo4j graph
        neo4jGraphService.deleteDepartmentNode(department.getDeptName());
    }
}
