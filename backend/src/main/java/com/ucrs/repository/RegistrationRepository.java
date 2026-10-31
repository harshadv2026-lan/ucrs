package com.ucrs.repository;

import com.ucrs.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    List<Registration> findByStudent_StudentRegNo(String studentRegNo);

    List<Registration> findByOffering_OfferingId(Long offeringId);

    List<Registration> findByStudent_StudentRegNoAndStatus(String studentRegNo, String status);

    List<Registration> findByOffering_OfferingIdAndStatus(Long offeringId, String status);

    void deleteByStudent_StudentRegNoAndStatus(String studentRegNo, String status);

    void deleteByOffering_OfferingIdAndStatus(Long offeringId, String status);

    void deleteByStudent_StudentRegNo(String studentRegNo);

    void deleteByOffering_OfferingId(Long offeringId);

    long countByStudent_StudentRegNo(String studentRegNo);

    long countByOffering_OfferingId(Long offeringId);

    Optional<Registration> findByStudent_StudentRegNoAndOffering_OfferingId(String studentRegNo, Long offeringId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Registration r WHERE r.offering.offeringId = :offeringId AND r.status != 'DROPPED'")
    List<Registration> findActiveRegistrationsWithLock(@Param("offeringId") Long offeringId);

    @Query("SELECT COUNT(r) FROM Registration r WHERE r.offering.offeringId = :offeringId AND r.status != 'DROPPED'")
    Long countActiveRegistrations(@Param("offeringId") Long offeringId);

    @Query("SELECT SUM(r.offering.course.credits) FROM Registration r WHERE r.student.studentRegNo = :regNo AND r.status IN ('REGISTERED', 'COMPLETED')")
    Integer sumCreditsByStudentRegNo(@Param("regNo") String regNo);

    boolean existsByStudent_StudentRegNoAndOffering_OfferingId(String studentRegNo, Long offeringId);

    /**
     * Check for an active (non-dropped) duplicate registration.
     * Used by registration service to allow re-registration after a drop.
     */
    @Query("SELECT COUNT(r) > 0 FROM Registration r WHERE r.student.studentRegNo = :regNo AND r.offering.offeringId = :offeringId AND r.status != 'DROPPED'")
    boolean existsActiveByStudentAndOffering(@Param("regNo") String regNo, @Param("offeringId") Long offeringId);
}
