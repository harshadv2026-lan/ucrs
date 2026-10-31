package com.ucrs.service;

import com.ucrs.exception.DataDependencyException;
import com.ucrs.exception.ResourceNotFoundException;
import com.ucrs.graph.Neo4jGraphService;
import com.ucrs.model.Department;
import com.ucrs.model.Registration;
import com.ucrs.model.Student;
import com.ucrs.repository.DepartmentRepository;
import com.ucrs.repository.RegistrationRepository;
import com.ucrs.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;
    private final RegistrationRepository registrationRepository;
    private final Neo4jGraphService neo4jGraphService;

    public List<Student> findAll() {
        return studentRepository.findAll();
    }

    public Student findById(String regNo) {
        return studentRepository.findById(regNo)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "regNo", regNo));
    }

    @Transactional
    public Student create(Student student) {
        Long deptId = null;
        if (student.getDepartment() != null && student.getDepartment().getDeptId() != null) {
            deptId = student.getDepartment().getDeptId();
        } else if (student.getDeptId() != null) {
            deptId = student.getDeptId();
        }

        if (deptId != null) {
            final Long finalDeptId = deptId;
            Department dept = departmentRepository.findById(finalDeptId)
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", finalDeptId));
            student.setDepartment(dept);
        }

        if (student.getPassword() == null || student.getPassword().isBlank()) {
            student.setPassword("student123");
        }

        Student saved = studentRepository.save(student);

        // Sync into Neo4j graph
        neo4jGraphService.mergeStudent(
                saved.getStudentRegNo(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getDepartment() != null ? saved.getDepartment().getDeptName() : null,
                saved.getSemesterNo() != null ? saved.getSemesterNo() : 1,
                saved.getCgpa() != null ? saved.getCgpa() : 0.0
        );

        return saved;
    }

    @Transactional
    public Student update(String regNo, Student updated) {
        Student existing = findById(regNo);
        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setDob(updated.getDob());
        existing.setGender(updated.getGender());
        existing.setAddress(updated.getAddress());
        existing.setSemesterNo(updated.getSemesterNo());
        existing.setCgpa(updated.getCgpa());

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

        Student saved = studentRepository.save(existing);

        // Sync into Neo4j graph
        neo4jGraphService.mergeStudent(
                saved.getStudentRegNo(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getDepartment() != null ? saved.getDepartment().getDeptName() : null,
                saved.getSemesterNo() != null ? saved.getSemesterNo() : 1,
                saved.getCgpa() != null ? saved.getCgpa() : 0.0
        );

        return saved;
    }

    @Transactional
    public void delete(String regNo) {
        Student student = findById(regNo);

        // 1. Check for COMPLETED registrations (academic history with grades)
        List<Registration> completed = registrationRepository.findByStudent_StudentRegNoAndStatus(regNo, "COMPLETED");
        if (!completed.isEmpty()) {
            throw new DataDependencyException("STUDENT", regNo,
                    String.format("Cannot delete student '%s' (%s %s): %d completed course record(s) with academic grades exist. Academic history must be preserved.",
                            regNo, student.getFirstName(), student.getLastName(), completed.size()));
        }

        // 2. Check for active (REGISTERED) registrations
        List<Registration> active = registrationRepository.findByStudent_StudentRegNoAndStatus(regNo, "REGISTERED");
        if (!active.isEmpty()) {
            throw new DataDependencyException("STUDENT", regNo,
                    String.format("Cannot delete student '%s' (%s %s): Student has %d active course registration(s). Active courses must be dropped before deletion.",
                            regNo, student.getFirstName(), student.getLastName(), active.size()));
        }

        // 3. Dropped registration records can be safely purged
        registrationRepository.deleteByStudent_StudentRegNo(regNo);

        // 4. Delete student from relational repository
        studentRepository.delete(student);

        // 5. Synchronize Neo4j graph
        neo4jGraphService.deleteStudentNode(regNo);
    }
}
