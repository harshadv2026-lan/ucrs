package com.ucrs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopicInterestDTO {
    private String name;
    private String category;
    private String icon;
    private String description;
    private int courseCount;
}
