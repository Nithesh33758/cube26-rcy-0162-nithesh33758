package com.cube.buildathon.recoverymanager.backend.controller;

import com.cube.buildathon.recoverymanager.backend.dto.AnalysisResultResponse;
import com.cube.buildathon.recoverymanager.backend.dto.AnalysisStatusResponse;
import com.cube.buildathon.recoverymanager.backend.dto.UploadResponse;
import com.cube.buildathon.recoverymanager.backend.service.AnalysisService;
import com.cube.buildathon.recoverymanager.backend.service.CsvUploadService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {
    private final CsvUploadService csvUploadService;
    private final AnalysisService analysisService;

    public AnalysisController(CsvUploadService csvUploadService, AnalysisService analysisService) {
        this.csvUploadService = csvUploadService;
        this.analysisService = analysisService;
    }

    @PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> upload(@RequestPart("file") MultipartFile file) {
        UploadResponse response = csvUploadService.upload(file);
        if (!response.headersValid()) {
            return ResponseEntity.unprocessableEntity().body(response);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{analysisId}/start")
    public AnalysisStatusResponse start(@PathVariable("analysisId") String analysisId) {
        return analysisService.startAnalysis(analysisId);
    }

    @GetMapping("/{analysisId}/status")
    public AnalysisStatusResponse status(@PathVariable("analysisId") String analysisId) {
        return analysisService.getStatus(analysisId);
    }

    @GetMapping("/{analysisId}")
    public AnalysisResultResponse getAnalysis(@PathVariable("analysisId") String analysisId) {
        return analysisService.getAnalysis(analysisId);
    }
}