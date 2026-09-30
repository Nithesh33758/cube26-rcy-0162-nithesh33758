package com.cube.buildathon.recoverymanager.backend.controller;

import com.cube.buildathon.recoverymanager.backend.dto.EvidenceImportResponse;
import com.cube.buildathon.recoverymanager.backend.enums.EvidenceSourceType;
import com.cube.buildathon.recoverymanager.backend.service.EvidenceImportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/evidence")
public class EvidenceImportController {
    private final EvidenceImportService evidenceImportService;

    public EvidenceImportController(EvidenceImportService evidenceImportService) {
        this.evidenceImportService = evidenceImportService;
    }

    @PostMapping(path = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EvidenceImportResponse> importEvidence(
            @RequestPart("file") MultipartFile file,
            @RequestParam("sourceType") EvidenceSourceType sourceType
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(evidenceImportService.importCsv(file, sourceType));
    }
}