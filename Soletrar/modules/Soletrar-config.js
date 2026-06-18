
        // O código JavaScript fornecido pelo usuário começa aqui
        let words = JSON.parse(localStorage.getItem('spellingGameWords')) || [];
        let currentWord = "";
        let score = parseInt(localStorage.getItem('spellingGameScore')) || 0;
        let performanceData = JSON.parse(localStorage.getItem('spellingGamePerformanceData')) || [];
        let performanceChart = null;
        let startTime = 0;
        let responseTimeData = JSON.parse(localStorage.getItem('spellingGameResponseTimeData')) || [];
        let wordLogs = JSON.parse(localStorage.getItem('spellingGameWordLogs')) || {};
        let chartType = 'line'; // Tipo de gráfico padrão
        let chartTheme = 'light'; // Tema padrão

        // Função para salvar dados em cache (localStorage)
        function saveDataToCache() {
            localStorage.setItem('spellingGameWords', JSON.stringify(words));
            localStorage.setItem('spellingGameScore', score.toString());
            localStorage.setItem('spellingGamePerformanceData', JSON.stringify(performanceData));
            localStorage.setItem('spellingGameResponseTimeData', JSON.stringify(responseTimeData));
            localStorage.setItem('spellingGameWordLogs', JSON.stringify(wordLogs));
            localStorage.setItem('spellingGameChartType', chartType);
            localStorage.setItem('spellingGameChartTheme', chartTheme);
        }

        // Função para apagar dados do cache
        function clearCachedData() {
            if (confirm('Tem certeza de que deseja apagar todos os dados salvos? Isso reiniciará o jogo.')) {
                localStorage.removeItem('spellingGameWords');
                localStorage.removeItem('spellingGameScore');
                localStorage.removeItem('spellingGamePerformanceData');
                localStorage.removeItem('spellingGameResponseTimeData');
                localStorage.removeItem('spellingGameWordLogs');
                localStorage.removeItem('spellingGameChartType');
                localStorage.removeItem('spellingGameChartTheme');
                
                words = [];
                score = 0;
                performanceData = [];
                responseTimeData = [];
                wordLogs = {};
                currentWord = "";
                chartType = 'line';
                chartTheme = 'light';
                
                document.getElementById('score').innerText = score;
                document.getElementById('gameArea').style.display = 'none';
                document.getElementById('feedback').innerText = '';
                document.getElementById('wordDisplay').innerText = '';
                
                if (performanceChart) {
                    performanceChart.destroy();
                    performanceChart = null;
                }
                updateLogsDisplay();
                alert('Dados apagados com sucesso!');
            }
        }

        // Função para exportar dados do cache
        function exportCachedData() {
            const cacheData = {
                words: words,
                score: score,
                performanceData: performanceData,
                responseTimeData: responseTimeData,
                wordLogs: wordLogs,
                chartType: chartType,
                chartTheme: chartTheme
            };
            const dataStr = JSON.stringify(cacheData, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "spelling_game_data.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Função para importar dados do cache
        function importCachedData() {
            document.getElementById('importCacheFileInput').click();
        }

        function handleCacheFileImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            if (file.size > 1024 * 1024) {
                alert("Erro: O arquivo deve ter no máximo 1MB.");
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    
                    if (jsonData.words && Array.isArray(jsonData.words)) {
                        words = jsonData.words;
                    }
                    if (typeof jsonData.score === 'number') {
                        score = jsonData.score;
                    }
                    if (jsonData.performanceData && Array.isArray(jsonData.performanceData)) {
                        performanceData = jsonData.performanceData;
                    }
                    if (jsonData.responseTimeData && Array.isArray(jsonData.responseTimeData)) {
                        responseTimeData = jsonData.responseTimeData;
                    }
                    if (jsonData.wordLogs && typeof jsonData.wordLogs === 'object') {
                        wordLogs = jsonData.wordLogs;
                    }
                    if (jsonData.chartType) {
                        chartType = jsonData.chartType;
                    }
                    if (jsonData.chartTheme) {
                        chartTheme = jsonData.chartTheme;
                    }
                    
                    saveDataToCache();
                    document.getElementById('score').innerText = score;
                    updateLogsDisplay();
                    updateCombinedChart();
                    
                    alert("Dados do jogo importados com sucesso!");
                } catch (error) {
                    alert("Erro ao ler o arquivo JSON: " + error.message);
                }
            };
            reader.onerror = function() {
                alert("Erro ao ler o arquivo.");
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        function startGame() {
            if (words.length === 0) {
                alert("Por favor, importe palavras antes de iniciar o jogo.");
                return;
            }
            document.getElementById('gameArea').style.display = 'block';
            document.getElementById('score').innerText = score;
            nextWord();
        }

        function nextWord() {
            if (words.length === 0) return;
            const randomIndex = Math.floor(Math.random() * words.length);
            currentWord = words[randomIndex];
            // Ocultar a palavra para o modelo de aprendizado
            const hiddenWord = currentWord.replace(/[a-zA-ZáéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇàèìòùÀÈÌÒÙ]/g, "_");
            document.getElementById('wordDisplay').innerText = hiddenWord;
            document.getElementById('spellInput').value = "";
            document.getElementById('feedback').innerText = "";
            document.getElementById('spellInput').focus();
            
            // Registrar o tempo de início para calcular o tempo de resposta
            startTime = new Date().getTime();
            
            // Reproduzir áudio automaticamente ao carregar nova palavra
            speakWord();
            
            // Inicializar registro da palavra atual
            initializeWordLog(currentWord);
            wordLogs[currentWord].attempts++;
            updateLogsDisplay();
            saveDataToCache();
        }
        
        // Função para inicializar o log de uma palavra
        function initializeWordLog(word) {
            if (!wordLogs[word]) {
                wordLogs[word] = {
                    attempts: 0,
                    successes: 0,
                    totalTime: 0,
                    bestTime: Infinity,
                    lastAttempt: null
                };
            }
        }
        
        // Função para atualizar a exibição dos logs
        function updateLogsDisplay() {
            const logsContainer = document.getElementById('logsContainer');
            if (!logsContainer) return;
            
            let html = '<h3>Registro de Aprendizado</h3>';
            for (const [word, log] of Object.entries(wordLogs)) {
                if (log.attempts > 0) {
                    const successRate = ((log.successes / log.attempts) * 100).toFixed(1);
                    const avgTime = log.successes > 0 ? (log.totalTime / log.successes).toFixed(1) : 0;
                    html += `
                        <div class="log-entry">
                            <strong>${word}</strong> - 
                            Tentativas: ${log.attempts} | 
                            Sucesso: ${successRate}% | 
                            Tempo: ${avgTime}s
                        </div>
                    `;
                }
            }
            logsContainer.innerHTML = html;
        }
        
        // Modificar a função checkSpelling para atualizar os logs
        function checkSpelling() {
            const userInput = document.getElementById('spellInput').value.trim().toLowerCase();
            const feedbackElement = document.getElementById('feedback');
            let pointsEarned = 0;
            
            // Calcular o tempo de resposta em segundos
            const endTime = new Date().getTime();
            const responseTime = (endTime - startTime) / 1000;
            
            if (userInput === currentWord.toLowerCase()) {
                pointsEarned = calculateScore(responseTime);
                score += pointsEarned;
                document.getElementById('score').innerText = score;
                feedbackElement.innerText = `Correto! Excelente trabalho! Você ganhou ${pointsEarned} pontos (${responseTime.toFixed(1)}s)`;
                feedbackElement.className = "feedback success";
                
                // Atualizar logs
                initializeWordLog(currentWord);
                wordLogs[currentWord].successes++;
                wordLogs[currentWord].totalTime += responseTime;
                if (responseTime < wordLogs[currentWord].bestTime) {
                    wordLogs[currentWord].bestTime = responseTime;
                }
                
                // Avançar automaticamente para a próxima palavra após 1.5 segundos
                setTimeout(nextWord, 1500);
            } else {
                pointsEarned = 0;
                feedbackElement.innerText = ` ${currentWord}`;
                feedbackElement.className = "feedback error";
                
                // Atualizar logs para tentativas incorretas
                initializeWordLog(currentWord);
                wordLogs[currentWord].attempts++;
            }
            
            // Registrar dados para o gráfico
            const now = new Date();
            const dateStr = now.toLocaleDateString('pt-BR') + " " + now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
            performanceData.push({
                date: dateStr,
                word: currentWord,
                points: pointsEarned
            });
            
            // Registrar dados de tempo de resposta
            responseTimeData.push({
                date: dateStr,
                word: currentWord,
                time: responseTime
            });
            
            updateCombinedChart();
            updateLogsDisplay();
            saveDataToCache();
        }

        function speakWord() {
            if ('speechSynthesis' in window && currentWord) {
                try {
                    window.speechSynthesis.cancel(); // Cancela qualquer fala anterior
                    const utterance = new SpeechSynthesisUtterance(currentWord);
                    utterance.lang = 'pt-BR'; // Define o idioma para português brasileiro
                    utterance.rate = 0.8; // Velocidade um pouco mais lenta para aprendizado
                    window.speechSynthesis.speak(utterance);
                } catch (error) {
                    console.error('Erro ao reproduzir áudio:', error);
                    // Add visual feedback
                    const feedbackElement = document.getElementById('feedback');
                    feedbackElement.innerText = 'Desculpe, não foi possível reproduzir o áudio desta palavra.';
                    feedbackElement.className = "feedback error";
                }
            }
        }

        function calculateScore(responseTime) {
            if (responseTime <= 5) {
                return 10; // Muito rápido
            } else if (responseTime <= 10) {
                return 8;  // Rápido
            } else if (responseTime <= 15) {
                return 6;  // Normal
            } else if (responseTime <= 20) {
                return 4;  // Devagar
            } else {
                return 2;  // Muito devagar
            }
        }

        function exportWords() {
            const dataStr = JSON.stringify(words, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "palavras.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function importWords() {
            document.getElementById('importFileInput').click();
        }

        // Função para verificar o acesso a arquivos externos como carregar o JSON
        async function checkExternalFileAccess(url) {
            try {
                const response = await fetch(url, { method: 'HEAD' });
                if (response.ok) {
                    console.log(`Acesso ao arquivo externo permitido: ${url}`);
                    return { success: true, status: response.status, message: 'Arquivo acessível' };
                } else {
                    console.warn(`Acesso ao arquivo externo negado ou arquivo não encontrado. Status: ${response.status}`);
                    return { success: false, status: response.status, message: `Erro HTTP: ${response.status}` };
                }
            } catch (error) {
                console.error(`Falha ao tentar acessar o arquivo externo: ${error.message}`);
                return { success: false, status: 0, message: `Erro de rede ou CORS: ${error.message}` };
            }
        }

        // Se não houver palavras no localStorage, tenta carregar do arquivo local palavras.json
        if (!localStorage.getItem('spellingGameWords')) {
            // Lista padrão de palavras caso o arquivo não seja encontrado
            const defaultWords = ["abacaxi", "borboleta", "cachorro", "dinossauro", "elefante"];
            // Inicializa com as palavras padrão para evitar que 'words' fique vazio durante o fetch assíncrono
            words = defaultWords;

            const externalFileUrl = './palavras.json';
            checkExternalFileAccess(externalFileUrl).then(accessResult => {
                if (accessResult.success) {
                    fetch(externalFileUrl)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Arquivo não encontrado');
                            }
                            return response.json();
                        })
                        .then(data => {
                            if (Array.isArray(data) && data.length > 0 && data.every(item => typeof item === 'string')) {
                                words = data;
                                localStorage.setItem('spellingGameWords', JSON.stringify(words));
                            } else {
                                // Se os dados do JSON forem inválidos ou vazios, usa a lista padrão
                                localStorage.setItem('spellingGameWords', JSON.stringify(words));
                            }
                        })
                        .catch(error => {
                            console.warn('Erro ao processar o arquivo JSON, usando lista padrão:', error);
                            localStorage.setItem('spellingGameWords', JSON.stringify(words));
                        });
                } else {
                    console.warn('Acesso ao arquivo externo falhou, usando lista padrão:', accessResult.message);
                    localStorage.setItem('spellingGameWords', JSON.stringify(words));
                }
            });
        }

        function handleFileImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            // Verificar tamanho do arquivo (limite de 1MB)
            if (file.size > 1024 * 1024) {
                alert("Erro: O arquivo deve ter no máximo 1MB.");
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    if (Array.isArray(jsonData)) {
                        // Validar se todos os elementos são strings
                        if (jsonData.every(item => typeof item === 'string')) {
                            words = jsonData;
                            alert("Lista de palavras importada com sucesso!");
                            saveDataToCache();
                            nextWord(); // Carrega a primeira palavra da nova lista
                        } else {
                            alert("Erro: O arquivo JSON deve conter apenas strings.");
                        }
                    } else {
                        alert("Erro: O arquivo JSON deve conter um array de palavras.");
                    }
                } catch (error) {
                    alert("Erro ao ler o arquivo JSON: " + error.message);
                }
            };
            reader.onerror = function() {
                alert("Erro ao ler o arquivo.");
            };
            reader.readAsText(file);
            // Limpar o input para permitir importar o mesmo arquivo novamente se necessário
            event.target.value = '';
        }

        // Função para alternar o tipo de gráfico
        function toggleChartType() {
            const types = ['line', 'bar', 'radar', 'doughnut'];
            const currentIndex = types.indexOf(chartType);
            chartType = types[(currentIndex + 1) % types.length];
            saveDataToCache();
            updateCombinedChart();
        }

        // Função para alternar o tema do gráfico
        function toggleChartTheme() {
            chartTheme = chartTheme === 'light' ? 'dark' : 'light';
            saveDataToCache();
            updateCombinedChart();
        }

        // Função para exportar o gráfico
        function exportChart() {
            const canvas = document.getElementById('performanceChart');
            const url = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `spelling_game_chart_${new Date().getTime()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        function updateCombinedChart() {
            const ctx = document.getElementById('performanceChart').getContext('2d');
            const labels = performanceData.map(d => `${d.date}\n(${d.word})`);
            const pointsData = performanceData.map(d => d.points);
            const timeData = responseTimeData.map(d => d.time);

            // Configurações de tema
            const textColor = chartTheme === 'dark' ? '#ffffff' : '#333333';
            const gridColor = chartTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            const backgroundColor = chartTheme === 'dark' ? '#2c3e50' : '#ffffff';

            // Destruir gráfico anterior se existir
            if (performanceChart) {
                performanceChart.destroy();
            }

            // Configurações base para todos os tipos de gráfico
            const baseOptions = {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    },
                    tooltip: {
                        backgroundColor: chartTheme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: textColor,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                if (context.dataset.yAxisID === 'yPoints') {
                                    const item = performanceData[index];
                                    return `Pontuação: ${item.points} pontos`;
                                } else {
                                    const item = responseTimeData[index];
                                    return `Tempo: ${item.time.toFixed(2)}s`;
                                }
                            }
                        }
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'xy',
                        },
                        pan: {
                            enabled: true,
                            mode: 'xy',
                        }
                    }
                },
                scales: {
                    yPoints: {
                        type: 'linear',
                        position: 'left',
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            stepSize: 2,
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        },
                        title: {
                            display: true,
                            text: 'Pontuação',
                            color: textColor
                        }
                    },
                    yTime: {
                        type: 'linear',
                        position: 'right',
                        beginAtZero: true,
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            drawOnChartArea: false,
                            color: gridColor
                        },
                        title: {
                            display: true,
                            text: 'Segundos',
                            color: textColor
                        }
                    },
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45,
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    }
                }
            };

            // Configurações específicas para cada tipo de gráfico
            const chartConfig = {
                line: {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Pontuação (Baseado no tempo)',
                                data: pointsData,
                                borderColor: '#2980b9',
                                backgroundColor: 'rgba(41, 128, 185, 0.2)',
                                fill: true,
                                tension: 0.1,
                                pointRadius: 5,
                                pointBackgroundColor: performanceData.map(d => d.points >= 8 ? '#27ae60' : d.points > 0 ? '#f1c40f' : '#e74c3c'),
                                yAxisID: 'yPoints',
                            },
                            {
                                label: 'Tempo de Resposta (segundos)',
                                data: timeData,
                                borderColor: '#e67e22',
                                backgroundColor: 'rgba(230, 126, 34, 0.2)',
                                fill: false,
                                tension: 0.1,
                                pointRadius: 5,
                                pointBackgroundColor: '#e67e22',
                                yAxisID: 'yTime',
                            }
                        ]
                    },
                    options: {
                        ...baseOptions,
                        animation: {
                            duration: 1000,
                            easing: 'easeInOutQuart'
                        }
                    }
                },
                bar: {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Pontuação',
                                data: pointsData,
                                backgroundColor: performanceData.map(d => d.points >= 8 ? '#27ae60' : d.points > 0 ? '#f1c40f' : '#e74c3c'),
                                yAxisID: 'yPoints',
                            },
                            {
                                label: 'Tempo de Resposta',
                                data: timeData,
                                backgroundColor: 'rgba(230, 126, 34, 0.6)',
                                yAxisID: 'yTime',
                            }
                        ]
                    },
                    options: {
                        ...baseOptions,
                        animation: {
                            duration: 1000,
                            easing: 'easeInOutQuart'
                        }
                    }
                },
                radar: {
                    type: 'radar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Pontuação',
                                data: pointsData,
                                borderColor: '#2980b9',
                                backgroundColor: 'rgba(41, 128, 185, 0.2)',
                                yAxisID: 'yPoints',
                            },
                            {
                                label: 'Tempo de Resposta',
                                data: timeData,
                                borderColor: '#e67e22',
                                backgroundColor: 'rgba(230, 126, 34, 0.2)',
                                yAxisID: 'yTime',
                            }
                        ]
                    },
                    options: {
                        ...baseOptions,
                        scales: {
                            r: {
                                angleLines: {
                                    color: gridColor
                                },
                                grid: {
                                    color: gridColor
                                },
                                pointLabels: {
                                    color: textColor
                                },
                                ticks: {
                                    color: textColor,
                                    backdropColor: 'transparent'
                                }
                            }
                        }
                    }
                },
                doughnut: {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Pontuação',
                                data: pointsData,
                                backgroundColor: performanceData.map(d => d.points >= 8 ? '#27ae60' : d.points > 0 ? '#f1c40f' : '#e74c3c'),
                            },
                            {
                                label: 'Tempo de Resposta',
                                data: timeData,
                                backgroundColor: 'rgba(230, 126, 34, 0.6)',
                            }
                        ]
                    },
                    options: {
                        ...baseOptions,
                        plugins: {
                            ...baseOptions.plugins,
                            legend: {
                                position: 'right',
                                labels: {
                                    color: textColor,
                                    padding: 20
                                }
                            }
                        }
                    }
                }
            };

            // Criar o gráfico com o tipo e tema selecionados
            performanceChart = new Chart(ctx, {
                ...chartConfig[chartType],
                options: {
                    ...chartConfig[chartType].options,
                    plugins: {
                        ...chartConfig[chartType].options.plugins,
                        title: {
                            display: true,
                            text: 'Desempenho do Jogo',
                            color: textColor,
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            });

            // Adicionar botões de controle ao gráfico
            const chartContainer = document.getElementById('chartContainer');
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div class="chart-controls">
                        <button onclick="toggleChartType()" class="chart-btn">Trocar Tipo</button>
                        <button onclick="toggleChartTheme()" class="chart-btn">Trocar Tema</button>
                        <button onclick="exportChart()" class="chart-btn">Exportar</button>
                    </div>
                    <div style="position: relative; height: 400px; width: 100%;">
                        <canvas id="performanceChart"></canvas>
                    </div>
                `;
            }
        }

        // Allow pressing Enter to check spelling
        document.getElementById('spellInput').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                checkSpelling();
            }
        });

        // Inicializar a exibição na carga da página
        document.getElementById('score').innerText = score;
        updateLogsDisplay();
        if (performanceData.length > 0 || responseTimeData.length > 0) {
            updateCombinedChart();
        }

 // Função para alternar entre as seções da página
        function showSection(sectionName) {
            document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
            document.getElementById(sectionName + 'Section').classList.add('active');
        }

        // Função para mostrar a seção de ajuda
        function showHelp() {
            document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
            document.getElementById('helpSection').classList.add('active');
        }

        // Variável para controlar o estado da narração
        let speechEnabled = false;
        let currentSpeech = null;

        // Função para alternar a narração da ajuda
        function toggleHelpSpeech() {
            speechEnabled = !speechEnabled;
            const button = document.querySelector('.speech-controls button');
            
            if (speechEnabled) {
                button.textContent = '🔇 Desativar Narração';
                speakHelpContent();
            } else {
                button.textContent = '🔊 Ativar Narração';
                if (currentSpeech) {
                    window.speechSynthesis.cancel();
                }
            }
        }

        // Função para falar o conteúdo da ajuda
        function speakHelpContent() {
            if (!speechEnabled) return;
            
            const helpContent = document.querySelector('.help-content');
            const text = helpContent.innerText;
            
            if (currentSpeech) {
                window.speechSynthesis.cancel();
            }
            
            currentSpeech = new SpeechSynthesisUtterance(text);
            currentSpeech.lang = 'pt-BR';
            currentSpeech.rate = 0.9;
            
            currentSpeech.onend = function() {
                if (speechEnabled) {
                    setTimeout(speakHelpContent, 1000);
                }
            };
            
            window.speechSynthesis.speak(currentSpeech);
        }