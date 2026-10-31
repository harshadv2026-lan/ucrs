package com.ucrs.controller;

import com.ucrs.dto.ApiResponse;
import com.ucrs.dto.StudentRecommendationResponse;
import com.ucrs.dto.TopicInterestDTO;
import com.ucrs.graph.GraphStats;
import com.ucrs.graph.Neo4jGraphService;
import com.ucrs.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final Neo4jGraphService neo4jGraphService;

    /**
     * Get personalized Neo4j course recommendations for a student.
     * Evaluates completed courses, prerequisites graph, credit limits, department, and topic interests.
     */
    @GetMapping("/{studentRegNo}")
    public ResponseEntity<ApiResponse<StudentRecommendationResponse>> getRecommendations(
            @PathVariable String studentRegNo,
            @RequestParam(required = false) Long semesterId,
            @RequestParam(required = false) List<String> interests,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {

        if ("STUDENT".equalsIgnoreCase(userRole) && userId != null && !userId.trim().isEmpty()) {
            if (!studentRegNo.equalsIgnoreCase(userId.trim())) {
                throw new SecurityException("Access denied: You can only view course recommendations for your own account");
            }
        }

        StudentRecommendationResponse response = recommendationService.getRecommendations(studentRegNo, semesterId, interests);
        return ResponseEntity.ok(ApiResponse.success(
                response,
                "Personalized course recommendations generated successfully via Neo4j graph engine"));
    }

    /**
     * Get the catalog of academic topic interests available for selection.
     */
    @GetMapping("/topics")
    public ResponseEntity<ApiResponse<List<TopicInterestDTO>>> getTopics() {
        List<TopicInterestDTO> topics = recommendationService.getTopicCatalog();
        return ResponseEntity.ok(ApiResponse.success(topics));
    }

    /**
     * Sync relational database data into Neo4j graph nodes and relationships.
     */
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncGraph(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        // Allow admin or student/faculty in demo mode
        recommendationService.syncGraphFromDatabase();
        GraphStats stats = neo4jGraphService.getStats();
        return ResponseEntity.ok(ApiResponse.success(
                Map.of(
                        "status", "SYNCHRONIZED",
                        "engineMode", stats.getEngineMode(),
                        "nodeCount", stats.getTotalNodes(),
                        "relationshipCount", stats.getTotalRelationships(),
                        "stats", stats
                ),
                "Neo4j graph synchronized successfully from relational database"));
    }

    /**
     * Get current status and graph engine statistics.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<GraphStats>> getGraphStatus() {
        GraphStats stats = neo4jGraphService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Neo4j graph engine status retrieved"));
    }
}
