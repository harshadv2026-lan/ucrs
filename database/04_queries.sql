-- =============================================================================
-- University Course Registration System (UCRS)
-- FILE: 04_queries.sql
-- Description: Analytical and reporting queries for day-to-day operations.
--
-- Run AFTER 01_schema.sql and 02_sample_data.sql.
-- All queries use standard Oracle SQL; compatible with SQL*Plus, SQL Developer,
-- and Oracle LiveSQL.
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET LINESIZE 200;
SET PAGESIZE 50;
COLUMN Course_ID          FORMAT A10
COLUMN Course_Name        FORMAT A35
COLUMN Prereq_Course_ID   FORMAT A15
COLUMN Prereq_Name        FORMAT A35
COLUMN Student_RegNo      FORMAT A15
COLUMN Student_Name       FORMAT A30
COLUMN Faculty_Name       FORMAT A28
COLUMN Dept_Name          FORMAT A30
COLUMN Semester_Name      FORMAT A15
COLUMN Academic_Year      FORMAT A12

-- =============================================================================
-- QUERY 1: All courses with their prerequisites
-- Shows course → prerequisite pairs with names.
-- If a course has no prerequisites, it is excluded (INNER JOIN on PREREQUISITE).
-- Use LEFT JOIN variant below if you want ALL courses listed.
-- =============================================================================
PROMPT
PROMPT ===== QUERY 1: Courses with Prerequisites =====

SELECT
    c.Course_ID,
    c.Course_Name,
    p.Prereq_Course_ID,
    pc.Course_Name   AS Prereq_Name,
    c.Credits        AS Course_Credits,
    pc.Credits       AS Prereq_Credits
FROM
    COURSE      c
    JOIN PREREQUISITE p  ON p.Course_ID        = c.Course_ID
    JOIN COURSE       pc ON pc.Course_ID        = p.Prereq_Course_ID
ORDER BY
    c.Course_ID,
    p.Prereq_Course_ID;

-- Variant: ALL courses, prerequisites optional (NULL when none exist)
PROMPT
PROMPT ===== QUERY 1b: All Courses (prerequisites optional) =====

SELECT
    c.Course_ID,
    c.Course_Name,
    c.Credits,
    NVL(p.Prereq_Course_ID, '-- None --') AS Prereq_Course_ID,
    NVL(pc.Course_Name,     '-- None --') AS Prereq_Name
FROM
    COURSE c
    LEFT JOIN PREREQUISITE p  ON p.Course_ID       = c.Course_ID
    LEFT JOIN COURSE       pc ON pc.Course_ID       = p.Prereq_Course_ID
ORDER BY
    c.Course_ID,
    p.Prereq_Course_ID NULLS FIRST;


-- =============================================================================
-- QUERY 2: Students registered in each offering with seat occupancy
-- Shows offering-level enrolment vs. capacity and remaining seats.
-- =============================================================================
PROMPT
PROMPT ===== QUERY 2: Registrations per Offering with Seat Count =====

SELECT
    co.Offering_ID,
    c.Course_ID,
    c.Course_Name,
    s.Semester_Name,
    s.Academic_Year,
    f.First_Name || ' ' || f.Last_Name       AS Faculty_Name,
    co.Max_Seats,
    COUNT(CASE WHEN r.Status <> 'DROPPED' THEN 1 END) AS Enrolled,
    co.Max_Seats - COUNT(CASE WHEN r.Status <> 'DROPPED' THEN 1 END)
                                              AS Remaining_Seats,
    ROUND(
        COUNT(CASE WHEN r.Status <> 'DROPPED' THEN 1 END)
        / co.Max_Seats * 100, 1
    )                                         AS Occupancy_Pct,
    co.Schedule
FROM
    COURSE_OFFERING co
    JOIN COURSE    c ON c.Course_ID   = co.Course_ID
    JOIN SEMESTER  s ON s.Semester_ID = co.Semester_ID
    JOIN FACULTY   f ON f.Faculty_ID  = co.Faculty_ID
    LEFT JOIN REGISTRATION r ON r.Offering_ID = co.Offering_ID
GROUP BY
    co.Offering_ID,
    c.Course_ID,
    c.Course_Name,
    s.Semester_Name,
    s.Academic_Year,
    f.First_Name,
    f.Last_Name,
    co.Max_Seats,
    co.Schedule
ORDER BY
    s.Academic_Year,
    s.Semester_Name,
    c.Course_ID;


-- =============================================================================
-- QUERY 3: Students eligible for a specific course
-- A student is eligible when:
--   (a) They have COMPLETED registrations for ALL prerequisites of the course.
--   (b) They are NOT already registered (REGISTERED/COMPLETED) in any
--       offering of that course.
--
-- Parameterised with a substitution variable; pass the desired Course_ID.
-- Example: when prompted enter  CS401
-- In a script set  DEFINE target_course = CS401
-- =============================================================================
PROMPT
PROMPT ===== QUERY 3: Students Eligible for a Given Course =====
PROMPT    (Edit the WHERE clause or use substitution variable &target_course)
PROMPT

-- Hard-coded to CS401 for demonstration; replace with &target_course if desired
WITH
    target_course AS (SELECT 'CS401' AS course_id FROM DUAL),
    prereq_counts AS (
        -- Total number of prerequisites for the target course
        SELECT COUNT(*) AS total_prereqs
        FROM   PREREQUISITE
        WHERE  Course_ID = (SELECT course_id FROM target_course)
    ),
    student_prereq_completed AS (
        -- For each student, count how many prerequisites of the target course
        -- they have already COMPLETED
        SELECT
            r.Student_RegNo,
            COUNT(DISTINCT co.Course_ID)  AS prereqs_done
        FROM
            REGISTRATION   r
            JOIN COURSE_OFFERING co ON co.Offering_ID = r.Offering_ID
        WHERE
            r.Status = 'COMPLETED'
            AND co.Course_ID IN (
                    SELECT Prereq_Course_ID
                    FROM   PREREQUISITE
                    WHERE  Course_ID = (SELECT course_id FROM target_course)
                )
        GROUP BY r.Student_RegNo
    ),
    already_enrolled AS (
        -- Students already registered or completed in the target course
        SELECT DISTINCT r.Student_RegNo
        FROM   REGISTRATION   r
        JOIN   COURSE_OFFERING co ON co.Offering_ID = r.Offering_ID
        WHERE  co.Course_ID = (SELECT course_id FROM target_course)
          AND  r.Status IN ('REGISTERED', 'COMPLETED')
    )
SELECT
    st.Student_RegNo,
    st.First_Name || ' ' || st.Last_Name    AS Student_Name,
    d.Dept_Name,
    st.Semester_No,
    st.CGPA,
    spc.prereqs_done                        AS Prerequisites_Met,
    pc.total_prereqs                        AS Prerequisites_Required
FROM
    STUDENT                st
    JOIN DEPARTMENT        d   ON d.Dept_ID       = st.Dept_ID
    LEFT JOIN student_prereq_completed spc ON spc.Student_RegNo = st.Student_RegNo
    CROSS JOIN prereq_counts pc
WHERE
    -- All prerequisites met  (NVL handles students with no completed courses)
    NVL(spc.prereqs_done, 0) >= pc.total_prereqs
    -- Not already enrolled
    AND st.Student_RegNo NOT IN (SELECT Student_RegNo FROM already_enrolled)
ORDER BY
    st.CGPA DESC,
    st.Student_RegNo;


-- =============================================================================
-- QUERY 4: Top students by CGPA per department (using RANK / window function)
-- Shows rank 1-3 per department.
-- =============================================================================
PROMPT
PROMPT ===== QUERY 4: Top Students by CGPA per Department =====

SELECT
    Dept_Name,
    Student_RegNo,
    Student_Name,
    CGPA,
    Dept_Rank
FROM (
    SELECT
        d.Dept_Name,
        st.Student_RegNo,
        st.First_Name || ' ' || st.Last_Name  AS Student_Name,
        st.CGPA,
        RANK() OVER (
            PARTITION BY d.Dept_ID
            ORDER BY st.CGPA DESC NULLS LAST
        )  AS Dept_Rank
    FROM
        STUDENT     st
        JOIN DEPARTMENT d ON d.Dept_ID = st.Dept_ID
) ranked
WHERE  Dept_Rank <= 3
ORDER BY Dept_Name, Dept_Rank;


-- =============================================================================
-- QUERY 5: Registration statistics by semester
-- Aggregated metrics per semester: total offerings, total registrations,
-- dropped count, completion rate, and distinct students enrolled.
-- =============================================================================
PROMPT
PROMPT ===== QUERY 5: Registration Statistics by Semester =====

SELECT
    s.Semester_ID,
    s.Semester_Name,
    s.Academic_Year,
    s.Is_Active,
    COUNT(DISTINCT co.Offering_ID)                                  AS Total_Offerings,
    COUNT(DISTINCT st.Student_RegNo)                                AS Distinct_Students,
    COUNT(r.Reg_ID)                                                 AS Total_Registrations,
    COUNT(CASE WHEN r.Status = 'REGISTERED'  THEN 1 END)           AS Currently_Registered,
    COUNT(CASE WHEN r.Status = 'COMPLETED'   THEN 1 END)           AS Completed,
    COUNT(CASE WHEN r.Status = 'DROPPED'     THEN 1 END)           AS Dropped,
    CASE
        WHEN COUNT(r.Reg_ID) = 0 THEN NULL
        ELSE ROUND(
                 COUNT(CASE WHEN r.Status = 'COMPLETED' THEN 1 END)
                 / COUNT(r.Reg_ID) * 100, 2
             )
    END                                                             AS Completion_Rate_Pct,
    SUM(NVL(c.Credits,0) * CASE WHEN r.Status IN ('REGISTERED','COMPLETED') THEN 1 ELSE 0 END)
                                                                    AS Total_Credit_Hours_Offered
FROM
    SEMESTER       s
    LEFT JOIN COURSE_OFFERING co ON co.Semester_ID = s.Semester_ID
    LEFT JOIN REGISTRATION    r  ON r.Offering_ID  = co.Offering_ID
    LEFT JOIN STUDENT         st ON st.Student_RegNo = r.Student_RegNo
    LEFT JOIN COURSE           c ON c.Course_ID     = co.Course_ID
GROUP BY
    s.Semester_ID,
    s.Semester_Name,
    s.Academic_Year,
    s.Is_Active
ORDER BY
    s.Academic_Year,
    s.Semester_ID;


-- =============================================================================
-- QUERY 6 (Bonus): Student transcript – all registrations for a student
-- with course name, semester, grade, status, and credits.
-- =============================================================================
PROMPT
PROMPT ===== QUERY 6: Student Transcript (example: 2023CS001) =====

SELECT
    r.Reg_ID,
    co.Course_ID,
    c.Course_Name,
    c.Credits,
    sem.Semester_Name,
    sem.Academic_Year,
    r.Registration_Date,
    r.Grade,
    r.Status
FROM
    REGISTRATION    r
    JOIN COURSE_OFFERING co  ON co.Offering_ID = r.Offering_ID
    JOIN COURSE           c  ON c.Course_ID    = co.Course_ID
    JOIN SEMESTER         sem ON sem.Semester_ID = co.Semester_ID
WHERE
    r.Student_RegNo = '2023CS001'
ORDER BY
    sem.Academic_Year,
    sem.Semester_ID,
    c.Course_ID;


-- =============================================================================
-- QUERY 7 (Bonus): Faculty workload – number of offerings and total students
-- per faculty member in the active semester.
-- =============================================================================
PROMPT
PROMPT ===== QUERY 7: Faculty Workload (Active Semester) =====

SELECT
    f.Faculty_ID,
    f.First_Name || ' ' || f.Last_Name  AS Faculty_Name,
    f.Designation,
    d.Dept_Name,
    COUNT(DISTINCT co.Offering_ID)      AS Offerings,
    SUM(co.Max_Seats)                   AS Total_Max_Seats,
    COUNT(r.Reg_ID)                     AS Total_Enrolments
FROM
    FACULTY          f
    JOIN DEPARTMENT  d   ON d.Dept_ID   = f.Dept_ID
    LEFT JOIN COURSE_OFFERING co ON co.Faculty_ID  = f.Faculty_ID
    LEFT JOIN SEMESTER        sem ON sem.Semester_ID = co.Semester_ID AND sem.Is_Active = 'Y'
    LEFT JOIN REGISTRATION    r   ON r.Offering_ID  = co.Offering_ID
                                 AND r.Status        <> 'DROPPED'
WHERE
    sem.Is_Active = 'Y' OR co.Offering_ID IS NULL
GROUP BY
    f.Faculty_ID,
    f.First_Name,
    f.Last_Name,
    f.Designation,
    d.Dept_Name
ORDER BY
    Offerings DESC,
    f.Last_Name;

PROMPT '==> 04_queries.sql completed successfully.';
