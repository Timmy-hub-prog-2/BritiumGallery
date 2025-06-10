//package com.maven.demo.controller;
//
//import com.maven.demo.dto.PeopleDTO;
//import com.maven.demo.service.PeopleService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//
//@CrossOrigin(origins = "http://localhost:4200")
//@RestController
//@RequestMapping("/api/people")
//@RequiredArgsConstructor
//public class PeopleController {
//
//    private final PeopleService peopleService;
//
//    @PostMapping
//    public PeopleDTO createPerson(@RequestBody PeopleDTO dto) {
//        return peopleService.savePerson(dto);
//    }
//
//    @GetMapping("/admins")
//    public List<PeopleDTO> getAdmins() {
//        return peopleService.getAllAdmins();
//    }
//
//    @GetMapping("/customers")
//    public List<PeopleDTO> getCustomers() {
//        return peopleService.getAllCustomers();
//    }
//}
