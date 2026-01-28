import React, { useState } from 'react';

export default function InvitePage() {
    // Estados para capturar os dados do formulário
    const [nome, setNome] = useState('');
    const [documento, setDocumento] = useState('');
    const [acompanhantes, setAcompanhantes] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aqui vamos disparar a requisição para o Spring Boot depois
        console.log("Enviando dados:", { nome, documento, acompanhantes });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 font-sans">

            {/* 1. HEADER (Boas Vindas) */}
            <header className="w-full max-w-md mt-6">
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Boas vindas</h1>
                <p className="text-gray-500 mt-1 font-medium italic">Agradecimentos pelo seu apoio ao evento.</p>
            </header>

            {/* 2. ESPAÇO PARA IMAGEM (Propósito) */}
            <div className="w-full max-w-md aspect-video bg-gray-200 rounded-2xl mt-8 flex items-center justify-center border-2 border-dashed border-gray-300">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">IMG Propósito;
                transição pra outra imagem de apresentação.
                </span>
            </div>

            {/* 3. FORMULÁRIO (O "Card" do esboço) */}
            <main className="w-full max-w-md mt-8">
                <h2 className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-4 ml-1">
                    Cadastre-se abaixo
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col gap-6"
                >
                    {/* Nome */}
                    <input
                        type="text"
                        placeholder="Nome Completo"
                        className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        onChange={(e) => setNome(e.target.value)}
                    />

                    {/* Documento */}
                    <input
                        type="text"
                        placeholder="Documento (CPF ou RG)"
                        className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        onChange={(e) => setDocumento(e.target.value)}
                    />

                    {/* Seletor de Acompanhantes (Sugestão de MVP) */}
                    <div className="flex items-center justify-between px-2">
                        <span className="text-sm font-bold text-gray-500 uppercase">Acompanhantes</span>
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => setAcompanhantes(Math.max(0, acompanhantes - 1))} className="w-8 h-8 rounded-full bg-gray-100 font-bold">-</button>
                            <span className="font-bold">{acompanhantes}</span>
                            <button type="button" onClick={() => setAcompanhantes(acompanhantes + 1)} className="w-8 h-8 rounded-full bg-gray-100 font-bold">+</button>
                        </div>
                    </div>

                    {/* Botão de Envio */}
                    <button
                        type="submit"
                        className="w-full h-16 bg-blue-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        GERAR MEU CONVITE
                    </button>
                </form>
            </main>

        </div>
    );
}