package com.ucrs.service;

import com.ucrs.exception.DataDependencyException;
import com.ucrs.exception.ResourceNotFoundException;
import com.ucrs.graph.Neo4jGraphService;
import com.ucrs.model.Course;
import com.ucrs.model.CourseOffering;
import com.ucrs.model.Department;
import com.ucrs.model.Prerequisite;
import com.ucrs.repository.CourseOfferingRepository;
import com.ucrs.repository.CourseRepository;
import com.ucrs.repository.DepartmentRepository;
import com.ucrs.repository.PrerequisiteRepository;
import com.ucrs.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final PrerequisiteRepository prerequisiteRepository;
    private final CourseOfferingRepository offeringRepository;
    private final RegistrationRepository registrationRepository;
    private final Neo4jGraphService neo4jGraphService;

    public List<Course> findAll(Long deptId, String search) {
        List<Course> courses;
        if (deptId != null && search != null && !search.isBlank()) {
            courses = courseRepository.findByDepartment_DeptIdAndCourseNameContainingIgnoreCase(deptId, search);
        } else if (deptId != null) {
            courses = courseRepository.findByDepartment_DeptId(deptId);
        } else if (search != null && !search.isBlank()) {
            courses = courseRepository.findByCourseNameContainingIgnoreCase(search);
        } else {
            courses = courseRepository.findAll();
        }

        // Populate prerequisites so catalogue and admin tables show actual prereqs
        for (Course c : courses) {
            List<String> prereqs = prerequisiteRepository.findByCourseId(c.getCourseId()).stream()
                    .map(Prerequisite::getPrereqCourseId)
                    .collect(Collectors.toList());
            c.setPrerequisites(prereqs);
        }
        return courses;
    }

    public Course findById(String id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));
        List<String> prereqs = prerequisiteRepository.findByCourseId(id).stream()
                .map(Prerequisite::getPrereqCourseId)
                .collect(Collectors.toList());
        course.setPrerequisites(prereqs);
        return course;
    }

    public List<Prerequisite> findPrerequisites(String courseId) {
        return prerequisiteRepository.findByCourseId(courseId);
    }

    @Transactional
    public Course create(Course course) {
        Long deptId = null;
        if (course.getDepartment() != null && course.getDepartment().getDeptId() != null) {
            deptId = course.getDepartment().getDeptId();
        } else if (course.getDeptId() != null) {
            deptId = course.getDeptId();
        }

        if (deptId != null) {
            final Long finalDeptId = deptId;
            Department dept = departmentRepository.findById(finalDeptId)
                    .orElseThrow(() -> new ResourceNotFoundException("Department", "id", finalDeptId));
            course.setDepartment(dept);
        }

        Course saved = courseRepository.save(course);

        // Sync course to Neo4j graph
        neo4jGraphService.mergeCourse(
                saved.getCourseId(),
                saved.getCourseName(),
                saved.getCredits(),
                saved.getDescription(),
                saved.getDepartment() != null ? saved.getDepartment().getDeptName() : null
        );

        // Persist prerequisites if provided
        if (course.getPrerequisites() != null && !course.getPrerequisites().isEmpty()) {
            for (String prereqId : course.getPrerequisites()) {
                if (prereqId != null && !prereqId.isBlank()) {
                    prerequisiteRepository.save(new Prerequisite(saved.getCourseId(), prereqId.trim()));
                    neo4jGraphService.mergePrerequisite(saved.getCourseId(), prereqId.trim());
                }
            }
            saved.setPrerequisites(course.getPrerequisites());
        }

        return saved;
    }

    @Transactional
    public Course update(String id, Course updated) {
        Course existing = findById(id);
        existing.setCourseName(updated.getCourseName());
        existing.setCredits(updated.getCredits());
        existing.setDescription(updated.getDescription());

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

        Course saved = courseRepository.save(existing);

        // Update Neo4j graph node
        neo4jGraphService.mergeCourse(
                saved.getCourseId(),
                saved.getCourseName(),
                saved.getCredits(),
                saved.getDescription(),
                saved.getDepartment() != null ? saved.getDepartment().getDeptName() : null
        );

        // Update prerequisites if explicitly provided
        if (updated.getPrerequisites() != null) {
            prerequisiteRepository.deleteByCourseId(id);
            for (String prereqId : updated.getPrerequisites()) {
                if (prereqId != null && !prereqId.isBlank()) {
                    prerequisiteRepository.save(new Prerequisite(id, prereqId.trim()));
                    neo4jGraphService.mergePrerequisite(id, prereqId.trim());
                }
            }
            saved.setPrerequisites(updated.getPrerequisites());
        }

        return saved;
    }

    @Transactional
    public void delete(String id) {
        Course course = findById(id);

        // 1. Check if this course is required as a prerequisite by OTHER courses
        List<Prerequisite> dependentPrereqs = prerequisiteRepository.findByPrereqCourseId(id);
        if (!dependentPrereqs.isEmpty()) {
            String dependentCourses = dependentPrereqs.stream()
                    .map(Prerequisite::getCourseId)
                    .distinct()
                    .collect(Collectors.joining(", "));
            throw new DataDependencyException("COURSE", id,
                    String.format("Cannot delete course '%s' (%s): Required as a prerequisite for %d course(s) [%s]. Remove it as a prerequisite from those courses first.",
                            id, course.getCourseName(), dependentPrereqs.size(), dependentCourses));
        }

        // 2. Check if course offerings exist for this course
        List<CourseOffering> offerings = offeringRepository.findByCourse_CourseId(id);
        if (!offerings.isEmpty()) {
            long totalRegistrations = 0;
            for (CourseOffering offering : offerings) {
                totalRegistrations += registrationRepository.countByOffering_OfferingId(offering.getOfferingId());
            }
            if (totalRegistrations > 0) {
                throw new DataDependencyException("COURSE", id,
                        String.format("Cannot delete course '%s' (%s): %d offering(s) exist with student registrations (%d total record(s)). Academic history must be preserved.",
                                id, course.getCourseName(), offerings.size(), totalRegistrations));
            } else {
                throw new DataDependencyException("COURSE", id,
                        String.format("Cannot delete course '%s' (%s): %d offering(s) exist for this course. Remove the empty offering(s) first.",
                                id, course.getCourseName(), offerings.size()));
            }
        }

        // 3. Remove own prerequisites defined for this course
        prerequisiteRepository.deleteByCourseId(id);

        // 4. Delete course from relational database
        courseRepository.delete(course);

        // 5. Synchronize Neo4j graph database
        neo4jGraphService.deleteCourseNode(id);
    }
}
