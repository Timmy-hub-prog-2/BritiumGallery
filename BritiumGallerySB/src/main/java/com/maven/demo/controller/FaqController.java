package com.maven.demo.controller;

import com.maven.demo.dto.FaqDto;
import com.maven.demo.service.FaqService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faqs")
@CrossOrigin(origins = "http://localhost:4200")
public class FaqController {

    private final FaqService faqService;

    public FaqController(FaqService faqService) {
        this.faqService = faqService;
    }

    @GetMapping
    public ResponseEntity<List<FaqDto>> getFaqs() {
        return ResponseEntity.ok(faqService.getAllActiveFaqs());
    }
    @PostMapping
    public ResponseEntity<FaqDto> create(@RequestBody FaqDto faqDto) {
        return ResponseEntity.ok(faqService.createFaq(faqDto));
    }


    @PutMapping("/{id}")
    public ResponseEntity<FaqDto> update(@PathVariable Long id, @RequestBody FaqDto faqDto) {
        return ResponseEntity.ok(faqService.updateFaq(id, faqDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        faqService.deleteFaq(id);
        return ResponseEntity.noContent().build();
    }
}