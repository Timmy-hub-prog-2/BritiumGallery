package com.maven.demo.service;

import com.maven.demo.dto.PeopleDTO;
import com.maven.demo.dto.UserDTO;

import java.util.List;

public interface PeopleService {
    List<UserDTO> getAllAdmins();
    List<UserDTO> getAllCustomers();
    UserDTO savePerson(UserDTO dto);
}

