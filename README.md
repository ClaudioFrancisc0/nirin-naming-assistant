# Nirin Naming Assistant - Deployment Ready! 🚀

Este projeto está configurado para deploy no **Render.com**.

## Estrutura

```
nirin-naming-assistant/
├── client/          # Frontend React (Vite)
├── server/          # Backend Express + Puppeteer
└── render.yaml      # Configuração do Render.com
```

## Desenvolvimento Local

### Backend
```bash
cd server
npm install
node index.js
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## Deploy no Render.com

Siga o guia completo em: `render_deployment_guide.md`

### Requisitos
- Conta no Render.com (gratuita)
- Código em repositório Git (GitHub/GitLab)
- API Keys configuradas

### Variáveis de Ambiente Necessárias

**Backend (`nirin-naming-api`):**
- `GEMINI_API_KEY` - Google Gemini API Key
- `INPI_USER` - Usuário do INPI
- `INPI_PASS` - Senha do INPI

**Frontend (`nirin-naming-app`):**
- `VITE_API_URL` - URL do backend (ex: https://nirin-naming-api.onrender.com)

## Tecnologias

- **Frontend**: React 19, Vite, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, Puppeteer
- **AI**: Google Gemini API
- **Scraping**: Puppeteer (INPI, Instagram)

## Funcionalidades

✅ Chat com IA para geração de nomes  
✅ Verificação de disponibilidade no INPI  
✅ Verificação de disponibilidade no Instagram  
✅ Interface com identidade visual Nirin  
✅ Scroll independente por coluna  
✅ Deploy-ready para Render.com  

## Suporte

Para dúvidas sobre o deploy, consulte o guia ou entre em contato.
# nirin-naming-assistant
