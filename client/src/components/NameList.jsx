import React, { useState } from 'react';
import { Trash2, ExternalLink, Loader2, CheckCircle, XCircle, Search, AlertCircle, Eye, Plus } from 'lucide-react';

const NameList = ({ names, onAdd, onRemove, onCheck, onShowINPIDetails, onShowInstagramDetails, checkingName }) => {
    const [manualInput, setManualInput] = useState('');

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualInput.trim()) {
            onAdd(manualInput);
            setManualInput('');
        }
    };

    return (
        <div className="h-full flex flex-col bg-nirin-card border-l border-nirin-muted/10 w-80 overflow-hidden">
            <div className="p-4 border-b border-nirin-muted/10 flex-shrink-0">
                <h2 className="text-nirin-text font-semibold text-lg">Nomes Selecionados</h2>
                <p className="text-nirin-muted text-xs mt-1 mb-3">
                    {names.length} {names.length === 1 ? 'nome' : 'nomes'} na lista
                </p>

                {/* Manual Entry Form */}
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        placeholder="Adicionar nome..."
                        className="flex-1 bg-nirin-dark border border-nirin-muted/20 rounded px-3 py-1.5 text-sm text-nirin-text focus:outline-none focus:border-nirin-orange/50 placeholder:text-nirin-muted/50"
                    />
                    <button
                        type="submit"
                        disabled={!manualInput.trim()}
                        className="bg-nirin-orange hover:bg-nirin-orange/80 text-white p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Adicionar"
                    >
                        <Plus size={18} />
                    </button>
                </form>
            </div>

            {/* Scrollable Names List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {names.length === 0 ? (
                    <div className="text-center text-nirin-muted text-sm mt-10">
                        Nenhum nome selecionado ainda.<br />
                        Adicione sugestões do chat.
                    </div>
                ) : (
                    names.map((item, index) => (
                        <div key={index} className="bg-nirin-dark p-3 rounded-md border border-nirin-muted/10 group hover:border-nirin-orange/30 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-nirin-text font-medium text-lg">{item.name}</span>
                                <button
                                    onClick={() => onRemove(item.name)}
                                    className="text-nirin-muted hover:text-red-500 transition-colors"
                                    title="Remover"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Actions / Status */}
                            <div className="space-y-2 mt-3">
                                {/* Availability Check Button */}
                                {!item.checked && (
                                    <button
                                        onClick={() => onCheck(item.name)}
                                        disabled={!!checkingName} // Disable all if any is checking, to prevent race conditions (optional, but safer)
                                        className={`w-full py-1.5 px-3 text-xs rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${checkingName === item.name
                                            ? 'bg-nirin-orange/20 text-nirin-orange'
                                            : 'bg-nirin-orange/10 hover:bg-nirin-orange/20 text-nirin-orange'
                                            }`}
                                    >
                                        {checkingName === item.name ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                                        {checkingName === item.name ? 'Verificando...' : 'Verificar Disponibilidade'}
                                    </button>
                                )}

                                {/* Results */}
                                {item.checked && (
                                    <div className="space-y-1.5 text-xs">
                                        {/* Instagram Result */}
                                        <div className="flex flex-col p-1.5 bg-black/20 rounded gap-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-nirin-muted">Instagram</span>
                                                {/* Single Result Header or Empty if multiple */}
                                                {item.instagram?.status !== 'multiple' && (
                                                    item.instagram?.status === 'available' ? (
                                                        <span className="text-green-500 flex items-center gap-1"><CheckCircle size={12} /> Livre</span>
                                                    ) : item.instagram?.status === 'unavailable' ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-red-500 flex items-center gap-1"><XCircle size={12} /> Ocupado</span>
                                                            {item.instagram.foundProfile && (
                                                                <button
                                                                    onClick={() => onShowInstagramDetails(item)}
                                                                    className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-xs uppercase font-bold tracking-wide"
                                                                >
                                                                    <Eye size={16} /> Ver
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-yellow-500 flex items-center gap-1">? Incerto</span>
                                                    )
                                                )}
                                            </div>

                                            {/* Multiple Variations List */}
                                            {item.instagram?.status === 'multiple' && (
                                                <div className="mt-1 space-y-1 pl-2 border-l-2 border-nirin-muted/10">
                                                    {item.instagram.variations.map((v, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-xs">
                                                            <span className="text-nirin-muted font-mono">@{v.variant}</span>
                                                            {v.status === 'available' ? (
                                                                <span className="text-green-500 flex items-center gap-1"><CheckCircle size={10} /> Livre</span>
                                                            ) : v.status === 'unavailable' ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-red-500 flex items-center gap-1"><XCircle size={10} /> Ocupado</span>
                                                                    {v.foundProfile && (
                                                                        <button
                                                                            onClick={() => onShowInstagramDetails({ instagram: { foundProfile: v.foundProfile } })}
                                                                            className="text-blue-500 hover:text-blue-400"
                                                                            title="Ver Perfil"
                                                                        >
                                                                            <Eye size={10} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-yellow-500">?</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* INPI Status */}
                                        <div className="flex items-center gap-2 text-sm p-1.5 bg-black/20 rounded">
                                            <span className="text-nirin-muted w-20">INPI (Cl. {item.ncl}):</span>
                                            {item.inpi?.status === 'available' ? (
                                                <span className="text-green-500 flex items-center gap-1">
                                                    <CheckCircle size={14} /> Disponível
                                                </span>
                                            ) : item.inpi?.status === 'unavailable' || item.inpi?.status === 'manual_check' ? (
                                                (() => {
                                                    // Check if any process is active (not extinct/archived)
                                                    const processes = item.inpi.foundProcesses || [];

                                                    // Logic: If ALL are extinct, then it's Yellow. If ANY is active (or unknown), it's Red.
                                                    const allExtinct = processes.length > 0 && processes.every(p => {
                                                        const s = (p.situation || '').toLowerCase();
                                                        return s.includes('extinto') ||
                                                            s.includes('arquivado') ||
                                                            s.includes('indeferido') ||
                                                            s.includes('cancelado') ||
                                                            s.includes('expirado');
                                                    });

                                                    const isActive = !allExtinct;

                                                    // User requested Red for active marks (same as error)
                                                    const colorClass = isActive ? "text-red-500" : "text-yellow-500";
                                                    const icon = isActive ? <XCircle size={14} /> : <AlertCircle size={14} />;
                                                    const label = isActive ? "Ocupado" : "Extinto/Arq.";

                                                    return (
                                                        <div className="flex flex-col w-full">
                                                            <div className="flex items-center justify-between">
                                                                <span className={`${colorClass} flex items-center gap-1`}>
                                                                    {icon} {processes.length} {processes.length === 1 ? 'proc.' : 'procs.'} ({label})
                                                                </span>
                                                                <button
                                                                    onClick={() => onShowINPIDetails(item)}
                                                                    className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-xs uppercase font-bold tracking-wide"
                                                                >
                                                                    <Eye size={16} /> Ver
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })()
                                            ) : (
                                                <span className="text-red-500 flex items-center gap-1" title={item.inpi?.details || "Erro na conexão"}>
                                                    <XCircle size={14} /> Erro Técnico
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NameList;
