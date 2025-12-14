class TecladoInterativo {
    constructor() {
        this.audioAtual = null;
        this.modoEdicao = false;
        this.modoNoturno = localStorage.getItem('modoNoturno') === 'true';
        this.contadorSons = parseInt(localStorage.getItem('contadorSons')) || 0;
        this.coresTeclas = JSON.parse(localStorage.getItem('coresTeclas')) || {};
        this.sonsEditados = JSON.parse(localStorage.getItem('sonsEditados')) || {};
        this.emojiEditados = JSON.parse(localStorage.getItem('emojiEditados')) || {};
        this.contextoAudio = null; // Adicionar contexto Web Audio
        this.sonsCarregados = {}; // Cache de áudios decodificados
        
        this.inicializar();
    }
    // NOVA FUNÇÃO: Detectar interação do usuário
detectarInteracao() {
    const eventos = ['touchstart', 'click', 'keydown'];
    
    eventos.forEach(evento => {
        document.addEventListener(evento, () => {
            // Ativar contexto de áudio se estiver suspenso
            if (this.contextoAudio && this.contextoAudio.state === 'suspended') {
                this.contextoAudio.resume().then(() => {
                    console.log('Áudio ativado por interação do usuário');
                    this.atualizarIndicadorAudio(true);
                });
            }
            
            // Esconder instruções após primeira interação
            const instrucoes = document.getElementById('instrucoes-mobile');
            if (instrucoes && instrucoes.style.display !== 'none') {
                setTimeout(() => {
                    instrucoes.style.display = 'none';
                }, 3000);
            }
        }, { once: true }); // Executar apenas uma vez
    });
}

// NOVA FUNÇÃO: Atualizar indicador de áudio
atualizarIndicadorAudio(ativo) {
    const indicador = document.getElementById('indicador-audio');
    if (indicador) {
        if (ativo) {
            indicador.classList.remove('inativo');
        } else {
            indicador.classList.add('inativo');
        }
    }
}

// NOVA FUNÇÃO: Mostrar instruções mobile
mostrarInstrucoesMobile() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        setTimeout(() => {
            const instrucoes = document.getElementById('instrucoes-mobile');
            if (instrucoes) {
                instrucoes.style.display = 'block';
                
                // Auto-esconder após 10 segundos
                setTimeout(() => {
                    if (instrucoes.style.display === 'block') {
                        instrucoes.style.display = 'none';
                    }
                }, 10000);
            }
        }, 1000);
    }
}

    inicializar() {
        this.configurarModoNoturno();
        this.inicializarAudio(); // Inicializar áudio primeiro
        this.configurarTeclas();
        this.configurarControles();
        this.restaurarConfiguracoes();
        this.atualizarContadorSons();
        
        // Inicializar Web Audio API para mobile
        this.inicializarWebAudio();
        
        // Configurar eventos
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.pararTodosSons();
        });
        
        // Botão de ativação de áudio para mobile
        this.criarBotaoAtivacaoAudio();
    }

    // NOVA FUNÇÃO: Inicializar Web Audio API
    inicializarWebAudio() {
        try {
            // Criar contexto de áudio
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.contextoAudio = new AudioContext();
            
            // Carregar todos os sons no cache
            this.carregarSonsCache();
            
            console.log('Web Audio API inicializado');
        } catch (error) {
            console.error('Erro ao inicializar Web Audio:', error);
        }
    }

    // NOVA FUNÇÃO: Carregar sons em cache
    async carregarSonsCache() {
        const elementosAudio = document.querySelectorAll('audio');
        
        for (const audioElement of elementosAudio) {
            const id = audioElement.id;
            
            try {
                const response = await fetch(audioElement.src);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.contextoAudio.decodeAudioData(arrayBuffer);
                
                this.sonsCarregados[id] = audioBuffer;
                console.log(`Áudio carregado em cache: ${id}`);
            } catch (error) {
                console.error(`Erro ao carregar áudio ${id}:`, error);
            }
        }
    }

    // NOVA FUNÇÃO: Criar botão de ativação de áudio
    criarBotaoAtivacaoAudio() {
        // Verificar se é mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            const botaoAtivar = document.createElement('button');
            botaoAtivar.id = 'botao-ativar-audio';
            botaoAtivar.className = 'botao-ativar-audio';
            botaoAtivar.innerHTML = '🎵 ATIVAR SONS';
            botaoAtivar.onclick = () => this.ativarAudioMobile();
            
            document.querySelector('.cabecalho')?.appendChild(botaoAtivar);
            
            // CSS para o botão
            const style = document.createElement('style');
            style.textContent = `
                .botao-ativar-audio {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 25px;
                    font-family: 'Montserrat', sans-serif;
                    font-weight: 600;
                    font-size: 0.9em;
                    cursor: pointer;
                    z-index: 1000;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    animation: pulsar-importante 2s infinite;
                }
                
                @keyframes pulsar-importante {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                .botao-ativar-audio:hover {
                    background: linear-gradient(135deg, #764ba2, #667eea);
                }
            `;
            document.head.appendChild(style);
        }
    }

    // NOVA FUNÇÃO: Ativar áudio no mobile
    ativarAudioMobile() {
        // Iniciar contexto de áudio (necessário para iOS)
        if (this.contextoAudio && this.contextoAudio.state === 'suspended') {
            this.contextoAudio.resume();
        }
        
        // Tocar um som silencioso para desbloquear
        this.tocarSomSilencioso();
        
        // Remover botão
        const botao = document.getElementById('botao-ativar-audio');
        if (botao) botao.remove();
        
        this.mostrarFeedback('✅ Sons ativados! Clique nas teclas.');
    }

    // NOVA FUNÇÃO: Tocar som silencioso para desbloquear
    tocarSomSilencioso() {
        try {
            // Método 1: Usando Web Audio API
            if (this.contextoAudio) {
                const source = this.contextoAudio.createBufferSource();
                const buffer = this.contextoAudio.createBuffer(1, 1, 22050);
                source.buffer = buffer;
                source.connect(this.contextoAudio.destination);
                source.start(0);
                source.stop(0.01);
            }
            
            // Método 2: Usando áudio HTML5
            const audio = new Audio();
            audio.volume = 0.001; // Quase inaudível
            audio.play().catch(e => console.log('Som silencioso para desbloquear'));
            
        } catch (error) {
            console.log('Som silencioso executado');
        }
    }

    // ATUALIZAR FUNÇÃO tocarSom() para mobile
    tocarSom(idElementoAudio) {
        // Verificar se o contexto de áudio está suspenso (iOS)
        if (this.contextoAudio && this.contextoAudio.state === 'suspended') {
            this.contextoAudio.resume().then(() => {
                this.executarSom(idElementoAudio);
            }).catch(error => {
                console.error('Erro ao resumir áudio:', error);
                this.mostrarFeedback('⚠️ Toque na tela para ativar sons');
            });
            return;
        }
        
        this.executarSom(idElementoAudio);
    }

    // NOVA FUNÇÃO: Executar som
    executarSom(idElementoAudio) {
        const audioElement = document.querySelector(idElementoAudio);
        
        if (!audioElement) {
            console.error(`Áudio não encontrado: ${idElementoAudio}`);
            return;
        }
        
        // Parar som atual
        if (this.audioAtual && this.audioAtual !== audioElement) {
            this.audioAtual.pause();
            this.audioAtual.currentTime = 0;
        }
        
        // Método 1: Tentar com Web Audio API primeiro (melhor para mobile)
        if (this.contextoAudio && this.sonsCarregados[audioElement.id]) {
            try {
                const source = this.contextoAudio.createBufferSource();
                source.buffer = this.sonsCarregados[audioElement.id];
                source.connect(this.contextoAudio.destination);
                source.start(0);
                
                // Atualizar feedback visual
                this.atualizarFeedbackTecla(audioElement.id);
                
                // Incrementar contador
                this.incrementarContador();
                return;
            } catch (error) {
                console.log('Falha no Web Audio, tentando HTML5...');
            }
        }
        
        // Método 2: Usar HTML5 Audio (fallback)
        this.audioAtual = audioElement;
        this.audioAtual.currentTime = 0;
        
        audioElement.play().catch(error => {
            console.error('Erro ao reproduzir áudio HTML5:', error);
            
            // Mostrar instruções para mobile
            if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                this.mostrarFeedback('📱 No iOS, toque primeiro em "ATIVAR SONS"');
            } else if (/Android/.test(navigator.userAgent)) {
                this.mostrarFeedback('📱 Toque na tela primeiro para permitir sons');
            } else {
                this.mostrarFeedback('❌ Erro ao reproduzir áudio');
            }
            
            this.audioAtual = null;
        }).then(() => {
            // Sucesso
            this.atualizarFeedbackTecla(audioElement.id);
            this.incrementarContador();
        });
    }

    // NOVA FUNÇÃO: Atualizar feedback visual da tecla
    atualizarFeedbackTecla(audioId) {
        const somId = audioId.replace('som_tecla_', '');
        const tecla = document.querySelector(`[data-som="${somId}"]`);
        
        if (tecla) {
            tecla.classList.add('ativa');
            setTimeout(() => tecla.classList.remove('ativa'), 300);
        }
    }

    // NOVA FUNÇÃO: Incrementar contador
    incrementarContador() {
        if (!this.modoEdicao) {
            this.contadorSons++;
            localStorage.setItem('contadorSons', this.contadorSons);
            this.atualizarContadorSons();
        }
    }
    configurarModoNoturno() {
        const botaoModo = document.getElementById('botao-modo');
        if (this.modoNoturno) {
            document.body.classList.add('modo-dia');
            if (botaoModo) {
                botaoModo.innerHTML = '<span class="icone">☀️</span><span class="texto">Modo Claro</span>';
            }
        }
    }

   configurarTeclas() {
    document.querySelectorAll('.tecla').forEach(tecla => {
        const somId = tecla.dataset.som;
        const idAudio = `#som_tecla_${somId}`;
        
        // Configurar emoji editado (APLICAR PARA TODAS as teclas)
        if (this.emojiEditados[tecla.className]) {
            tecla.textContent = this.emojiEditados[tecla.className];
            tecla.classList.add('editado');
        }
        
        // Configurar cor personalizada (APLICAR PARA TODAS as teclas)
        if (this.coresTeclas[tecla.className]) {
            tecla.style.background = this.coresTeclas[tecla.className];
            tecla.classList.add('editado');
        }
        
        // Salvar emoji original para TODAS as teclas
        if (!tecla.dataset.emojiOriginal) {
            tecla.dataset.emojiOriginal = tecla.textContent;
        }
        
        // Configurar eventos (IGUAL para todas as teclas)
        tecla.onclick = () => {
            if (this.modoEdicao) {
                this.abrirModalEdicao(tecla);
            } else {
                this.tocarSom(idAudio);
            }
        };

        tecla.onkeydown = (e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                tecla.classList.add('ativa');
                if (!this.modoEdicao) {
                    this.tocarSom(idAudio);
                }
                e.preventDefault();
            }
        };

        tecla.onkeyup = () => {
            tecla.classList.remove('ativa');
        };
    });
}

    tocarSom(idAudio) {
        const audioElement = document.querySelector(idAudio);
        
        if (!audioElement) {
            console.error(`Áudio não encontrado: ${idAudio}`);
            return;
        }
        
        // Parar som atual
        if (this.audioAtual && this.audioAtual !== audioElement) {
            this.audioAtual.pause();
            this.audioAtual.currentTime = 0;
        }
        
        // Tocar novo som
        this.audioAtual = audioElement;
        this.audioAtual.currentTime = 0;
        
        audioElement.play().catch(e => {
            console.error('Erro ao reproduzir áudio:', e);
            this.mostrarFeedback('❌ Erro ao reproduzir áudio');
        });
        
        // Incrementar contador
        this.contadorSons++;
        localStorage.setItem('contadorSons', this.contadorSons);
        this.atualizarContadorSons();
        
        // Feedback visual
        const tecla = document.querySelector(`[data-som="${idAudio.split('_').pop()}"]`);
        if (tecla) {
            tecla.classList.add('ativa');
            setTimeout(() => tecla.classList.remove('ativa'), 300);
        }
    }

    pararTodosSons() {
        if (this.audioAtual) {
            this.audioAtual.pause();
            this.audioAtual.currentTime = 0;
            this.audioAtual = null;
        }
        
        document.querySelectorAll('.tecla').forEach(tecla => {
            tecla.classList.remove('ativa');
        });
        
        this.mostrarFeedback('⏹️ Todos os sons parados');
    }

    atualizarContadorSons() {
        const elemento = document.getElementById('contador-sons');
        if (elemento) {
            elemento.textContent = this.contadorSons.toLocaleString('pt-BR');
        }
    }

    toggleModoEdicao() {
        this.modoEdicao = !this.modoEdicao;
        const botao = document.getElementById('botao-editar');
        
        document.querySelectorAll('.tecla').forEach(tecla => {
            if (this.modoEdicao) {
                tecla.classList.add('modo-edicao');
                tecla.title = 'Clique para editar esta tecla';
            } else {
                tecla.classList.remove('modo-edicao');
                tecla.title = '';
            }
        });
        
        if (botao) {
            if (this.modoEdicao) {
                botao.innerHTML = '<span class="icone">✅</span><span class="texto">Sair do Modo</span>';
                botao.classList.add('ativo');
                this.mostrarFeedback('✏️ Modo edição ativado');
            } else {
                botao.innerHTML = '<span class="icone">✏️</span><span class="texto">Editar Teclado</span>';
                botao.classList.remove('ativo');
                this.mostrarFeedback('✅ Modo edição desativado');
            }
        }
    }

    toggleModoNoturno() {
        this.modoNoturno = !this.modoNoturno;
        const botao = document.getElementById('botao-modo');
        
        document.body.classList.toggle('modo-dia', this.modoNoturno);
        localStorage.setItem('modoNoturno', this.modoNoturno);
        
        if (botao) {
            if (this.modoNoturno) {
                botao.innerHTML = '<span class="icone">☀️</span><span class="texto">Modo Claro</span>';
                this.mostrarFeedback('☀️ Modo claro ativado');
            } else {
                botao.innerHTML = '<span class="icone">🌙</span><span class="texto">Modo Noturno</span>';
                this.mostrarFeedback('🌙 Modo noturno ativado');
            }
        }
    }

    abrirModalEdicao(tecla) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3 class="modal-title">✏️ Editar Tecla</h3>
                    <button class="btn-fechar-modal">×</button>
                </div>
                
                <div class="grupo-form">
                    <label>Emoji/Texto:</label>
                    <input type="text" class="input-form" id="input-emoji" 
                           value="${tecla.textContent}" maxlength="10">
                    <small>Digite um emoji ou texto curto (máx. 10 caracteres)</small>
                </div>
                
                <div class="grupo-form">
                    <label>Cor da Tecla:</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="color" class="input-form" id="input-cor" 
                               value="${this.coresTeclas[tecla.className] ? this.hexFromGradient(this.coresTeclas[tecla.className]) : '#667eea'}" 
                               style="flex: 0 0 60px;">
                        <div id="preview-cor" style="width: 40px; height: 40px; border-radius: 8px; 
                             border: 2px solid rgba(255,255,255,0.2); background: ${tecla.style.background || '#667eea'}"></div>
                    </div>
                    
                    <div class="seletor-cores-container">
                        ${['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', 
                           '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140',
                           '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2'].map(cor => `
                            <div class="cor-opcao" style="background: ${cor}" data-cor="${cor}"></div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="grupo-form">
                    <label>Alterar Som:</label>
                    <input type="file" class="input-form" id="input-som" accept="audio/*">
                    <small>Formatos suportados: MP3, WAV, OGG (máx. 5MB)</small>
                </div>
                
                <div class="modal-botoes">
                    <button class="btn-modal btn-primario" id="btn-salvar-tecla">
                        💾 Salvar Alterações
                    </button>
                    <button class="btn-modal btn-secundario" id="btn-reset-tecla">
                        ↩️ Resetar Tecla
                    </button>
                    <button class="btn-modal btn-perigo" id="btn-testar-som">
                        🔊 Testar Som
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Eventos das cores pré-definidas
        modal.querySelectorAll('.cor-opcao').forEach(corOpcao => {
            corOpcao.onclick = () => {
                const cor = corOpcao.dataset.cor;
                modal.querySelector('#input-cor').value = cor;
                modal.querySelector('#preview-cor').style.background = cor;
            };
        });
        
        // Atualizar preview quando cor muda
        modal.querySelector('#input-cor').oninput = (e) => {
            modal.querySelector('#preview-cor').style.background = e.target.value;
        };
        
        // Eventos dos botões
        modal.querySelector('.btn-fechar-modal').onclick = () => {
            document.body.removeChild(modal);
        };
        
        modal.querySelector('#btn-salvar-tecla').onclick = () => {
            this.salvarAlteracoesTecla(tecla, modal);
            document.body.removeChild(modal);
        };
        
        modal.querySelector('#btn-reset-tecla').onclick = () => {
            if (confirm('Resetar esta tecla para as configurações originais?')) {
                this.resetarTecla(tecla);
                document.body.removeChild(modal);
            }
        };
        
        modal.querySelector('#btn-testar-som').onclick = () => {
            const somId = tecla.dataset.som;
            const idAudio = `#som_tecla_${somId}`;
            this.tocarSom(idAudio);
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
    }

    hexFromGradient(gradient) {
        // Extrai a primeira cor do gradiente
        const match = gradient.match(/#[0-9A-Fa-f]{6}/);
        return match ? match[0] : '#667eea';
    }

    salvarAlteracoesTecla(tecla, modal) {
        const novoEmoji = modal.querySelector('#input-emoji').value.trim();
        const novaCor = modal.querySelector('#input-cor').value;
        const arquivoSom = modal.querySelector('#input-som').files[0];
        
        // Salvar emoji
        if (novoEmoji && novoEmoji !== tecla.dataset.emojiOriginal) {
            tecla.textContent = novoEmoji;
            this.emojiEditados[tecla.className] = novoEmoji;
            tecla.classList.add('editado');
        } else if (novoEmoji === tecla.dataset.emojiOriginal) {
            delete this.emojiEditados[tecla.className];
            tecla.classList.remove('editado');
        }
        
        // Salvar cor
        if (novaCor) {
            const gradiente = `linear-gradient(145deg, ${novaCor}40, ${novaCor}80)`;
            tecla.style.background = gradiente;
            this.coresTeclas[tecla.className] = gradiente;
            tecla.classList.add('editado');
        }
        
        // Salvar som
        if (arquivoSom) {
            if (arquivoSom.size > 5 * 1024 * 1024) {
                this.mostrarFeedback('❌ Arquivo muito grande! Máximo 5MB');
                return;
            }
            
            const url = URL.createObjectURL(arquivoSom);
            const somId = tecla.dataset.som;
            const audioElement = document.querySelector(`#som_tecla_${somId}`);
            
            if (audioElement) {
                audioElement.src = url;
                this.sonsEditados[somId] = url;
                tecla.classList.add('editado');
            }
        }
        
        // Atualizar localStorage
        localStorage.setItem('emojiEditados', JSON.stringify(this.emojiEditados));
        localStorage.setItem('coresTeclas', JSON.stringify(this.coresTeclas));
        localStorage.setItem('sonsEditados', JSON.stringify(this.sonsEditados));
        
        this.mostrarFeedback('✅ Tecla atualizada com sucesso!');
    }

    resetarTecla(tecla) {
        const className = tecla.className;
        const somId = tecla.dataset.som;
        
        // Resetar emoji
        tecla.textContent = tecla.dataset.emojiOriginal;
        delete this.emojiEditados[className];
        
        // Resetar cor
        tecla.style.background = '';
        delete this.coresTeclas[className];
        
        // Resetar som
        const audioElement = document.querySelector(`#som_tecla_${somId}`);
        if (audioElement && audioElement.dataset.srcOriginal) {
            audioElement.src = audioElement.dataset.srcOriginal;
            delete this.sonsEditados[somId];
        }
        
        // Remover marca de editado
        tecla.classList.remove('editado');
        
        // Atualizar localStorage
        localStorage.setItem('emojiEditados', JSON.stringify(this.emojiEditados));
        localStorage.setItem('coresTeclas', JSON.stringify(this.coresTeclas));
        localStorage.setItem('sonsEditados', JSON.stringify(this.sonsEditados));
        
        this.mostrarFeedback('↩️ Tecla resetada para configurações originais');
    }

    aplicarCoresAleatorias() {
        const cores = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe',
            '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140',
            '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
            '#7209B7', '#3A86FF', '#FB5607', '#8338EC', '#FF006E'
        ];
        
        document.querySelectorAll('.tecla').forEach(tecla => {
            const corAleatoria = cores[Math.floor(Math.random() * cores.length)];
            const gradiente = `linear-gradient(145deg, ${corAleatoria}40, ${corAleatoria}80)`;
            
            tecla.style.background = gradiente;
            this.coresTeclas[tecla.className] = gradiente;
            tecla.classList.add('editado');
        });
        
        localStorage.setItem('coresTeclas', JSON.stringify(this.coresTeclas));
        this.mostrarFeedback('🌈 Cores aleatórias aplicadas!');
    }

    abrirSeletorCores() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3 class="modal-title">🎨 Personalizar Cores</h3>
                    <button class="btn-fechar-modal">×</button>
                </div>
                
                <div class="grupo-form">
                    <label>Selecione uma cor para aplicar em todas as teclas:</label>
                    <input type="color" class="input-form" id="cor-unica" value="#667eea" style="width: 100%; height: 50px;">
                </div>
                
                <div class="grupo-form">
                    <label>Ou escolha uma cor pré-definida:</label>
                    <div class="paleta-cores">
                        ${[
                            '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
                            '#7209B7', '#3A86FF', '#FB5607', '#8338EC', '#FF006E',
                            '#FFBE0B', '#3A86FF', '#8338EC', '#FB5607', '#FF006E',
                            '#00BBF9', '#00F5D4', '#FF97B7', '#9B5DE5', '#F15BB5'
                        ].map(cor => `
                            <div class="cor-predefinida" style="background: ${cor}" 
                                 onclick="window.tecladoInterativo.aplicarCorUnica('${cor}'); 
                                          document.querySelector('.modal-overlay')?.remove();"></div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="modal-botoes">
                    <button class="btn-modal btn-primario" onclick="window.tecladoInterativo.aplicarCorUnica(
                        document.getElementById('cor-unica').value); 
                        document.querySelector('.modal-overlay')?.remove();">
                        🎨 Aplicar Cor
                    </button>
                    <button class="btn-modal btn-secundario" onclick="window.tecladoInterativo.aplicarCoresAleatorias();
                        document.querySelector('.modal-overlay')?.remove();">
                        🎲 Cores Aleatórias
                    </button>
                    <button class="btn-modal btn-perigo" onclick="window.tecladoInterativo.resetarCores();
                        document.querySelector('.modal-overlay')?.remove();">
                        ↩️ Resetar Cores
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.btn-fechar-modal').onclick = () => {
            document.body.removeChild(modal);
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
    }

    aplicarCorUnica(cor) {
        const gradiente = `linear-gradient(145deg, ${cor}40, ${cor}80)`;
        
        document.querySelectorAll('.tecla').forEach(tecla => {
            tecla.style.background = gradiente;
            this.coresTeclas[tecla.className] = gradiente;
            tecla.classList.add('editado');
        });
        
        localStorage.setItem('coresTeclas', JSON.stringify(this.coresTeclas));
        this.mostrarFeedback(`🎨 Cor aplicada em todas as teclas!`);
    }

    resetarCores() {
        if (confirm('Resetar cores de todas as teclas?')) {
            document.querySelectorAll('.tecla').forEach(tecla => {
                tecla.style.background = '';
                tecla.classList.remove('editado');
                delete this.coresTeclas[tecla.className];
            });
            
            localStorage.removeItem('coresTeclas');
            this.mostrarFeedback('↩️ Cores resetadas!');
        }
    }

    resetarTudo() {
        if (confirm('Tem certeza que deseja resetar TODAS as configurações? Isso não pode ser desfeito.')) {
            // Resetar cores
            this.resetarCores();
            
            // Resetar emojis
            document.querySelectorAll('.tecla').forEach(tecla => {
                if (tecla.dataset.emojiOriginal) {
                    tecla.textContent = tecla.dataset.emojiOriginal;
                }
                tecla.classList.remove('editado');
            });
            localStorage.removeItem('emojiEditados');
            
            // Resetar sons
            document.querySelectorAll('audio').forEach(audio => {
                if (audio.dataset.srcOriginal) {
                    audio.src = audio.dataset.srcOriginal;
                }
            });
            localStorage.removeItem('sonsEditados');
            
            // Resetar contador de sons
            this.contadorSons = 0;
            localStorage.removeItem('contadorSons');
            this.atualizarContadorSons();
            
            // Sair do modo edição
            if (this.modoEdicao) {
                this.toggleModoEdicao();
            }
            
            this.mostrarFeedback('🔄 Todas as configurações foram resetadas!');
        }
    }

    restaurarConfiguracoes() {
        // Restaurar sons editados
        Object.entries(this.sonsEditados).forEach(([somId, url]) => {
            const audioElement = document.querySelector(`#som_tecla_${somId}`);
            if (audioElement) {
                audioElement.src = url;
            }
        });
        
        // Salvar URLs originais para possível reset
        document.querySelectorAll('audio').forEach(audio => {
            if (!audio.dataset.srcOriginal) {
                audio.dataset.srcOriginal = audio.src;
            }
        });
    }

    mostrarFeedback(mensagem) {
        // Remove feedback anterior
        const feedbackAnterior = document.querySelector('.feedback-flutuante');
        if (feedbackAnterior) {
            feedbackAnterior.remove();
        }
        
        const feedback = document.createElement('div');
        feedback.className = 'feedback-flutuante';
        feedback.textContent = mensagem;
        feedback.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
            font-weight: 600;
            font-family: 'Montserrat', sans-serif;
            font-size: 0.95em;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        `;
        
        // Adicionar estilos de animação
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                document.body.removeChild(feedback);
            }
            if (style.parentNode) {
                document.head.removeChild(style);
            }
        }, 3000);
    }

    configurarControles() {
        document.getElementById('botao-parar').onclick = () => this.pararTodosSons();
        document.getElementById('botao-editar').onclick = () => this.toggleModoEdicao();
        document.getElementById('botao-reset').onclick = () => this.resetarTudo();
        document.getElementById('botao-modo').onclick = () => this.toggleModoNoturno();
        document.getElementById('botao-cor-teclas').onclick = () => this.abrirSeletorCores();
        document.getElementById('botao-cores-aleatorias').onclick = () => this.aplicarCoresAleatorias();
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.tecladoInterativo = new TecladoInterativo();
});