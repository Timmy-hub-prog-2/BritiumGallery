//package com.maven.demo.service;
//
//import com.maven.demo.dto.PeopleDTO;
//import com.maven.demo.dto.UserDTO;
//import com.maven.demo.entity.PeopleEntity;
//import com.maven.demo.entity.RoleEntity;
//import com.maven.demo.repository.PeopleRepository;
//import com.maven.demo.repository.RoleRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//
//import java.util.List;
//import java.util.stream.Collectors;
//
//@Service
//@RequiredArgsConstructor
//public class PeopleServiceImpl implements PeopleService {
//
//    private final PeopleRepository peopleRepository;
//    private final RoleRepository roleRepository;
//
//    @Override
//    public List<UserDTO> getAllAdmins() {
//        System.out.println("add admins");
//        return peopleRepository.findByRole_Id(2L).stream()
//                .map(this::toDTO)
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    public List<UserDTO> getAllCustomers() {
//        return peopleRepository.findByRole_Id(3L).stream()
//                .map(this::toDTO)
//                .collect(Collectors.toList());
//    }
//
//    @Override
//    public PeopleDTO savePerson(PeopleDTO dto) {
//        RoleEntity role = roleRepository.findById(dto.getRoleId()).orElseThrow();
//        PeopleEntity entity = PeopleEntity.builder()
//                .name(dto.getName())
//                .email(dto.getEmail())
//                .password(dto.getPassword())
//                .status(dto.getStatus())
//                .gender(dto.getGender())
//                .address(dto.getAddress())
//                .phNumber(dto.getPhNumber())
//                .role(role)
//                .build();
//        return toDTO(peopleRepository.save(entity));
//    }
//    private PeopleDTO toDTO(PeopleEntity entity) {
//        return PeopleDTO.builder()
//                .id(entity.getId())
//                .name(entity.getName())
//                .email(entity.getEmail())
//                .password(entity.getPassword())
//                .status(entity.getStatus())
//                .gender(entity.getGender())
//                .address(entity.getAddress())
//                .phNumber(entity.getPhNumber())
//                .roleId(entity.getRole().getId())
//                .roleName(entity.getRole().getType())
//                .build();
//    }
//}