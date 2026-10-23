package com.ucrs.controller;

import com.ucrs.dto.ApiResponse;
import com.ucrs.dto.CourseOfferingDTO;
import com.ucrs.model.Faculty;
import com.ucrs.service.FacultyService;
import com.ucrs.service.OfferingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/faculty")
@RequiredArgsConstructor
public class FacultyController {

    private final FacultyService facultyService;
    private final OfferingService offeringService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Faculty>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(facultyService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(@PathVariable Long id) {
        Faculty faculty = facultyService.findById(id);
        List<CourseOfferingDTO> offerings = offeringService.findAll(null, null, id)
                .stream()
                .filter(o -> o.getFacultyId() != null && o.getFacultyId().equals(id))
                .toList();
        Map<String, Object> result = new HashMap<>();
        result.put("faculty", faculty);
        result.put("offerings", offerings);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Faculty>> create(@RequestBody Faculty faculty) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(facultyService.create(faculty), "Faculty created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Faculty>> update(@PathVariable Long id, @RequestBody Faculty faculty) {
        return ResponseEntity.ok(ApiResponse.success(facultyService.update(id, faculty), "Faculty updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only ADMIN can delete faculty"));
        }
        facultyService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Faculty deleted"));
    }
}
