// --- Variáveis de Estado ---
let currentPlayer = localStorage.getItem('spellingGameCurrentUser') || ""; // Armazena o nome do jogador atual, vazio se nenhum estiver logado
let words = { portugues: [], matematica: [], ingles: [], ciencias: [], custom: [] }; // Armazena palavras/perguntas por categoria
let currentQuestion = { type: '', prompt: '', answer: '', category: '' }; // Armazena a pergunta atual do jogo
let score = 0; // Armazena a pontuação do jogador
let performanceData = []; // Armazena dados de desempenho do jogador
let performanceChart = null; // Referência para o gráfico de desempenho
let startTime = 0; // Armazena o tempo inicial da resposta
let responseTimeData = []; // Armazena tempos de resposta do jogador
let wordLogs = {}; // Registra estatísticas de cada palavra/pergunta
let chartType = 'line'; // Define o tipo de gráfico padrão
let chartTheme = 'light'; // Define o tema do gráfico (claro/escuro)
let isWaitingForNext = false; // Indica se aguarda próxima pergunta
let config = { difficulty: 'medium', activeSubjects: ['portugues', 'matematica', 'ingles', 'ciencias'] }; // Configurações do jogo
let speechRate = 1; // Define a velocidade da fala
let wordRevealed = false; // Indica se a palavra atual foi revelada
const MAX_HISTORY_SIZE = 100; // Define o tamanho máximo do histórico

// --- Dados de Matéria Personalizada ---
let customSubjectName = "Matéria Importada"; // Nome padrão para matérias personalizadas
let customSubjectColor = "#e74c3c"; // Cor padrão para matérias personalizadas

// --- Dados de Pronúncia em Inglês ---
const pronunciationData = { // Dicionário com pronúncias fonéticas de palavras em inglês
    "dog": "dɔːg", "cat": "kæt", "house": "haʊs", "car": "kɑːr", "tree": "triː",
    "water": "ˈwɔːtər", "fire": "ˈfaɪər", "earth": "ɜːrθ", "air": "er", "sun": "sʌn",
    "moon": "muːn", "star": "stɑːr", "computer": "kəmˈpjuːtər", "book": "bʊk",
    "sister": "ˈsɪstər", "school": "skuːl", "friend": "frɛnd", "brother": "ˈbrʌðər",
    "city": "ˈsɪti", "world": "wɜːrld", "development": "dɪˈvɛləpmənt", "knowledge": "ˈnɒlɪdʒ",
    "apple": "ˈæpəl", "family": "ˈfæmɪli", "heart": "hɑːrt", "light": "laɪt",
    "time": "taɪm", "year": "jɪr", "people": "ˈpiːpəl", "way": "weɪ",
    "day": "deɪ", "man": "mæn", "woman": "ˈwʊmən", "child": "tʃaɪld",
    "eye": "aɪ", "history": "ˈhɪstəri", "power": "ˈpaʊər", "fish": "fɪʃ",
    "bird": "bɜːrd", "mountain": "ˈmaʊntən", "forest": "ˈfɒrɪst", "river": "ˈrɪvər"
};

// --- Registro de Matérias ---
const subjectRegistry = { // Registro de todas as matérias disponíveis
    portugues: { name: "Português", color: "cat-portugues", generator: generatePortugueseQuestion, defaultWords: ["bola", "gato", "sol", "mesa", "borboleta", "elefante", "girassol", "computador", "paralelepípedo", "extraordinário", "inconstitucional", "conhecimento", "abelha", "cadeira", "janela", "computador", "escada", "felicidade", "guitarra", "horizonte", "ilha", "juventude", "livraria", "montanha", "natureza", "orquídea", "palavra", "queijo", "relógio", "sapateira", "travesseiro", "universidade", "ventilador", "xarope", "zebra"] },
    matematica: { name: "Matemática", color: "cat-matematica", generator: generateMathQuestion },
    ingles: { name: "Inglês", color: "cat-ingles", generator: generateEnglishQuestion, defaultWords: ["dog", "cat", "house", "car", "tree", "water", "fire", "earth", "air", "sun", "moon", "star", "computer", "book"] },
    ciencias: { name: "Ciências", color: "cat-ciencias", generator: generateScienceQuestion },
    custom: { name: customSubjectName, color: "cat-custom", generator: generateCustomQuestion }
};

// --- Geradores de Perguntas ---
function generateMathQuestion() { // Gera uma pergunta de matemática
    const diff = config.difficulty; // Obtém dificuldade atual
    let a, b; // Variáveis para os números da operação
    const ops = [ // Array de operações possíveis
        { symbol: '+', func: (a, b) => a + b },
        { symbol: '-', func: (a, b) => a - b },
        { symbol: '×', func: (a, b) => a * b },
        { symbol: '÷', func: (a, b) => a / b }
    ];
    if (diff === 'easy') { a = Math.floor(Math.random() * 10) + 1; b = Math.floor(Math.random() * 10) + 1; } // Números fáceis
    else if (diff === 'medium') { a = Math.floor(Math.random() * 50) + 10; b = Math.floor(Math.random() * 50) + 10; } // Números médios
    else { a = Math.floor(Math.random() * 100) + 50; b = Math.floor(Math.random() * 100) + 50; } // Números difíceis
    
    const op = ops[Math.floor(Math.random() * ops.length)]; // Seleciona operação aleatória
    if (op.symbol === '-' && b > a) [a, b] = [b, a]; // Garante resultado positivo para subtração
    if (op.symbol === '×' && diff === 'hard') { a = Math.floor(Math.random() * 15) + 5; b = Math.floor(Math.random() * 15) + 5; } // Números específicos para multiplicação difícil
    if (op.symbol === '÷') { b = Math.floor(Math.random() * 10) + 1; a = b * (Math.floor(Math.random() * 10) + 1); } // Garante divisão exata
    
    return { type: 'math', category: 'Matemática', prompt: `Quanto é ${a} ${op.symbol} ${b}?`, answer: op.func(a, b).toString() }; // Retorna objeto pergunta
}

function generateEnglishQuestion() { // Gera pergunta de inglês
    const vocab = { // Vocabulário por nível de dificuldade
        easy: [ 
            {pt: "Cachorro", en: "Dog"}, {pt: "Gato", en: "Cat"}, {pt: "Sol", en: "Sun"},
            {pt: "Árvore", en: "Tree"}, {pt: "Água", en: "Water"}, {pt: "Fogo", en: "Fire"},
            {pt: "Terra", en: "Earth"}, {pt: "Ar", en: "Air"}, {pt: "Lua", en: "Moon"},
            {pt: "Estrela", en: "Star"}, {pt: "Livro", en: "Book"}, {pt: "Peixe", en: "Fish"},
            {pt: "Pássaro", en: "Bird"}, {pt: "Maçã", en: "Apple"}, {pt: "Coração", en: "Heart"}
        ],
        medium: [ 
            {pt: "Irmã", en: "Sister"}, {pt: "Escola", en: "School"}, {pt: "Amigo", en: "Friend"},
            {pt: "Irmão", en: "Brother"}, {pt: "Cidade", en: "City"}, {pt: "Mundo", en: "World"},
            {pt: "Família", en: "Family"}, {pt: "Luz", en: "Light"}, {pt: "Tempo", en: "Time"},
            {pt: "Ano", en: "Year"}, {pt: "Pessoas", en: "People"}, {pt: "Caminho", en: "Way"},
            {pt: "Dia", en: "Day"}, {pt: "Homem", en: "Man"}, {pt: "Mulher", en: "Woman"}
        ],
        hard: [ 
            {pt: "Desenvolvimento", en: "Development"}, {pt: "Conhecimento", en: "Knowledge"},
            {pt: "Criança", en: "Child"}, {pt: "Olho", en: "Eye"}, {pt: "História", en: "History"},
            {pt: "Poder", en: "Power"}, {pt: "Montanha", en: "Mountain"}, {pt: "Floresta", en: "Forest"},
            {pt: "Rio", en: "River"}, {pt: "Universidade", en: "University"}, {pt: "Computador", en: "Computer"},
            {pt: "Sociedade", en: "Society"}, {pt: "Ambiente", en: "Environment"}, {pt: "Educação", en: "Education"}
        ]
    };
    const word = vocab[config.difficulty][Math.floor(Math.random() * vocab[config.difficulty].length)]; // Seleciona palavra aleatória
    return { type: 'english', category: 'Inglês', prompt: `Traduza para o inglês: ${word.pt}`, answer: word.en.toLowerCase() }; // Retorna objeto pergunta
}

function generatePortugueseQuestion() { // Gera pergunta de português
    const pool = words.portugues.length > 0 ? words.portugues : subjectRegistry.portugues.defaultWords; // Usa palavras personalizadas ou padrão
    const word = pool[Math.floor(Math.random() * pool.length)]; // Seleciona palavra aleatória
    return { type: 'portuguese', category: 'Português', prompt: "Ouça a palavra:", answer: word.toLowerCase() }; // Retorna objeto pergunta
}

function generateScienceQuestion() { // Gera pergunta de ciências
    const questions = { // Banco de perguntas por dificuldade
        easy: [ 
            {q: "Qual o nome do nosso planeta?", a: "terra"}, {q: "O que nasce primeiro, a galinha ou o ovo? (responda ovo)", a: "ovo"},
            {q: "Qual é o maior planeta do sistema solar?", a: "jupiter"}, {q: "Qual é a estrela mais próxima da Terra?", a: "sol"},
            {q: "Qual gás as plantas liberam?", a: "oxigenio"}, {q: "Como chamamos a chuva congelada?", a: "granizo"},
            {q: "Qual é o animal terrestre mais rápido?", a: "guepardo"}, {q: "Qual é o maior animal do mundo?", a: "baleia"},
            {q: "Onde vivem os peixes?", a: "agua"}, {q: "Qual fruta é conhecida por ter muita vitamina C?", a: "laranja"}
        ],
        medium: [ 
            {q: "Qual o nome do processo que as plantas usam para fazer comida?", a: "fotossintese"}, {q: "Qual gás respiramos?", a: "oxigenio"},
            {q: "Qual é o órgão responsável por bombear o sangue?", a: "coracao"}, {q: "Qual é o osso mais longo do corpo humano?", a: "femur"},
            {q: "Qual planeta é conhecido como Planeta Vermelho?", a: "marte"}, {q: "Qual é a unidade de medida da força?", a: "newton"},
            {q: "Qual é a parte da planta que faz a fotossíntese?", a: "folha"}, {q: "Como se chama o profissional que estuda o espaço?", a: "astronauta"},
            {q: "Qual é o estado da água a 0 graus Celsius?", a: "solido"}, {q: "Qual é o símbolo químico do ouro?", a: "au"}
        ],
        hard: [ 
            {q: "Qual a fórmula química da água?", a: "h2o"}, {q: "Qual o nome da força que nos prende ao chão?", a: "gravidade"},
            {q: "Qual é o número atômico do Carbono?", a: "6"}, {q: "Qual é a segunda lei de Newton?", a: "forca"},
            {q: "Qual é a parte da célula responsável pela produção de energia?", a: "mitocôndria"}, {q: "Qual é o nome do processo de divisão celular?", a: "mitose"},
            {q: "Qual gás é responsável pelo efeito estufa?", a: "co2"}, {q: "Qual é o maior órgão do corpo humano?", a: "pele"},
            {q: "Qual é a velocidade da luz no vácuo em m/s? (aproximado em milhões)", a: "300"}, {q: "Qual é o nome da galáxia onde vivemos?", a: "via lactea"}
        ]
    };
    const qObj = questions[config.difficulty][Math.floor(Math.random() * questions[config.difficulty].length)]; // Seleciona pergunta aleatória
    return { type: 'science', category: 'Ciências', prompt: qObj.q, answer: qObj.a }; // Retorna objeto pergunta
}

function generateCustomQuestion() { // Gera pergunta de matéria personalizada
    if (words.custom.length === 0) return { type: 'error', category: 'Erro', prompt: 'Nenhuma matéria importada ainda!', answer: '' }; // Verifica se há perguntas
    const qObj = words.custom[Math.floor(Math.random() * words.custom.length)]; // Seleciona pergunta aleatória
    return { type: 'custom', category: customSubjectName, prompt: qObj.question, answer: qObj.answer.toLowerCase() }; // Retorna objeto pergunta
}

function getNextQuestion() { // Seleciona próxima pergunta
    const active = config.activeSubjects; // Obtém matérias ativas
    if (active.length === 0) return { type: 'error', category: 'Erro', prompt: 'Selecione ao menos uma disciplina nas configurações!', answer: '' }; // Verifica se há matérias ativas
    const chosenSubjectKey = active[Math.floor(Math.random() * active.length)]; // Seleciona matéria aleatória
    return subjectRegistry[chosenSubjectKey].generator(); // Retorna pergunta gerada
}

// --- Lógica Principal ---
function getPlayerKey(key) { return currentPlayer ? `spellingGame_${currentPlayer}_${key}` : `spellingGame_${key}`; } // Gera chave de armazenamento do jogador

function loadPlayerData() { // Carrega dados do jogador
    words = JSON.parse(localStorage.getItem(getPlayerKey('Words'))) || { portugues: [], matematica: [], ingles: [], ciencias: [], custom: [] }; // Carrega palavras
    score = parseInt(localStorage.getItem(getPlayerKey('Score'))) || 0; // Carrega pontuação
    performanceData = JSON.parse(localStorage.getItem(getPlayerKey('PerformanceData'))) || []; // Carrega dados de desempenho
    responseTimeData = JSON.parse(localStorage.getItem(getPlayerKey('ResponseTimeData'))) || []; // Carrega tempos de resposta
    wordLogs = JSON.parse(localStorage.getItem(getPlayerKey('WordLogs'))) || {}; // Carrega registros de palavras
    chartType = localStorage.getItem(getPlayerKey('ChartType')) || 'line'; // Carrega tipo de gráfico
    chartTheme = localStorage.getItem(getPlayerKey('ChartTheme')) || 'light'; // Carrega tema do gráfico
    config = JSON.parse(localStorage.getItem(getPlayerKey('Config'))) || { difficulty: 'medium', activeSubjects: Object.keys(subjectRegistry) }; // Carrega configurações
    speechRate = parseFloat(localStorage.getItem(getPlayerKey('SpeechRate'))) || 1; // Carrega velocidade de fala
    wordRevealed = false; // Reseta estado de revelação
    
    customSubjectName = localStorage.getItem(getPlayerKey('CustomSubjectName')) || "Matéria Importada"; // Carrega nome da matéria personalizada
    customSubjectColor = localStorage.getItem(getPlayerKey('CustomSubjectColor')) || "#e74c3c"; // Carrega cor da matéria personalizada
    subjectRegistry.custom.name = customSubjectName; // Atualiza registro

    document.getElementById('score').innerText = score; // Atualiza pontuação na UI
    document.getElementById('speechRate').value = speechRate; // Atualiza velocidade de fala na UI
    document.getElementById('rateValue').textContent = speechRate.toFixed(1) + 'x'; // Atualiza texto da velocidade
    updateLogsDisplay(); // Atualiza display de registros
    updateCombinedChart(); // Atualiza gráfico
    applyConfigToUI(); // Aplica configurações na UI
    updateSubjectPanel(); // Atualiza painel de matérias
}

function applyConfigToUI() { // Aplica configurações na interface
    document.getElementById('difficultySelect').value = config.difficulty; // Atualiza seleção de dificuldade
    updateSubjectPanel(); // Atualiza painel de matérias
}

function updateSubjectPanel() { // Atualiza painel de matérias
    const panel = document.getElementById('subjectPanel'); // Obtém painel
    panel.innerHTML = ''; // Limpa painel
    
    for (const [key, subject] of Object.entries(subjectRegistry)) { // Itera matérias
        const card = document.createElement('div'); // Cria cartão da matéria
        card.className = `subject-card ${config.activeSubjects.includes(key) ? 'active' : ''}`; // Define classe
        
        const header = document.createElement('h3'); // Cabeçalho do cartão
        header.className = subject.color; // Define cor
        header.textContent = subject.name; // Define nome
        if (key === 'custom') header.style.backgroundColor = customSubjectColor; // Define cor personalizada
        
        const controls = document.createElement('div'); // Controles do cartão
        controls.className = 'subject-controls';
        
        const count = document.createElement('div'); // Contador de palavras
        count.className = 'subject-count';
        count.textContent = key === 'custom' ? `${words.custom.length} perguntas` : `${words[key].length} palavras`;
        
        const toggle = document.createElement('div'); // Botão de ativação
        toggle.className = `subject-toggle ${config.activeSubjects.includes(key) ? 'active' : ''}`;
        toggle.textContent = config.activeSubjects.includes(key) ? 'Ativo' : 'Inativo';
        toggle.onclick = () => toggleSubject(key); // Define ação
        
        controls.appendChild(count); // Adiciona elementos
        controls.appendChild(toggle);
        card.appendChild(header);
        card.appendChild(controls);
        panel.appendChild(card); // Adiciona cartão ao painel
    }
}

function toggleSubject(subjectKey) { // Alterna estado da matéria
    const index = config.activeSubjects.indexOf(subjectKey); // Procura matéria
    if (index > -1) config.activeSubjects.splice(index, 1); // Remove se ativa
    else config.activeSubjects.push(subjectKey); // Adiciona se inativa
    saveConfig(); // Salva configurações
    updateSubjectPanel(); // Atualiza painel
}

function saveConfig() { // Salva configurações
    config.difficulty = document.getElementById('difficultySelect').value; // Obtém dificuldade
    speechRate = parseFloat(document.getElementById('speechRate').value); // Obtém velocidade
    saveDataToCache(); // Salva dados
}

function registerPlayer() { // Registra novo jogador
    const name = document.getElementById('playerNameInput').value.trim(); // Obtém nome
    if (name === "") return alert("Por favor, digite um nome válido."); // Valida nome
    selectPlayer(name); // Seleciona jogador
}

function selectPlayer(name) { // Seleciona jogador existente
    currentPlayer = name.toLowerCase(); // Define nome
    localStorage.setItem('spellingGameCurrentUser', currentPlayer); // Salva nome
    let players = JSON.parse(localStorage.getItem('spellingGamePlayers')) || []; // Obtém lista de jogadores
    if (!players.includes(currentPlayer)) { // Se novo jogador
        players.push(currentPlayer); // Adiciona à lista
        localStorage.setItem('spellingGamePlayers', JSON.stringify(players)); // Salva lista
    }
    document.getElementById('playerModal').classList.remove('active'); // Fecha modal
    document.getElementById('playerInfoBar').style.display = 'flex'; // Mostra barra de info
    document.getElementById('currentPlayerName').innerText = currentPlayer; // Mostra nome
    loadPlayerData(); // Carrega dados
}

function logoutPlayer() { // Desloga jogador
    if (performanceChart) { performanceChart.destroy(); performanceChart = null; } // Destroi gráfico
    document.getElementById('playerInfoBar').style.display = 'none'; // Esconde barra
    document.getElementById('playerModal').classList.add('active'); // Mostra modal
    document.getElementById('playerNameInput').value = ''; // Limpa input
    updatePlayerList(); // Atualiza lista
}

function updatePlayerList() { // Atualiza lista de jogadores
    const players = JSON.parse(localStorage.getItem('spellingGamePlayers')) || []; // Obtém lista
    const listElement = document.getElementById('playerList'); // Obtém elemento
    const sectionElement = document.getElementById('existingPlayersSection'); // Obtém seção
    if (players.length > 0) { // Se há jogadores
        sectionElement.style.display = 'block'; // Mostra seção
        listElement.innerHTML = ''; // Limpa lista
        players.forEach(player => { // Para cada jogador
            const li = document.createElement('li'); // Cria item
            li.textContent = player; // Define texto
            li.onclick = () => selectPlayer(player); // Define ação
            listElement.appendChild(li); // Adiciona à lista
        });
    } else { sectionElement.style.display = 'none'; } // Esconde seção vazia
}

if (currentPlayer) { // Se há jogador atual
    document.getElementById('playerModal').classList.remove('active'); // Fecha modal
    document.getElementById('playerInfoBar').style.display = 'flex'; // Mostra barra
    document.getElementById('currentPlayerName').innerText = currentPlayer; // Mostra nome
    loadPlayerData(); // Carrega dados
} else { updatePlayerList(); } // Senão, atualiza lista

function saveDataToCache() { // Salva dados no cache
    if (performanceData.length > MAX_HISTORY_SIZE) performanceData = performanceData.slice(-MAX_HISTORY_SIZE); // Limita histórico
    if (responseTimeData.length > MAX_HISTORY_SIZE) responseTimeData = responseTimeData.slice(-MAX_HISTORY_SIZE); // Limita histórico
    localStorage.setItem(getPlayerKey('Words'), JSON.stringify(words)); // Salva palavras
    localStorage.setItem(getPlayerKey('Score'), score.toString()); // Salva pontuação
    localStorage.setItem(getPlayerKey('PerformanceData'), JSON.stringify(performanceData)); // Salva desempenho
    localStorage.setItem(getPlayerKey('ResponseTimeData'), JSON.stringify(responseTimeData)); // Salva tempos
    localStorage.setItem(getPlayerKey('WordLogs'), JSON.stringify(wordLogs)); // Salva registros
    localStorage.setItem(getPlayerKey('ChartType'), chartType); // Salva tipo de gráfico
    localStorage.setItem(getPlayerKey('ChartTheme'), chartTheme); // Salva tema
    localStorage.setItem(getPlayerKey('Config'), JSON.stringify(config)); // Salva configurações
    localStorage.setItem(getPlayerKey('SpeechRate'), speechRate.toString()); // Salva velocidade
    localStorage.setItem(getPlayerKey('CustomSubjectName'), customSubjectName); // Salva nome personalizado
    localStorage.setItem(getPlayerKey('CustomSubjectColor'), customSubjectColor); // Salva cor personalizada
}

function clearSubjectData() { // Limpa dados da matéria
    if (!confirm('Tem certeza de que deseja limpar o progresso da disciplina selecionada?')) return; // Confirma
    const filter = document.getElementById('subjectFilter').value; // Obtém filtro
    if (filter === 'all') { // Se todas as matérias
        if (!confirm('Isso limpará TODOS os dados de todas disciplinas. Continuar?')) return; // Confirma
        ['Words', 'Score', 'PerformanceData', 'ResponseTimeData', 'WordLogs', 'ChartType', 'ChartTheme', 'Config', 'SpeechRate', 'CustomSubjectName', 'CustomSubjectColor']
            .forEach(k => localStorage.removeItem(getPlayerKey(k))); // Remove todos os dados
        words = { portugues: [], matematica: [], ingles: [], ciencias: [], custom: [] }; // Reseta palavras
        score = 0; performanceData = []; responseTimeData = []; wordLogs = {}; // Reseta dados
        config = { difficulty: 'medium', activeSubjects: Object.keys(subjectRegistry) }; // Reseta config
        speechRate = 1; customSubjectName = "Matéria Importada"; customSubjectColor = "#e74c3c"; // Reseta personalizado
    } else { // Matéria específica
        words[filter] = []; // Limpa palavras
        const regKey = filter === 'custom' ? customSubjectName : subjectRegistry[filter].name; // Obtém nome
        const logs = Object.keys(wordLogs).filter(k => wordLogs[k].category === regKey); // Filtra registros
        logs.forEach(k => delete wordLogs[k]); // Remove registros
        performanceData = performanceData.filter(d => d.category !== regKey); // Remove desempenho
        responseTimeData = responseTimeData.filter(d => d.category !== regKey); // Remove tempos
    }
    document.getElementById('score').innerText = score; // Atualiza pontuação
    document.getElementById('gameArea').style.display = 'none'; // Esconde área
    document.getElementById('feedback').innerText = ''; // Limpa feedback
    document.getElementById('wordDisplay').innerHTML = ''; // Limpa display
    document.getElementById('phoneticDisplay').innerHTML = ''; // Limpa fonética
    if (performanceChart) { performanceChart.destroy(); performanceChart = null; } // Destroi gráfico
    updateLogsDisplay(); // Atualiza registros
    updateSubjectPanel(); // Atualiza painel
    saveDataToCache(); // Salva dados
}

function clearCachedData() { // Limpa todos os dados
    if (!confirm('Tem certeza de que deseja apagar TODOS os dados?')) return; // Confirma
    ['Words', 'Score', 'PerformanceData', 'ResponseTimeData', 'WordLogs', 'ChartType', 'ChartTheme', 'Config', 'SpeechRate', 'CustomSubjectName', 'CustomSubjectColor']
        .forEach(k => localStorage.removeItem(getPlayerKey(k))); // Remove todos os dados
    words = { portugues: [], matematica: [], ingles: [], ciencias: [], custom: [] }; // Reseta palavras
    score = 0; performanceData = []; responseTimeData = []; wordLogs = {}; // Reseta dados
    config = { difficulty: 'medium', activeSubjects: Object.keys(subjectRegistry) }; // Reseta config
    speechRate = 1; customSubjectName = "Matéria Importada"; customSubjectColor = "#e74c3c"; // Reseta personalizado
    document.getElementById('score').innerText = 0; // Atualiza pontuação
    document.getElementById('gameArea').style.display = 'none'; // Esconde área
    document.getElementById('feedback').innerText = ''; // Limpa feedback
    document.getElementById('wordDisplay').innerHTML = ''; // Limpa display
    document.getElementById('phoneticDisplay').innerHTML = ''; // Limpa fonética
    document.getElementById('customSubjectContainer').style.display = 'none'; // Esconde container
    if (performanceChart) { performanceChart.destroy(); performanceChart = null; } // Destroi gráfico
    updateLogsDisplay(); // Atualiza registros
    updateSubjectPanel(); // Atualiza painel
}

function exportPlayerData() { // Exporta dados do jogador
    if (!currentPlayer) return alert("Nenhum jogador logado."); // Verifica jogador
    const players = JSON.parse(localStorage.getItem('spellingGamePlayers')) || []; // Obtém lista
    downloadJSON({ playerName: currentPlayer, playersList: players, gameData: { words, score, performanceData, responseTimeData, wordLogs, chartType, chartTheme, config, speechRate, customSubjectName, customSubjectColor } }, `game_player_${currentPlayer}.json`); // Baixa arquivo
}

function downloadJSON(data, filename) { // Baixa arquivo JSON
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); // Cria blob
    const a = document.createElement('a'); // Cria link
    a.href = URL.createObjectURL(blob); // Define URL
    a.download = filename; // Define nome
    document.body.appendChild(a); // Adiciona ao body
    a.click(); // Clica
    document.body.removeChild(a); // Remove
}

function importCachedData() { document.getElementById('importCacheFileInput').click(); } // Dispara input de importação
function importWords(subjectKey) { // Importa palavras
    document.getElementById('importFileInput').click(); // Dispara input
    document.getElementById('importFileInput').dataset.subject = subjectKey; // Define matéria
}

function handleCacheFileImport(event) { // Processa importação de cache
    readFile(event, (jsonData) => { // Lê arquivo
        const g = jsonData.gameData || jsonData; // Obtém dados
        words = g.words || { portugues: [], matematica: [], ingles: [], ciencias: [], custom: [] }; // Carrega palavras
        score = g.score || 0; // Carrega pontuação
        performanceData = g.performanceData || []; // Carrega desempenho
        responseTimeData = g.responseTimeData || []; // Carrega tempos
        wordLogs = g.wordLogs || {}; // Carrega registros
        config = g.config || config; // Carrega config
        speechRate = g.speechRate || 1; // Carrega velocidade
        customSubjectName = g.customSubjectName || "Matéria Importada"; // Carrega nome
        customSubjectColor = g.customSubjectColor || "#e74c3c"; // Carrega cor
        if (jsonData.playerName) { // Se há nome
            let players = JSON.parse(localStorage.getItem('spellingGamePlayers')) || []; // Obtém lista
            if (!players.includes(jsonData.playerName)) { // Se novo
                players.push(jsonData.playerName); // Adiciona
                localStorage.setItem('spellingGamePlayers', JSON.stringify(players)); // Salva
            }
            selectPlayer(jsonData.playerName); // Seleciona
        }
        saveDataToCache(); // Salva dados
        document.getElementById('score').innerText = score; // Atualiza pontuação
        document.getElementById('speechRate').value = speechRate; // Atualiza velocidade
        document.getElementById('rateValue').textContent = speechRate.toFixed(1) + 'x'; // Atualiza texto
        updateLogsDisplay(); // Atualiza registros
        updateCombinedChart(); // Atualiza gráfico
        updateSubjectPanel(); // Atualiza painel
        alert("Dados importados com sucesso!"); // Alerta
    });
}

function handleFileImport(event) { // Processa importação de arquivo
    const file = event.target.files[0]; // Obtém arquivo
    if (!file) return; // Se vazio
    if (file.size > 1024 * 1024) return alert("Erro: O arquivo deve ter no máximo 1MB."); // Valida tamanho
    
    const reader = new FileReader(); // Cria leitor
    reader.onload = (e) => { // Ao carregar
        try { // Tenta
            const jsonData = JSON.parse(e.target.result); // Parseia JSON
            if (Array.isArray(jsonData) && jsonData.every(item => typeof item === 'string')) { // Se array de strings
                const subjectKey = event.target.dataset.subject || 'portugues'; // Obtém matéria
                words[subjectKey] = jsonData; // Define palavras
                saveDataToCache(); // Salva
                updateSubjectPanel(); // Atualiza painel
                alert(`Lista de ${subjectRegistry[subjectKey].name} importada com sucesso!`); // Alerta
            } else { alert("Erro: O arquivo JSON deve conter um array de strings."); } // Erro formato
        } catch (err) { alert("Erro ao ler o arquivo JSON: " + err.message); } // Erro leitura
    };
    reader.readAsText(file); // Lê como texto
    event.target.value = ''; // Limpa input
}

function importCustomSubject() { document.getElementById('importCustomSubjectInput').click(); } // Dispara input de importação

function handleCustomSubjectImport(event) { // Processa importação de matéria
    const file = event.target.files[0]; // Obtém arquivo
    if (!file) return; // Se vazio

    const reader = new FileReader(); // Cria leitor
    reader.onload = (e) => { // Ao carregar
        try { // Tenta
            const jsonData = JSON.parse(e.target.result); // Parseia JSON
            if (!jsonData.htmlContent || !jsonData.subjectName) return alert("Erro: O JSON deve conter 'subjectName' e 'htmlContent'."); // Valida formato

            customSubjectName = jsonData.subjectName; // Define nome
            customSubjectColor = jsonData.subjectColor || "#e74c3c"; // Define cor
            subjectRegistry.custom.name = customSubjectName; // Atualiza registro

            const container = document.getElementById('customSubjectContainer'); // Obtém container
            const contentDiv = document.getElementById('customSubjectContent'); // Obtém conteúdo
            contentDiv.innerHTML = jsonData.htmlContent; // Define conteúdo
            document.getElementById('customSubjectTitle').innerText = customSubjectName; // Define título
            container.style.display = 'block'; // Mostra container

            const questionElements = contentDiv.querySelectorAll('[data-question][data-answer]'); // Obtém perguntas
            if (questionElements.length === 0) return alert("Nenhuma pergunta encontrada. Certifique-se de usar os atributos data-question e data-answer no HTML."); // Valida perguntas

            words.custom = []; // Limpa perguntas
            questionElements.forEach(el => { // Para cada pergunta
                words.custom.push({ question: el.getAttribute('data-question'), answer: el.getAttribute('data-answer').toLowerCase() }); // Adiciona
            });

            if (!config.activeSubjects.includes('custom')) config.activeSubjects.push('custom'); // Ativa matéria
            
            saveDataToCache(); // Salva dados
            updateSubjectPanel(); // Atualiza painel
            alert(`Matéria "${customSubjectName}" importada com sucesso! ${words.custom.length} perguntas encontradas.`); // Alerta
        } catch (err) { alert("Erro ao processar o arquivo JSON: " + err.message); } // Erro processamento
    };
    reader.readAsText(file); // Lê como texto
    event.target.value = ''; // Limpa input
}

function readFile(event, onSuccess) { // Lê arquivo
    const file = event.target.files[0]; // Obtém arquivo
    if (!file) return; // Se vazio
    if (file.size > 1024 * 1024) return alert("Erro: O arquivo deve ter no máximo 1MB."); // Valida tamanho
    const reader = new FileReader(); // Cria leitor
    reader.onload = (e) => { // Ao carregar
        try { onSuccess(JSON.parse(e.target.result)); } // Tenta processar
        catch (err) { alert("Erro ao ler o arquivo JSON: " + err.message); } // Erro leitura
    };
    reader.readAsText(file); // Lê como texto
    event.target.value = ''; // Limpa input
}

function startGame() { // Inicia jogo
    if(config.activeSubjects.length === 0) return alert("Selecione ao menos uma disciplina nas configurações!"); // Val matérias
    document.getElementById('gameArea').style.display = 'block'; // Mostra área
    nextWord(); // Próxima palavra
}

function nextWord() { // Próxima palavra
    isWaitingForNext = false; // Reseta espera
    wordRevealed = false; // Reseta revelação
    currentQuestion = getNextQuestion(); // Obtém pergunta
    if(currentQuestion.type === 'error') { alert(currentQuestion.prompt); return; } // Erro
    
    const catEl = document.getElementById('questionCategory'); // Obtém elementos
    const textEl = document.getElementById('questionText');
    const displayEl = document.getElementById('wordDisplay');
    const phoneticEl = document.getElementById('phoneticDisplay');
    const inputEl = document.getElementById('spellInput');
    
    const subKey = Object.keys(subjectRegistry).find(k => subjectRegistry[k].name === currentQuestion.category); // Obtém chave
    catEl.className = subKey ? subjectRegistry[subKey].color : ''; // Define cor
    catEl.textContent = currentQuestion.category; // Define categoria

    if (subKey === 'custom') catEl.style.backgroundColor = customSubjectColor; // Define cor personalizada
    else catEl.style.backgroundColor = '';

    textEl.innerText = currentQuestion.prompt; // Define pergunta
    inputEl.value = ""; // Limpa input
    document.getElementById('feedback').innerText = ""; // Limpa feedback
    document.getElementById('nextButton').style.display = 'none'; // Esconde botão
    inputEl.focus(); // Foca input
    startTime = new Date().getTime(); // Inicia tempo

    if (currentQuestion.type === 'portuguese') { // Se português
        displayEl.innerHTML = ''; // Limpa display
        inputEl.placeholder = "Digite a palavra..."; // Define placeholder
        speakWord(); // Fala palavra
    } else if (currentQuestion.type === 'english') { // Se inglês
        displayEl.innerHTML = ''; // Limpa display
        phoneticEl.textContent = pronunciationData[currentQuestion.answer] || ''; // Define fonética
        inputEl.placeholder = "Digite a palavra em inglês..."; // Define placeholder
        speakWord(); // Fala palavra
    } else { // Outros
        displayEl.innerHTML = ''; // Limpa display
        phoneticEl.textContent = ''; // Limpa fonética
        inputEl.placeholder = currentQuestion.type === 'math' ? "Digite o número..." : "Digite a resposta..."; // Define placeholder
    }

    initializeWordLog(currentQuestion.answer); // Inicia registro
    wordLogs[currentQuestion.answer].attempts++; // Incrementa tentativas
    wordLogs[currentQuestion.answer].category = currentQuestion.category; // Define categoria
    updateLogsDisplay(); // Atualiza registros
    saveDataToCache(); // Salva dados
}

function initializeWordLog(key) { // Inicia registro de palavra
    if (!wordLogs[key]) wordLogs[key] = { attempts: 0, successes: 0, totalTime: 0, bestTime: Infinity, category: '' }; // Cria registro
}

function updateLogsDisplay() { // Atualiza display de registros
    const logsContainer = document.getElementById('logsContainer'); // Obtém container
    if (!logsContainer) return; // Se não existir
    const filter = document.getElementById('subjectFilter').value; // Obtém filtro
    let html = ''; // HTML resultante
    for (const [key, log] of Object.entries(wordLogs)) { // Para cada registro
        const matchesFilter = filter === 'all' || (filter === 'custom' ? log.category === customSubjectName : subjectRegistry[filter].name === log.category); // Verifica filtro
        if (log.attempts > 0 && matchesFilter) { // Se tem tentativas e filtra
            const successRate = ((log.successes / log.attempts) * 100).toFixed(1); // Calcula taxa
            const avgTime = log.successes > 0 ? (log.totalTime / log.successes).toFixed(1) : 0; // Calcula tempo médio
            const catBadge = log.category ? `<span style="font-size:0.8em; color:#7f8c8d;">(${log.category})</span>` : ''; // Badge de categoria
            html += `<div class="log-entry"><strong>${key}</strong> ${catBadge} - Tentativas: ${log.attempts} | Sucesso: ${successRate}% | Tempo: ${avgTime}s</div>`; // Adiciona linha
        }
    }
    logsContainer.innerHTML = html || '<p>Nenhum registro ainda.</p>'; // Define conteúdo
}

function checkSpelling() { // Verifica ortografia
    if (isWaitingForNext) return; // Se aguarda próxima
    const userInput = document.getElementById('spellInput').value.trim().toLowerCase(); // Obtém entrada
    if (!userInput) return; // Se vazia
    
    const feedbackElement = document.getElementById('feedback'); // Obtém feedback
    const endTime = new Date().getTime(); // Tempo final
    const responseTime = (endTime - startTime) / 1000; // Tempo resposta
    let pointsEarned = 0; // Pontuação

    if (userInput === currentQuestion.answer.toLowerCase()) { // Se correto
        pointsEarned = calculateScore(responseTime); // Calcula pontos
        score += pointsEarned; // Adiciona pontuação
        document.getElementById('score').innerText = score; // Atualiza pontuação
        feedbackElement.innerText = `Correto! +${pointsEarned} pontos (${responseTime.toFixed(1)}s)`; // Define feedback
        feedbackElement.className = "feedback success"; // Define classe
        
        wordLogs[currentQuestion.answer].successes++; // Incrementa acertos
        wordLogs[currentQuestion.answer].totalTime += responseTime; // Adiciona tempo
        if (responseTime < wordLogs[currentQuestion.answer].bestTime) wordLogs[currentQuestion.answer].bestTime = responseTime; // Atualiza melhor tempo
    } else { // Se incorreto
        feedbackElement.innerText = `Incorreto! A resposta era: ${currentQuestion.answer}`; // Define feedback
        feedbackElement.className = "feedback error"; // Define classe
    }

    if (currentQuestion.type === 'portuguese') { // Se português
        document.getElementById('wordDisplay').innerHTML = `<div class="letter-box">${currentQuestion.answer}</div>`; // Mostra palavra
    }

    const now = new Date(); // Data atual
    const dateStr = now.toLocaleDateString('pt-BR') + " " + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}); // Formata data
    performanceData.push({ date: dateStr, word: currentQuestion.answer, points: pointsEarned, category: currentQuestion.category }); // Adiciona desempenho
    responseTimeData.push({ date: dateStr, word: currentQuestion.answer, time: responseTime }); // Adiciona tempo

    updateCombinedChart(); // Atualiza gráfico
    updateLogsDisplay(); // Atualiza registros
    saveDataToCache(); // Salva dados

    document.getElementById('nextButton').style.display = 'inline-block'; // Mostra botão
    isWaitingForNext = true; // Define espera
}

function speakWord() { // Fala palavra
    if ('speechSynthesis' in window) { // Se suportado
        window.speechSynthesis.cancel(); // Cancela fala anterior
        const utterance = new SpeechSynthesisUtterance(); // Cria utterance
        if (currentQuestion.type === 'portuguese') { // Se português
            utterance.lang = 'pt-BR'; // Define idioma
            utterance.rate = speechRate; // Define velocidade
            utterance.text = currentQuestion.answer; // Define texto
        } else if (currentQuestion.type === 'english') { // Se inglês
            utterance.lang = 'en-US'; // Define idioma
            utterance.rate = speechRate; // Define velocidade
            utterance.text = currentQuestion.answer; // Define texto
        } else { // Outros
            utterance.lang = 'pt-BR'; // Define idioma
            utterance.rate = speechRate; // Define velocidade
            utterance.text = currentQuestion.prompt.replace('×', 'vezes').replace('÷', 'dividido por'); // Substitui símbolos
        }
        window.speechSynthesis.speak(utterance); // Fala
    }
}

function slowPronunciation() { // Fala devagar
    speechRate = 0.6; // Define velocidade
    document.getElementById('speechRate').value = speechRate; // Atualiza input
    document.getElementById('rateValue').textContent = speechRate.toFixed(1) + 'x'; // Atualiza texto
    saveConfig(); // Salva config
    speakWord(); // Fala
}
function fastPronunciation() { // Fala rápido
    speechRate = 1.4; // Define velocidade
    document.getElementById('speechRate').value = speechRate; // Atualiza input
    document.getElementById('rateValue').textContent = speechRate.toFixed(1) + 'x'; // Atualiza texto
    saveConfig(); // Salva config
    speakWord(); // Fala
}

function calculateScore(t) { // Calcula pontuação
    if (t <= 5) return 10; // Tempo rápido
    if (t <= 10) return 8; // Tempo médio rápido
    if (t <= 15) return 6; // Tempo médio
    if (t <= 20) return 4; // Tempo lento
    return 2; // Tempo muito lento
}

function toggleChartType() { // Alterna tipo de gráfico
    const types = ['line', 'bar', 'radar', 'doughnut']; // Tipos disponíveis
    chartType = types[(types.indexOf(chartType) + 1) % types.length]; // Próximo tipo
    saveDataToCache(); // Salva dados
    updateCombinedChart(); // Atualiza gráfico
}
function toggleChartTheme() { // Alterna tema do gráfico
    chartTheme = chartTheme === 'light' ? 'dark' : 'light'; // Inverte tema
    saveDataToCache(); // Salva dados
    updateCombinedChart(); // Atualiza gráfico
}
function exportChart() { // Exporta gráfico
    const url = document.getElementById('performanceChart').toDataURL('image/png'); // Obtém URL
    const a = document.createElement('a'); // Cria link
    a.href = url; // Define URL
    a.download = `chart_${Date.now()}.png`; // Define nome
    a.click(); // Clica
}

function updateCombinedChart() { // Atualiza gráfico combinado
    const canvas = document.getElementById('performanceChart'); // Obtém canvas
    if (!canvas) return; // Se não existir
    const ctx = canvas.getContext('2d'); // Obtém contexto
    const labels = performanceData.map(d => `${d.date} (${d.word})`); // Labels
    const pointsData = performanceData.map(d => d.points); // Dados de pontos
    const timeData = responseTimeData.map(d => d.time); // Dados de tempo
    const textColor = chartTheme === 'dark' ? '#ffffff' : '#333333'; // Cor do texto
    const gridColor = chartTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'; // Cor da grade

    if (performanceChart) performanceChart.destroy(); // Destroi gráfico existente

    let configChart = {}; // Configuração do gráfico
    const axisOptions = { // Opções dos eixos
        yPoints: { type: 'linear', position: 'left', beginAtZero: true, max: 10, ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: 'Pontuação', color: textColor } },
        yTime: { type: 'linear', position: 'right', beginAtZero: true, ticks: { color: textColor }, grid: { drawOnChartArea: false }, title: { display: true, text: 'Segundos', color: textColor } },
        x: { ticks: { color: textColor, maxRotation: 45 }, grid: { color: gridColor } }
    };

    if (chartType === 'line' || chartType === 'bar') { // Se linha ou barra
        configChart = { type: chartType, data: { labels, datasets: [{ label: 'Pontuação', data: pointsData, yAxisID: 'yPoints', backgroundColor: chartType === 'bar' ? pointsData.map(d => d >= 8 ? '#27ae60' : d > 0 ? '#f1c40f' : '#e74c3c') : 'rgba(41,128,185,0.2)', borderColor: '#2980b9' }, { label: 'Tempo (s)', data: timeData, yAxisID: 'yTime', backgroundColor: 'rgba(230,126,34,0.6)', borderColor: '#e67e22' }] }, options: { scales: axisOptions } };
    } else if (chartType === 'radar') { // Se radar
        configChart = { type: 'radar', data: { labels, datasets: [{ label: 'Pontuação', data: pointsData, borderColor: '#2980b9', backgroundColor: 'rgba(41,128,185,0.2)' }, { label: 'Tempo (s)', data: timeData, borderColor: '#e67e22', backgroundColor: 'rgba(230,126,34,0.2)' }] }, options: { scales: { r: { ticks: { color: textColor, backdropColor: 'transparent' }, grid: { color: gridColor }, pointLabels: { color: textColor } } } } };
    } else if (chartType === 'doughnut') { // Se rosca
        configChart = { type: 'doughnut', data: { labels, datasets: [{ label: 'Pontuação', data: pointsData, backgroundColor: pointsData.map(d => d >= 8 ? '#27ae60' : d > 0 ? '#f1c40f' : '#e74c3c') }, { label: 'Tempo (s)', data: timeData, backgroundColor: timeData.map(() => 'rgba(230,126,34,0.6)') }] } };
    }

    performanceChart = new Chart(ctx, { ...configChart, options: { responsive: true, maintainAspectRatio: false, ...configChart.options, plugins: { legend: { labels: { color: textColor } }, title: { display: true, text: 'Desempenho Multidisciplinar', color: textColor } } } }); // Cria gráfico
}

// Listener global para tecla Enter
document.addEventListener('keydown', function(e) { // Adiciona listener
    if (e.key === 'Enter') { // Se Enter
        const gameArea = document.getElementById('gameArea'); // Obtém área
        if (gameArea && gameArea.style.display !== 'none') { // Se área visível
            if (!isWaitingForNext) { // Se não aguarda próxima
                checkSpelling(); // Verifica resposta
            } else { // Se aguarda
                nextWord(); // Próxima palavra
            }
        } else if (document.getElementById('playerModal').classList.contains('active')) { // Se modal visível
            registerPlayer(); // Registra jogador
        } else if (document.getElementById('editPlayerModal').classList.contains('active')) { // Se modal de edição visível
            savePlayerEdit(); // Salva edição
        }
    }
});

// Listener para controle de velocidade
document.getElementById('speechRate').addEventListener('input', (e) => { // Ao mudar
    speechRate = parseFloat(e.target.value); // Define velocidade
    document.getElementById('rateValue').textContent = speechRate.toFixed(1) + 'x'; // Atualiza texto
});
document.getElementById('speechRate').addEventListener('change', (e) => { // Ao soltar
    saveConfig(); // Salva config
});

function showSection(sectionName) { // Mostra seção
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active')); // Esconde todas
    document.querySelectorAll('.nav-buttons button').forEach(el => el.classList.remove('nav-active')); // Remove ativo
    document.getElementById(sectionName + 'Section').classList.add('active'); // Mostra seção
    document.getElementById('nav' + sectionName.charAt(0).toUpperCase() + sectionName.slice(1)).classList.add('nav-active'); // Ativa botão
}

let speechEnabled = false; // Estado da narração
let currentSpeech = null; // Fala atual

function toggleHelpSpeech() { // Alterna narração
    speechEnabled = !speechEnabled; // Inverte estado
    const button = document.querySelector('.speech-controls button'); // Obtém botão
    if (speechEnabled) { // Se ativar
        button.textContent = '🔇 Desativar Narração'; // Muda texto
        const text = document.querySelector('.help-content').innerText; // Obtém texto
        currentSpeech = new SpeechSynthesisUtterance(text); // Cria fala
        currentSpeech.lang = 'pt-BR'; currentSpeech.rate = 0.9; // Define idioma e velocidade
        window.speechSynthesis.speak(currentSpeech); // Fala
    } else { // Se desativar
        button.textContent = '🔊 Ativar Narração'; // Muda texto
        window.speechSynthesis.cancel(); currentSpeech = null; // Cancela fala
    }
}

// --- Funções de Edição de Jogador ---
function editPlayer() { // Edita jogador
    if (!currentPlayer) return; // Se não houver jogador
    document.getElementById('editPlayerNameInput').value = currentPlayer; // Define nome
    document.getElementById('editPlayerModal').classList.add('active'); // Mostra modal
}

function closeEditModal() { // Fecha modal de edição
    document.getElementById('editPlayerModal').classList.remove('active'); // Esconde modal
}

function savePlayerEdit() { // Salva edição de jogador
    const newName = document.getElementById('editPlayerNameInput').value.trim().toLowerCase(); // Obtém novo nome
    if (!newName) return alert("Por favor, digite um nome válido."); // Valida nome
    if (newName === currentPlayer) return closeEditModal(); // Se mesmo nome

    let players = JSON.parse(localStorage.getItem('spellingGamePlayers')) || []; // Obtém lista
    if (players.includes(newName)) return alert("Este nome de jogador já existe!"); // Valida duplicidade

    // Migra dados
    const dataKeys = ['Words', 'Score', 'PerformanceData', 'ResponseTimeData', 'WordLogs', 'ChartType', 'ChartTheme', 'Config', 'SpeechRate', 'CustomSubjectName', 'CustomSubjectColor'];
    dataKeys.forEach(key => { // Para cada chave
        const oldKey = `spellingGame_${currentPlayer}_${key}`; // Chave antiga
        const newKey = `spellingGame_${newName}_${key}`; // Chave nova
        const data = localStorage.getItem(oldKey); // Obtém dados
        if (data) { // Se existir
            localStorage.setItem(newKey, data); // Copia
            localStorage.removeItem(oldKey); // Remove
        }
    });

    // Atualiza lista
    const index = players.indexOf(currentPlayer); // Procura índice
    if (index > -1) players[index] = newName; // Atualiza nome
    localStorage.setItem('spellingGamePlayers', JSON.stringify(players)); // Salva lista

    // Troca para novo nome
    selectPlayer(newName); // Seleciona novo
    closeEditModal(); // Fecha modal
    alert("Nome do jogador atualizado com sucesso!"); // Alerta
}
