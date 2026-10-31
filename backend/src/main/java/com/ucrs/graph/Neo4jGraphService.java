package com.ucrs.graph;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.neo4j.driver.*;
import org.neo4j.driver.Record;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

/**
 * Service managing graph database operations using Neo4j.
 * Automatically connects to live Neo4j Bolt server if available,
 * or gracefully falls back to the embedded in-memory Neo4j graph engine.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class Neo4jGraphService {

    private final InMemoryNeo4jGraphEngine inMemoryEngine;

    @Value("${ucrs.neo4j.enabled:true}")
    private boolean neo4jEnabled;

    @Value("${ucrs.neo4j.uri:bolt://localhost:7687}")
    private String neo4jUri;

    @Value("${ucrs.neo4j.username:neo4j}")
    private String neo4jUsername;

    @Value("${ucrs.neo4j.password:password}")
    private String neo4jPassword;

    private Driver driver;
    @Getter
    private boolean liveConnected = false;
    @Getter
    private String engineMode = "EMBEDDED_GRAPH_ENGINE";

    private final List<String> liveCypherHistory = new CopyOnWriteArrayList<>();

    @PostConstruct
    public void init() {
        if (!neo4jEnabled) {
            log.info("Neo4j integration disabled via configuration; using Embedded Neo4j Graph Engine.");
            engineMode = "EMBEDDED_GRAPH_ENGINE";
            return;
        }

        try {
            log.info("Attempting connection to Neo4j instance at {}", neo4jUri);
            Config config = Config.builder()
                    .withConnectionTimeout(3, java.util.concurrent.TimeUnit.SECONDS)
                    .build();
            driver = GraphDatabase.driver(neo4jUri, AuthTokens.basic(neo4jUsername, neo4jPassword), config);
            driver.verifyConnectivity();
            liveConnected = true;
            engineMode = "LIVE_NEO4J";
            log.info("Successfully connected to live Neo4j database at {}", neo4jUri);
            setupLiveSchema();
        } catch (Exception e) {
            liveConnected = false;
            engineMode = "EMBEDDED_GRAPH_ENGINE";
            log.info("Live Neo4j instance not reachable at {} ({}). Activating Embedded Neo4j Property Graph Engine.",
                    neo4jUri, e.getMessage());
            if (driver != null) {
                try { driver.close(); } catch (Exception ignored) {}
                driver = null;
            }
        }
    }

    @PreDestroy
    public void close() {
        if (driver != null) {
            try {
                driver.close();
            } catch (Exception e) {
                log.warn("Error closing Neo4j driver: {}", e.getMessage());
            }
        }
    }

    private void setupLiveSchema() {
        if (!liveConnected || driver == null) return;
        try (Session session = driver.session()) {
            session.executeWrite(tx -> {
                tx.run("CREATE CONSTRAINT course_id_unique IF NOT EXISTS FOR (c:Course) REQUIRE c.courseId IS UNIQUE;").consume();
                tx.run("CREATE CONSTRAINT student_id_unique IF NOT EXISTS FOR (s:Student) REQUIRE s.regNo IS UNIQUE;").consume();
                tx.run("CREATE CONSTRAINT topic_name_unique IF NOT EXISTS FOR (t:Topic) REQUIRE t.name IS UNIQUE;").consume();
                tx.run("CREATE CONSTRAINT dept_name_unique IF NOT EXISTS FOR (d:Department) REQUIRE d.name IS UNIQUE;").consume();
                return null;
            });
            log.info("Live Neo4j schema constraints verified.");
        } catch (Exception e) {
            log.warn("Could not apply live Neo4j constraints: {}", e.getMessage());
        }
    }

    private void runWrite(String cypher, Map<String, Object> params) {
        if (!liveConnected || driver == null) return;
        try (Session session = driver.session()) {
            session.executeWrite(tx -> {
                tx.run(cypher, params).consume();
                return null;
            });
            logCypher(cypher);
        } catch (Exception e) {
            log.warn("Live Neo4j write error: {} on query: {}", e.getMessage(), cypher);
        }
    }

    public synchronized void resetGraph() {
        inMemoryEngine.clear();
        runWrite("MATCH (n) DETACH DELETE n;", Collections.emptyMap());
    }

    public synchronized void deleteStudentNode(String studentRegNo) {
        inMemoryEngine.deleteNode(studentRegNo);
        String cypher = "MATCH (s:Student {regNo: $regNo}) DETACH DELETE s;";
        runWrite(cypher, Map.of("regNo", studentRegNo));
    }

    public synchronized void deleteCourseNode(String courseId) {
        inMemoryEngine.deleteNode(courseId);
        String cypher = "MATCH (c:Course {courseId: $courseId}) DETACH DELETE c;";
        runWrite(cypher, Map.of("courseId", courseId));
    }

    public synchronized void deleteDepartmentNode(String deptName) {
        inMemoryEngine.deleteNode(deptName);
        String cypher = "MATCH (d:Department {name: $deptName}) DETACH DELETE d;";
        runWrite(cypher, Map.of("deptName", deptName));
    }

    public void mergeDepartment(Long deptId, String deptName) {
        Map<String, Object> props = new HashMap<>();
        props.put("deptId", deptId);
        props.put("name", deptName);
        inMemoryEngine.mergeNode(deptName, "Department", props);

        String cypher = "MERGE (d:Department {name: $name}) ON CREATE SET d.deptId = $deptId;";
        runWrite(cypher, props);
    }

    public void mergeCourse(String courseId, String courseName, int credits, String description, String deptName) {
        Map<String, Object> props = new HashMap<>();
        props.put("courseId", courseId);
        props.put("courseName", courseName);
        props.put("credits", credits);
        props.put("description", description != null ? description : "");
        props.put("department", deptName);

        inMemoryEngine.mergeNode(courseId, "Course", props);
        if (deptName != null) {
            inMemoryEngine.createRelationship(courseId, deptName, "OFFERED_BY", Collections.emptyMap());
        }

        String cypher = "MERGE (c:Course {courseId: $courseId}) " +
                "ON CREATE SET c.courseName = $courseName, c.credits = $credits, c.description = $description, c.department = $department " +
                "ON MATCH SET c.courseName = $courseName, c.credits = $credits " +
                "WITH c " +
                "MERGE (d:Department {name: $department}) " +
                "MERGE (c)-[:OFFERED_BY]->(d);";
        runWrite(cypher, props);
    }

    public void mergePrerequisite(String courseId, String prereqCourseId) {
        inMemoryEngine.createRelationship(courseId, prereqCourseId, "REQUIRES_PREREQUISITE", Collections.emptyMap());
        inMemoryEngine.createRelationship(prereqCourseId, courseId, "PREREQUISITE_OF", Collections.emptyMap());

        String cypher = "MATCH (c:Course {courseId: $courseId}), (p:Course {courseId: $prereqId}) " +
                "MERGE (c)-[:REQUIRES_PREREQUISITE]->(p) " +
                "MERGE (p)-[:PREREQUISITE_OF]->(c);";
        runWrite(cypher, Map.of("courseId", courseId, "prereqId", prereqCourseId));
    }

    public void mergeCourseTopic(String courseId, String topicName, String category) {
        Map<String, Object> topicProps = new HashMap<>();
        topicProps.put("name", topicName);
        topicProps.put("category", category != null ? category : "General");
        inMemoryEngine.mergeNode(topicName, "Topic", topicProps);
        inMemoryEngine.createRelationship(courseId, topicName, "COVERS_TOPIC", Collections.emptyMap());

        String cypher = "MATCH (c:Course {courseId: $courseId}) " +
                "MERGE (t:Topic {name: $topicName}) ON CREATE SET t.category = $category " +
                "MERGE (c)-[:COVERS_TOPIC]->(t);";
        runWrite(cypher, Map.of("courseId", courseId, "topicName", topicName, "category", category != null ? category : "General"));
    }

    public void mergeStudent(String studentRegNo, String firstName, String lastName, String deptName, int semesterNo, double cgpa) {
        Map<String, Object> props = new HashMap<>();
        props.put("regNo", studentRegNo);
        props.put("name", firstName + " " + lastName);
        props.put("department", deptName);
        props.put("semesterNo", semesterNo);
        props.put("cgpa", cgpa);

        inMemoryEngine.mergeNode(studentRegNo, "Student", props);
        if (deptName != null) {
            inMemoryEngine.createRelationship(studentRegNo, deptName, "MAJORS_IN", Collections.emptyMap());
        }

        String cypher = "MERGE (s:Student {regNo: $regNo}) " +
                "ON CREATE SET s.name = $name, s.department = $department, s.semesterNo = $semesterNo, s.cgpa = $cgpa " +
                "ON MATCH SET s.name = $name, s.department = $department " +
                "WITH s " +
                "MERGE (d:Department {name: $department}) " +
                "MERGE (s)-[:MAJORS_IN]->(d);";
        runWrite(cypher, props);
    }

    public void mergeCompletedCourse(String studentRegNo, String courseId, String grade) {
        Map<String, Object> props = new HashMap<>();
        props.put("grade", grade != null ? grade : "");
        inMemoryEngine.createRelationship(studentRegNo, courseId, "COMPLETED", props);

        String cypher = "MATCH (s:Student {regNo: $regNo}), (c:Course {courseId: $courseId}) " +
                "MERGE (s)-[r:COMPLETED]->(c) SET r.grade = $grade;";
        runWrite(cypher, Map.of("regNo", studentRegNo, "courseId", courseId, "grade", grade != null ? grade : ""));
    }

    public void mergeCurrentlyEnrolled(String studentRegNo, String courseId, Long semesterId) {
        Map<String, Object> props = new HashMap<>();
        props.put("semesterId", semesterId != null ? semesterId : 0L);
        inMemoryEngine.createRelationship(studentRegNo, courseId, "CURRENTLY_ENROLLED", props);

        String cypher = "MATCH (s:Student {regNo: $regNo}), (c:Course {courseId: $courseId}) " +
                "MERGE (s)-[r:CURRENTLY_ENROLLED]->(c) SET r.semesterId = $semesterId;";
        runWrite(cypher, Map.of("regNo", studentRegNo, "courseId", courseId, "semesterId", semesterId != null ? semesterId : 0L));
    }

    public Set<String> getPrerequisites(String courseId) {
        if (liveConnected && driver != null) {
            try (Session session = driver.session()) {
                String cypher = "MATCH (c:Course {courseId: $courseId})-[:REQUIRES_PREREQUISITE]->(p:Course) RETURN p.courseId AS prereqId;";
                List<Record> records = session.executeRead(tx -> tx.run(cypher, Map.of("courseId", courseId)).list());
                logCypher(cypher);
                return records.stream().map(r -> r.get("prereqId").asString()).collect(Collectors.toSet());
            } catch (Exception e) {
                log.warn("Live Neo4j getPrerequisites error: {}", e.getMessage());
            }
        }
        return inMemoryEngine.getPrerequisites(courseId);
    }

    public Set<String> getTopicsForCourse(String courseId) {
        if (liveConnected && driver != null) {
            try (Session session = driver.session()) {
                String cypher = "MATCH (c:Course {courseId: $courseId})-[:COVERS_TOPIC]->(t:Topic) RETURN t.name AS topicName;";
                List<Record> records = session.executeRead(tx -> tx.run(cypher, Map.of("courseId", courseId)).list());
                logCypher(cypher);
                return records.stream().map(r -> r.get("topicName").asString()).collect(Collectors.toSet());
            } catch (Exception e) {
                log.warn("Live Neo4j getTopicsForCourse error: {}", e.getMessage());
            }
        }
        return inMemoryEngine.getTopicsForCourse(courseId);
    }

    public List<String> getMatchingTopics(String courseId, List<String> interests) {
        if (interests == null || interests.isEmpty()) return Collections.emptyList();
        if (liveConnected && driver != null) {
            try (Session session = driver.session()) {
                String cypher = "MATCH (c:Course {courseId: $courseId})-[:COVERS_TOPIC]->(t:Topic) WHERE t.name IN $interests RETURN t.name AS matchedTopic;";
                List<Record> records = session.executeRead(tx -> tx.run(cypher, Map.of("courseId", courseId, "interests", interests)).list());
                logCypher(cypher);
                return records.stream().map(r -> r.get("matchedTopic").asString()).collect(Collectors.toList());
            } catch (Exception e) {
                log.warn("Live Neo4j getMatchingTopics error: {}", e.getMessage());
            }
        }
        return inMemoryEngine.getMatchingTopics(courseId, interests);
    }

    public GraphStats getStats() {
        if (liveConnected && driver != null) {
            try (Session session = driver.session()) {
                return session.executeRead(tx -> {
                    int totalNodes = tx.run("MATCH (n) RETURN count(n) AS cnt;").single().get("cnt").asInt();
                    int totalRels = tx.run("MATCH ()-[r]->() RETURN count(r) AS cnt;").single().get("cnt").asInt();
                    int courseNodes = tx.run("MATCH (c:Course) RETURN count(c) AS cnt;").single().get("cnt").asInt();
                    int studentNodes = tx.run("MATCH (s:Student) RETURN count(s) AS cnt;").single().get("cnt").asInt();
                    int topicNodes = tx.run("MATCH (t:Topic) RETURN count(t) AS cnt;").single().get("cnt").asInt();
                    int deptNodes = tx.run("MATCH (d:Department) RETURN count(d) AS cnt;").single().get("cnt").asInt();
                    int prereqRels = tx.run("MATCH ()-[r:PREREQUISITE_OF]->() RETURN count(r) AS cnt;").single().get("cnt").asInt();
                    int topicRels = tx.run("MATCH ()-[r:COVERS_TOPIC]->() RETURN count(r) AS cnt;").single().get("cnt").asInt();
                    int enrollRels = tx.run("MATCH ()-[r:COMPLETED|CURRENTLY_ENROLLED]->() RETURN count(r) AS cnt;").single().get("cnt").asInt();

                    Map<String, Integer> labelCounts = Map.of(
                            "Course", courseNodes,
                            "Student", studentNodes,
                            "Topic", topicNodes,
                            "Department", deptNodes
                    );

                    Map<String, Integer> relCounts = Map.of(
                            "PREREQUISITE_OF", prereqRels,
                            "COVERS_TOPIC", topicRels,
                            "COMPLETED_OR_ENROLLED", enrollRels
                    );

                    return GraphStats.builder()
                            .engineMode(engineMode)
                            .connected(true)
                            .boltUri(neo4jUri)
                            .totalNodes(totalNodes)
                            .totalRelationships(totalRels)
                            .courseNodes(courseNodes)
                            .studentNodes(studentNodes)
                            .topicNodes(topicNodes)
                            .departmentNodes(deptNodes)
                            .prerequisiteRelationships(prereqRels)
                            .topicRelationships(topicRels)
                            .enrollmentRelationships(enrollRels)
                            .labelCounts(labelCounts)
                            .relationshipCounts(relCounts)
                            .build();
                });
            } catch (Exception e) {
                log.warn("Live Neo4j getStats query error: {}", e.getMessage());
            }
        }

        GraphStats stats = inMemoryEngine.getStats();
        stats.setEngineMode(engineMode);
        stats.setConnected(liveConnected);
        stats.setBoltUri(liveConnected ? neo4jUri : "in-memory://neo4j.ucrs.internal");
        return stats;
    }

    public List<String> getExecutedCypherQueries() {
        List<String> combined = new ArrayList<>();
        combined.addAll(liveCypherHistory);
        combined.addAll(inMemoryEngine.getCypherHistory());
        return combined.stream().distinct().limit(35).collect(Collectors.toList());
    }

    private void logCypher(String cypher) {
        if (liveCypherHistory.size() > 50) liveCypherHistory.remove(0);
        liveCypherHistory.add(cypher);
    }
}
