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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class ConviteControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private ConviteRepository conviteRepository;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
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
                    { "nome": "Maria", "sobrenome": "Silva", "cpf": "111.444.777-35" },
                    { "nome": "João", "sobrenome": "Silva", "cpf": "390.533.447-05" }
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
                .andExpect(jsonPath("$.acompanhantes").isArray())
                .andExpect(jsonPath("$.acompanhantes.length()").value(2));
    }

    @Test
    void deveRejeitarCpfTitularDuplicado() throws Exception {
        String jsonPrimeiro = """
            {
                "nome": "Primeiro",
                "cpf": "529.982.247-25",
                "telefone": "11900000001",
                "instagram": "@a",
                "placaCarro": "AAA-1111",
                "acompanhantes": []
            }
            """;
        mockMvc.perform(post("/api/convites/criar")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPrimeiro))
                .andExpect(status().isOk());

        String jsonDuplicado = """
            {
                "nome": "Segundo mesmo CPF",
                "cpf": "52998224725",
                "telefone": "11900000002",
                "instagram": "@b",
                "placaCarro": "BBB-2222",
                "acompanhantes": []
            }
            """;
        mockMvc.perform(post("/api/convites/criar")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonDuplicado))
                .andExpect(status().isConflict());
    }

    @Test
    void deveRejeitarAcompanhanteComMesmoCpfDoTitular() throws Exception {
        String json = """
            {
                "nome": "Titular",
                "cpf": "747.553.170-19",
                "telefone": "11911112222",
                "instagram": "@t",
                "placaCarro": "TST-0001",
                "acompanhantes": [
                    { "nome": "X", "sobrenome": "Y", "cpf": "74755317019" }
                ]
            }
            """;
        mockMvc.perform(post("/api/convites/criar")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isConflict());
    }

    @Test
    void deveRejeitarDoisAcompanhantesComMesmoCpf() throws Exception {
        String json = """
            {
                "nome": "Titular Dois Acomp",
                "cpf": "085.199.970-43",
                "telefone": "11933334444",
                "instagram": "@d",
                "placaCarro": "TST-0004",
                "acompanhantes": [
                    { "nome": "A", "sobrenome": "1", "cpf": "462.178.366-27" },
                    { "nome": "B", "sobrenome": "2", "cpf": "46217836627" }
                ]
            }
            """;
        mockMvc.perform(post("/api/convites/criar")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isConflict());
    }

    @Test
    void deveRealizarCheckinComSucesso() throws Exception {
        Convite convite = new Convite();
        convite.setNome("Visitante VIP");
        convite.setCpf("99988877766");
        convite.setTelefone("000000000");
        convite.setCodigo("TESTE123");
        convite.setUsado(false);
        conviteRepository.save(convite);

        mockMvc.perform(post("/api/convites/checkin/TESTE123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usado").value(true));
    }

    @Test
    void deveRetornarErroQuandoConviteJaUtilizado() throws Exception {
        Convite convite = new Convite();
        convite.setNome("Visitante Atrasado");
        convite.setCpf("11122233344");
        convite.setTelefone("000000000");
        convite.setCodigo("USADO123");
        convite.setUsado(true);
        conviteRepository.save(convite);

        mockMvc.perform(post("/api/convites/checkin/USADO123"))
                .andExpect(status().isConflict());
    }

    @Test
    void deveRetornarErro404ParaConviteInexistente() throws Exception {
        mockMvc.perform(post("/api/convites/checkin/CODIGO_INVALIDO_XYZ"))
                .andExpect(status().isNotFound());
    }
}
