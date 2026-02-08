import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import QRCode from "react-qr-code";
import html2canvas from 'html2canvas';
import '../styles/invitePage.css';

// --- IMPORTS DAS IMAGENS ---
import img1 from '../assets/Carrossel/Imagem 1º.jpg';
import img2 from '../assets/Carrossel/imagem 2º.jpeg';
import img3 from '../assets/Carrossel/Imagem 3º.jpg';
import img4 from '../assets/Carrossel/Imagem 4º.jpg';
import img5 from '../assets/Carrossel/Imagem 5º.jpg';
import img6 from '../assets/Carrossel/Imagem 6º.jpg';

// Lista para o Carrossel
const IMAGES = [img1, img3, img4, img5, img6];

interface Acompanhante {
    nome: string;
    sobrenome: string;
}

interface UserFormData {
    nome: string;
    placaCarro: string; // Trocamos email por placa
    cpf: string;
    telefone: string;
    instagram: string;
}

interface ConviteResponse {
    id: string;
    nome: string;
    codigo: string;
}

export default function InvitePage() {
    // Estados do Formulário
    const [formData, setFormData] = useState<UserFormData>({ 
        nome: '', 
        placaCarro: '', 
        cpf: '', 
        telefone: '', 
        instagram: '' 
    });
    
    const [errors, setErrors] = useState({ cpf: '', telefone: '' });
    const [acompanhantes, setAcompanhantes] = useState<Acompanhante[]>([]);
    
    // Estados de UI
    const [isLoading, setIsLoading] = useState(false);
    const [conviteGerado, setConviteGerado] = useState<ConviteResponse | null>(null);
    const [currentImage, setCurrentImage] = useState(0);

    // Carrossel Automático
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % IMAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // --- MÁSCARAS E FORMATAÇÃO ---

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const formatTelefone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    };

    // --- HANDLERS (Ações) ---

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'cpf') {
            finalValue = formatCPF(value);
            if (finalValue.length === 14) setErrors(prev => ({...prev, cpf: ''}));
        }

        if (name === 'telefone') {
            finalValue = formatTelefone(value);
            if (finalValue.length >= 14) setErrors(prev => ({...prev, telefone: ''}));
        }

        // Placa sempre Maiúscula
        if (name === 'placaCarro') {
            finalValue = value.toUpperCase();
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const addAcompanhante = () => setAcompanhantes([...acompanhantes, { nome: '', sobrenome: '' }]);
    const removeAcompanhante = (index: number) => setAcompanhantes(acompanhantes.filter((_, i) => i !== index));
    
    const handleAcompanhanteChange = (index: number, field: keyof Acompanhante, value: string) => {
        const novaLista = [...acompanhantes];
        if (novaLista[index]) { novaLista[index][field] = value; setAcompanhantes(novaLista); }
    };

    const handleReset = () => {
        setConviteGerado(null);
        setFormData({ nome: '', placaCarro: '', cpf: '', telefone: '', instagram: '' });
        setAcompanhantes([]);
        setErrors({ cpf: '', telefone: '' });
    };

    // --- DOWNLOAD DO TICKET ---
    const handleDownloadTicket = async () => {
        const element = document.getElementById('ticket-capture');
        if (element) {
            const canvas = await html2canvas(element, { 
                backgroundColor: '#ffffff', // Garante fundo branco na imagem salva
                scale: 2 // Melhor qualidade
            });
            const data = canvas.toDataURL('image/png');
            
            const link = document.createElement('a');
            link.href = data;
            link.download = `convite-cassab-${conviteGerado?.codigo}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        const newErrors = { cpf: '', telefone: '' };
        let hasError = false;

        if (formData.cpf.length < 14) {
            newErrors.cpf = "CPF incompleto.";
            hasError = true;
        }
        if (formData.telefone.length < 14) {
            newErrors.telefone = "Telefone incompleto.";
            hasError = true;
        }

        setErrors(newErrors);
        if (hasError) return;

        setIsLoading(true);

        const payload = {
            ...formData,
            // Remove acompanhantes vazios se o usuário clicou em adicionar mas não preencheu
            acompanhantes: acompanhantes.filter(a => a.nome.trim() !== '')
        };

        try {
            // Mude para o seu link do NGROK se for testar no celular
            // Exemplo: 'https://seu-ngrok.app/api/convites'
            const response = await fetch('http://localhost:8080/api/convites/criar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const dados: ConviteResponse = await response.json();
                setConviteGerado(dados);
            } else {
                alert("Erro ao salvar. Verifique se o CPF já foi cadastrado.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão com o servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="split-screen-container">
            
            {/* ====== LADO ESQUERDO ====== */}
            <div className="left-pane">
                
                {/* 1. Imagem de Fundo (img2) com Animação */}
                <div 
                    className="animated-bg" 
                    style={{ backgroundImage: `url(${img2})` }} 
                ></div>
                
                {/* 2. Camada Escura para o texto aparecer */}
                <div className="bg-overlay"></div>

                {/* 3. Conteúdo Principal */}
                <div className="content-wrapper">
                    
                    {/* ===== TELA DE SUCESSO (TICKET) ===== */}
                    {conviteGerado ? (
                        <div className="ticket-wrapper">
                            <h2 style={{textAlign: 'center', marginBottom: '1.5rem', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                                Seu ingresso está pronto! 🎉
                            </h2>
                            
                            {/* O Ingresso em si (Fundo Branco para scanear fácil) */}
                            <div id="ticket-capture" style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                                <div className="ticket-card">
                                    <div className="ticket-header">
                                        <h3 className="ticket-event-name">Cassab Solidário</h3>
                                        <p className="ticket-subtitle">Convite Individual</p>
                                    </div>

                                    <div className="ticket-body">
                                        <div className="qr-container">
                                            <QRCode value={conviteGerado.codigo} size={150} fgColor="#1f2937" />
                                        </div>
                                        <div className="ticket-code">{conviteGerado.codigo}</div>
                                        <div className="ticket-divider"></div>
                                        <div className="ticket-guest-info">
                                            <h4>Titular</h4>
                                            <p>{conviteGerado.nome}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', maxWidth: '380px', margin: '2rem auto' }}>
                                <button className="btn-download" onClick={handleDownloadTicket}>
                                    ⬇ Baixar Ingresso (JPG)
                                </button>
                                <div style={{textAlign: 'center'}}>
                                    <button className="btn-new" onClick={handleReset} style={{color: '#fff', textDecoration: 'underline', marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer'}}>
                                        Realizar novo cadastro
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ===== TELA DE FORMULÁRIO ===== */
                        <>
                            <header className="header-section">
                                <h1 style={{color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>
                                    Cadastro Solidário
                                </h1>
                                <p style={{color: '#e5e7eb', textShadow: '0 1px 2px rgba(0,0,0,0.8)'}}>
                                    Preencha os dados corretamente para gerar seu convite.
                                </p>
                            </header>

                            <main>
                                <span className="form-title" style={{color: 'white', display: 'block', marginBottom: '10px'}}>
                                    Dados do Titular
                                </span>

                                <form onSubmit={handleSubmit} className="form-card">
                                    <div className="form-group">
                                        <label htmlFor="nome">Nome Completo</label>
                                        <input id="nome" name="nome" type="text" placeholder="Seu nome" className="input-field"
                                            value={formData.nome} onChange={handleInputChange} required disabled={isLoading} />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="placaCarro">Placa do Carro (Opcional)</label>
                                        <input 
                                            id="placaCarro" 
                                            name="placaCarro" 
                                            type="text" 
                                            placeholder="ABC1234" 
                                            className="input-field"
                                            value={formData.placaCarro} 
                                            onChange={handleInputChange} 
                                            disabled={isLoading} 
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="cpf">CPF</label>
                                        <input id="cpf" name="cpf" type="text" placeholder="000.000.000-00" maxLength={14}
                                            className={`input-field ${errors.cpf ? 'input-error' : ''}`}
                                            value={formData.cpf} onChange={handleInputChange} required disabled={isLoading} />
                                        {errors.cpf && <span className="error-msg">{errors.cpf}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="telefone">Telefone</label>
                                        <input id="telefone" name="telefone" type="tel" placeholder="(61) 90000-0000" maxLength={15}
                                            className={`input-field ${errors.telefone ? 'input-error' : ''}`}
                                            value={formData.telefone} onChange={handleInputChange} required disabled={isLoading} />
                                        {errors.telefone && <span className="error-msg">{errors.telefone}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="instagram">Instagram</label>
                                        <input id="instagram" name="instagram" type="text" placeholder="@seu.perfil" className="input-field"
                                            value={formData.instagram} onChange={handleInputChange} disabled={isLoading} />
                                    </div>

                                    <div className="companions-section">
                                        <span className="section-title">Acompanhantes ({acompanhantes.length})</span>
                                        {acompanhantes.map((item, index) => (
                                            <div key={index} className="companion-row">
                                                <div className="companion-inputs">
                                                    <input type="text" placeholder="Nome" className="input-field"
                                                        value={item.nome} onChange={(e) => handleAcompanhanteChange(index, 'nome', e.target.value)} required disabled={isLoading} />
                                                    <input type="text" placeholder="Sobrenome" className="input-field"
                                                        value={item.sobrenome} onChange={(e) => handleAcompanhanteChange(index, 'sobrenome', e.target.value)} required disabled={isLoading} />
                                                </div>
                                                <button type="button" onClick={() => removeAcompanhante(index)} className="btn-remove" disabled={isLoading}>&times;</button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={addAcompanhante} className="btn-add" disabled={isLoading}>+ Adicionar Acompanhante</button>
                                    </div>

                                    <button type="submit" className="btn-submit" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
                                        {isLoading ? 'AGUARDE...' : 'GERAR MEU CONVITE'}
                                    </button>
                                </form>
                            </main>
                        </>
                    )}
                </div>
            </div>

            {/* ====== LADO DIREITO (CARROSSEL) ====== */}
            <div className="right-pane">
                {IMAGES.map((img, index) => (
                    <div key={index} className={`carousel-slide ${index === currentImage ? 'active' : ''}`}>
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
                        <button key={idx} onClick={() => setCurrentImage(idx)} className={`dot ${idx === currentImage ? 'active' : ''}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}