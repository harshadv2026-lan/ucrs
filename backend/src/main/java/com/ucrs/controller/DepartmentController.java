package com.ucrs.controller;

import com.ucrs.dto.ApiResponse;
import com.ucrs.model.Department;
import com.ucrs.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Department>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Department>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Department>> create(@RequestBody Department department) {
        Department created = departmentService.create(department);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "Department created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Department>> update(@PathVariable Long id, @RequestBody Department department) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.update(id, department), "Department updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        departmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Department deleted"));
    }
}
