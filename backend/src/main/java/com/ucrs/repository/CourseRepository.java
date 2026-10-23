package com.ucrs.repository;

import com.ucrs.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {
    List<Course> findByDepartment_DeptId(Long deptId);
    List<Course> findByCourseNameContainingIgnoreCase(String search);
    List<Course> findByDepartment_DeptIdAndCourseNameContainingIgnoreCase(Long deptId, String search);
}
