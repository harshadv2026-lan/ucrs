package com.ucrs.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphNode {
    private String id;
    @Builder.Default
    private Set<String> labels = new HashSet<>();
    @Builder.Default
    private Map<String, Object> properties = new HashMap<>();

    public void addLabel(String label) {
        if (labels == null) labels = new HashSet<>();
        labels.add(label);
    }

    public void setProperty(String key, Object value) {
        if (properties == null) properties = new HashMap<>();
        properties.put(key, value);
    }

    public Object getProperty(String key) {
        return properties != null ? properties.get(key) : null;
    }

    public String getStringProperty(String key, String defaultVal) {
        Object val = getProperty(key);
        return val != null ? String.valueOf(val) : defaultVal;
    }

    public Integer getIntProperty(String key, Integer defaultVal) {
        Object val = getProperty(key);
        if (val instanceof Number) return ((Number) val).intValue();
        if (val != null) {
            try {
                return Integer.parseInt(val.toString());
            } catch (Exception ignored) {}
        }
        return defaultVal;
    }
}
