import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import '../styles/invitePage.css';

interface Acompanhante {
    nome: string;
    sobrenome: string;
}

interface UserFormData {
    nome: string;
    cpf: string;
    telefone: string;
    instagram: string;
}

const IMAGES = [
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop"
];

export default function InvitePage() {
    // Estado dos dados do titular
    const [formData, setFormData] = useState<UserFormData>({
        nome: '',
        cpf: '',
        telefone: '',
        instagram: ''
    });

    // Estado da lista de acompanhantes
    const [acompanhantes, setAcompanhantes] = useState<Acompanhante[]>([]);

    // Estado de carregamento (feedback visual para o usuário)
    const [isLoading, setIsLoading] = useState(false);

    // Estado do Carrossel
    const [currentImage, setCurrentImage] = useState(0);

    // Roda o carrossel automaticamente
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % IMAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Atualiza os inputs do titular
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Funções de manipulação de acompanhantes
    const addAcompanhante = () => {
        setAcompanhantes([...acompanhantes, { nome: '', sobrenome: '' }]);
    };

    const removeAcompanhante = (index: number) => {
        const novaLista = acompanhantes.filter((_, i) => i !== index);
        setAcompanhantes(novaLista);
    };

    const handleAcompanhanteChange = (index: number, field: keyof Acompanhante, value: string) => {
        const novaLista = [...acompanhantes];
        if (novaLista[index]) {
            novaLista[index][field] = value;
            setAcompanhantes(novaLista);
        }
    };

    // ENVIO DO FORMULÁRIO (INTEGRADO COM BACKEND)
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true); // Bloqueia o botão e mostra loading
        
        // Prepara o JSON removendo acompanhantes vazios se houver
        const payload = {
            ...formData,
            acompanhantes: acompanhantes.filter(a => a.nome.trim() !== '')
        };

        try {
            // Chama o seu Backend Spring Boot
            // Se estiver rodando em outra porta ou URL, altere aqui
            const response = await fetch('http://localhost:8080/api/convites/criar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Convite gerado com sucesso! 🎉");
                
                // Limpa o formulário após o sucesso
                setFormData({ nome: '', cpf: '', telefone: '', instagram: '' });
                setAcompanhantes([]);
            } else {
                alert("Erro ao salvar. Verifique os dados e tente novamente.");
                console.error("Erro no servidor:", response.status);
            }

        } catch (error) {
            console.error("Erro de conexão:", error);
            alert("Não foi possível conectar ao servidor. O Backend está rodando?");
        } finally {
            setIsLoading(false); // Libera o botão novamente
        }
    };

    return (
        <div className="split-screen-container">
            
            {/* ====== LADO ESQUERDO: Formulário ====== */}
            <div className="left-pane">
                <div className="content-wrapper">
                    
                    <header className="header-section">
                        <h1>Cadastro Solidário</h1>
                        <p>Garanta sua presença e de seus convidados.</p>
                    </header>

                    <main>
                        <span className="form-title">Dados do Titular</span>

                        <form onSubmit={handleSubmit} className="form-card">
                            
                            <div className="form-group">
                                <label htmlFor="nome">Nome Completo</label>
                                <input
                                    id="nome"
                                    name="nome"
                                    type="text"
                                    placeholder="Seu nome"
                                    className="input-field"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="cpf">CPF</label>
                                <input
                                    id="cpf"
                                    name="cpf"
                                    type="text"
                                    placeholder="000.000.000-00"
                                    className="input-field"
                                    value={formData.cpf}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="telefone">Telefone / WhatsApp</label>
                                <input
                                    id="telefone"
                                    name="telefone"
                                    type="tel"
                                    placeholder="(61) 90000-0000"
                                    className="input-field"
                                    value={formData.telefone}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="instagram">Instagram</label>
                                <input
                                    id="instagram"
                                    name="instagram"
                                    type="text"
                                    placeholder="@seu.perfil"
                                    className="input-field"
                                    value={formData.instagram}
                                    onChange={handleInputChange}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Área de Acompanhantes */}
                            <div className="companions-section">
                                <span className="section-title">
                                    Acompanhantes ({acompanhantes.length})
                                </span>

                                {acompanhantes.map((item, index) => (
                                    <div key={index} className="companion-row">
                                        <div className="companion-inputs">
                                            <input
                                                type="text"
                                                placeholder="Nome"
                                                className="input-field"
                                                value={item.nome}
                                                onChange={(e) => handleAcompanhanteChange(index, 'nome', e.target.value)}
                                                required
                                                disabled={isLoading}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Sobrenome"
                                                className="input-field"
                                                value={item.sobrenome}
                                                onChange={(e) => handleAcompanhanteChange(index, 'sobrenome', e.target.value)}
                                                required
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeAcompanhante(index)}
                                            className="btn-remove"
                                            title="Remover"
                                            disabled={isLoading}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}

                                <button 
                                    type="button" 
                                    onClick={addAcompanhante} 
                                    className="btn-add"
                                    disabled={isLoading}
                                >
                                    + Adicionar Acompanhante
                                </button>
                            </div>

                            <button 
                                type="submit" 
                                className="btn-submit"
                                disabled={isLoading}
                                style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer' }}
                            >
                                {isLoading ? 'ENVIANDO...' : 'GERAR MEU CONVITE'}
                            </button>
                        </form>
                    </main>
                </div>
            </div>

            {/* ====== LADO DIREITO: Imagens ====== */}
            <div className="right-pane">
                {IMAGES.map((img, index) => (
                    <div
                        key={index}
                        className={`carousel-slide ${index === currentImage ? 'active' : ''}`}
                    >
                        <div className="overlay"></div>
                        <img src={img} alt={`Slide ${index}`} className="carousel-image" />
                    </div>
                ))}
                
                <div className="carousel-content">
                    <span className="carousel-subtitle">Evento Beneficente</span>
                    <h2 className="carousel-title">Juntos fazemos a diferença.</h2>
                    <p className="carousel-desc">Preencha seus dados para receber o QR Code de acesso.</p>
                </div>

                <div className="indicators">
                    {IMAGES.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentImage(idx)}
                            className={`dot ${idx === currentImage ? 'active' : ''}`}
                        />
                    ))}
                </div>
            </div>

        </div>
    );
}