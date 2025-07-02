package com.maven.demo.service;

import com.maven.demo.dto.FaqDto;
import com.maven.demo.entity.FaqEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.FaqRepository;
import com.maven.demo.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FaqService {

    private final FaqRepository faqRepository;
    private final ModelMapper modelMapper;

    @Autowired
    private UserRepository userRepository;

    public FaqService(FaqRepository faqRepository, ModelMapper modelMapper) {
        this.faqRepository = faqRepository;
        this.modelMapper = modelMapper;
    }

    public List<FaqDto> getAllActiveFaqs() {
        return faqRepository.findByActiveTrue()
                .stream()
                .map(faq -> modelMapper.map(faq, FaqDto.class))
                .collect(Collectors.toList());
    }

    public FaqDto createFaq(FaqDto faqDto) {
        UserEntity admin = userRepository.findById(faqDto.getCreatedById())
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        FaqEntity faq = FaqEntity.builder()
                .question(faqDto.getQuestion())
                .answer(faqDto.getAnswer())
                .category(faqDto.getCategory()) // ✅
                .active(true)
                .createdBy(admin)
                .build();

        return modelMapper.map(faqRepository.save(faq), FaqDto.class);
    }

    public FaqDto updateFaq(Long id, FaqDto faqDto) {
        FaqEntity faq = faqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ not found"));

        faq.setQuestion(faqDto.getQuestion());
        faq.setAnswer(faqDto.getAnswer());
        faq.setCategory(faqDto.getCategory()); // ✅
        faq.setActive(faqDto.isActive());

        return modelMapper.map(faqRepository.save(faq), FaqDto.class);
    }

    public void deleteFaq(Long id) {
        faqRepository.deleteById(id);
    }
}