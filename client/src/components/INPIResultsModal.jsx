import React from 'react';
import { X, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INPIResultsModal = ({ isOpen, onClose, results, name, ncl }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                Resultado INPI: <span className="text-nirin-orange">{name}</span>
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Classe NCL: <strong>{ncl}</strong>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {results && results.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-100">
                                    <AlertTriangle className="flex-shrink-0" />
                                    <div>
                                        <p className="font-medium">Foram encontrados {results.length} processos similares.</p>
                                        <p className="text-sm opacity-90">Verifique se algum deles impede o registro da sua marca.</p>
                                    </div>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                            <tr>
                                                <th className="p-3">Marca</th>
                                                <th className="p-3">Processo</th>
                                                <th className="p-3">Situação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {results.map((proc, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-3 font-medium text-gray-900">{proc.brandName}</td>
                                                    <td className="p-3 text-gray-500 font-mono text-xs">{proc.processNumber}</td>
                                                    <td className="p-3">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${proc.situation.toLowerCase().includes('arquivado') || proc.situation.toLowerCase().includes('extinto')
                                                                ? 'bg-gray-100 text-gray-600'
                                                                : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {proc.situation}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Nenhum registro exato encontrado!</h3>
                                <p className="text-gray-500 max-w-xs mt-2">
                                    Não encontramos marcas idênticas na busca básica. Isso é um ótimo sinal, mas recomenda-se uma busca fonética aprofundada.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                        <a
                            href="https://busca.inpi.gov.br/pePI/jsp/marcas/Pesquisa_classe_basica.jsp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-nirin-orange hover:text-orange-700 font-medium text-sm px-4 py-2 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                            Abrir site do INPI <ExternalLink size={16} />
                        </a>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default INPIResultsModal;
