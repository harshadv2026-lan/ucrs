package com.ucrs.exception;

import lombok.Getter;

@Getter
public class DataDependencyException extends RuntimeException {
    private final String entityType;
    private final Object entityId;

    public DataDependencyException(String message) {
        super(message);
        this.entityType = null;
        this.entityId = null;
    }

    public DataDependencyException(String entityType, Object entityId, String message) {
        super(message);
        this.entityType = entityType;
        this.entityId = entityId;
    }
}
