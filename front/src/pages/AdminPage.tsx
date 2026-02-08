import { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import '../styles/adminPage.css'; 

const URL = import.meta.env.VITE_API_URL || "http://localhost:8080"; 

interface Acompanhante {
    nome: string;
    sobrenome: string;
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
    const [convites, setConvites] = useState<Convite[]>([]);
    const [activeTab, setActiveTab] = useState<'pendentes' | 'presentes'>('pendentes');
    const [showCamera, setShowCamera] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [modal, setModal] = useState<ModalState>({ show: false, type: 'info', title: '' });

    useEffect(() => {
        fetchConvites();
    }, []);

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

    // Função auxiliar para formatar CPF na visualização (caso venha sem pontuação)
    const formatCPF = (cpf: string) => {
        if (!cpf) return '-';
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    const openDetails = (convite: Convite) => {
        setModal({
            show: true,
            type: 'info',
            title: 'Detalhes do Convite',
            data: convite
        });
    };

    const handleCheckIn = async (codigo: string) => {
        if (!codigo) return;
        setShowCamera(false);

        try {
            const res = await fetch(`${URL}/api/convites/checkin/${codigo}`, {
                method: 'POST'
            });

            if (res.status === 404) {
                setModal({ show: true, type: 'error', title: 'Não Encontrado', message: 'Código inválido ou inexistente.' });
                return;
            }

            if (res.status === 409) {
                setModal({ show: true, type: 'warn', title: 'Já Utilizado!', message: 'Este convite já entrou no evento anteriormente.' });
                return;
            }

            if (res.ok) {
                const dados: Convite = await res.json();
                setModal({ 
                    show: true, 
                    type: 'success', 
                    title: 'Acesso Liberado! 🎉', 
                    data: dados 
                });
                fetchConvites(); 
                setManualCode('');
            }
        } catch (error) {
            setModal({ show: true, type: 'error', title: 'Erro de Conexão', message: 'Verifique a internet.' });
        }
    };

    // Filtros
    const listaBase = activeTab === 'pendentes' 
        ? convites.filter(c => !c.usado) 
        : convites.filter(c => c.usado);

    const listaFiltrada = listaBase.filter(c => 
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cpf.includes(searchTerm) || // Permite buscar pelo CPF também
        (c.placaCarro && c.placaCarro.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Portaria Inteligente 👮‍♂️</h1>
            </header>

            <div className="action-area">
                <button 
                    className={`btn-camera ${showCamera ? 'active' : ''}`}
                    onClick={() => setShowCamera(!showCamera)}
                >
                    {showCamera ? '❌ Fechar Câmera' : '📷 Ler QR Code'}
                </button>

                {showCamera && (
                    <div className="camera-wrapper">
                        <Scanner
                            onScan={(result) => {
                                if (result && result.length > 0) handleCheckIn(result[0].rawValue);
                            }}
                            styles={{ container: { width: '100%', aspectRatio: '1/1' } }}
                        />
                        <p style={{ marginTop: '10px' }}>Posicione o código no centro</p>
                    </div>
                )}

                <div className="manual-input-group">
                    <input 
                        type="text" 
                        placeholder="Digitar código..." 
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    />
                    <button onClick={() => handleCheckIn(manualCode)}>Validar</button>
                </div>
            </div>

            <div className="search-container">
                <input 
                    type="text" 
                    className="search-input"
                    placeholder="🔍 Nome, CPF, Placa ou Código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="lists-section">
                <div className="tabs">
                    <button className={activeTab === 'pendentes' ? 'active' : ''} onClick={() => setActiveTab('pendentes')}>
                        ⏳ Pendentes ({listaBase.length})
                    </button>
                    <button className={activeTab === 'presentes' ? 'active' : ''} onClick={() => setActiveTab('presentes')}>
                        ✅ Presentes ({convites.filter(c => c.usado).length})
                    </button>
                </div>

                <div className="list-content">
                    {listaFiltrada.map(convite => (
                        <div key={convite.id} className={`convite-card ${convite.usado ? 'used' : ''}`}>
                            <div className="card-info" onClick={() => openDetails(convite)} style={{cursor: 'pointer'}}>
                                <strong>{convite.nome}</strong>
                                <small>CPF: {convite.cpf}</small> {/* MOSTRANDO CPF NO CARD */}
                                <small>Cód: <b>{convite.codigo}</b></small>
                                {convite.placaCarro && <small>🚗 {convite.placaCarro}</small>}
                                {convite.acompanhantes.length > 0 && (
                                    <span className="guest-badge">+{convite.acompanhantes.length} convidados</span>
                                )}
                            </div>
                            
                            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                {/* BOTÃO COM ÍCONE NOVO (SVG) */}
                                <button 
                                    className="btn-icon" 
                                    onClick={() => openDetails(convite)} 
                                    title="Ver Detalhes"
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer', padding: '5px'
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                </button>

                                {!convite.usado && (
                                    <button className="btn-quick-checkin" onClick={() => handleCheckIn(convite.codigo)} title="Validar Entrada">
                                        ✔
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {listaFiltrada.length === 0 && (
                        <p className="empty-msg">Nenhum registro encontrado.</p>
                    )}
                </div>
            </div>

            {/* --- MODAL --- */}
            {modal.show && (
                <div className="modal-overlay" onClick={() => setModal({ ...modal, show: false })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        
                        <span className="modal-icon">
                            {modal.type === 'success' ? '🎉' : modal.type === 'error' ? '❌' : modal.type === 'warn' ? '⚠️' : 'ℹ️'}
                        </span>
                        
                        <h2 className="modal-title" style={{
                            color: modal.type === 'success' ? '#059669' : 
                                   modal.type === 'error' ? '#dc2626' : 
                                   modal.type === 'warn' ? '#d97706' : '#2563eb'
                        }}>
                            {modal.title}
                        </h2>

                        {(modal.data) ? (
                            <div className="modal-body">
                                <p><strong>Titular:</strong> {modal.data.nome}</p>
                                <p><strong>CPF:</strong> {formatCPF(modal.data.cpf)}</p> {/* CPF NO MODAL */}
                                <p><strong>Código:</strong> {modal.data.codigo}</p>
                                {modal.data.placaCarro && <p><strong>Placa:</strong> {modal.data.placaCarro}</p>}
                                <p><strong>Status:</strong> {modal.data.usado ? <span style={{color:'green', fontWeight:'bold'}}>JÁ ENTROU</span> : <span style={{color:'orange', fontWeight:'bold'}}>PENDENTE</span>}</p>

                                {modal.data.acompanhantes.length > 0 ? (
                                    <div style={{marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '0.5rem'}}>
                                        <p><strong>Lista de Acompanhantes:</strong></p>
                                        <ul className="modal-guests-list">
                                            {modal.data.acompanhantes.map((ac, i) => (
                                                <li key={i}>{ac.nome} {ac.sobrenome}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p style={{marginTop: '1rem', fontStyle: 'italic', color: '#888'}}>Sem acompanhantes.</p>
                                )}
                            </div>
                        ) : (
                            <p style={{margin: '1rem 0', color: '#666'}}>{modal.message}</p>
                        )}

                        <div style={{display: 'flex', gap: '10px', marginTop: '1rem'}}>
                            <button className="btn-close-modal" onClick={() => setModal({ ...modal, show: false })}>
                                FECHAR
                            </button>
                            
                            {modal.type === 'info' && modal.data && !modal.data.usado && (
                                <button 
                                    className="btn-close-modal" 
                                    style={{backgroundColor: '#059669'}}
                                    onClick={() => handleCheckIn(modal.data!.codigo)}
                                >
                                    VALIDAR
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}