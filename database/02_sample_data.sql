-- =============================================================================
-- University Course Registration System (UCRS)
-- FILE: 02_sample_data.sql
-- Description: Comprehensive seed data for all tables.
--
-- Run AFTER 01_schema.sql.
-- Uses DEFERRABLE constraint technique to handle circular FK between
-- DEPARTMENT and FACULTY during initial data load.
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;

-- Defer the circular FK constraint for the duration of this transaction
SET CONSTRAINTS FK_DEPT_HOD DEFERRED;

-- =============================================================================
-- DEPARTMENTS (HOD_ID left NULL; updated after faculty rows are inserted)
-- =============================================================================
INSERT INTO DEPARTMENT (Dept_ID, Dept_Name, HOD_ID)
VALUES (SEQ_DEPT_ID.NEXTVAL, 'Computer Science', NULL);            -- 100

INSERT INTO DEPARTMENT (Dept_ID, Dept_Name, HOD_ID)
VALUES (SEQ_DEPT_ID.NEXTVAL, 'Information Technology', NULL);      -- 101

INSERT INTO DEPARTMENT (Dept_ID, Dept_Name, HOD_ID)
VALUES (SEQ_DEPT_ID.NEXTVAL, 'Electronics and Communication', NULL); -- 102

INSERT INTO DEPARTMENT (Dept_ID, Dept_Name, HOD_ID)
VALUES (SEQ_DEPT_ID.NEXTVAL, 'Mechanical Engineering', NULL);      -- 103

INSERT INTO DEPARTMENT (Dept_ID, Dept_Name, HOD_ID)
VALUES (SEQ_DEPT_ID.NEXTVAL, 'Master of Business Administration', NULL); -- 104

-- =============================================================================
-- FACULTY  (10 members across 5 departments)
-- =============================================================================
-- CS Department (Dept_ID = 100)
INSERT INTO FACULTY (Faculty_ID, First_Name, Last_Name, Email, Phone, Designation, Dept_ID)
VALUES (SEQ_FACULTY_ID.NEXTVAL, 'Anjali',   'Sharma',    'anjali.sharma@ucrs.edu',    '9810001001', 'Professor',           100); -- 1

INSERT INTO FACULTY (Faculty_ID, First_Name, Last_Name, Email, Phone, Designation, Dept_ID)
VALUES (SEQ_FACULTY_ID.NEXTVAL, 'Rohan',    'Mehta',     'rohan.mehta@ucrs.edu',      '9810001002', 'Associate Professor', 100); -- 2

-- IT Department (Dept_ID = 101)
INSERT INTO FACULTY (Faculty_ID, First_Name, Last_Name, Email, Phone, Designation, Dept_ID)
VALUES (SEQ_FACULTY_ID.NEXTVAL, 'Priya',    'Nair',      'priya.nair@ucrs.edu',       '9810001003', 'Assistant Professor', 101); -- 3

INSERT INTO FACULTY (Faculty_ID, First_Name, Last_Name, Email, Phone, Designation, Dept_ID)
VALUES (SEQ_FACULTY_ID.NEXTVAL, 'Vikram',   'Singh',     'vikram.singh@ucrs.edu',     '9810001004', 'Lecturer',            101); -- 4

-- ECE Department (Dept_ID = 102)
INSERT INTO FACULTY (Faculty_ID, First_Name, Last_Name, Email, Phone, Designation, Dept_ID)
VALUES (SEQ_FACULTY_ID.NEXTVAL, 'Kavita',   'Reddy',     'kavita.reddy@ucrs.edu',     '9810001005', 'Professor',           102); -- 5

INSERT INTO FACULTY (Faculty_ID, First_Name, Last_Name, Email, Phone, Designation, Dept_ID)
VALUES (SEQ_FACULTY_ID.NEXTVAL, 'Suresh',   'Kumar',     'suresh.kumar@ucrs.edu',     '9810001006', 'Associate Professor', 102); -- 6

-- MECH Department (Dept_ID = 103)
INSERT INTO FACULTY (Faculty_ID, First_Name, Last_Name, Email, Phone, Designation, Dept_ID)
VALUES (SEQ_FACULTY_ID.NEXTVAL, 'Deepak',   'Gupta',     'deepak.gupta@ucrs.edu',     '9810001007', 'Professor',           103); -- 7

INSERT INTO FACULTY (Faculty_ID, First_Name, Last_Name, Email, Phone, Designation, Dept_ID)
VALUES (SEQ_FACULTY_ID.NEXTVAL, 'Lakshmi',  'Iyer',      'lakshmi.iyer@ucrs.edu',     '9810001008', 'Lecturer',            103); -- 8

-- MBA Department (Dept_ID = 104)
INSERT INTO FACULTY (Faculty_ID, First_Name, Last_Name, Email, Phone, Designation, Dept_ID)
VALUES (SEQ_FACULTY_ID.NEXTVAL, 'Arjun',    'Patel',     'arjun.patel@ucrs.edu',      '9810001009', 'Professor',           104); -- 9

INSERT INTO FACULTY (Faculty_ID, First_Name, Last_Name, Email, Phone, Designation, Dept_ID)
VALUES (SEQ_FACULTY_ID.NEXTVAL, 'Meena',    'Joshi',     'meena.joshi@ucrs.edu',      '9810001010', 'Assistant Professor', 104); -- 10

-- =============================================================================
-- UPDATE HOD_IDs in DEPARTMENT (constraint checked at COMMIT)
-- =============================================================================
UPDATE DEPARTMENT SET HOD_ID = 1  WHERE Dept_Name = 'Computer Science';
UPDATE DEPARTMENT SET HOD_ID = 3  WHERE Dept_Name = 'Information Technology';
UPDATE DEPARTMENT SET HOD_ID = 5  WHERE Dept_Name = 'Electronics and Communication';
UPDATE DEPARTMENT SET HOD_ID = 7  WHERE Dept_Name = 'Mechanical Engineering';
UPDATE DEPARTMENT SET HOD_ID = 9  WHERE Dept_Name = 'Master of Business Administration';

COMMIT;  -- FK_DEPT_HOD constraint is verified here; all rows exist so it passes

-- =============================================================================
-- STUDENTS (15 students across departments and semesters)
-- =============================================================================
-- CS Students
INSERT INTO STUDENT VALUES ('2024CS001','Aarav',  'Shah',      'aarav.shah@student.ucrs.edu',      '9900001001', DATE '2004-03-15', 'M', '12 MG Road, Mumbai',           100, 4,  8.75);
INSERT INTO STUDENT VALUES ('2024CS002','Diya',   'Patel',     'diya.patel@student.ucrs.edu',      '9900001002', DATE '2004-07-22', 'F', '45 Park Street, Delhi',         100, 4,  9.10);
INSERT INTO STUDENT VALUES ('2023CS001','Kabir',  'Verma',     'kabir.verma@student.ucrs.edu',     '9900001003', DATE '2003-11-05', 'M', '7 Hill View, Pune',             100, 6,  7.40);
INSERT INTO STUDENT VALUES ('2023CS002','Ishaan', 'Khanna',    'ishaan.khanna@student.ucrs.edu',   '9900001004', DATE '2003-06-18', 'M', '22 Lake Road, Bangalore',       100, 6,  8.20);

-- IT Students
INSERT INTO STUDENT VALUES ('2024IT001','Riya',   'Desai',     'riya.desai@student.ucrs.edu',      '9900001005', DATE '2004-01-30', 'F', '88 Gandhi Nagar, Ahmedabad',    101, 4,  7.90);
INSERT INTO STUDENT VALUES ('2024IT002','Aryan',  'Joshi',     'aryan.joshi@student.ucrs.edu',     '9900001006', DATE '2004-09-12', 'M', '3 Nehru Place, Delhi',          101, 4,  8.50);
INSERT INTO STUDENT VALUES ('2023IT001','Sneha',  'Pillai',    'sneha.pillai@student.ucrs.edu',    '9900001007', DATE '2003-04-25', 'F', '56 Kalyan Nagar, Chennai',      101, 6,  9.30);

-- ECE Students
INSERT INTO STUDENT VALUES ('2024EC001','Tanvi',  'Rao',       'tanvi.rao@student.ucrs.edu',       '9900001008', DATE '2004-08-09', 'F', '17 Vijaynagar, Hyderabad',      102, 3,  7.60);
INSERT INTO STUDENT VALUES ('2024EC002','Aditya', 'Mishra',    'aditya.mishra@student.ucrs.edu',   '9900001009', DATE '2004-05-14', 'M', '9 Civil Lines, Allahabad',      102, 3,  8.00);
INSERT INTO STUDENT VALUES ('2023EC001','Pooja',  'Nambiar',   'pooja.nambiar@student.ucrs.edu',   '9900001010', DATE '2003-12-02', 'F', '34 Marine Drive, Kochi',        102, 5,  8.85);

-- MECH Students
INSERT INTO STUDENT VALUES ('2024ME001','Harsh',  'Trivedi',   'harsh.trivedi@student.ucrs.edu',   '9900001011', DATE '2004-02-28', 'M', '5 Station Road, Vadodara',      103, 3,  7.20);
INSERT INTO STUDENT VALUES ('2024ME002','Simran', 'Kaur',      'simran.kaur@student.ucrs.edu',     '9900001012', DATE '2004-10-16', 'F', '11 Model Town, Ludhiana',       103, 3,  8.10);

-- MBA Students
INSERT INTO STUDENT VALUES ('2024MB001','Nikhil', 'Aggarwal',  'nikhil.aggarwal@student.ucrs.edu', '9900001013', DATE '2001-07-07', 'M', '67 Connaught Place, Delhi',     104, 2,  7.50);
INSERT INTO STUDENT VALUES ('2024MB002','Ananya', 'Bose',      'ananya.bose@student.ucrs.edu',     '9900001014', DATE '2000-03-19', 'F', '23 Salt Lake, Kolkata',         104, 2,  8.40);
INSERT INTO STUDENT VALUES ('2023MB001','Rahul',  'Chatterjee','rahul.chatterjee@student.ucrs.edu','9900001015', DATE '1999-11-11', 'M', '8 Park Circus, Kolkata',        104, 4,  9.00);

COMMIT;

-- =============================================================================
-- COURSES (12 courses with varying credits across departments)
-- =============================================================================
-- CS Courses
INSERT INTO COURSE VALUES ('CS101',  'Introduction to Programming',       4, 'Fundamentals of programming using C/Python; control flow, functions, arrays.', 100);
INSERT INTO COURSE VALUES ('CS201',  'Data Structures and Algorithms',     4, 'Arrays, linked lists, trees, graphs, sorting, and searching algorithms.',    100);
INSERT INTO COURSE VALUES ('CS301',  'Database Management Systems',        3, 'Relational model, SQL, normalization, transaction management, Oracle RDBMS.', 100);
INSERT INTO COURSE VALUES ('CS401',  'Machine Learning',                   4, 'Supervised/unsupervised learning, neural networks, model evaluation.',        100);

-- IT Courses
INSERT INTO COURSE VALUES ('IT101',  'Web Technologies',                   3, 'HTML, CSS, JavaScript, REST APIs, and modern web frameworks.',               101);
INSERT INTO COURSE VALUES ('IT201',  'Network Security',                   3, 'Cryptography, firewalls, VPN, intrusion detection systems.',                 101);

-- ECE Courses
INSERT INTO COURSE VALUES ('EC101',  'Digital Electronics',                4, 'Logic gates, flip-flops, counters, PLDs, and microcontrollers.',             102);
INSERT INTO COURSE VALUES ('EC201',  'Signal Processing',                  4, 'Fourier transforms, filters, DSP algorithms, and MATLAB.',                  102);
INSERT INTO COURSE VALUES ('EC301',  'Embedded Systems',                   3, 'ARM architecture, RTOS, device drivers, IoT fundamentals.',                 102);

-- MECH Courses
INSERT INTO COURSE VALUES ('ME101',  'Engineering Mechanics',              4, 'Statics, dynamics, kinematics, and Newton\'s laws applications.',            103);
INSERT INTO COURSE VALUES ('ME201',  'Thermodynamics',                     4, 'Laws of thermodynamics, heat engines, refrigeration cycles.',                103);

-- MBA Courses
INSERT INTO COURSE VALUES ('MB101',  'Business Statistics and Analytics',  3, 'Descriptive and inferential statistics, regression, business analytics.',    104);

COMMIT;

-- =============================================================================
-- SEMESTERS (2 semesters; Sem 2 2024-25 is currently active)
-- =============================================================================
INSERT INTO SEMESTER VALUES (SEQ_SEMESTER_ID.NEXTVAL, 'Semester 1', '2024-25', DATE '2024-07-01', DATE '2024-11-30', 'N'); -- 1
INSERT INTO SEMESTER VALUES (SEQ_SEMESTER_ID.NEXTVAL, 'Semester 2', '2024-25', DATE '2025-01-06', DATE '2025-05-31', 'Y'); -- 2

COMMIT;

-- =============================================================================
-- COURSE OFFERINGS (15 offerings across both semesters)
-- Format: Offering_ID, Course_ID, Semester_ID, Faculty_ID, Max_Seats, Schedule
-- =============================================================================
-- Semester 1 (Sem_ID = 1) offerings
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'CS101', 1, 1,  60, 'MWF 08:00-09:00 Room CS-101');   -- Off 1
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'CS201', 1, 2,  55, 'TTh 10:00-11:30 Room CS-201');   -- Off 2
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'IT101', 1, 3,  50, 'MWF 11:00-12:00 Room IT-101');   -- Off 3
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'EC101', 1, 5,  60, 'TTh 08:00-09:30 Room EC-101');   -- Off 4
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'ME101', 1, 7,  65, 'MWF 09:00-10:00 Room ME-101');   -- Off 5
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'MB101', 1, 9,  40, 'TTh 14:00-15:30 Room MB-101');   -- Off 6
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'CS301', 1, 1,  50, 'MWF 14:00-15:00 Room CS-301');   -- Off 7

-- Semester 2 (Sem_ID = 2) offerings
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'CS101', 2, 2,  60, 'TTh 09:00-10:30 Room CS-101');   -- Off 8
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'CS201', 2, 1,  55, 'MWF 10:00-11:00 Room CS-201');   -- Off 9
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'CS401', 2, 2,  45, 'TTh 11:00-12:30 Room CS-401');   -- Off 10
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'IT201', 2, 3,  50, 'MWF 13:00-14:00 Room IT-201');   -- Off 11
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'EC201', 2, 5,  55, 'TTh 08:00-09:30 Room EC-201');   -- Off 12
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'EC301', 2, 6,  45, 'MWF 15:00-16:00 Room EC-301');   -- Off 13
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'ME201', 2, 7,  60, 'TTh 13:00-14:30 Room ME-201');   -- Off 14
INSERT INTO COURSE_OFFERING VALUES (SEQ_OFFERING_ID.NEXTVAL, 'CS301', 2, 1,  50, 'MWF 08:00-09:00 Room CS-302');   -- Off 15

COMMIT;

-- =============================================================================
-- PREREQUISITES
-- CS201 requires CS101; CS301 requires CS201; CS401 requires CS201 & CS301;
-- EC301 requires EC101 & EC201; IT201 requires IT101
-- =============================================================================
INSERT INTO PREREQUISITE VALUES ('CS201', 'CS101');
INSERT INTO PREREQUISITE VALUES ('CS301', 'CS201');
INSERT INTO PREREQUISITE VALUES ('CS401', 'CS201');
INSERT INTO PREREQUISITE VALUES ('CS401', 'CS301');
INSERT INTO PREREQUISITE VALUES ('EC201', 'EC101');
INSERT INTO PREREQUISITE VALUES ('EC301', 'EC101');
INSERT INTO PREREQUISITE VALUES ('EC301', 'EC201');
INSERT INTO PREREQUISITE VALUES ('IT201', 'IT101');

COMMIT;

-- =============================================================================
-- REGISTRATIONS (22 registrations; mix of status/grades from Sem 1)
--   Sem 1 offerings (1-7): mostly COMPLETED with grades
--   Sem 2 offerings (8-15): REGISTERED (active)
-- =============================================================================

-- Sem 1 completed registrations -----------------------------------------------
-- CS students in CS101 (Off 1)
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2024CS001',1, DATE '2024-07-03','A+','COMPLETED');
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2024CS002',1, DATE '2024-07-03','A', 'COMPLETED');
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2023CS001',1, DATE '2024-07-04','B+','COMPLETED');

-- CS students in CS201 (Off 2) – requires CS101
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2023CS001',2, DATE '2024-07-04','B', 'COMPLETED');
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2023CS002',2, DATE '2024-07-04','A', 'COMPLETED');

-- IT students in IT101 (Off 3)
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2024IT001',3, DATE '2024-07-05','B+','COMPLETED');
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2024IT002',3, DATE '2024-07-05','A', 'COMPLETED');
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2023IT001',3, DATE '2024-07-05','A+','COMPLETED');

-- ECE students in EC101 (Off 4)
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2024EC001',4, DATE '2024-07-06','B', 'COMPLETED');
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2024EC002',4, DATE '2024-07-06','A', 'COMPLETED');
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2023EC001',4, DATE '2024-07-06','A+','COMPLETED');

-- MECH students in ME101 (Off 5)
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2024ME001',5, DATE '2024-07-07','C', 'COMPLETED');
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2024ME002',5, DATE '2024-07-07','B+','COMPLETED');

-- MBA students in MB101 (Off 6)
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2024MB001',6, DATE '2024-07-08','B', 'COMPLETED');
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2024MB002',6, DATE '2024-07-08','A', 'COMPLETED');
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2023MB001',6, DATE '2024-07-08','A+','COMPLETED');

-- CS students in CS301 (Off 7) – Sem 1; needs CS201
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2023CS001',7, DATE '2024-07-09','B+','COMPLETED');
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2023CS002',7, DATE '2024-07-09','A', 'COMPLETED');

-- A dropped registration example (Sem 1, no grade)
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2024CS001',2, DATE '2024-07-10', NULL,'DROPPED');

-- Sem 2 active registrations ---------------------------------------------------
-- CS401 (Off 10) – 2023 CS students (have CS201 + CS301 completed)
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2023CS001',10, DATE '2025-01-08', NULL,'REGISTERED');
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2023CS002',10, DATE '2025-01-08', NULL,'REGISTERED');

-- ECE201 (Off 12) – ECE students who completed EC101
INSERT INTO REGISTRATION VALUES (SEQ_REG_ID.NEXTVAL,'2023EC001',12, DATE '2025-01-09', NULL,'REGISTERED');

COMMIT;

PROMPT '==> 02_sample_data.sql completed successfully. 5 depts, 10 faculty, 15 students, 12 courses, 2 sems, 15 offerings, 8 prereqs, 22 registrations inserted.';
