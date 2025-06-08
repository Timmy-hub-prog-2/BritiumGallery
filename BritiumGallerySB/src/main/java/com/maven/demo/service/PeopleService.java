package com.maven.demo.service;

import com.maven.demo.dto.PeopleDTO;

import java.util.List;

public interface PeopleService {
    List<PeopleDTO> getAllAdmins();
    List<PeopleDTO> getAllCustomers();
    PeopleDTO savePerson(PeopleDTO dto);
}

