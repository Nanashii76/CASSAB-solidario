package com.cassab.demo.dto;

import java.util.List;

public record ConvinteRequestDTO(
    String nome,
    String cpf,
    String email,
    String telefone,
    String instagram,
    List<AcompanhanteDTO> acompanhantes 
) {}
