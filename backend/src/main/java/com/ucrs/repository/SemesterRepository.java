package com.ucrs.repository;

import com.ucrs.model.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, Long> {
    List<Semester> findByIsActive(Boolean isActive);
    Optional<Semester> findFirstByIsActiveTrue();
}
