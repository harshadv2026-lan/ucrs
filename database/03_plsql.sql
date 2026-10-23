-- =============================================================================
-- University Course Registration System (UCRS)
-- FILE: 03_plsql.sql
-- Description: PL/SQL package (UCRS_PKG), standalone cursor procedure,
--              and trigger for the UCRS.
--
-- Run AFTER 01_schema.sql and 02_sample_data.sql.
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;

-- =============================================================================
-- SECTION 1: PACKAGE SPECIFICATION  –  UCRS_PKG
-- Declares all public procedures, functions, and types used in the package.
-- =============================================================================
CREATE OR REPLACE PACKAGE UCRS_PKG AS

    -- -------------------------------------------------------------------------
    -- Custom exceptions
    -- -------------------------------------------------------------------------
    EX_STUDENT_NOT_FOUND  EXCEPTION;
    EX_OFFERING_NOT_FOUND EXCEPTION;
    EX_NO_SEATS           EXCEPTION;
    EX_DUPLICATE_REG      EXCEPTION;
    EX_PREREQ_NOT_MET     EXCEPTION;

    PRAGMA EXCEPTION_INIT(EX_STUDENT_NOT_FOUND,  -20001);
    PRAGMA EXCEPTION_INIT(EX_OFFERING_NOT_FOUND, -20002);
    PRAGMA EXCEPTION_INIT(EX_NO_SEATS,           -20003);
    PRAGMA EXCEPTION_INIT(EX_DUPLICATE_REG,      -20004);
    PRAGMA EXCEPTION_INIT(EX_PREREQ_NOT_MET,     -20005);

    -- -------------------------------------------------------------------------
    -- PROCEDURE: REGISTER_STUDENT
    --   Registers a student for a course offering after performing all
    --   business-rule validations (existence, seats, duplicates, prerequisites).
    --
    -- Parameters:
    --   p_student_regno  IN   Student registration number
    --   p_offering_id    IN   Target course offering ID
    --   p_reg_id        OUT   New registration ID (on success)
    --   p_message       OUT   Human-readable result / error message
    -- -------------------------------------------------------------------------
    PROCEDURE REGISTER_STUDENT (
        p_student_regno IN  VARCHAR2,
        p_offering_id   IN  NUMBER,
        p_reg_id        OUT NUMBER,
        p_message       OUT VARCHAR2
    );

    -- -------------------------------------------------------------------------
    -- FUNCTION: GET_TOTAL_CREDITS
    --   Returns total credits of REGISTERED + COMPLETED courses for a student.
    --   Optionally filtered to a specific semester.
    --
    -- Parameters:
    --   p_student_regno  IN   Student registration number
    --   p_semester_id    IN   (Optional) Semester ID to filter by; NULL = all
    -- Returns:
    --   Total credit hours (NUMBER), 0 if no matching registrations found.
    -- -------------------------------------------------------------------------
    FUNCTION GET_TOTAL_CREDITS (
        p_student_regno IN VARCHAR2,
        p_semester_id   IN NUMBER DEFAULT NULL
    ) RETURN NUMBER;

END UCRS_PKG;
/


-- =============================================================================
-- SECTION 2: PACKAGE BODY  –  UCRS_PKG
-- =============================================================================
CREATE OR REPLACE PACKAGE BODY UCRS_PKG AS

    -- =========================================================================
    -- PROCEDURE: REGISTER_STUDENT
    -- =========================================================================
    PROCEDURE REGISTER_STUDENT (
        p_student_regno IN  VARCHAR2,
        p_offering_id   IN  NUMBER,
        p_reg_id        OUT NUMBER,
        p_message       OUT VARCHAR2
    ) AS
        -- Local variables
        v_student_count   NUMBER;
        v_max_seats       NUMBER;
        v_enrolled_count  NUMBER;
        v_dup_count       NUMBER;
        v_prereq_unmet    NUMBER;
        v_course_id       VARCHAR2(20);
        v_new_reg_id      NUMBER;

        -- Cursor variable for lock
        v_offering_row    COURSE_OFFERING%ROWTYPE;

    BEGIN
        -- ------------------------------------------------------------------
        -- STEP 1: Verify student exists
        -- ------------------------------------------------------------------
        SELECT COUNT(*)
        INTO   v_student_count
        FROM   STUDENT
        WHERE  Student_RegNo = p_student_regno;

        IF v_student_count = 0 THEN
            RAISE_APPLICATION_ERROR(-20001,
                'Student not found: ' || p_student_regno);
        END IF;

        -- ------------------------------------------------------------------
        -- STEP 2: Lock the course offering row to prevent race conditions
        --         and verify it exists.
        -- SELECT ... FOR UPDATE waits for concurrent locks to release before
        -- proceeding, ensuring seat counts are accurate.
        -- ------------------------------------------------------------------
        BEGIN
            SELECT *
            INTO   v_offering_row
            FROM   COURSE_OFFERING
            WHERE  Offering_ID = p_offering_id
            FOR UPDATE NOWAIT;          -- raises ORA-00054 if locked elsewhere
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                RAISE_APPLICATION_ERROR(-20002,
                    'Course offering not found: ' || p_offering_id);
        END;

        v_max_seats  := v_offering_row.Max_Seats;
        v_course_id  := v_offering_row.Course_ID;

        -- ------------------------------------------------------------------
        -- STEP 3: Check available seats (count current REGISTERED students)
        -- ------------------------------------------------------------------
        SELECT COUNT(*)
        INTO   v_enrolled_count
        FROM   REGISTRATION
        WHERE  Offering_ID = p_offering_id
          AND  Status       <> 'DROPPED';   -- DROPPED students free their seat

        IF v_enrolled_count >= v_max_seats THEN
            RAISE_APPLICATION_ERROR(-20003,
                'No seats available in offering ' || p_offering_id
                || ' (capacity: ' || v_max_seats
                || ', enrolled: ' || v_enrolled_count || ').');
        END IF;

        -- ------------------------------------------------------------------
        -- STEP 4: Check for duplicate registration
        -- ------------------------------------------------------------------
        SELECT COUNT(*)
        INTO   v_dup_count
        FROM   REGISTRATION
        WHERE  Student_RegNo = p_student_regno
          AND  Offering_ID   = p_offering_id;

        IF v_dup_count > 0 THEN
            RAISE_APPLICATION_ERROR(-20004,
                'Student ' || p_student_regno
                || ' is already registered for offering ' || p_offering_id || '.');
        END IF;

        -- ------------------------------------------------------------------
        -- STEP 5: Prerequisite check
        --   The student must have a COMPLETED registration for every
        --   prerequisite course of v_course_id.
        --   Strategy: Count prerequisites of the course that the student
        --   has NOT completed → if > 0, prerequisite not met.
        -- ------------------------------------------------------------------
        SELECT COUNT(*)
        INTO   v_prereq_unmet
        FROM   PREREQUISITE p
        WHERE  p.Course_ID = v_course_id
          AND  NOT EXISTS (
                   -- Student has COMPLETED a registration for the prereq course
                   -- in any offering of that course
                   SELECT 1
                   FROM   REGISTRATION   r
                   JOIN   COURSE_OFFERING co
                          ON co.Offering_ID = r.Offering_ID
                   WHERE  r.Student_RegNo = p_student_regno
                     AND  co.Course_ID    = p.Prereq_Course_ID
                     AND  r.Status        = 'COMPLETED'
               );

        IF v_prereq_unmet > 0 THEN
            RAISE_APPLICATION_ERROR(-20005,
                'Prerequisite(s) not met for course ' || v_course_id
                || '. Complete all required prerequisite courses first.');
        END IF;

        -- ------------------------------------------------------------------
        -- STEP 6: All checks passed – insert registration
        -- ------------------------------------------------------------------
        v_new_reg_id := SEQ_REG_ID.NEXTVAL;

        INSERT INTO REGISTRATION (
            Reg_ID, Student_RegNo, Offering_ID,
            Registration_Date, Grade, Status
        ) VALUES (
            v_new_reg_id, p_student_regno, p_offering_id,
            SYSDATE, NULL, 'REGISTERED'
        );

        COMMIT;

        p_reg_id  := v_new_reg_id;
        p_message := 'SUCCESS: Student ' || p_student_regno
                     || ' registered for offering ' || p_offering_id
                     || '. Registration ID: ' || v_new_reg_id || '.';

    EXCEPTION
        -- Re-raise application errors so the caller sees the message
        WHEN OTHERS THEN
            ROLLBACK;
            p_reg_id  := NULL;
            p_message := 'ERROR [' || SQLCODE || ']: ' || SQLERRM;
            -- Optionally re-raise: RAISE;
    END REGISTER_STUDENT;


    -- =========================================================================
    -- FUNCTION: GET_TOTAL_CREDITS
    -- =========================================================================
    FUNCTION GET_TOTAL_CREDITS (
        p_student_regno IN VARCHAR2,
        p_semester_id   IN NUMBER DEFAULT NULL
    ) RETURN NUMBER AS
        v_total_credits NUMBER := 0;
    BEGIN
        -- Sum credits for all REGISTERED or COMPLETED courses.
        -- If p_semester_id is supplied, restrict to that semester's offerings.
        SELECT NVL(SUM(c.Credits), 0)
        INTO   v_total_credits
        FROM   REGISTRATION   r
        JOIN   COURSE_OFFERING co ON co.Offering_ID = r.Offering_ID
        JOIN   COURSE           c  ON c.Course_ID    = co.Course_ID
        WHERE  r.Student_RegNo = p_student_regno
          AND  r.Status        IN ('REGISTERED', 'COMPLETED')
          AND  (p_semester_id IS NULL OR co.Semester_ID = p_semester_id);

        RETURN v_total_credits;

    EXCEPTION
        WHEN OTHERS THEN
            -- Return 0 on unexpected error; caller should check SQLCODE if needed
            RETURN 0;
    END GET_TOTAL_CREDITS;

END UCRS_PKG;
/


-- =============================================================================
-- SECTION 3: STANDALONE PROCEDURE  –  LIST_COURSE_OFFERINGS
-- Uses an explicit cursor to display all offerings for a given semester.
-- Output via DBMS_OUTPUT; ensure SET SERVEROUTPUT ON before calling.
-- =============================================================================
CREATE OR REPLACE PROCEDURE LIST_COURSE_OFFERINGS (
    p_semester_id IN NUMBER
) AS
    -- -------------------------------------------------------------------------
    -- Explicit cursor: fetches every offering in the specified semester along
    -- with course/faculty details and the current seat usage.
    -- -------------------------------------------------------------------------
    CURSOR cur_offerings IS
        SELECT
            co.Offering_ID,
            c.Course_ID,
            c.Course_Name,
            c.Credits,
            f.First_Name || ' ' || f.Last_Name  AS Faculty_Name,
            f.Designation,
            co.Max_Seats,
            -- Count only non-DROPPED registrations as "seats used"
            NVL((
                SELECT COUNT(*)
                FROM   REGISTRATION r
                WHERE  r.Offering_ID = co.Offering_ID
                  AND  r.Status      <> 'DROPPED'
            ), 0)                               AS Seats_Used,
            co.Schedule
        FROM
            COURSE_OFFERING co
            JOIN COURSE   c ON c.Course_ID  = co.Course_ID
            JOIN FACULTY  f ON f.Faculty_ID = co.Faculty_ID
        WHERE
            co.Semester_ID = p_semester_id
        ORDER BY
            c.Course_ID;

    -- Record variable based on the cursor's result set
    rec_offering cur_offerings%ROWTYPE;

    -- Local counters
    v_row_count    NUMBER := 0;
    v_sem_name     SEMESTER.Semester_Name%TYPE;
    v_acad_year    SEMESTER.Academic_Year%TYPE;

BEGIN
    -- Fetch semester info for the header line
    BEGIN
        SELECT Semester_Name, Academic_Year
        INTO   v_sem_name, v_acad_year
        FROM   SEMESTER
        WHERE  Semester_ID = p_semester_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            DBMS_OUTPUT.PUT_LINE('ERROR: Semester ID ' || p_semester_id || ' not found.');
            RETURN;
    END;

    -- -----------------------------------------------------------------------
    -- Header
    -- -----------------------------------------------------------------------
    DBMS_OUTPUT.PUT_LINE(RPAD('=', 100, '='));
    DBMS_OUTPUT.PUT_LINE(
        'COURSE OFFERINGS  |  Semester: ' || v_sem_name
        || '  |  Academic Year: ' || v_acad_year
    );
    DBMS_OUTPUT.PUT_LINE(RPAD('=', 100, '='));
    DBMS_OUTPUT.PUT_LINE(
        RPAD('Off.ID', 8)
        || RPAD('Course', 10)
        || RPAD('Course Name',                35)
        || RPAD('Credits', 8)
        || RPAD('Faculty',                    28)
        || RPAD('Seats Used/Max', 16)
        || 'Schedule'
    );
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 100, '-'));

    -- -----------------------------------------------------------------------
    -- Open → Fetch loop → Close  (explicit cursor pattern)
    -- -----------------------------------------------------------------------
    OPEN cur_offerings;

    LOOP
        FETCH cur_offerings INTO rec_offering;
        EXIT WHEN cur_offerings%NOTFOUND;

        v_row_count := v_row_count + 1;

        DBMS_OUTPUT.PUT_LINE(
            RPAD(rec_offering.Offering_ID,          8)
            || RPAD(rec_offering.Course_ID,         10)
            || RPAD(SUBSTR(rec_offering.Course_Name,1,34), 35)
            || RPAD(rec_offering.Credits,           8)
            || RPAD(SUBSTR(rec_offering.Faculty_Name,1,27), 28)
            || RPAD(rec_offering.Seats_Used || ' / ' || rec_offering.Max_Seats, 16)
            || rec_offering.Schedule
        );
    END LOOP;

    CLOSE cur_offerings;

    -- -----------------------------------------------------------------------
    -- Footer
    -- -----------------------------------------------------------------------
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 100, '-'));
    DBMS_OUTPUT.PUT_LINE('Total offerings listed: ' || v_row_count);
    DBMS_OUTPUT.PUT_LINE(RPAD('=', 100, '='));

EXCEPTION
    WHEN OTHERS THEN
        IF cur_offerings%ISOPEN THEN
            CLOSE cur_offerings;
        END IF;
        DBMS_OUTPUT.PUT_LINE('Unexpected error: [' || SQLCODE || '] ' || SQLERRM);
        RAISE;
END LIST_COURSE_OFFERINGS;
/


-- =============================================================================
-- SECTION 4: TRIGGER  –  TRG_NO_GRADE_DROPPED
-- After any UPDATE on REGISTRATION, if a row's Status becomes 'DROPPED' and
-- its Grade is NOT NULL, raise an application error.
-- Prevents assigning a grade to a dropped registration.
-- =============================================================================
CREATE OR REPLACE TRIGGER TRG_NO_GRADE_DROPPED
    AFTER UPDATE ON REGISTRATION
    FOR EACH ROW
BEGIN
    IF :NEW.Status = 'DROPPED' AND :NEW.Grade IS NOT NULL THEN
        RAISE_APPLICATION_ERROR(
            -20010,
            'Cannot assign grade to a DROPPED registration. '
            || 'Reg_ID: ' || :NEW.Reg_ID
            || ', Student: ' || :NEW.Student_RegNo
        );
    END IF;
END TRG_NO_GRADE_DROPPED;
/

-- =============================================================================
-- SECTION 5: Compile-status verification
-- =============================================================================
SELECT object_name, object_type, status
FROM   user_objects
WHERE  object_name IN (
           'UCRS_PKG',
           'LIST_COURSE_OFFERINGS',
           'TRG_NO_GRADE_DROPPED'
       )
ORDER BY object_type, object_name;

-- =============================================================================
-- SECTION 6: Quick smoke-test examples
-- (Uncomment to run interactively; requires sample data from 02_sample_data.sql)
-- =============================================================================

/*
-- ---- Test GET_TOTAL_CREDITS ------------------------------------------------
DECLARE
    v_credits NUMBER;
BEGIN
    v_credits := UCRS_PKG.GET_TOTAL_CREDITS('2023CS001', NULL);
    DBMS_OUTPUT.PUT_LINE('Total credits (all sems) for 2023CS001: ' || v_credits);

    v_credits := UCRS_PKG.GET_TOTAL_CREDITS('2023CS001', 1);
    DBMS_OUTPUT.PUT_LINE('Total credits (Sem 1)    for 2023CS001: ' || v_credits);
END;
/

-- ---- Test REGISTER_STUDENT -------------------------------------------------
DECLARE
    v_reg_id  NUMBER;
    v_msg     VARCHAR2(500);
BEGIN
    -- Should succeed: 2024CS002 registering for CS201 offering (Off 9, Sem 2)
    -- 2024CS002 completed CS101 (Reg_ID 2), so prerequisite is met.
    UCRS_PKG.REGISTER_STUDENT('2024CS002', 9, v_reg_id, v_msg);
    DBMS_OUTPUT.PUT_LINE(v_msg);
END;
/

-- ---- Test LIST_COURSE_OFFERINGS --------------------------------------------
BEGIN
    LIST_COURSE_OFFERINGS(2);   -- Semester 2 offerings
END;
/

-- ---- Test trigger (should raise error) ------------------------------------
UPDATE REGISTRATION
SET    Status = 'DROPPED', Grade = 'A'
WHERE  Reg_ID = 1;
*/

PROMPT '==> 03_plsql.sql completed successfully.';
