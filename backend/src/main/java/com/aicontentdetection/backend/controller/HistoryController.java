package com.aicontentdetection.backend.controller;

import com.aicontentdetection.backend.dto.DetectionHistoryResponseDto;
import com.aicontentdetection.backend.service.DetectionRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HistoryController {

    private final DetectionRecordService detectionRecordService;

    @GetMapping("/history")
    public DetectionHistoryResponseDto getHistory(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return detectionRecordService.getHistory(page, limit);
    }
}
