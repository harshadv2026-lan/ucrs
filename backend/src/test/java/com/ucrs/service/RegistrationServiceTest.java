package com.ucrs.service;

import com.ucrs.exception.DuplicateRegistrationException;
import com.ucrs.exception.RegistrationException;
import com.ucrs.model.*;
import com.ucrs.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("demo")
@Transactional
public class RegistrationServiceTest {

    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private CourseOfferingRepository offeringRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Test
    public void testDuplicateRegistrationThrowsException() {
        // Student 2021CS001 is already registered in demo data for offering 7 (CS301)
        assertThrows(DuplicateRegistrationException.class, () -> {
            registrationService.register("2021CS001", 7L);
        });
    }

    @Test
    public void testUnmetPrerequisiteThrowsException() {
        // Student 2021EC001 does not have CS201 prerequisite for offering 7 (CS301)
        RegistrationException ex = assertThrows(RegistrationException.class, () -> {
            registrationService.register("2021EC001", 7L);
        });
        assertTrue(ex.getMessage().toLowerCase().contains("prerequisite"));
    }

    @Test
    public void testDropAndReactivateRegistration() {
        // Find an active registration for 2021CS001
        List<Registration> regs = registrationRepository.findByStudent_StudentRegNo("2021CS001");
        Registration activeReg = regs.stream()
                .filter(r -> "REGISTERED".equalsIgnoreCase(r.getStatus()))
                .findFirst()
                .orElseThrow();

        Long regId = activeReg.getRegId();
        Long offeringId = activeReg.getOffering().getOfferingId();

        // Drop the registration
        Registration dropped = registrationService.dropRegistration(regId, "2021CS001", "STUDENT");
        assertEquals("DROPPED", dropped.getStatus());

        // Re-registering for the same offering should reactivate without database constraint error
        Registration reRegistered = registrationService.register("2021CS001", offeringId);
        assertNotNull(reRegistered);
        assertEquals("REGISTERED", reRegistered.getStatus());
        assertEquals(regId, reRegistered.getRegId());
    }

    @Test
    public void testUnauthorizedDropThrowsSecurityException() {
        List<Registration> regs = registrationRepository.findByStudent_StudentRegNo("2021CS001");
        Registration activeReg = regs.stream()
                .filter(r -> "REGISTERED".equalsIgnoreCase(r.getStatus()))
                .findFirst()
                .orElseThrow();

        // Student 2021IT001 attempts to drop 2021CS001's registration
        assertThrows(SecurityException.class, () -> {
            registrationService.dropRegistration(activeReg.getRegId(), "2021IT001", "STUDENT");
        });
    }

    @Test
    public void testScheduleConflictDetection() {
        // CS301 (offering 7) has schedule "Tue/Thu 09:00-10:30"
        // Let's create another course offering in Fall 2024 with overlapping schedule "Tue/Thu 10:00-11:30"
        CourseOffering off7 = offeringRepository.findById(7L).orElseThrow();
        CourseOffering conflictingOffering = CourseOffering.builder()
                .course(off7.getCourse())
                .semester(off7.getSemester())
                .faculty(off7.getFaculty())
                .maxSeats(30)
                .schedule("Tue/Thu 10:00-11:30") // Overlaps with 09:00-10:30 on Tue/Thu
                .build();
        conflictingOffering = offeringRepository.save(conflictingOffering);

        final Long conflictId = conflictingOffering.getOfferingId();

        // 2021CS001 is already in offering 7 ("Tue/Thu 09:00-10:30"), so registering for conflicting offering must fail
        RegistrationException ex = assertThrows(RegistrationException.class, () -> {
            registrationService.register("2021CS001", conflictId);
        });
        assertTrue(ex.getMessage().toLowerCase().contains("schedule conflict"));
    }
}
