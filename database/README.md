# University Course Registration System (UCRS)
## Oracle SQL Database – Developer Guide

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [File Inventory & Execution Order](#2-file-inventory--execution-order)
3. [How to Connect to Oracle](#3-how-to-connect-to-oracle)
4. [Running the Scripts](#4-running-the-scripts)
5. [Table Relationships (ASCII ER Diagram)](#5-table-relationships-ascii-er-diagram)
6. [Circular FK Workaround](#6-circular-fk-workaround)
7. [Calling the Stored Procedure & Function](#7-calling-the-stored-procedure--function)
8. [PL/SQL Package Reference](#8-plsql-package-reference)
9. [Trigger Reference](#9-trigger-reference)
10. [Sample Query Usage](#10-sample-query-usage)
11. [Sequences Reference](#11-sequences-reference)
12. [Design Decisions & Notes](#12-design-decisions--notes)

---

## 1. Project Overview

The **University Course Registration System (UCRS)** is an Oracle 12c+ relational database that manages:

| Domain | Tables Involved |
|---|---|
| Academic structure | `DEPARTMENT`, `FACULTY`, `COURSE` |
| Students | `STUDENT` |
| Scheduling | `SEMESTER`, `COURSE_OFFERING` |
| Enrolment | `REGISTRATION`, `PREREQUISITE` |

Key business rules enforced at the database level:
- A student cannot register for a course twice in the same offering (`UNIQUE` constraint).
- Registration is only allowed when seats are available (`REGISTER_STUDENT` procedure).
- All course prerequisites must be **COMPLETED** before enrolment.
- A **DROPPED** registration cannot carry a grade (trigger `TRG_NO_GRADE_DROPPED`).
- The circular HOD ↔ Faculty foreign key is handled via a **deferrable constraint**.

---

## 2. File Inventory & Execution Order

> [!IMPORTANT]
> Always run the scripts in the numbered order below. Running them out of order will cause FK violations or missing objects.

| # | File | Purpose |
|---|---|---|
| 1 | `01_schema.sql` | DDL – sequences, tables, constraints, indexes |
| 2 | `02_sample_data.sql` | DML – seed data (5 depts, 10 faculty, 15 students …) |
| 3 | `03_plsql.sql` | PL/SQL – package `UCRS_PKG`, procedure, trigger |
| 4 | `04_queries.sql` | Analytical SQL queries (reporting) |

---

## 3. How to Connect to Oracle

### SQL*Plus (command line)
```bash
sqlplus username/password@hostname:1521/service_name
# e.g.
sqlplus ucrs_user/ucrs_pass@localhost:1521/XEPDB1
```

### SQL Developer (GUI)
1. Open SQL Developer → **New Connection**
2. Fill **Connection Name**, **Username**, **Password**
3. Set **Hostname**, **Port** (default 1521), **Service name** (e.g. `XEPDB1`)
4. Click **Test** → **Connect**

### Oracle LiveSQL (browser)
1. Visit [livesql.oracle.com](https://livesql.oracle.com)
2. Sign in with an Oracle account (free)
3. Paste each script into the worksheet and click **Run Script**

---

## 4. Running the Scripts

### SQL*Plus – interactive
```sql
-- Connect first, then run each file:
SQL> @/path/to/database/01_schema.sql
SQL> @/path/to/database/02_sample_data.sql
SQL> @/path/to/database/03_plsql.sql
SQL> @/path/to/database/04_queries.sql
```

### SQL*Plus – shell one-liner
```bash
sqlplus ucrs_user/ucrs_pass@localhost:1521/XEPDB1 \
  @01_schema.sql \
  @02_sample_data.sql \
  @03_plsql.sql \
  @04_queries.sql
```

### SQL Developer
1. Open each `.sql` file via **File → Open**
2. Press **F5** (Run Script) for DDL/DML files
3. Press **F9** (Run Statement) for individual queries

> [!TIP]
> Enable `SET SERVEROUTPUT ON SIZE UNLIMITED` before running PL/SQL scripts so that `DBMS_OUTPUT` messages appear in the output panel.

---

## 5. Table Relationships (ASCII ER Diagram)

```
  DEPARTMENT                      FACULTY
  ──────────                      ───────
  Dept_ID (PK) ◄──────────────── Dept_ID (FK)
  Dept_Name                       Faculty_ID (PK)
  HOD_ID (FK, DEFERRABLE) ──────► Faculty_ID      ← circular pair
                                  First_Name
                                  Last_Name
                                  Email
                                  Phone
                                  Designation

         │                               │
         │ (1:N)                         │ (1:N)
         ▼                               ▼
      STUDENT                    COURSE_OFFERING
      ───────                    ───────────────
      Student_RegNo (PK)         Offering_ID (PK)
      First_Name                 Course_ID  (FK) ──────► COURSE
      Last_Name                  Semester_ID(FK) ──────► SEMESTER
      Email                      Faculty_ID (FK) ──────► FACULTY
      Dept_ID (FK)               Max_Seats
      Semester_No                Schedule
      CGPA
         │
         │ (1:N via REGISTRATION)
         ▼
   REGISTRATION ◄──────── COURSE_OFFERING
   ────────────
   Reg_ID (PK)
   Student_RegNo (FK)
   Offering_ID (FK)
   Registration_Date
   Grade
   Status

   COURSE ◄─────────── PREREQUISITE ──────────► COURSE
   ──────               ───────────              (self-ref)
   Course_ID (PK)       Course_ID (FK, PK)
   Course_Name          Prereq_Course_ID (FK, PK)
   Credits
   Dept_ID (FK) ──────► DEPARTMENT

   SEMESTER
   ────────
   Semester_ID (PK)
   Semester_Name
   Academic_Year
   Start_Date
   End_Date
   Is_Active
```

### Cardinalities at a glance

| Relationship | Cardinality |
|---|---|
| DEPARTMENT → FACULTY | 1 : N |
| DEPARTMENT → STUDENT | 1 : N |
| DEPARTMENT → COURSE | 1 : N |
| FACULTY → COURSE_OFFERING | 1 : N |
| COURSE → COURSE_OFFERING | 1 : N |
| SEMESTER → COURSE_OFFERING | 1 : N |
| STUDENT → REGISTRATION | 1 : N |
| COURSE_OFFERING → REGISTRATION | 1 : N |
| COURSE → PREREQUISITE (as course) | 1 : N |
| COURSE → PREREQUISITE (as prereq) | 1 : N |
| DEPARTMENT → FACULTY (HOD) | 1 : 1 (optional) |

---

## 6. Circular FK Workaround

### The Problem
```
DEPARTMENT.HOD_ID  →  FACULTY.Faculty_ID
FACULTY.Dept_ID    →  DEPARTMENT.Dept_ID
```
Neither table can be fully created *after* the other because each references the other. Attempting a normal FK pair raises `ORA-00942` or `ORA-02270`.

### The Solution – Deferrable Constraint

**Step 1 – Create DEPARTMENT without the HOD_ID FK:**
```sql
CREATE TABLE DEPARTMENT (
    Dept_ID   NUMBER PRIMARY KEY,
    Dept_Name VARCHAR2(100) NOT NULL,
    HOD_ID    NUMBER          -- plain column; no FK yet
);
```

**Step 2 – Create FACULTY with FK to DEPARTMENT (normal):**
```sql
CREATE TABLE FACULTY (
    Faculty_ID NUMBER PRIMARY KEY,
    Dept_ID    NUMBER NOT NULL REFERENCES DEPARTMENT(Dept_ID),
    ...
);
```

**Step 3 – Add the circular FK back to DEPARTMENT as DEFERRABLE:**
```sql
ALTER TABLE DEPARTMENT
    ADD CONSTRAINT FK_DEPT_HOD
        FOREIGN KEY (HOD_ID)
        REFERENCES FACULTY(Faculty_ID)
        DEFERRABLE INITIALLY DEFERRED;
```

**At data-load time – defer within a transaction:**
```sql
SET CONSTRAINTS FK_DEPT_HOD DEFERRED;

INSERT INTO DEPARTMENT (Dept_ID, Dept_Name) VALUES (100, 'Computer Science');
INSERT INTO FACULTY    (Faculty_ID, Dept_ID, ...) VALUES (1, 100, ...);
UPDATE DEPARTMENT SET HOD_ID = 1 WHERE Dept_ID = 100;

COMMIT;   -- FK verified HERE; both rows exist, so it passes
```

> [!NOTE]
> `DEFERRABLE INITIALLY DEFERRED` means Oracle only checks the constraint when the transaction commits, not on each individual DML statement. This is the standard Oracle pattern for mutually-referential tables.

---

## 7. Calling the Stored Procedure & Function

### REGISTER_STUDENT

```sql
SET SERVEROUTPUT ON;

DECLARE
    v_reg_id  NUMBER;
    v_msg     VARCHAR2(500);
BEGIN
    -- Register student 2024CS002 in Offering #9 (CS201, Sem 2)
    UCRS_PKG.REGISTER_STUDENT(
        p_student_regno => '2024CS002',
        p_offering_id   => 9,
        p_reg_id        => v_reg_id,
        p_message       => v_msg
    );
    DBMS_OUTPUT.PUT_LINE('Result   : ' || v_msg);
    DBMS_OUTPUT.PUT_LINE('New Reg# : ' || NVL(TO_CHAR(v_reg_id), 'N/A'));
END;
/
```

**Expected success output:**
```
Result   : SUCCESS: Student 2024CS002 registered for offering 9. Registration ID: 23.
New Reg# : 23
```

**Example error outputs:**

| Scenario | Error Message |
|---|---|
| Student not found | `ERROR [-20001]: Student not found: ZZZZ001` |
| Offering not found | `ERROR [-20002]: Course offering not found: 999` |
| No seats | `ERROR [-20003]: No seats available in offering 9 (capacity: 55, enrolled: 55).` |
| Duplicate registration | `ERROR [-20004]: Student 2024CS002 is already registered for offering 9.` |
| Prerequisite not met | `ERROR [-20005]: Prerequisite(s) not met for course CS401 …` |

---

### GET_TOTAL_CREDITS

```sql
SET SERVEROUTPUT ON;

DECLARE
    v_credits NUMBER;
BEGIN
    -- All-semester total for a student
    v_credits := UCRS_PKG.GET_TOTAL_CREDITS('2023CS001');
    DBMS_OUTPUT.PUT_LINE('Total credits (all semesters): ' || v_credits);

    -- Filter to Semester 1 only
    v_credits := UCRS_PKG.GET_TOTAL_CREDITS('2023CS001', 1);
    DBMS_OUTPUT.PUT_LINE('Total credits (Semester 1)   : ' || v_credits);
END;
/
```

---

### LIST_COURSE_OFFERINGS (standalone procedure)

```sql
SET SERVEROUTPUT ON SIZE UNLIMITED;

BEGIN
    LIST_COURSE_OFFERINGS(2);   -- pass Semester_ID
END;
/
```

---

## 8. PL/SQL Package Reference

### Package: `UCRS_PKG`

#### Public Exceptions

| Exception | Error Code | Meaning |
|---|---|---|
| `EX_STUDENT_NOT_FOUND` | `-20001` | `p_student_regno` does not exist |
| `EX_OFFERING_NOT_FOUND` | `-20002` | `p_offering_id` does not exist |
| `EX_NO_SEATS` | `-20003` | Offering has reached max enrolment |
| `EX_DUPLICATE_REG` | `-20004` | Student already registered for offering |
| `EX_PREREQ_NOT_MET` | `-20005` | One or more prerequisites not completed |

#### Procedure: `REGISTER_STUDENT`

| Parameter | Direction | Type | Description |
|---|---|---|---|
| `p_student_regno` | IN | VARCHAR2 | Student registration number |
| `p_offering_id` | IN | NUMBER | Target offering ID |
| `p_reg_id` | OUT | NUMBER | New `REGISTRATION.Reg_ID` on success; NULL on error |
| `p_message` | OUT | VARCHAR2 | Human-readable success/error message |

**Validation sequence:**
1. Student exists
2. Offering exists (locked with `SELECT … FOR UPDATE NOWAIT`)
3. Seats available
4. No duplicate registration
5. All prerequisites COMPLETED

#### Function: `GET_TOTAL_CREDITS`

| Parameter | Direction | Type | Default | Description |
|---|---|---|---|---|
| `p_student_regno` | IN | VARCHAR2 | — | Student registration number |
| `p_semester_id` | IN | NUMBER | `NULL` | Restrict to a semester; NULL = all |

Returns `NUMBER` – sum of `COURSE.Credits` for REGISTERED + COMPLETED courses.

---

## 9. Trigger Reference

### `TRG_NO_GRADE_DROPPED`

| Property | Value |
|---|---|
| Type | `AFTER UPDATE` |
| Table | `REGISTRATION` |
| Fires on | each row |
| Action | Raises `ORA-20010` if `NEW.Status = 'DROPPED'` and `NEW.Grade IS NOT NULL` |

```sql
-- This will raise ORA-20010:
UPDATE REGISTRATION SET Status = 'DROPPED', Grade = 'A' WHERE Reg_ID = 1;

-- This is fine (drop without a grade):
UPDATE REGISTRATION SET Status = 'DROPPED' WHERE Reg_ID = 1;
```

---

## 10. Sample Query Usage

All queries in `04_queries.sql` can be run as-is against the sample data.

| Query | Description |
|---|---|
| Q1 | Course → prerequisite pairs (with optional left-join variant) |
| Q2 | Offering seat occupancy across all semesters |
| Q3 | Students eligible for `CS401` (edit `target_course` CTE for others) |
| Q4 | Top-3 students by CGPA per department (window function `RANK()`) |
| Q5 | Semester-level registration statistics and completion rates |
| Q6 | Full student transcript for `2023CS001` |
| Q7 | Faculty workload in the active semester |

To change the target student/course in Q3, edit the CTE:
```sql
WITH target_course AS (SELECT 'EC301' AS course_id FROM DUAL),
```

---

## 11. Sequences Reference

| Sequence | Table | Start | Step |
|---|---|---|---|
| `SEQ_DEPT_ID` | `DEPARTMENT` | 100 | 1 |
| `SEQ_FACULTY_ID` | `FACULTY` | 1 | 1 |
| `SEQ_SEMESTER_ID` | `SEMESTER` | 1 | 1 |
| `SEQ_OFFERING_ID` | `COURSE_OFFERING` | 1 | 1 |
| `SEQ_REG_ID` | `REGISTRATION` | 1 | 1 |

> [!NOTE]
> Oracle 12c+ supports **identity columns** (`GENERATED ALWAYS AS IDENTITY`).
> This schema uses explicit sequences for clarity and compatibility with
> Oracle 11g+ migration if needed.

Usage pattern:
```sql
INSERT INTO REGISTRATION (Reg_ID, ...) VALUES (SEQ_REG_ID.NEXTVAL, ...);
-- or in Oracle 12c with NEXTVAL in SELECT:
SELECT SEQ_REG_ID.NEXTVAL FROM DUAL;
```

---

## 12. Design Decisions & Notes

| Decision | Rationale |
|---|---|
| `VARCHAR2` for `Student_RegNo` | Registration numbers are alphanumeric (e.g. `2024CS001`); a `NUMBER` PK would lose leading zeros and require format masking. |
| `CHAR(1)` for boolean-like flags | Oracle has no native `BOOLEAN` for SQL (only PL/SQL). `CHAR(1)` with a `CHECK (IN ('Y','N'))` is idiomatic Oracle. |
| `DEFERRABLE INITIALLY DEFERRED` on HOD FK | The only clean way to solve the DEPARTMENT ↔ FACULTY circular dependency without application-level workarounds. |
| `SELECT ... FOR UPDATE NOWAIT` in `REGISTER_STUDENT` | Prevents the classic lost-update race condition where two concurrent registrations for the last seat both succeed. `NOWAIT` surfaces a lock error immediately rather than blocking indefinitely. |
| Grades stored as `VARCHAR2(2)` | Accommodates formats: `A+`, `A`, `B+`, `B`, `C`, `D`, `F` without requiring a lookup table. |
| Composite PK on `PREREQUISITE` | Natural key; no surrogate needed. Also enforces that the same prerequisite cannot be listed twice for the same course. |
| `NVL(SUM(...), 0)` in `GET_TOTAL_CREDITS` | `SUM()` returns `NULL` when there are no rows; `NVL` ensures callers always receive a numeric value. |
| Indexes on FK columns | Oracle does **not** automatically index FK columns (unlike PostgreSQL). Without these indexes, `ON DELETE`/cascade operations and FK-based joins cause full-table scans. |

---

*Generated for Oracle Database 12c Release 2 (12.2) and later.*
*Compatible with Oracle 19c, 21c, and 23ai.*
