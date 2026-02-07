package com.cassab.demo.dto;

import java.util.List;

public record ConvinteRequestDTO(
    String nome,
    String cpf,
    String telefone,
    String instagram,
    String placaCarro,
    List<AcompanhanteDTO> acompanhantes 
) {}
