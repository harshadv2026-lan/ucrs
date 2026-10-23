package com.ucrs.model;

import java.io.Serializable;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class PrerequisiteId implements Serializable {
    private String courseId;
    private String prereqCourseId;
}
