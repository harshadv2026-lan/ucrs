package com.ucrs.repository;

import com.ucrs.model.CourseOffering;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseOfferingRepository extends JpaRepository<CourseOffering, Long> {

    List<CourseOffering> findBySemester_SemesterId(Long semesterId);

    List<CourseOffering> findByCourse_Department_DeptId(Long deptId);

    List<CourseOffering> findBySemester_SemesterIdAndCourse_Department_DeptId(Long semesterId, Long deptId);

    List<CourseOffering> findByFaculty_FacultyId(Long facultyId);

    @Query("SELECT COUNT(r) FROM Registration r WHERE r.offering.offeringId = :offeringId AND r.status = 'REGISTERED'")
    Long countActiveRegistrations(@Param("offeringId") Long offeringId);
}
