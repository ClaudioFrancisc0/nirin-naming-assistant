import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Bot, User, Loader2 } from 'lucide-react';
import { sendMessage } from '../api';
import { motion } from 'framer-motion';

const ChatInterface = ({ onAddName }) => {
    const [messages, setMessages] = useState([
        { role: 'model', content: 'Olá! Sou o Assistente de Naming da Nirin. Como posso ajudar no seu projeto hoje? Me conte um pouco sobre a marca.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Filter history to send to API (exclude last user message which is sent separately if needed, 
            // but our API expects full history or just previous. Let's send previous history)
            const history = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));

            const responseText = await sendMessage(input, history);

            setMessages(prev => [...prev, { role: 'model', content: responseText }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', content: 'Desculpe, ocorreu um erro ao processar sua mensagem.' }]);
        } finally {
            setLoading(false);
        }
    };

    // Function to detect potential names in the text (simple heuristic: bullet points or quotes)
    // and allow adding them. For now, we just render the text.
    // A more advanced version would parse the markdown list.

    // We will render the message with a simple parser to detect lines starting with "- " or "1. "
    // and add a "+" button next to them.

    const renderMessageContent = (content, role) => {
        if (!content) return null;
        if (role === 'user') return <p className="whitespace-pre-wrap">{content}</p>;

        // Split by lines to find list items
        return (
            <div className="space-y-2">
                {content.toString().split('\n').map((line, i) => {
                    const isListItem = line.trim().match(/^(\d+\.|-|\*)\s+(.+)/);

                    if (isListItem) {
                        // Clean the line from markdown bold syntax for display
                        const cleanLine = line.replace(/\*\*/g, '');

                        // Extract the name (assuming the first bold part or just the text before a colon)
                        // Example: "1. **Apex**: Description..." -> Name: Apex
                        // Since we are stripping **, we just take the part after the number/bullet
                        const potentialName = isListItem[2].split(':')[0].replace(/\*\*/g, '').trim();

                        return (
                            <div
                                key={i}
                                className="flex items-start gap-2 group hover:bg-blue-50 p-1.5 rounded-lg -mx-1.5 cursor-pointer transition-colors"
                                onClick={() => onAddName(potentialName)}
                            >
                                <span className="flex-1 whitespace-pre-wrap">{cleanLine}</span>
                                <button
                                    className="opacity-0 group-hover:opacity-100 p-1 text-nirin-orange hover:bg-nirin-orange/10 rounded transition-all"
                                    title="Adicionar à lista"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        );
                    }
                    return <p key={i} className="whitespace-pre-wrap min-h-[1.5em]">{line}</p>;
                })}
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-nirin-dark relative overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, index) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={index}
                        className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-nirin-orange flex items-center justify-center flex-shrink-0">
                                <Bot size={18} className="text-white" />
                            </div>
                        )}

                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                            ? 'bg-nirin-card border border-nirin-muted/20 text-nirin-text rounded-tr-none'
                            : 'bg-transparent text-nirin-text/90 rounded-tl-none'
                            }`}>
                            {renderMessageContent(msg.content, msg.role)}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-nirin-muted/20 flex items-center justify-center flex-shrink-0">
                                <User size={18} className="text-nirin-text" />
                            </div>
                        )}
                    </motion.div>
                ))}
                {loading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-nirin-orange flex items-center justify-center">
                            <Bot size={18} className="text-white" />
                        </div>
                        <div className="p-4 bg-transparent text-nirin-muted italic flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            Pensando...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-nirin-dark border-t border-nirin-muted/10">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Descreva o projeto ou peça sugestões..."
                        className="w-full bg-nirin-card text-nirin-text border border-nirin-muted/20 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-nirin-orange/50 focus:ring-1 focus:ring-nirin-orange/50 transition-all placeholder:text-nirin-muted/50"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-nirin-orange rounded-full flex items-center justify-center text-white hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-nirin-orange transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
