import React from 'react';
import { NCL_CLASSES } from '../constants/nclClasses';
import { X } from 'lucide-react';

const NCLSelector = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-nirin-card border border-nirin-muted/20 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
                <div className="p-4 border-b border-nirin-muted/20 flex justify-between items-center">
                    <h3 className="text-nirin-text font-semibold text-lg">Selecione a Classe (NCL)</h3>
                    <button onClick={onClose} className="text-nirin-muted hover:text-nirin-orange transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-2 flex-1">
                    <div className="grid gap-2">
                        {NCL_CLASSES.map((ncl) => (
                            <button
                                key={ncl.id}
                                onClick={() => onSelect(ncl.id)}
                                className="text-left px-4 py-3 rounded-md hover:bg-nirin-orange/10 hover:text-nirin-orange transition-colors text-nirin-text/80 text-sm border border-transparent hover:border-nirin-orange/20"
                            >
                                <span className="font-bold mr-2">{ncl.id}.</span>
                                {ncl.label.split(': ')[1]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NCLSelector;
