// --- Estado do Sistema ---
// Armazena as variáveis globais do aplicativo, como preferências do usuário e histórico de conversas
const state = {
    userName: localStorage.getItem('zenith_name') || null, // Obtém o nome do usuário do armazenamento local ou define como nulo se não existir
    isDarkMode: localStorage.getItem('zenith_theme') === 'dark', // Verifica se o tema escuro está salvo no armazenamento local
    context: 'idle', // Define o contexto atual do chat: 'idle' (inativo) ou 'awaiting_name' (aguardando nome)
    chatHistory: JSON.parse(localStorage.getItem('zenith_history')) || [] // Carrega o histórico de conversas salvo ou cria um array vazio
};

// --- Dados de Intenção ---
// Define as intenções que o bot pode reconhecer e suas respostas correspondentes
const intents = {
    // Intenção de saudação
    GREETING: {
        keywords: ['oi', 'olá', 'ola', 'hey', 'bom dia', 'boa tarde', 'boa noite', 'saudações'], // Palavras que podem acionar esta intenção
        replies: () => { // Função que retorna respostas de saudação dinâmicas
            const time = new Date().getHours(); // Pega a hora atual do sistema
            let prefix = "Olá!"; // Prefixo padrão para a saudação
            if (time < 12) prefix = "Bom dia!"; // Antes do meio-dia
            else if (time < 18) prefix = "Boa tarde!"; // Entre meio-dia e 18h
            else prefix = "Boa noite!"; // Após 18h
            
            // Retorna diferentes saudações baseado se o usuário já foi identificado
            return state.userName 
                ? [`${prefix} Que bom ver você de novo, ${state.userName}!`, `Bem-vindo de volta, ${state.userName}. Como posso ajudar hoje?`]
                : [`${prefix} Eu sou o Zenith. Posso perguntar o seu nome?`, `Oi! Acho que ainda não nos conhecemos. Qual é o seu nome?`];
        }
    },
    // Intenção sobre capacidades do bot
    CAPABILITIES: {
        keywords: ['ajuda', 'o que você faz', 'recursos', 'comandos', 'qual o seu propósito'], // Palavras-chave sobre capacidades
        replies: ["Sou um assistente de IA predefinido. Posso lembrar do seu nome, contar piadas, dar a hora atual, mudar o tema e responder perguntas básicas sem nenhuma API externa!"] // Resposta fixa sobre capacidades
    },
    // Intenção sobre horário/data
    TIME: {
        keywords: ['hora', 'data', 'dia', 'relógio', 'relogio', 'qual a data', 'que dia', 'hoje'], // Palavras-chave relacionadas a tempo e data
        replies: () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const dateStr = now.toLocaleDateString([], {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
            return [
                `Agora são ${timeStr} de ${dateStr}.`, 
                `O relógio diz ${timeStr} e hoje é ${dateStr}.`
            ];
        } // Retorna a hora e data atual formatadas
    },
    
    // Intenção de piadas
    JOKE: {
        keywords: ['piada', 'engraçado', 'engracado', 'rir', 'risada'], // Palavras-chave para pedir piadas
        replies: [ // Array de piadas pré-definidas
            "Por que os programadores preferem o modo escuro? Porque a luz atrai bugs.",
            "Quantos desenvolvedores são necessários para trocar uma lâmpada? Nenhum, é um problema de hardware.",
            "Uma consulta SQL entra em um bar, vai até duas tabelas e pergunta... 'Posso me juntar a vocês?'"
        ]
    },
    // Intenção sobre identidade do bot
    IDENTITY: {
        keywords: ['quem é você', 'quem e voce', 'seu nome', 'o que você é', 'o que voce e', 'criador'], // Palavras-chave sobre identidade
        replies: ["Eu sou o Fabrício IA, um assistente leve e inteligente baseado em JS. Fui criado para mostrar que os bots podem ser rápidos e úteis mesmo sem um cérebro na nuvem massivo."] // Resposta sobre a identidade do bot
    },
    // Intenção de mudança de tema
    THEME: {
        keywords: ['modo escuro', 'modo claro', 'tema', 'fundo', 'cor'], // Palavras-chave para mudar tema
        replies: ["Claro! Atualizei o tema para você. O que achou?"] // Resposta após mudar o tema
    },
    // Intenção de agradecimento
    THANKS: {
        keywords: ['obrigado', 'obrigada', 'valeu', 'legal', 'incrível', 'incivel', 'ótimo', 'otimo'], // Palavras-chave de agradecimento
        replies: ["De nada!", "Feliz em ajudar!", "Qualquer hora! Precisa de mais alguma coisa?"] // Respostas para agradecimentos
    }
};

// --- Funções Principais da UI ---
// Funções que manipulam elementos da interface do usuário
const container = document.getElementById('chat-container'); // Elemento que contém as mensagens do chat
const inputField = document.getElementById('user-input'); // Campo de entrada de texto do usuário
const typingIndicator = document.getElementById('typing-indicator'); // Indicador visual de "digitando..."

// Função para alternar entre modo claro e escuro
function toggleTheme(force) {
    // Define o estado do tema: usa o valor forçado se fornecido, ou inverte o estado atual
    state.isDarkMode = force !== undefined ? force : !state.isDarkMode;
    // Alterna classes CSS no body para aplicar o tema
    document.body.classList.toggle('dark-mode', state.isDarkMode);
    document.body.classList.toggle('light-mode', !state.isDarkMode);
    // Alterna classe no contêiner principal do app
    document.getElementById('app-container').classList.toggle('dark', state.isDarkMode);
    
    // Altera o ícone do botão de tema baseado no modo atual
    const icon = document.getElementById('theme-icon');
    if(state.isDarkMode) {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />'; // Ícone de sol
    } else {
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />'; // Ícone de lua
    }
    
    // Salva a preferência de tema no armazenamento local
    localStorage.setItem('zenith_theme', state.isDarkMode ? 'dark' : 'light');
}

// Função para criar uma bolha de mensagem no chat
function createBubble(text, sender) {
    // Formata a hora atual como HH:MM
    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    // Cria um elemento div para a bolha da mensagem
    const bubble = document.createElement('div');
    // Define classes CSS para alinhamento (direita para usuário, esquerda para bot)
    bubble.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
    
    // Define o conteúdo HTML da bolha
    bubble.innerHTML = `
        <div class="message-bubble ${sender === 'user' ? 'user-bubble' : 'bot-bubble'} px-5 py-3.5 rounded-2xl Shadow-sm border border-black/5">
            <p class="text-sm leading-relaxed">${text}</p>
            <span class="block text-[9px] mt-1 opacity-50 text-right">${timeStr}</span>
        </div>
    `;
    
    // Adiciona a bolha ao contêiner e rola para o final
    container.appendChild(bubble);
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    
    // Salva a mensagem no histórico e no armazenamento local (mantendo apenas as últimas 50 mensagens)
    state.chatHistory.push({ text, sender, time: Date.now() });
    localStorage.setItem('zenith_history', JSON.stringify(state.chatHistory.slice(-50)));
}

// Função que lida com o envio de mensagens
async function handleChatSubmit(e) {
    // Previne o envio padrão do formulário
    e.preventDefault();
    // Obtém e limpa o texto do campo de entrada
    const text = inputField.value.trim();
    if (!text) return; // Se não houver texto, não faz nada

    // Limpa o campo de entrada e exibe a mensagem do usuário
    inputField.value = '';
    createBubble(text, 'user');

    // Mostra o indicador de digitação e rola o chat
    typingIndicator.classList.remove('hidden');
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });

    // Simula um atraso de processamento antes da resposta
    setTimeout(() => {
        // Esconde o indicador de digitação e processa a resposta
        typingIndicator.classList.add('hidden');
        processResponse(text);
    }, 600 + Math.random() * 800); // Atraso aleatório entre 600-1400ms
}

// Função principal que processa a entrada do usuário e gera respostas
function processResponse(input) {
    // Converte o texto para minúsculas para facilitar a correspondência
    const lowInput = input.toLowerCase();
    
    // 1. Lógica para capturar nomes de usuários
    if (state.context === 'awaiting_name' || (lowInput.includes('meu nome é') && !state.userName)) {
        // Extrai o nome da entrada do usuário
        let name = input.split(' ').pop().replace(/[?!.]/g, '');
        if (lowInput.includes('meu nome é')) name = input.split('é ').pop();
        
        // Salva o nome no estado e no armazenamento local
        state.userName = name;
        localStorage.setItem('zenith_name', name);
        state.context = 'idle'; // Reseta o contexto
        // Responde com uma saudação personalizada
        return createBubble(`Prazer em conhecê-lo, ${name}! Vou me lembrar disso. Como posso ajudar você hoje?`, 'bot');
    }

    // 2. Lógica para mudança de tema
    if (lowInput.includes('escuro') || lowInput.includes('claro')) {
        // Define se deve mudar para tema escuro ou claro
        const isDark = lowInput.includes('escuro');
        toggleTheme(isDark); // Aplica a mudança de tema
        return createBubble(intents.THEME.replies[0], 'bot'); // Responde sobre a mudança de tema
    }

    // 3. Procura por correspondência de intenções
    for (const key in intents) {
        const intent = intents[key];
        // Verifica se alguma palavra-chave da intenção está na entrada do usuário
        if (intent.keywords.some(k => lowInput.includes(k))) {
            // Obtém o pool de respostas (executa função se for o caso)
            const pool = typeof intent.replies === 'function' ? intent.replies() : intent.replies;
            const response = pool[Math.floor(Math.random() * pool.length)]; // Seleciona uma resposta aleatória
            
            // Se for uma saudação e o usuário não tem nome, define o contexto para aguardar nome
            if (key === 'GREETING' && !state.userName) state.context = 'awaiting_name';
            
            return createBubble(response, 'bot'); // Exibe a resposta
        }
    }

    // 4. Resposta padrão caso nenhuma intenção corresponda
    const fallbacks = [
        "Não tenho certeza sobre isso. Tente perguntar sobre a hora, minhas capacidades ou uma piada!",
        "Isso está um pouco além do meu escopo predefinido. Talvez tentar 'ajuda' para ver o que eu posso fazer?",
        "Interessante! Me conte mais, ou peça uma piada rápida!"
    ];
    createBubble(fallbacks[Math.floor(Math.random() * fallbacks.length)], 'bot');
}

// Função para preencher o campo de entrada com texto
function fillInput(text) {
    inputField.value = text; // Define o valor do campo
    inputField.focus(); // Foca no campo para digitação imediata
}

// Função para limpar o histórico de conversas
function clearChat() {
    // Solicita confirmação antes de limpar
    if(confirm("Limpar histórico de conversas?")) {
        container.innerHTML = ''; // Limpa o contêiner de mensagens
        state.chatHistory = []; // Limpa o histórico no estado
        localStorage.removeItem('zenith_history'); // Remove do armazenamento local
        createBubble("Sistema reiniciado. Memória limpa. Como posso ajudar?", 'bot'); // Mensagem de confirmação
    }
}

// --- Inicialização ---
// Código executado quando a página é carregada
window.onload = () => {
    // Aplica o tema salvo ao carregar
    toggleTheme(state.isDarkMode);
    
    // Se houver histórico de mensagens, carrega-as
    if (state.chatHistory.length > 0) {
        state.chatHistory.forEach(msg => {
            // Cria elementos para cada mensagem do histórico
            const bubble = document.createElement('div');
            bubble.className = `flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`;
            bubble.innerHTML = `
                <div class="message-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'} px-5 py-3.5 rounded-2xl Shadow-sm border border-black/5">
                    <p class="text-sm leading-relaxed">${msg.text}</p>
                    <span class="block text-[9px] mt-1 opacity-50 text-right">${new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            `;
            container.appendChild(bubble);
        });
        container.scrollTop = container.scrollHeight; // Rola para o final
    } else {
        // Se não h histórico, exibe mensagem de boas-vindas
        createBubble("Olá! Eu sou o Fabrício IA. Sou um assistente de IA completamente local. Como está sendo o seu dia?", 'bot');
    }
    
    // Foca no campo de entrada ao carregar
    inputField.focus();
};
