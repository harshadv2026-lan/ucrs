package com.ucrs.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphRelationship {
    private String id;
    private String startNodeId;
    private String endNodeId;
    private String type;
    @Builder.Default
    private Map<String, Object> properties = new HashMap<>();

    public void setProperty(String key, Object value) {
        if (properties == null) properties = new HashMap<>();
        properties.put(key, value);
    }

    public Object getProperty(String key) {
        return properties != null ? properties.get(key) : null;
    }
}
