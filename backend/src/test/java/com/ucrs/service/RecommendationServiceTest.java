package com.ucrs.service;

import com.ucrs.dto.CourseRecommendationDTO;
import com.ucrs.dto.IneligibleCourseDTO;
import com.ucrs.dto.StudentRecommendationResponse;
import com.ucrs.graph.GraphStats;
import com.ucrs.graph.Neo4jGraphService;
import org.junit.jupiter.api.BeforeEach;
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
public class RecommendationServiceTest {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private Neo4jGraphService neo4jGraphService;

    @BeforeEach
    public void setUp() {
        recommendationService.syncGraphFromDatabase();
    }

    @Test
    public void testGraphSyncAndStats() {
        GraphStats stats = neo4jGraphService.getStats();
        assertNotNull(stats);
        assertTrue(stats.getTotalNodes() > 0, "Graph should contain nodes after sync");
        assertTrue(stats.getTotalRelationships() > 0, "Graph should contain relationships after sync");
        assertNotNull(stats.getEngineMode());
        assertFalse(neo4jGraphService.getExecutedCypherQueries().isEmpty(), "Cypher queries should be logged");
    }

    @Test
    public void testRecommendationsForStudentWithPrerequisitesAndExclusions() {
        // Student 2021CS001 has completed CS101, CS201 and is registered for CS301, CS401
        StudentRecommendationResponse response = recommendationService.getRecommendations("2021CS001", null, null);

        assertNotNull(response);
        assertEquals("2021CS001", response.getStudentRegNo());
        assertEquals("Computer Science", response.getDepartmentName());
        assertTrue(response.getRemainingCredits() > 0);
        assertTrue(response.getMaxSemesterCredits() >= 20);

        // 1. Check exclusions from eligible recommendations:
        // Already completed courses must NOT be recommended
        for (CourseRecommendationDTO rec : response.getRecommendations()) {
            assertNotEquals("CS101", rec.getCourseId(), "CS101 is completed and should not be recommended");
            assertNotEquals("CS201", rec.getCourseId(), "CS201 is completed and should not be recommended");
            assertNotEquals("CS301", rec.getCourseId(), "CS301 is currently enrolled and should not be recommended");
            assertNotEquals("CS401", rec.getCourseId(), "CS401 is currently enrolled and should not be recommended");
            // Must have positive match score and explainable reasons
            assertTrue(rec.getMatchScore() > 0, "Match score must be positive");
            assertNotNull(rec.getReasons());
            assertFalse(rec.getReasons().isEmpty(), "Recommendations must have explainable reasons");
        }

        // 2. Check ineligible courses categorization
        List<IneligibleCourseDTO> ineligible = response.getIneligibleCourses();
        assertFalse(ineligible.isEmpty(), "Should have categorized ineligible courses");

        // CS501 requires CS401 which is not yet completed (it's currently enrolled)
        boolean hasCs501PrereqBlock = ineligible.stream().anyMatch(c ->
                "CS501".equals(c.getCourseId()) &&
                "UNMET_PREREQUISITES".equals(c.getReasonCode()) &&
                c.getUnmetPrerequisites().stream().anyMatch(p -> p.contains("CS401"))
        );
        assertTrue(hasCs501PrereqBlock, "CS501 must be flagged as ineligible due to unmet CS401 prerequisite");

        // Check already completed status in ineligible list
        boolean hasCompletedEntry = ineligible.stream().anyMatch(c ->
                "ALREADY_COMPLETED".equals(c.getReasonCode())
        );
        assertTrue(hasCompletedEntry, "Should contain ALREADY_COMPLETED records in ineligible list");

        // Check currently enrolled status in ineligible list
        boolean hasEnrolledEntry = ineligible.stream().anyMatch(c ->
                "ALREADY_ENROLLED".equals(c.getReasonCode())
        );
        assertTrue(hasEnrolledEntry, "Should contain ALREADY_ENROLLED records in ineligible list");
    }

    @Test
    public void testInterestDrivenRanking() {
        // Request recommendations with interest "Web & Full-Stack Development"
        List<String> webInterest = List.of("Web & Full-Stack Development");
        StudentRecommendationResponse response = recommendationService.getRecommendations("2021CS001", null, webInterest);

        assertNotNull(response.getRecommendations());
        assertFalse(response.getRecommendations().isEmpty());

        // Find IT101 (which covers Web & Full-Stack Development)
        CourseRecommendationDTO it101Rec = response.getRecommendations().stream()
                .filter(r -> "IT101".equals(r.getCourseId()))
                .findFirst()
                .orElse(null);

        assertNotNull(it101Rec, "IT101 should be recommended as prerequisites are satisfied");
        assertTrue(it101Rec.getMatchedTopics().contains("Web & Full-Stack Development"),
                "IT101 matched topics should include Web & Full-Stack Development");

        // Reasons must explain topic match
        boolean explainsTopic = it101Rec.getReasons().stream()
                .anyMatch(r -> r.toLowerCase().contains("interest") || r.toLowerCase().contains("web"));
        assertTrue(explainsTopic, "Recommendation explanation should cite the topic interest");
    }

    @Test
    public void testTopicCatalogNotNull() {
        assertNotNull(recommendationService.getTopicCatalog());
        assertFalse(recommendationService.getTopicCatalog().isEmpty(), "Topic catalog should contain topics");
    }
}
