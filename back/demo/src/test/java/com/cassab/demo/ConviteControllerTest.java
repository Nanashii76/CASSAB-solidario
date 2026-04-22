package com.cassab.demo;

import com.cassab.demo.model.Convite;
import com.cassab.demo.repository.ConviteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional // Garante que o banco de dados é limpo após cada teste
class ConviteControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private ConviteRepository conviteRepository;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
        // Opcional: pode apagar se preferir contar apenas com o @Transactional
        conviteRepository.deleteAll();
    }

    @Test
    void deveCriarNovoConvite() throws Exception {
        String jsonConvite = """
            {
                "nome": "Jefferson Rodrigues",
                "cpf": "123.456.789-00",
                "telefone": "11999999999",
                "instagram": "@jeff",
                "placaCarro": "ABC-1234",
                "acompanhantes": [
                    { "nome": "Maria", "sobrenome": "Silva" },
                    { "nome": "João", "sobrenome": "Silva" }
                ]
            }
            """;

        mockMvc.perform(post("/api/convites/criar")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonConvite))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.codigo").exists())
                .andExpect(jsonPath("$.codigo").isString())
                .andExpect(jsonPath("$.usado").value(false))
                .andExpect(jsonPath("$.acompanhantes").isArray());
    }

    @Test
    void deveRealizarCheckinComSucesso() throws Exception {
        // 1. Setup: Criar um convite falso no banco usando código
        Convite convite = new Convite();
        convite.setNome("Visitante VIP");
        convite.setCpf("99988877766"); // Diferente, mas como usamos @Transactional n teria problema
        convite.setTelefone("000000000");
        convite.setCodigo("TESTE123");
        convite.setUsado(false);
        conviteRepository.save(convite);

        // 2. Ação e Verificação: Fazer check-in com o código criado
        mockMvc.perform(post("/api/convites/checkin/TESTE123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usado").value(true)); // O status de "usado" deve mudar para true
    }

    @Test
    void deveRetornarErroQuandoConviteJaUtilizado() throws Exception {
        // 1. Setup: Criar um convite no banco que JÁ FOI usado
        Convite convite = new Convite();
        convite.setNome("Visitante Atrasado");
        convite.setCpf("11122233344");
        convite.setTelefone("000000000");
        convite.setCodigo("USADO123");
        convite.setUsado(true); // <--- Atenção aqui, já está usado!
        conviteRepository.save(convite);

        // 2. Ação e Verificação: Tentar fazer checkin novamente
        mockMvc.perform(post("/api/convites/checkin/USADO123"))
                .andExpect(status().isConflict()); // Status 409
    }

    @Test
    void deveRetornarErro404ParaConviteInexistente() throws Exception {
        // Tentar fazer checkin com código que não existe no banco
        mockMvc.perform(post("/api/convites/checkin/CODIGO_INVALIDO_XYZ"))
                .andExpect(status().isNotFound()); // Status 404
    }
}
