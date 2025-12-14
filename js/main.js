// main.js - Teclado Interativo Completo
// Versão: 3.0.0
// Data: 2024

class TecladoInterativo {
    constructor() {
        this.audioAtual = null;
        this.modoEdicao = false;
        this.modoNoturno = localStorage.getItem('modoNoturno') === 'true';
        this.contadorSons = parseInt(localStorage.getItem('contadorSons')) || 0;
        this.coresTeclas = JSON.parse(localStorage.getItem('coresTeclas')) || {};
        this.sonsEditados = JSON.parse(localStorage.getItem('sonsEditados')) || {};
        this.emojiEditados = JSON.parse(localStorage.getItem('emojiEditados')) || {};
        this.audioContext = null;
        this.audioUnlocked = false;
        this.sonsCache = new Map();
        
        this.inicializar();
    }

    inicializar() {
        console.log('🎹 Inicializando Teclado Interativo...');
        
        // Configurar modo noturno
        this.configurarModoNoturno();
        
        // Configurar áudio
        this.configurarAudio();
        
        // Configurar elementos
        this.configurarTeclas();
        this.configurarControles();
        this.restaurarConfiguracoes();
        this.atualizarContadorSons();
        this.configurarEventosGlobais();
        
        // Inicializar versão
        this.exibirVersao();
        
        // Feedback inicial
        setTimeout(() => {
            this.mostrarFeedback('🎹 Teclado Interativo Pronto!', 2000);
        }, 500);
    }

    // ========== CONFIGURAÇÃO DE ÁUDIO ==========
    
    configurarAudio() {
        // Criar contexto de áudio
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Inicializar em estado suspenso
            if (this.audioContext.state === 'running') {
                this.audioUnlocked = true;
                console.log('✅ Áudio já desbloqueado');
            } else {
                console.log('⚠️ Áudio precisa de interação do usuário');
                this.mostrarInstrucoesAudio();
            }
        } catch (e) {
            console.error('❌ Web Audio API não suportada:', e);
        }
        
        // Pré-carregar sons
        this.preCarregarSons();
    }
    
    mostrarInstrucoesAudio() {
        // Verificar se é mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Criar overlay de instruções
            const overlay = document.createElement('div');
            overlay.className = 'overlay-audio-instructions';
            overlay.innerHTML = `
                <div class="audio-instructions">
                    <h3>🔊 Ativar Sons</h3>
                    <p>Para usar os sons no celular:</p>
                    <ol>
                        <li>Toque em qualquer tecla abaixo</li>
                        <li>Aguarde a permissão do navegador</li>
                        <li>Toque novamente para tocar sons</li>
                    </ol>
                    <div class="tecla-exemplo" onclick="window.tecladoInterativo.desbloquearAudio()">
                        <span>🔊</span>
                        <small>Toque aqui primeiro</small>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" class="btn-pular">
                        Pular
                    </button>
                </div>
            `;
            
            // Adicionar estilos
            const style = document.createElement('style');
            style.textContent = `
                .overlay-audio-instructions {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    backdrop-filter: blur(10px);
                }
                
                .audio-instructions {
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    padding: 25px;
                    border-radius: 20px;
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                    border: 2px solid #00d4ff;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                
                .audio-instructions h3 {
                    color: #00d4ff;
                    margin-top: 0;
                }
                
                .audio-instructions ol {
                    text-align: left;
                    margin: 20px 0;
                    padding-left: 20px;
                }
                
                .audio-instructions li {
                    margin-bottom: 10px;
                    color: #fff;
                }
                
                .tecla-exemplo {
                    width: 100px;
                    height: 100px;
                    background: linear-gradient(145deg, #667eea, #764ba2);
                    border-radius: 15px;
                    margin: 20px auto;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                    color: white;
                    font-size: 2em;
                }
                
                .tecla-exemplo:hover {
                    transform: scale(1.05);
                }
                
                .tecla-exemplo small {
                    font-size: 0.4em;
                    margin-top: 5px;
                    opacity: 0.8;
                }
                
                .btn-pular {
                    background: transparent;
                    border: 1px solid #666;
                    color: #999;
                    padding: 10px 20px;
                    border-radius: 10px;
                    cursor: pointer;
                    margin-top: 15px;
                    font-family: inherit;
                }
                
                .btn-pular:hover {
                    background: rgba(255,255,255,0.1);
                }
            `;
            
            document.head.appendChild(style);
            document.body.appendChild(overlay);
        }
    }
    
    desbloquearAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                this.audioUnlocked = true;
                console.log('✅ Áudio desbloqueado com sucesso!');
                this.mostrarFeedback('✅ Sons ativados!', 2000);
                
                // Remover overlay
                const overlay = document.querySelector('.overlay-audio-instructions');
                if (overlay) overlay.remove();
                
                // Tocar som de confirmação
                this.tocarSomConfirmacao();
            }).catch(e => {
                console.error('❌ Erro ao desbloquear áudio:', e);
                this.mostrarFeedback('❌ Não foi possível ativar os sons', 3000);
            });
        }
    }
    
    tocarSomConfirmacao() {
        // Tocar um som simples para confirmar
        if (this.audioContext && this.audioUnlocked) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 523.25; // Nota C5
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        }
    }
    
    preCarregarSons() {
        // Carregar todos os elementos de áudio
        const elementosAudio = document.querySelectorAll('audio');
        
        elementosAudio.forEach(audio => {
            // Marcar como pré-carregado
            audio.preload = 'auto';
            audio.load();
            
            // Adicionar ao cache
            this.sonsCache.set(audio.id, audio);
            
            // Configurar tratamento de erro
            audio.onerror = () => {
                console.error(`❌ Erro ao carregar áudio: ${audio.src}`);
                this.mostrarFeedback(`❌ Erro no som ${audio.id}`, 3000);
            };
        });
        
        console.log(`✅ ${elementosAudio.length} sons pré-carregados`);
    }
    
    // ========== FUNÇÃO PRINCIPAL DE SOM ==========
    
    tocarSom(idElementoAudio) {
        // Verificar se o áudio está desbloqueado
        if (!this.audioUnlocked && this.audioContext) {
            this.desbloquearAudio();
            return;
        }
        
        const audioElement = document.querySelector(idElementoAudio);
        
        if (!audioElement) {
            console.error(`❌ Áudio não encontrado: ${idElementoAudio}`);
            return;
        }
        
        // Parar som atual se estiver tocando
        if (this.audioAtual && this.audioAtual !== audioElement) {
            this.audioAtual.pause();
            this.audioAtual.currentTime = 0;
        }
        
        // Tentar reproduzir
        try {
            this.audioAtual = audioElement;
            audioElement.currentTime = 0;
            
            const playPromise = audioElement.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Sucesso
                    this.onSomTocado(audioElement);
                }).catch(error => {
                    // Falha - tentar método alternativo
                    console.log('❌ Play bloqueado, tentando fallback...', error);
                    this.tentarFallbackAudio(audioElement);
                });
            }
        } catch (error) {
            console.error('❌ Erro ao tocar som:', error);
            this.tentarFallbackAudio(audioElement);
        }
    }
    
    tentarFallbackAudio(audioElement) {
        // Método 1: Tentar com volume baixo
        audioElement.volume = 0.5;
        
        // Método 2: Usar Web Audio API se disponível
        if (this.audioContext && this.audioUnlocked) {
            this.usarWebAudioAPI(audioElement);
            return;
        }
        
        // Método 3: Pedir interação do usuário
        this.mostrarFeedback('🔊 Toque novamente para ativar sons', 3000);
        
        // Método 4: Tentar com timeout
        setTimeout(() => {
            audioElement.play().catch(e => {
                console.error('❌ Fallback também falhou:', e);
                this.mostrarFeedback('❌ Erro ao reproduzir som', 3000);
            });
        }, 100);
    }
    
    usarWebAudioAPI(audioElement) {
        try {
            // Criar source do áudio
            const source = this.audioContext.createMediaElementSource(audioElement);
            const gainNode = this.audioContext.createGain();
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            gainNode.gain.value = 1.0;
            
            audioElement.currentTime = 0;
            audioElement.play();
            
            this.onSomTocado(audioElement);
            
        } catch (error) {
            console.error('❌ Web Audio API falhou:', error);
        }
    }
    
    onSomTocado(audioElement) {
        // Feedback visual
        const somId = audioElement.id.replace('som_tecla_', '');
        const tecla = document.querySelector(`[data-som="${somId}"]`);
        
        if (tecla) {
            tecla.classList.add('tocando');
            setTimeout(() => tecla.classList.remove('tocando'), 300);
            
            // Efeito de onda
            this.criarEfeitoOnda(tecla);
        }
        
        // Atualizar contador
        if (!this.modoEdicao) {
            this.contadorSons++;
            localStorage.setItem('contadorSons', this.contadorSons.toString());
            this.atualizarContadorSons();
        }
        
        // Feedback sonoro (opcional)
        if (this.audioContext && this.audioUnlocked) {
            this.tocarFeedbackSonoro();
        }
    }
    
    criarEfeitoOnda(tecla) {
        const onda = document.createElement('div');
        onda.className = 'onda-sonora';
        
        const rect = tecla.getBoundingClientRect();
        onda.style.cssText = `
            position: fixed;
            top: ${rect.top}px;
            left: ${rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border-radius: 20px;
            background: radial-gradient(circle, rgba(0,212,255,0.3) 0%, rgba(0,212,255,0) 70%);
            pointer-events: none;
            z-index: 999;
            animation: expandirOnda 0.5s ease-out forwards;
        `;
        
        // Adicionar animação se não existir
        if (!document.querySelector('#animacao-onda')) {
            const style = document.createElement('style');
            style.id = 'animacao-onda';
            style.textContent = `
                @keyframes expandirOnda {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(onda);
        setTimeout(() => onda.remove(), 500);
    }
    
    tocarFeedbackSonoro() {
        // Som de confirmação sutil
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 1046.50; // Nota C6
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            // Ignorar erros no feedback
        }
    }
    
    pararTodosSons() {
        if (this.audioAtual) {
            this.audioAtual.pause();
            this.audioAtual.currentTime = 0;
            this.audioAtual = null;
        }
        
        // Parar todos os elementos de áudio
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        // Remover classe tocando
        document.querySelectorAll('.tecla').forEach(tecla => {
            tecla.classList.remove('tocando', 'ativa');
        });
        
        this.mostrarFeedback('⏹️ Todos os sons parados', 2000);
    }
    
    // ========== CONFIGURAÇÃO DAS TECLAS ==========
    
    configurarTeclas() {
        const teclas = document.querySelectorAll('.tecla');
        
        teclas.forEach(tecla => {
            const somId = tecla.dataset.som;
            const idAudio = `#som_tecla_${somId}`;
            
            // Restaurar configurações salvas
            this.restaurarTecla(tecla);
            
            // Salvar emoji original
            if (!tecla.dataset.emojiOriginal) {
                tecla.dataset.emojiOriginal = tecla.textContent;
            }
            
            // Configurar eventos
            this.configurarEventosTecla(tecla, idAudio);
        });
        
        console.log(`✅ ${teclas.length} teclas configuradas`);
    }
    
    restaurarTecla(tecla) {
        // Restaurar emoji
        if (this.emojiEditados[tecla.className]) {
            tecla.textContent = this.emojiEditados[tecla.className];
            tecla.classList.add('editado');
        }
        
        // Restaurar cor
        if (this.coresTeclas[tecla.className]) {
            tecla.style.background = this.coresTeclas[tecla.className];
            tecla.classList.add('editado');
        }
    }
    
    configurarEventosTecla(tecla, idAudio) {
        // Clique/Touch
        tecla.addEventListener('click', () => {
            if (this.modoEdicao) {
                this.abrirModalEdicao(tecla);
            } else {
                this.tocarSom(idAudio);
            }
        });
        
        // Teclado
        tecla.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                tecla.classList.add('ativa');
                if (!this.modoEdicao) {
                    this.tocarSom(idAudio);
                }
                e.preventDefault();
            }
        });
        
        tecla.addEventListener('keyup', () => {
            tecla.classList.remove('ativa');
        });
        
        // Touch para mobile
        tecla.addEventListener('touchstart', (e) => {
            tecla.classList.add('ativa');
            if (!this.modoEdicao) {
                // Tentar desbloquear áudio no primeiro toque
                if (!this.audioUnlocked) {
                    this.desbloquearAudio();
                }
                this.tocarSom(idAudio);
            }
            e.preventDefault();
        }, { passive: false });
        
        tecla.addEventListener('touchend', () => {
            tecla.classList.remove('ativa');
        });
        
        tecla.addEventListener('touchcancel', () => {
            tecla.classList.remove('ativa');
        });
    }
    
    // ========== SISTEMA DE EDIÇÃO ==========
    
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
                this.mostrarFeedback('✏️ Modo edição ativado', 2000);
            } else {
                botao.innerHTML = '<span class="icone">✏️</span><span class="texto">Editar Teclado</span>';
                botao.classList.remove('ativo');
                this.mostrarFeedback('✅ Modo edição desativado', 2000);
            }
        }
    }
    
    abrirModalEdicao(tecla) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3 class="modal-title">✏️ Editar "${tecla.textContent}"</h3>
                    <button class="btn-fechar-modal">×</button>
                </div>
                
                <div class="grupo-form">
                    <label>Emoji/Texto:</label>
                    <input type="text" class="input-form" id="input-emoji" 
                           value="${tecla.textContent}" maxlength="10">
                    <small>Digite um emoji ou texto curto</small>
                </div>
                
                <div class="grupo-form">
                    <label>Cor da Tecla:</label>
                    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                        <input type="color" class="input-form" id="input-cor" 
                               value="${this.extrairCorDaTecla(tecla)}" 
                               style="flex: 0 0 60px; height: 40px;">
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
                    <small>MP3, WAV, OGG (máx. 5MB)</small>
                    <button class="btn-teste-som" onclick="window.tecladoInterativo.testarSomTecla('${tecla.dataset.som}')">
                        🔊 Testar Som Atual
                    </button>
                </div>
                
                <div class="modal-botoes">
                    <button class="btn-modal btn-primario" id="btn-salvar-tecla">
                        💾 Salvar
                    </button>
                    <button class="btn-modal btn-secundario" id="btn-reset-tecla">
                        ↩️ Resetar
                    </button>
                    <button class="btn-modal btn-perigo" id="btn-fechar-modal">
                        ❌ Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Configurar eventos do modal
        this.configurarModalEdicao(tecla, modal);
    }
    
    extrairCorDaTecla(tecla) {
        const estilo = tecla.style.background;
        if (estilo.includes('#')) {
            const match = estilo.match(/#[0-9A-Fa-f]{6}/);
            return match ? match[0] : '#667eea';
        }
        return '#667eea';
    }
    
    configurarModalEdicao(tecla, modal) {
        // Eventos das cores pré-definidas
        modal.querySelectorAll('.cor-opcao').forEach(corOpcao => {
            corOpcao.addEventListener('click', () => {
                const cor = corOpcao.dataset.cor;
                modal.querySelector('#input-cor').value = cor;
                modal.querySelector('#preview-cor').style.background = cor;
            });
        });
        
        // Atualizar preview quando cor muda
        modal.querySelector('#input-cor').addEventListener('input', (e) => {
            modal.querySelector('#preview-cor').style.background = e.target.value;
        });
        
        // Botão salvar
        modal.querySelector('#btn-salvar-tecla').addEventListener('click', () => {
            this.salvarAlteracoesTecla(tecla, modal);
            document.body.removeChild(modal);
        });
        
        // Botão reset
        modal.querySelector('#btn-reset-tecla').addEventListener('click', () => {
            if (confirm('Resetar esta tecla para as configurações originais?')) {
                this.resetarTecla(tecla);
                document.body.removeChild(modal);
            }
        });
        
        // Botão fechar
        const btnFechar = modal.querySelector('#btn-fechar-modal');
        const btnX = modal.querySelector('.btn-fechar-modal');
        
        [btnFechar, btnX].forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });
        
        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    testarSomTecla(somId) {
        this.tocarSom(`#som_tecla_${somId}`);
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
                this.mostrarFeedback('❌ Arquivo muito grande! Máximo 5MB', 3000);
                return;
            }
            
            const url = URL.createObjectURL(arquivoSom);
            const somId = tecla.dataset.som;
            const audioElement = document.querySelector(`#som_tecla_${somId}`);
            
            if (audioElement) {
                // Salvar src original se for a primeira vez
                if (!audioElement.dataset.srcOriginal) {
                    audioElement.dataset.srcOriginal = audioElement.src;
                }
                
                audioElement.src = url;
                this.sonsEditados[somId] = url;
                tecla.classList.add('editado');
            }
        }
        
        // Atualizar localStorage
        this.salvarConfiguracoes();
        
        this.mostrarFeedback('✅ Tecla atualizada!', 2000);
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
        this.salvarConfiguracoes();
        
        this.mostrarFeedback('↩️ Tecla resetada', 2000);
    }
    
    salvarConfiguracoes() {
        localStorage.setItem('emojiEditados', JSON.stringify(this.emojiEditados));
        localStorage.setItem('coresTeclas', JSON.stringify(this.coresTeclas));
        localStorage.setItem('sonsEditados', JSON.stringify(this.sonsEditados));
    }
    
    // ========== SISTEMA DE CORES ==========
    
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
        this.mostrarFeedback('🌈 Cores aleatórias aplicadas!', 2000);
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
                    <label>Cor única para todas:</label>
                    <input type="color" class="input-form" id="cor-unica" value="#667eea" style="width: 100%; height: 50px;">
                </div>
                
                <div class="grupo-form">
                    <label>Cores pré-definidas:</label>
                    <div class="paleta-cores">
                        ${[
                            '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
                            '#7209B7', '#3A86FF', '#FB5607', '#8338EC', '#FF006E',
                            '#FFBE0B', '#3A86FF', '#8338EC', '#FB5607', '#FF006E',
                            '#00BBF9', '#00F5D4', '#FF97B7', '#9B5DE5', '#F15BB5'
                        ].map(cor => `
                            <div class="cor-predefinida" style="background: ${cor}" 
                                 data-cor="${cor}"></div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="modal-botoes">
                    <button class="btn-modal btn-primario" id="btn-aplicar-cor">
                        🎨 Aplicar Cor
                    </button>
                    <button class="btn-modal btn-secundario" id="btn-cores-aleatorias">
                        🎲 Aleatórias
                    </button>
                    <button class="btn-modal btn-perigo" id="btn-reset-cores">
                        ↩️ Resetar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Eventos
        modal.querySelectorAll('.cor-predefinida').forEach(cor => {
            cor.addEventListener('click', () => {
                modal.querySelector('#cor-unica').value = cor.dataset.cor;
            });
        });
        
        modal.querySelector('#btn-aplicar-cor').addEventListener('click', () => {
            this.aplicarCorUnica(modal.querySelector('#cor-unica').value);
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#btn-cores-aleatorias').addEventListener('click', () => {
            this.aplicarCoresAleatorias();
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#btn-reset-cores').addEventListener('click', () => {
            this.resetarCores();
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.btn-fechar-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    aplicarCorUnica(cor) {
        const gradiente = `linear-gradient(145deg, ${cor}40, ${cor}80)`;
        
        document.querySelectorAll('.tecla').forEach(tecla => {
            tecla.style.background = gradiente;
            this.coresTeclas[tecla.className] = gradiente;
            tecla.classList.add('editado');
        });
        
        localStorage.setItem('coresTeclas', JSON.stringify(this.coresTeclas));
        this.mostrarFeedback(`🎨 Cor aplicada em todas as teclas!`, 2000);
    }
    
    resetarCores() {
        if (confirm('Resetar cores de todas as teclas?')) {
            document.querySelectorAll('.tecla').forEach(tecla => {
                tecla.style.background = '';
                tecla.classList.remove('editado');
                delete this.coresTeclas[tecla.className];
            });
            
            localStorage.removeItem('coresTeclas');
            this.mostrarFeedback('↩️ Cores resetadas!', 2000);
        }
    }
    
    // ========== MODO NOTURNO ==========
    
    configurarModoNoturno() {
        if (this.modoNoturno) {
            document.body.classList.add('modo-dia');
            const botaoModo = document.getElementById('botao-modo');
            if (botaoModo) {
                botaoModo.innerHTML = '<span class="icone">☀️</span><span class="texto">Modo Claro</span>';
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
                this.mostrarFeedback('☀️ Modo claro ativado', 2000);
            } else {
                botao.innerHTML = '<span class="icone">🌙</span><span class="texto">Modo Noturno</span>';
                this.mostrarFeedback('🌙 Modo noturno ativado', 2000);
            }
        }
    }
    
    // ========== RESET GERAL ==========
    
    resetarTudo() {
        if (confirm('Tem certeza que deseja resetar TODAS as configurações?\n\nIsso irá:\n• Resetar todas as cores\n• Restaurar emojis originais\n• Restaurar sons originais\n• Zerar contador de sons\n\nIsso não pode ser desfeito!')) {
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
            
            this.mostrarFeedback('🔄 Todas as configurações resetadas!', 3000);
        }
    }
    
    // ========== CONTADORES E FEEDBACK ==========
    
    atualizarContadorSons() {
        const elemento = document.getElementById('contador-sons');
        if (elemento) {
            elemento.textContent = this.contadorSons.toLocaleString('pt-BR');
        }
    }
    
    mostrarFeedback(mensagem, duracao = 3000) {
        // Remover feedback anterior
        const feedbackAnterior = document.querySelector('.feedback-flutuante');
        if (feedbackAnterior) {
            feedbackAnterior.remove();
        }
        
        // Criar novo feedback
        const feedback = document.createElement('div');
        feedback.className = 'feedback-flutuante';
        feedback.textContent = mensagem;
        
        // Adicionar ao DOM
        document.body.appendChild(feedback);
        
        // Remover após duração
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, duracao);
    }
    
    exibirVersao() {
        const versao = '3.0.0';
        const elemento = document.getElementById('versao-app');
        if (elemento) {
            elemento.textContent = versao;
        }
        localStorage.setItem('app_version', versao);
    }
    
    // ========== CONFIGURAÇÕES GERAIS ==========
    
    restaurarConfiguracoes() {
        // Restaurar sons editados
        Object.entries(this.sonsEditados).forEach(([somId, url]) => {
            const audioElement = document.querySelector(`#som_tecla_${somId}`);
            if (audioElement) {
                // Salvar src original se for a primeira vez
                if (!audioElement.dataset.srcOriginal) {
                    audioElement.dataset.srcOriginal = audioElement.src;
                }
                audioElement.src = url;
            }
        });
    }
    
    configurarControles() {
        // Mapear botões para funções
        const controles = {
            'botao-parar': () => this.pararTodosSons(),
            'botao-editar': () => this.toggleModoEdicao(),
            'botao-reset': () => this.resetarTudo(),
            'botao-modo': () => this.toggleModoNoturno(),
            'botao-cor-teclas': () => this.abrirSeletorCores(),
            'botao-cores-aleatorias': () => this.aplicarCoresAleatorias()
        };
        
        // Configurar cada botão
        Object.entries(controles).forEach(([id, funcao]) => {
            const botao = document.getElementById(id);
            if (botao) {
                botao.addEventListener('click', funcao);
            }
        });
    }
    
    configurarEventosGlobais() {
        // ESC para parar sons
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.pararTodosSons();
            }
        });
        
        // Desbloquear áudio em qualquer interação
        document.addEventListener('click', () => {
            if (!this.audioUnlocked && this.audioContext) {
                this.desbloquearAudio();
            }
        });
        
        // Log para debug
        window.addEventListener('load', () => {
            console.log('🎹 Teclado Interativo v3.0.0 carregado!');
            console.log('📱 Mobile:', /Mobi|Android/i.test(navigator.userAgent));
            console.log('🔊 Áudio desbloqueado:', this.audioUnlocked);
        });
    }
}

// ========== INICIALIZAÇÃO ==========

// Criar e exportar instância global
window.tecladoInterativo = new TecladoInterativo();

// Adicionar estilos dinâmicos para feedback
const estiloDinamico = document.createElement('style');
estiloDinamico.textContent = `
    .feedback-flutuante {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.95em;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
        animation: slideInFeedback 0.3s ease, fadeOutFeedback 0.3s ease 2.7s forwards;
        max-width: 300px;
        text-align: center;
    }
    
    @keyframes slideInFeedback {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes fadeOutFeedback {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
    
    .tecla.tocando {
        animation: vibrarTecla 0.1s;
    }
    
    @keyframes vibrarTecla {
        0% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
        100% { transform: translateX(0); }
    }
    
    .btn-teste-som {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 8px 15px;
        border-radius: 8px;
        cursor: pointer;
        margin-top: 10px;
        font-size: 0.9em;
        transition: background 0.3s;
        display: block;
        width: 100%;
    }
    
    .btn-teste-som:hover {
        background: rgba(255,255,255,0.2);
    }
`;
document.head.appendChild(estiloDinamico);

// Debug helper (opcional)
window.debugTeclado = () => {
    console.log('=== DEBUG TECLADO ===');
    console.log('Áudio desbloqueado:', window.tecladoInterativo.audioUnlocked);
    console.log('Contexto áudio:', window.tecladoInterativo.audioContext?.state);
    console.log('Sons no cache:', window.tecladoInterativo.sonsCache.size);
    console.log('Contador sons:', window.tecladoInterativo.contadorSons);
    
    // Testar reprodução
    const audio = new Audio();
    audio.volume = 0.1;
    audio.src = '#';
    
    audio.play().then(() => {
        console.log('✅ Reprodução automática permitida');
        audio.pause();
    }).catch(e => {
        console.log('❌ Reprodução bloqueada:', e.name);
    });
};

// Auto-test ao carregar
setTimeout(() => {
    console.log('🎹 Teclado Interativo v3.0.0 pronto para uso!');
}, 1000);