package com.ucrs.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphStats {
    private String engineMode; // "LIVE_NEO4J" or "EMBEDDED_GRAPH_ENGINE"
    private boolean connected;
    private String boltUri;
    private int totalNodes;
    private int totalRelationships;
    private int courseNodes;
    private int studentNodes;
    private int topicNodes;
    private int departmentNodes;
    private int prerequisiteRelationships;
    private int topicRelationships;
    private int enrollmentRelationships;
    private Map<String, Integer> labelCounts;
    private Map<String, Integer> relationshipCounts;
}
