package com.ucrs.service;

import com.ucrs.exception.ResourceNotFoundException;
import com.ucrs.model.Course;
import com.ucrs.model.Prerequisite;
import com.ucrs.repository.CourseRepository;
import com.ucrs.repository.PrerequisiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final PrerequisiteRepository prerequisiteRepository;

    public List<Course> findAll(Long deptId, String search) {
        if (deptId != null && search != null && !search.isBlank()) {
            return courseRepository.findByDepartment_DeptIdAndCourseNameContainingIgnoreCase(deptId, search);
        } else if (deptId != null) {
            return courseRepository.findByDepartment_DeptId(deptId);
        } else if (search != null && !search.isBlank()) {
            return courseRepository.findByCourseNameContainingIgnoreCase(search);
        }
        return courseRepository.findAll();
    }

    public Course findById(String id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));
    }

    public List<Prerequisite> findPrerequisites(String courseId) {
        return prerequisiteRepository.findByCourseId(courseId);
    }

    @Transactional
    public Course create(Course course) {
        return courseRepository.save(course);
    }

    @Transactional
    public Course update(String id, Course updated) {
        Course existing = findById(id);
        existing.setCourseName(updated.getCourseName());
        existing.setCredits(updated.getCredits());
        existing.setDescription(updated.getDescription());
        if (updated.getDepartment() != null) {
            existing.setDepartment(updated.getDepartment());
        }
        return courseRepository.save(existing);
    }

    @Transactional
    public void delete(String id) {
        findById(id);
        prerequisiteRepository.deleteByCourseId(id);
        courseRepository.deleteById(id);
    }
}
