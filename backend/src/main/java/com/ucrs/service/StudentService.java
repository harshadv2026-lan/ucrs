package com.ucrs.service;

import com.ucrs.exception.ResourceNotFoundException;
import com.ucrs.model.Department;
import com.ucrs.model.Student;
import com.ucrs.repository.DepartmentRepository;
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

    public List<Student> findAll() {
        return studentRepository.findAll();
    }

    public Student findById(String regNo) {
        return studentRepository.findById(regNo)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "regNo", regNo));
    }

    @Transactional
    public Student create(Student student) {
        return studentRepository.save(student);
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
        if (updated.getDepartment() != null && updated.getDepartment().getDeptId() != null) {
            Department dept = departmentRepository.findById(updated.getDepartment().getDeptId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", updated.getDepartment().getDeptId()));
            existing.setDepartment(dept);
        }
        return studentRepository.save(existing);
    }

    @Transactional
    public void delete(String regNo) {
        findById(regNo);
        studentRepository.deleteById(regNo);
    }
}
