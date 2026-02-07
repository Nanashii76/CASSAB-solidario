package com.cassab.demo.controller;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;

import com.cassab.demo.dto.ConvinteRequestDTO;
import com.cassab.demo.model.Acompanhante;
import com.cassab.demo.model.Convite;
import com.cassab.demo.repository.ConviteRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@Controller
@RequestMapping("/api/convites")
@CrossOrigin(origins = "*")
public class ConviteController {
    
    @Autowired
    private ConviteRepository conviteRepository;

    @PostMapping("/criar")
    public ResponseEntity<Convite> criarConvite(@RequestBody ConvinteRequestDTO dados) {
        Convite novoConvite = new Convite();
        novoConvite.setNome(dados.nome());
        novoConvite.setCpf(dados.cpf());
        novoConvite.setPlacaCarro(dados.placaCarro());
        novoConvite.setTelefone(dados.telefone());
        novoConvite.setInstagram(dados.instagram());

        if (dados.acompanhantes() != null) {
            List<Acompanhante> listaAcompanhantes = dados.acompanhantes().stream().map(dto -> {
                Acompanhante a = new Acompanhante();
                a.setNome(dto.nome());
                a.setSobrenome(dto.sobrenome());
                a.setConvite(novoConvite);
                return a;
            }).collect(Collectors.toList());

            novoConvite.setAcompanhantes(listaAcompanhantes);
        }

        // Gerar código
        String codigoGerado = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        novoConvite.setCodigo(codigoGerado);
    
        Convite conviteSalvo = conviteRepository.save(novoConvite);
        return ResponseEntity.ok(conviteSalvo);
    }
    

}
