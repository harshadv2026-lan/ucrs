# University Course Registration System (UCRS)

> A full-stack DBMS project: **React + Vite** frontend · **Spring Boot 3** REST API · **Oracle SQL / PL/SQL** database (H2 demo mode included)

---

## 📂 Project Structure

```
ucrs/
├── frontend/          # React + Vite (port 5173)
├── backend/           # Spring Boot REST API (port 8080)
├── database/          # Oracle SQL DDL, DML, PL/SQL scripts
├── .env.example       # Environment variable template
└── README.md
```

---

## 🚀 Quick Start (Demo Mode — No Oracle Required)

Demo mode uses an **H2 in-memory database** that is seeded automatically at startup.

### 1. Start the Backend

**Requirements:** Java 17, Maven 3.8+

> ⚠️ **Java 17 is required.** The project uses Lombok which is incompatible with Java 21+ in some configurations. Install Java 17 via `brew install openjdk@17`.

```bash
# Using the pre-built JAR (fastest):
cd backend
JAVA_HOME=/opt/homebrew/opt/openjdk@17 java -jar target/ucrs-backend-1.0.0.jar

# OR build from source first:
cd backend
JAVA_HOME=/opt/homebrew/opt/openjdk@17 mvn package -DskipTests
JAVA_HOME=/opt/homebrew/opt/openjdk@17 java -jar target/ucrs-backend-1.0.0.jar

# OR use Maven Spring Boot plugin:
cd backend
JAVA_HOME=/opt/homebrew/opt/openjdk@17 mvn spring-boot:run
```

The API starts at `http://localhost:8080`.  
Swagger UI: `http://localhost:8080/swagger-ui/index.html`  
H2 Console: `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:mem:ucrsdb`
  - User: `sa` | Password: *(empty)*

### 2. Start the Frontend

**Requirements:** Node.js 18+

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`.

---

## 🔑 Demo Login Credentials

| Role    | Identifier                    | Password     |
|---------|-------------------------------|--------------|
| Student | `2021CS001`                   | `student123` |
| Student | `2021IT001`                   | `student123` |
| Faculty | `alice.johnson@ucrs.edu`      | `faculty123` |
| Faculty | `bob.smith@ucrs.edu`          | `faculty123` |
| Admin   | `admin`                       | `admin123`   |

> ⚠️ **Demo credentials are for development only.** Change all passwords before any production deployment.

---

## 🗄️ Oracle Database Setup

Run the SQL scripts **in order** using SQL*Plus, SQL Developer, or any Oracle client:

```sql
-- Connect to your Oracle instance first
-- Then run:
@database/01_schema.sql      -- Creates all 8 tables, sequences, indexes
@database/02_sample_data.sql -- Inserts sample departments, faculty, students, courses, etc.
@database/03_plsql.sql       -- Creates UCRS_PKG package, trigger, cursor procedure
@database/04_queries.sql     -- Useful analytical queries (optional)
```

### Switch Backend to Oracle

1. Copy `.env.example` to `.env` and fill in your Oracle credentials.
2. Edit `backend/src/main/resources/application.properties`:
   ```properties
   spring.profiles.active=oracle
   ```
3. Edit `backend/src/main/resources/application-oracle.properties`:
   ```properties
   spring.datasource.url=jdbc:oracle:thin:@//localhost:1521/XEPDB1
   spring.datasource.username=${ORACLE_USER}
   spring.datasource.password=${ORACLE_PASS}
   ```
4. Download the **Oracle JDBC driver** (`ojdbc11.jar`) from [oracle.com/jdbc](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html) and install it locally:
   ```bash
   mvn install:install-file \
     -Dfile=ojdbc11.jar \
     -DgroupId=com.oracle.database.jdbc \
     -DartifactId=ojdbc11 \
     -Dversion=23.3.0.23.09 \
     -Dpackaging=jar
   ```
5. Restart the backend: `mvn spring-boot:run`

---

## 🧪 Testing Course Registration

### Via the UI

1. Log in as a student (`2021CS001` / `student123`).
2. Navigate to **Course Registration**.
3. Select a course offering → click **Register**.
4. Check **My Registrations** to confirm it appears.
5. Click **Drop** to drop the course.
6. Log in as faculty (`alice.johnson@ucrs.edu` / `faculty123`) → **Grade Management** → assign a grade.

### Via Postman / curl

**Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"2021CS001","password":"student123","role":"STUDENT"}'
```

**Register for a course:**
```bash
curl -X POST http://localhost:8080/api/registrations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"studentRegNo":"2021CS001","offeringId":1}'
```

**Drop a registration:**
```bash
curl -X DELETE http://localhost:8080/api/registrations/1 \
  -H "Authorization: Bearer <token>"
```

**Assign a grade:**
```bash
curl -X PUT http://localhost:8080/api/registrations/1/grade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-User-Role: FACULTY" \
  -d '{"grade":"A"}'
```

---

## 📡 REST API Summary

| Method   | Endpoint                              | Description                        |
|----------|---------------------------------------|------------------------------------|
| `POST`   | `/api/auth/login`                     | Login (Student/Faculty/Admin)      |
| `GET`    | `/api/courses`                        | List courses (`?search=&deptId=`)  |
| `GET`    | `/api/courses/{id}`                   | Course detail + prerequisites      |
| `GET`    | `/api/offerings`                      | List offerings (`?semesterId=`)    |
| `GET`    | `/api/offerings/{id}/students`        | Enrolled students (Faculty/Admin)  |
| `GET`    | `/api/students/{regNo}`               | Student profile                    |
| `GET`    | `/api/registrations/{regNo}`          | Student's registrations            |
| `POST`   | `/api/registrations`                  | Register for a course              |
| `DELETE` | `/api/registrations/{id}`             | Drop a registration                |
| `PUT`    | `/api/registrations/{id}/grade`       | Assign grade                       |
| `GET`    | `/api/registrations/{regNo}/credits`  | Total registered credits           |
| `GET`    | `/api/admin/stats`                    | System statistics (Admin)          |
| `GET`    | `/api/departments`                    | All departments                    |
| `GET`    | `/api/semesters`                      | All semesters                      |
| `GET`    | `/api/faculty`                        | All faculty                        |

Full interactive documentation: **`http://localhost:8080/swagger-ui/index.html`**

---

## 🏗️ Database Schema

```
DEPARTMENT ──────────────────── FACULTY
  Dept_ID (PK)                    Faculty_ID (PK)
  Dept_Name                       First/Last Name
  HOD_ID (FK→FACULTY, deferred)   Dept_ID (FK→DEPARTMENT)
       │                          └──── COURSE_OFFERING
       └──── STUDENT                      Offering_ID (PK)
               Student_RegNo (PK)         Course_ID (FK)
               Dept_ID (FK)               Semester_ID (FK)
               └──── REGISTRATION         Faculty_ID (FK)
                       Reg_ID (PK)        Max_Seats
                       Student_RegNo (FK)
                       Offering_ID (FK)
                       Grade, Status

COURSE ──────────── PREREQUISITE
  Course_ID (PK)      Course_ID (PK, FK)
  Credits             Prereq_Course_ID (PK, FK)
  Dept_ID (FK)

SEMESTER
  Semester_ID (PK)
  Is_Active
```

---

## 🔐 PL/SQL Components

| Component | Type | Purpose |
|-----------|------|---------|
| `UCRS_PKG.REGISTER_STUDENT` | Procedure | Validates + inserts registration with `SELECT FOR UPDATE` locking |
| `UCRS_PKG.GET_TOTAL_CREDITS` | Function | Returns total credit hours for a student |
| `LIST_COURSE_OFFERINGS` | Procedure (cursor) | Prints offerings using explicit cursor |
| `TRG_NO_GRADE_DROPPED` | Trigger | Blocks grade assignment on DROPPED registrations |

---

## ✅ Demo vs Oracle Feature Matrix

| Feature | Demo Mode (H2) | Oracle Mode |
|---------|---------------|-------------|
| Login & Auth | ✅ | ✅ |
| Student Dashboard | ✅ | ✅ |
| Course Catalogue | ✅ | ✅ |
| Course Registration | ✅ (JPA validation) | ✅ (+ PL/SQL proc) |
| Grade Management | ✅ | ✅ |
| Admin CRUD | ✅ | ✅ |
| Prerequisite Enforcement | ✅ | ✅ |
| Seat Race-Condition Guard | ✅ (synchronized) | ✅ (SELECT FOR UPDATE) |
| PL/SQL Stored Procedures | ❌ | ✅ |
| Triggers | ❌ | ✅ |
| H2 Console | ✅ `/h2-console` | ❌ |
| Swagger UI | ✅ | ✅ |

---

## 🛠️ Build for Production

```bash
# Frontend
cd frontend && npm run build
# Output: frontend/dist/ — serve with any static host

# Backend
cd backend && mvn clean package -DskipTests
# Output: backend/target/ucrs-0.0.1-SNAPSHOT.jar
java -jar backend/target/ucrs-0.0.1-SNAPSHOT.jar
```

---

## 📝 Notes

- **Security:** This project uses a simplified token scheme suitable for a DBMS course project. For production, integrate Spring Security with JWT and BCrypt password hashing.
- **Oracle JDBC:** The `ojdbc11` dependency in `pom.xml` has `<scope>provided</scope>` because Oracle's license prohibits hosting it on Maven Central. Download and install it manually as shown above.
- **CORS:** The backend allows all origins in development. Restrict this in production.
