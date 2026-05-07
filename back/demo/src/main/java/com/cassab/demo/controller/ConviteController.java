package com.cassab.demo.controller;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import java.util.Optional;

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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;


@Controller
@RequestMapping("/api/convites")
@CrossOrigin(origins = "*")
public class ConviteController {
    
    @Autowired
    private ConviteRepository conviteRepository;

    // Removido: não usar novo arquivo de repositório

    @GetMapping
    public ResponseEntity<List<Convite>> listarTodos() {
        return ResponseEntity.ok(conviteRepository.findAll());  
    }
    
    @PostMapping("/criar")
    public ResponseEntity<?> criarConvite(@RequestBody ConvinteRequestDTO dados) {
        // Normaliza CPF do titular (somente dígitos) para checagem e armazenamento
        String cpfTitularDigits = dados.cpf() != null ? dados.cpf().replaceAll("\\D", "") : null;
        // Validar unicidade do CPF do titular
        if (cpfTitularDigits != null && conviteRepository.existsByCpf(cpfTitularDigits)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("CPF do titular já cadastrado.");
        }

        Convite novoConvite = new Convite();
        novoConvite.setNome(dados.nome());
        novoConvite.setCpf(cpfTitularDigits);
        novoConvite.setPlacaCarro(dados.placaCarro());
        novoConvite.setTelefone(dados.telefone());
        novoConvite.setInstagram(dados.instagram());

        if (dados.acompanhantes() != null) {
            List<Acompanhante> listaAcompanhantes = dados.acompanhantes().stream().map(dto -> {
                // Validação: CPF do acompanhante não pode ser igual ao do titular
                String cpfAcompDigits = dto.cpf() != null ? dto.cpf().replaceAll("\\D", "") : null;
                if (cpfAcompDigits != null && cpfTitularDigits != null && cpfAcompDigits.equals(cpfTitularDigits)) {
                    throw new IllegalArgumentException("CPF do acompanhante não pode ser igual ao do titular.");
                }
                Acompanhante a = new Acompanhante();
                a.setNome(dto.nome());
                a.setSobrenome(dto.sobrenome());
                a.setCpf(cpfAcompDigits);
                a.setConvite(novoConvite);
                return a;
            }).collect(Collectors.toList());

            novoConvite.setAcompanhantes(listaAcompanhantes);
        }

        // Gerar código
        String codigoGerado = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        novoConvite.setCodigo(codigoGerado);
    
        try {
            Convite conviteSalvo = conviteRepository.save(novoConvite);
            return ResponseEntity.ok(conviteSalvo);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (DataIntegrityViolationException e) {
            // Violações de UNIQUE em cpf (titular ou acompanhante)
            return ResponseEntity.status(HttpStatus.CONFLICT).body("CPF já cadastrado.");
        }
    }

    @PostMapping("/checkin/{codigo}")
    public ResponseEntity<?> realizarCheckin(@PathVariable String codigo) {
        Optional<Convite> conviteOpt = conviteRepository.findByCodigo(codigo);

        if (conviteOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Convite não encontrado!");
        }

        Convite convite = conviteOpt.get();

        if (convite.getUsado()) {
            return ResponseEntity.status(409).body("ATENÇÃO: Este convite JÁ FOI UTILIZADO anteriormente!");
        }

        convite.setUsado(true);
        conviteRepository.save(convite);

        return ResponseEntity.ok(convite);
    }
    
}
