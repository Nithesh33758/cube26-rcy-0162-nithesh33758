package com.cube.buildathon.recoverymanager.backend.controller;

import com.cube.buildathon.recoverymanager.backend.dto.ReimbursementImportResponse;
import com.cube.buildathon.recoverymanager.backend.service.ReimbursementImportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/reimbursements")
public class ReimbursementController {
    private final ReimbursementImportService reimbursementImportService;

    public ReimbursementController(ReimbursementImportService reimbursementImportService) {
        this.reimbursementImportService = reimbursementImportService;
    }

    @PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReimbursementImportResponse> upload(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reimbursementImportService.upload(file));
    }
}