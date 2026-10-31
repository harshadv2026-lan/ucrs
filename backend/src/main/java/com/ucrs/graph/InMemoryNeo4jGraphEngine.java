package com.ucrs.graph;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

/**
 * In-Memory Neo4j Property Graph Engine.
 * Provides high-performance graph traversals for course prerequisites,
 * department relationships, topic interest alignments, and student history.
 * Logs corresponding Neo4j Cypher queries for transparency and auditability.
 */
@Slf4j
@Component
public class InMemoryNeo4jGraphEngine {

    private final Map<String, GraphNode> nodes = new ConcurrentHashMap<>();
    private final List<GraphRelationship> relationships = new CopyOnWriteArrayList<>();
    private final List<String> cypherHistory = new CopyOnWriteArrayList<>();

    public synchronized void clear() {
        nodes.clear();
        relationships.clear();
        logCypher("// Resetting graph database state\nMATCH (n) DETACH DELETE n;");
    }

    public synchronized GraphNode mergeNode(String id, String label, Map<String, Object> properties) {
        GraphNode node = nodes.computeIfAbsent(id, k -> {
            GraphNode n = new GraphNode();
            n.setId(k);
            return n;
        });
        if (label != null) {
            node.addLabel(label);
        }
        if (properties != null) {
            properties.forEach(node::setProperty);
        }

        logCypher(String.format("MERGE (n:%s {id: '%s'}) SET n += %s;",
                label != null ? label : "Entity", id, formatProperties(properties)));
        return node;
    }

    public synchronized GraphRelationship createRelationship(String startId, String endId, String type, Map<String, Object> props) {
        // Prevent duplicate relationships of same type between same nodes
        for (GraphRelationship existing : relationships) {
            if (existing.getStartNodeId().equals(startId) &&
                existing.getEndNodeId().equals(endId) &&
                existing.getType().equals(type)) {
                if (props != null) props.forEach(existing::setProperty);
                return existing;
            }
        }

        String relId = startId + "-" + type + "->" + endId;
        GraphRelationship rel = GraphRelationship.builder()
                .id(relId)
                .startNodeId(startId)
                .endNodeId(endId)
                .type(type)
                .properties(props != null ? new HashMap<>(props) : new HashMap<>())
                .build();
        relationships.add(rel);

        logCypher(String.format("MATCH (a {id: '%s'}), (b {id: '%s'}) MERGE (a)-[r:%s]->(b);",
                startId, endId, type));
        return rel;
    }

    public Optional<GraphNode> getNode(String id) {
        return Optional.ofNullable(nodes.get(id));
    }

    public synchronized void deleteNode(String id) {
        nodes.remove(id);
        relationships.removeIf(r -> r.getStartNodeId().equals(id) || r.getEndNodeId().equals(id));
        logCypher(String.format("MATCH (n {id: '%s'}) DETACH DELETE n;", id));
    }

    public List<GraphNode> getNodesByLabel(String label) {
        return nodes.values().stream()
                .filter(n -> n.getLabels().contains(label))
                .collect(Collectors.toList());
    }

    /**
     * Finds direct prerequisites for a course:
     * Cypher: MATCH (c:Course {id: $courseId})-[:REQUIRES_PREREQUISITE]->(p:Course) RETURN p.id
     */
    public Set<String> getPrerequisites(String courseId) {
        logCypher(String.format("MATCH (c:Course {id: '%s'})-[:REQUIRES_PREREQUISITE]->(p:Course) RETURN p.id;", courseId));
        return relationships.stream()
                .filter(r -> "REQUIRES_PREREQUISITE".equals(r.getType()) && r.getStartNodeId().equals(courseId))
                .map(GraphRelationship::getEndNodeId)
                .collect(Collectors.toSet());
    }

    /**
     * Recursively traverses transitive prerequisites for a course:
     * Cypher: MATCH (c:Course {id: $courseId})-[:REQUIRES_PREREQUISITE*]->(p:Course) RETURN p.id
     */
    public Set<String> getAllTransitivePrerequisites(String courseId) {
        logCypher(String.format("MATCH (c:Course {id: '%s'})-[:REQUIRES_PREREQUISITE*]->(p:Course) RETURN DISTINCT p.id;", courseId));
        Set<String> all = new LinkedHashSet<>();
        collectTransitive(courseId, all);
        return all;
    }

    private void collectTransitive(String current, Set<String> visited) {
        Set<String> direct = getPrerequisites(current);
        for (String p : direct) {
            if (visited.add(p)) {
                collectTransitive(p, visited);
            }
        }
    }

    /**
     * Gets topics covered by a course:
     * Cypher: MATCH (c:Course {id: $courseId})-[:COVERS_TOPIC]->(t:Topic) RETURN t.id
     */
    public Set<String> getTopicsForCourse(String courseId) {
        logCypher(String.format("MATCH (c:Course {id: '%s'})-[:COVERS_TOPIC]->(t:Topic) RETURN t.id;", courseId));
        return relationships.stream()
                .filter(r -> "COVERS_TOPIC".equals(r.getType()) && r.getStartNodeId().equals(courseId))
                .map(GraphRelationship::getEndNodeId)
                .collect(Collectors.toSet());
    }

    /**
     * Returns matching topics between a course and student's selected interests:
     * Cypher: MATCH (c:Course {id: $courseId})-[:COVERS_TOPIC]->(t:Topic) WHERE t.id IN $interests RETURN t.id
     */
    public List<String> getMatchingTopics(String courseId, List<String> interests) {
        if (interests == null || interests.isEmpty()) return Collections.emptyList();
        Set<String> courseTopics = getTopicsForCourse(courseId);
        return interests.stream()
                .filter(courseTopics::contains)
                .collect(Collectors.toList());
    }

    /**
     * Gets courses offered by a department:
     * Cypher: MATCH (c:Course)-[:OFFERED_BY]->(d:Department {name: $deptName}) RETURN c.id
     */
    public Set<String> getCoursesByDepartment(String deptName) {
        logCypher(String.format("MATCH (c:Course)-[:OFFERED_BY]->(d:Department {name: '%s'}) RETURN c.id;", deptName));
        return relationships.stream()
                .filter(r -> "OFFERED_BY".equals(r.getType()) && deptName.equalsIgnoreCase(r.getEndNodeId()))
                .map(GraphRelationship::getStartNodeId)
                .collect(Collectors.toSet());
    }

    /**
     * Gets courses completed by a student:
     * Cypher: MATCH (s:Student {id: $regNo})-[r:COMPLETED]->(c:Course) RETURN c.id, r.grade
     */
    public Map<String, String> getCompletedCourses(String studentRegNo) {
        logCypher(String.format("MATCH (s:Student {id: '%s'})-[r:COMPLETED]->(c:Course) RETURN c.id, r.grade;", studentRegNo));
        Map<String, String> completed = new HashMap<>();
        relationships.stream()
                .filter(r -> "COMPLETED".equals(r.getType()) && r.getStartNodeId().equals(studentRegNo))
                .forEach(r -> {
                    String grade = r.getProperty("grade") != null ? r.getProperty("grade").toString() : "";
                    completed.put(r.getEndNodeId(), grade);
                });
        return completed;
    }

    public GraphStats getStats() {
        Map<String, Integer> labelCounts = new HashMap<>();
        for (GraphNode node : nodes.values()) {
            for (String label : node.getLabels()) {
                labelCounts.put(label, labelCounts.getOrDefault(label, 0) + 1);
            }
        }

        Map<String, Integer> relCounts = new HashMap<>();
        for (GraphRelationship rel : relationships) {
            relCounts.put(rel.getType(), relCounts.getOrDefault(rel.getType(), 0) + 1);
        }

        return GraphStats.builder()
                .engineMode("EMBEDDED_GRAPH_ENGINE")
                .connected(true)
                .boltUri("in-memory://neo4j.ucrs.internal")
                .totalNodes(nodes.size())
                .totalRelationships(relationships.size())
                .courseNodes(labelCounts.getOrDefault("Course", 0))
                .studentNodes(labelCounts.getOrDefault("Student", 0))
                .topicNodes(labelCounts.getOrDefault("Topic", 0))
                .departmentNodes(labelCounts.getOrDefault("Department", 0))
                .prerequisiteRelationships(relCounts.getOrDefault("REQUIRES_PREREQUISITE", 0))
                .topicRelationships(relCounts.getOrDefault("COVERS_TOPIC", 0))
                .enrollmentRelationships(relCounts.getOrDefault("COMPLETED", 0) + relCounts.getOrDefault("CURRENTLY_ENROLLED", 0))
                .labelCounts(labelCounts)
                .relationshipCounts(relCounts)
                .build();
    }

    private void logCypher(String cypher) {
        if (cypherHistory.size() > 50) {
            cypherHistory.remove(0);
        }
        cypherHistory.add(cypher);
    }

    public List<String> getCypherHistory() {
        return Collections.unmodifiableList(cypherHistory);
    }

    private String formatProperties(Map<String, Object> props) {
        if (props == null || props.isEmpty()) return "{}";
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : props.entrySet()) {
            if (!first) sb.append(", ");
            first = false;
            sb.append(e.getKey()).append(": ");
            if (e.getValue() instanceof Number || e.getValue() instanceof Boolean) {
                sb.append(e.getValue());
            } else {
                sb.append("'").append(e.getValue()).append("'");
            }
        }
        sb.append("}");
        return sb.toString();
    }
}
