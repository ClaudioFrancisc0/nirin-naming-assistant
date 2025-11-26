import React from 'react';
import { X, ExternalLink, Instagram, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstagramResultsModal = ({ isOpen, onClose, profile }) => {
    if (!isOpen || !profile) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-purple-50 to-pink-50">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Instagram className="text-pink-600" />
                                Perfil Encontrado
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-500"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden border-4 border-white shadow-lg">
                            {profile.image ? (
                                <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                    <User size={40} />
                                </div>
                            )}
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900">{profile.name}</h3>
                        <p className="text-nirin-orange font-medium">@{profile.username}</p>

                        <div className="mt-4 p-4 bg-gray-50 rounded-lg w-full text-sm text-gray-600">
                            {profile.details}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
                        <a
                            href={`https://instagram.com/${profile.username.replace('@', '').trim()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-medium text-sm px-6 py-2.5 rounded-full transition-colors shadow-sm hover:shadow"
                        >
                            Ver Perfil no Instagram <ExternalLink size={16} />
                        </a>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default InstagramResultsModal;
