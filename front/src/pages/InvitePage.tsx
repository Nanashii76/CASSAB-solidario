import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import '../styles/invitePage.css'

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
    const [formData, setFormData] = useState<UserFormData>({
        nome: '',
        cpf: '',
        telefone: '',
        instagram: ''
    });


    const [acompanhantes, setAcompanhantes] = useState<Acompanhante[]>([]);

    // Estado do Carrossel
    const [currentImage, setCurrentImage] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % IMAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Tipagem do evento de mudança de input (ChangeEvent)
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        const payload = {
            ...formData,
            acompanhantes: acompanhantes.filter(a => a.nome.trim() !== '')
        };

        console.log("JSON PARA O BACKEND:", JSON.stringify(payload, null, 2));
        alert("JSON gerado no console! (F12)");
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
                                            />
                                            <input
                                                type="text"
                                                placeholder="Sobrenome"
                                                className="input-field"
                                                value={item.sobrenome}
                                                onChange={(e) => handleAcompanhanteChange(index, 'sobrenome', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeAcompanhante(index)}
                                            className="btn-remove"
                                            title="Remover"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}

                                <button type="button" onClick={addAcompanhante} className="btn-add">
                                    + Adicionar Acompanhante
                                </button>
                            </div>

                            <button type="submit" className="btn-submit">
                                GERAR MEU CONVITE
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