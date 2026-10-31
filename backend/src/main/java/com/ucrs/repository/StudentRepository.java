package com.ucrs.repository;

import com.ucrs.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, String> {
    Optional<Student> findByEmail(String email);
    List<Student> findByDepartment_DeptId(Long deptId);
    long countByDepartment_DeptId(Long deptId);
}
