package com.ucrs.service;

import com.ucrs.config.DemoDataConfig;
import com.ucrs.dto.LoginRequest;
import com.ucrs.dto.LoginResponse;
import com.ucrs.exception.ResourceNotFoundException;
import com.ucrs.model.Faculty;
import com.ucrs.model.Student;
import com.ucrs.repository.FacultyRepository;
import com.ucrs.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final DemoDataConfig demoDataConfig;

    public LoginResponse login(LoginRequest request) {
        String role = request.getRole();
        String identifier = request.getIdentifier();
        String password = request.getPassword();

        if ("ADMIN".equalsIgnoreCase(role)) {
            return authenticateAdmin(identifier, password);
        } else if ("STUDENT".equalsIgnoreCase(role)) {
            return authenticateStudent(identifier, password);
        } else if ("FACULTY".equalsIgnoreCase(role)) {
            return authenticateFaculty(identifier, password);
        } else {
            throw new IllegalArgumentException("Invalid role: " + role);
        }
    }

    private LoginResponse authenticateAdmin(String username, String password) {
        if (!demoDataConfig.getAdminUsername().equals(username)
                || !demoDataConfig.getAdminPassword().equals(password)) {
            throw new ResourceNotFoundException("Invalid admin credentials");
        }
        return LoginResponse.builder()
                .token("demo-token-admin-" + UUID.randomUUID())
                .role("ADMIN")
                .name(demoDataConfig.getAdminName())
                .id("admin")
                .demoMode(demoDataConfig.isDemoMode())
                .build();
    }

    private LoginResponse authenticateStudent(String identifier, String password) {
        Student student = studentRepository.findById(identifier)
                .or(() -> studentRepository.findByEmail(identifier))
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with identifier: " + identifier));

        if (!password.equals(student.getPassword())) {
            throw new ResourceNotFoundException("Invalid credentials");
        }
        return LoginResponse.builder()
                .token("demo-token-student-" + UUID.randomUUID())
                .role("STUDENT")
                .name(student.getFirstName() + " " + student.getLastName())
                .id(student.getStudentRegNo())
                .demoMode(demoDataConfig.isDemoMode())
                .build();
    }

    private LoginResponse authenticateFaculty(String identifier, String password) {
        // Accept numeric faculty ID or email
        Faculty faculty;
        try {
            Long facultyId = Long.parseLong(identifier.trim());
            faculty = facultyRepository.findById(facultyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with ID: " + identifier));
        } catch (NumberFormatException e) {
            faculty = facultyRepository.findByEmail(identifier)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with email: " + identifier));
        }

        if (!password.equals(faculty.getPassword())) {
            throw new ResourceNotFoundException("Invalid credentials");
        }
        return LoginResponse.builder()
                .token("demo-token-faculty-" + UUID.randomUUID())
                .role("FACULTY")
                .name(faculty.getFirstName() + " " + faculty.getLastName())
                .id(faculty.getFacultyId().toString())
                .demoMode(demoDataConfig.isDemoMode())
                .build();
    }
}
