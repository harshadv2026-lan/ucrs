package com.ucrs.service;

import com.ucrs.model.Semester;
import com.ucrs.repository.SemesterRepository;
import com.ucrs.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SemesterService {

    private final SemesterRepository semesterRepository;

    public List<Semester> findAll() {
        return semesterRepository.findAll();
    }

    public Semester findById(Long id) {
        return semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", "id", id));
    }

    public List<Semester> findActive() {
        return semesterRepository.findByIsActive(true);
    }

    @Transactional
    public Semester create(Semester semester) {
        return semesterRepository.save(semester);
    }

    @Transactional
    public Semester update(Long id, Semester updated) {
        Semester existing = findById(id);
        existing.setSemesterName(updated.getSemesterName());
        existing.setAcademicYear(updated.getAcademicYear());
        existing.setStartDate(updated.getStartDate());
        existing.setEndDate(updated.getEndDate());
        existing.setIsActive(updated.getIsActive());
        return semesterRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        semesterRepository.deleteById(id);
    }
}
