import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import '../styles/adminPage.css'; 

const URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS;

interface Acompanhante {
    nome: string;
    sobrenome?: string;
    cpf?: string;
}

interface Convite {
    id: string;
    nome: string;
    cpf: string; 
    codigo: string;
    usado: boolean;
    placaCarro?: string;
    acompanhantes: Acompanhante[];
}

interface ModalState {
    show: boolean;
    type: 'success' | 'error' | 'warn' | 'info';
    title: string;
    message?: string;
    data?: Convite;
}

export default function AdminPage() {
    // Autenticação
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');

    // Dados
    const [convites, setConvites] = useState<Convite[]>([]);
    
    // UI
    const [activeTab, setActiveTab] = useState<'pendentes' | 'presentes'>('pendentes');
    const [showCamera, setShowCamera] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState<ModalState>({ show: false, type: 'info', title: '' });

    useEffect(() => {
        if (isAuthenticated) fetchConvites();
    }, [isAuthenticated]);

    const handleLogin = () => {
        if (passwordInput === ADMIN_PASS) setIsAuthenticated(true);
        else { alert("Senha incorreta!"); setPasswordInput(''); }
    };

    const fetchConvites = async () => {
        try {
            const res = await fetch(`${URL}/api/convites`);
            if (res.ok) {
                const data = await res.json();
                setConvites(data);
            }
        } catch (error) {
            console.error("Erro ao buscar convites", error);
        }
    };

    // --- LÓGICA DE CONTAGEM (SOMA TITULAR + ACOMPANHANTES) ---
    const totalPessoasEsperadas = convites.reduce((acc, curr) => acc + 1 + curr.acompanhantes.length, 0);
    
    const totalPessoasPresentes = convites
        .filter(c => c.usado) // Só pega os convites que já deram baixa
        .reduce((acc, curr) => acc + 1 + curr.acompanhantes.length, 0); // Soma Titular (1) + N Acompanhantes

    // --- LÓGICA DE FILTRO E BUSCA ---
    const listaFiltrada = convites.filter(c => {
        const term = searchTerm.toLowerCase();

        // 1. Verifica se bate com o Titular
        const matchTitular = 
            c.nome.toLowerCase().includes(term) ||
            c.codigo.toLowerCase().includes(term) ||
            c.cpf.includes(term) ||
            (c.placaCarro && c.placaCarro.toLowerCase().includes(term));

        // 2. Verifica se bate com algum Acompanhante
        const matchAcompanhante = c.acompanhantes.some(a => {
            const full = ((a.nome || '') + ' ' + (a.sobrenome || '')).trim().toLowerCase();
            return full.includes(term);
        });

        // 3. Aplica o filtro da Aba (Pendentes vs Presentes)
        const statusMatch = activeTab === 'pendentes' ? !c.usado : c.usado;

        // Retorna verdadeiro se bater com a Aba E (bater com Titular OU Acompanhante)
        return statusMatch && (matchTitular || matchAcompanhante);
    });

    // Formatadores
    const formatCPF = (cpf: string) => cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '-';

    const handleCheckIn = async (codigo: string) => {
        if (!codigo) return;
        setShowCamera(false);

        try {
            const res = await fetch(`${URL}/api/convites/checkin/${codigo}`, { method: 'POST' });
            
            if (res.status === 404) {
                setModal({ show: true, type: 'error', title: 'Não Encontrado', message: 'Código inválido.' });
                return;
            }
            if (res.status === 409) {
                setModal({ show: true, type: 'warn', title: 'Já Utilizado!', message: 'Convite já registrado anteriormente.' });
                return;
            }
            if (res.ok) {
                const dados: Convite = await res.json();
                // Mostra quem entrou
                setModal({ show: true, type: 'success', title: 'Acesso Liberado! 🎉', data: dados });
                fetchConvites(); 
                setManualCode('');
            }
        } catch (error) {
            setModal({ show: true, type: 'error', title: 'Erro', message: 'Falha na conexão.' });
        }
    };

    const openDetails = (convite: Convite) => {
        setModal({ show: true, type: 'info', title: 'Detalhes do Grupo', data: convite });
    };

    // --- TELA DE LOGIN ---
    if (!isAuthenticated) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <h2>🔒 Acesso Restrito</h2>
                    <input type="password" className="login-input" placeholder="Senha"
                        value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <button className="btn-submit" onClick={handleLogin}>ACESSAR</button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Portaria Inteligente 👮‍♂️</h1>
            </header>

            {/* DASHBOARD */}
            <div className="stats-container">
                <div className="stat-card blue">
                    <span className="stat-value">{totalPessoasEsperadas}</span>
                    <span className="stat-label">Público Total</span>
                </div>
                <div className="stat-card green">
                    <span className="stat-value">{totalPessoasPresentes}</span>
                    <span className="stat-label">Já Entraram</span>
                </div>
            </div>

            <div className="action-area">
                <button className={`btn-camera ${showCamera ? 'active' : ''}`} onClick={() => setShowCamera(!showCamera)}>
                    {showCamera ? '❌ Fechar' : '📷 Ler QR'}
                </button>

                {showCamera && (
                    <div className="camera-wrapper">
                        <Scanner onScan={(res) => { if(res && res[0]) handleCheckIn(res[0].rawValue) }} 
                                 styles={{ container: { width: '100%', aspectRatio: '1/1' } }} />
                    </div>
                )}

                <div className="manual-input-group">
                    <input type="text" placeholder="Código..." value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} />
                    <button onClick={() => handleCheckIn(manualCode)}>Validar</button>
                </div>
            </div>

            <div className="search-container">
                <input type="text" className="search-input" 
                    placeholder="🔍 Buscar por Titular, CPF ou Acompanhante..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="lists-section">
                <div className="tabs">
                    <button className={activeTab === 'pendentes' ? 'active' : ''} onClick={() => setActiveTab('pendentes')}>
                        ⏳ Pendentes
                    </button>
                    <button className={activeTab === 'presentes' ? 'active' : ''} onClick={() => setActiveTab('presentes')}>
                        ✅ Presentes
                    </button>
                </div>

                <div className="list-content">
                    {listaFiltrada.map(convite => {
                        // Lógica visual: Verifica se a busca deu match em algum acompanhante específico
                        const foundGuest = searchTerm && convite.acompanhantes.find(a => {
                            const full = ((a.nome || '') + ' ' + (a.sobrenome || '')).trim().toLowerCase();
                            return full.includes(searchTerm.toLowerCase());
                        });

                        return (
                            <div key={convite.id} className={`convite-card ${convite.usado ? 'used' : ''}`}>
                                <div className="card-info" onClick={() => openDetails(convite)} style={{cursor: 'pointer'}}>
                                    <strong>{convite.nome}</strong>
                                    <small>CPF: {formatCPF(convite.cpf)}</small>
                                    
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'5px'}}>
                                        <small>Cód: <b>{convite.codigo}</b></small>
                                        <span style={{
                                            fontSize:'0.75rem', backgroundColor: '#eff6ff', color: '#2563eb', 
                                            padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold'
                                        }}>
                                            👥 {1 + convite.acompanhantes.length} Pessoas
                                        </span>
                                    </div>

                                    {/* SE ENCONTROU UM ACOMPANHANTE NA BUSCA, MOSTRA AQUI */}
                                    {foundGuest && (
                                        <div style={{
                                            marginTop: '8px', padding: '4px 8px', backgroundColor: '#fff7ed', 
                                            borderLeft: '3px solid #f59e0b', borderRadius: '4px', fontSize: '0.8rem', color: '#b45309'
                                        }}>
                                            📍 Acompanhante: <b>{((foundGuest?.nome || '') + ' ' + (foundGuest?.sobrenome || '')).trim()}</b>
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                    <button className="btn-icon" onClick={() => openDetails(convite)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    </button>

                                    {!convite.usado && (
                                        <button className="btn-quick-checkin" onClick={() => handleCheckIn(convite.codigo)}>✔</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    
                    {listaFiltrada.length === 0 && (
                        <p className="empty-msg">Nenhum registro encontrado.</p>
                    )}
                </div>
            </div>

            {/* MODAL PADRÃO DE DETALHES */}
            {modal.show && modal.data && (
                <div className="modal-overlay" onClick={() => setModal({ ...modal, show: false })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <span className="modal-icon">
                            {modal.type === 'success' ? '🎉' : modal.type === 'error' ? '❌' : modal.type === 'warn' ? '⚠️' : 'ℹ️'}
                        </span>
                        
                        <h2 className="modal-title" style={{
                            color: modal.type === 'success' ? '#059669' : modal.type === 'error' ? '#dc2626' : modal.type === 'warn' ? '#d97706' : '#2563eb'
                        }}>
                            {modal.title}
                        </h2>

                        <div className="modal-body">
                            <p><strong>Titular:</strong> {modal.data.nome}</p>
                            <p><strong>CPF:</strong> {formatCPF(modal.data.cpf)}</p>
                            <p><strong>Placa:</strong> {modal.data.placaCarro || '---'}</p>
                            <p><strong>Grupo Total:</strong> {1 + modal.data.acompanhantes.length} Pessoas</p>

                            {modal.data.acompanhantes.length > 0 && (
                                <div style={{marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '0.5rem'}}>
                                    <p><strong>Lista de Acompanhantes:</strong></p>
                                    <ul className="modal-guests-list">
                                        {modal.data.acompanhantes.map((ac, i) => {
                                            const full = ((ac.nome || '') + ' ' + (ac.sobrenome || '')).trim();
                                            return <li key={i}>{full || '-'}</li>;
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div style={{display: 'flex', gap: '10px', marginTop: '1rem'}}>
                            <button className="btn-close-modal" onClick={() => setModal({ ...modal, show: false })}>FECHAR</button>
                            
                            {modal.type === 'info' && !modal.data.usado && (
                                <button className="btn-close-modal" style={{backgroundColor: '#059669'}} 
                                    onClick={() => handleCheckIn(modal.data!.codigo)}>
                                    LIBERAR TODOS
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}