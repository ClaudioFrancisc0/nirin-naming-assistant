const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
// Ensure key is present
if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing in environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateResponse(message, history = []) {
    // Fallback Chain:
    // 1. gemini-3-pro-preview (Latest, but low quota)
    // 2. gemini-2.5-flash-preview-09-2025 (Modern Flash, fast, high quota)
    // 3. gemini-2.0-flash-thinking-exp (Smart fallback)
    const modelChain = [
        "gemini-3-pro-preview",
        "gemini-2.5-flash-preview-09-2025",
        "gemini-2.0-flash-thinking-exp"
    ];

    console.log(`[Gemini] Generating response...`);

    async function tryGenerate(modelName) {
        console.log(`[Gemini] Attempting with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const systemInstruction = `
Você é o Assistente de Naming da Nirin, uma agência especializada em criação de nomes de marcas.
Sua função é ajudar o usuário a criar nomes criativos, estratégicos e disponíveis.

DIRETRIZES:
1.  **Metodologia Nirin**: Foque em nomes curtos, sonoros, fáceis de soletrar e com disponibilidade de domínio .com ou .com.br (se possível verificar mentalmente, mas não prometa).
2.  **Formato de Resposta**: Gere APENAS uma lista numerada com os nomes sugeridos.
3.  **NÃO INCLUA EXPLICAÇÕES OU JUSTIFICATIVAS**. O usuário quer ver apenas os nomes para facilitar a leitura.
4.  **Formatação Limpa**: NÃO use negrito (**), itálico ou qualquer formatação. Apenas o nome puro. Ex: 1. Nome
5.  **Tom de Voz**: Profissional e direto.
6.  **Contexto**: Se o usuário não der detalhes, faça perguntas estratégicas antes de sugerir.

IMPORTANTE:
Apresente SOMENTE a lista de nomes, um abaixo do outro, sem texto adicional entre eles.
`;

        const chatHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.parts ? msg.parts[0].text : msg.content }] // Handle both formats if needed
        }));

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemInstruction + "\n\nEntendido. Aguardando o briefing." }],
                },
                {
                    role: "model",
                    parts: [{ text: "Entendido. Sou o Assistente de Naming da Nirin. Por favor, me conte sobre o projeto." }],
                },
                ...chatHistory
            ],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();
        console.log(`[Gemini] Success with ${modelName}. Response length: ${text.length}`);
        return text;
    }

    let lastError = null;

    for (const modelName of modelChain) {
        try {
            return await tryGenerate(modelName);
        } catch (error) {
            console.error(`[Gemini] Error with ${modelName}:`, error.message);
            lastError = error;

            // If it's a fatal auth error, don't retry? No, auth is same for all.
            // But we retry for 404 (Not Found), 429 (Quota), 503 (Service Unavailable).
            // We continue to next model in chain.
        }
    }

    // If all failed
    return `Desculpe, não consegui conectar com nenhuma das minhas versões de inteligência (${modelChain.join(', ')}). Erro final: ${lastError ? lastError.message : 'Desconhecido'}.`;
}

module.exports = { generateResponse };
