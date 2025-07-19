package com.maven.demo.controller;

import com.maven.demo.dto.RoleDto;
import com.maven.demo.entity.RoleEntity;
import com.maven.demo.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "http://localhost:4200")
public class RoleController {

    @Autowired
    private RoleRepository roleRepository;

    @GetMapping
    public List<RoleDto> getAllRoles() {
        return roleRepository.findAll(Sort.by("type"))
                .stream()
                .filter(role -> !role.getType().equalsIgnoreCase("Customer"))
                .filter(role -> !role.getType().equalsIgnoreCase("Super Admin"))
                .map(role -> new RoleDto(role.getId(), role.getType()))
                .collect(Collectors.toList());
    }
    @GetMapping("/except-customer")
    public List<RoleDto> getRolesExceptCustomer() {
        // Fetch all roles from the repository
        return roleRepository.findAll(Sort.by("type"))
                .stream()
                // Filter out 'Customer' role
                .filter(role -> !role.getType().equalsIgnoreCase("Customer"))
                .map(role -> new RoleDto(role.getId(), role.getType()))
                .collect(Collectors.toList());
    }
}
