package com.ucrs.repository;

import com.ucrs.model.Prerequisite;
import com.ucrs.model.PrerequisiteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrerequisiteRepository extends JpaRepository<Prerequisite, PrerequisiteId> {
    List<Prerequisite> findByCourseId(String courseId);
    void deleteByCourseId(String courseId);
}
