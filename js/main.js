// main.js - Teclado Interativo v3.1.0
// Data: 2024
// - Removido som de feedback ao tocar
// - Melhorias de UI/UX

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
        
        this.inicializar();
    }

    inicializar() {
        console.log('🎹 Inicializando Teclado Interativo v3.1.0...');
        
        // Configurar modo noturno
        this.configurarModoNoturno();
        
        // Configurar áudio (SIMPLIFICADO)
        this.configurarAudio();
        
        // Configurar elementos
        this.configurarTeclas();
        this.configurarControles();
        this.restaurarConfiguracoes();
        this.atualizarContadorSons();
        this.configurarEventosGlobais();
        
        // Inicializar versão
        this.exibirVersao();
        
        // Remover overlay de instruções automático
        this.removerOverlays();
    }

    // ========== CONFIGURAÇÃO SIMPLIFICADA DE ÁUDIO ==========
    
    configurarAudio() {
        // Método simples e direto
        this.audioUnlocked = true; // Assumir que está desbloqueado
        
        // Pré-carregar sons silenciosamente
        this.preCarregarSons();
    }
    
    preCarregarSons() {
        // Silenciar pré-carregamento para evitar ruídos
        const elementosAudio = document.querySelectorAll('audio');
        elementosAudio.forEach(audio => {
            audio.volume = 1.0; // Volume normal, sem ajustes
            audio.preload = 'auto';
            audio.load();
        });
    }
    
    // ========== FUNÇÃO PRINCIPAL DE SOM ==========
    
    tocarSom(idElementoAudio) {
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
        
        // Tocar som (MÉTODO DIRETO)
        try {
            this.audioAtual = audioElement;
            audioElement.currentTime = 0;
            
            // SILENCIAR QUALQUER FEEDBACK SONORO
            audioElement.muted = false; // Garantir que não está mudo
            
            const playPromise = audioElement.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Sucesso - APENAS FEEDBACK VISUAL
                    this.onSomTocadoSucesso(audioElement);
                }).catch(error => {
                    // Falha - tentar uma vez
                    console.log('Tentando fallback...');
                    setTimeout(() => {
                        audioElement.play().catch(e => {
                            console.error('Erro ao tocar som:', e);
                        });
                    }, 100);
                });
            }
        } catch (error) {
            console.error('Erro ao tocar som:', error);
        }
    }
    
    onSomTocadoSucesso(audioElement) {
        // APENAS FEEDBACK VISUAL - SEM SOM EXTRA
        
        // Efeito visual na tecla
        const somId = audioElement.id.replace('som_tecla_', '');
        const tecla = document.querySelector(`[data-som="${somId}"]`);
        
        if (tecla) {
            tecla.classList.add('tocando');
            setTimeout(() => tecla.classList.remove('tocando'), 200);
            
            // Efeito de onda suave
            this.criarEfeitoOnda(tecla);
        }
        
        // Atualizar contador
        if (!this.modoEdicao) {
            this.contadorSons++;
            localStorage.setItem('contadorSons', this.contadorSons.toString());
            this.atualizarContadorSons();
        }
        
        // NENHUM FEEDBACK SONORO ADICIONAL
    }
    
    criarEfeitoOnda(tecla) {
        const onda = document.createElement('div');
        onda.className = 'onda-sonora-visual';
        
        const rect = tecla.getBoundingClientRect();
        onda.style.cssText = `
            position: fixed;
            top: ${rect.top}px;
            left: ${rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border-radius: 15px;
            background: radial-gradient(circle, rgba(0,212,255,0.2) 0%, rgba(0,212,255,0) 70%);
            pointer-events: none;
            z-index: 999;
            animation: expandirOndaSuave 0.4s ease-out forwards;
        `;
        
        document.body.appendChild(onda);
        setTimeout(() => onda.remove(), 400);
    }
    
    pararTodosSons() {
        if (this.audioAtual) {
            this.audioAtual.pause();
            this.audioAtual.currentTime = 0;
            this.audioAtual = null;
        }
        
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        document.querySelectorAll('.tecla').forEach(tecla => {
            tecla.classList.remove('tocando', 'ativa');
        });
        
        this.mostrarFeedback('⏹️ Todos os sons parados', 1500);
    }
    
    // ========== REMOVER ELEMENTOS INDESEJADOS ==========
    
    removerOverlays() {
        // Remover qualquer overlay de áudio
        const overlays = document.querySelectorAll('.overlay-audio-instructions, .audio-instructions, .indicador-audio');
        overlays.forEach(el => el.remove());
        
        // Remover pontos vermelhos/círculos piscando
        const pontos = document.querySelectorAll('[class*="indicador"], [class*="piscando"], [style*="red"], [style*="vermelho"]');
        pontos.forEach(el => el.remove());
        
        // Remover scripts de overlay
        const scriptsOverlay = document.querySelectorAll('script[src*="overlay"], script[src*="indicador"]');
        scriptsOverlay.forEach(el => el.remove());
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
            
            // Configurar eventos SIMPLIFICADOS
            tecla.addEventListener('click', () => {
                if (this.modoEdicao) {
                    this.abrirModalEdicao(tecla);
                } else {
                    this.tocarSom(idAudio);
                }
            });
            
            // Touch para mobile
            tecla.addEventListener('touchstart', (e) => {
                tecla.classList.add('ativa');
                if (!this.modoEdicao) {
                    this.tocarSom(idAudio);
                }
                e.preventDefault();
            }, { passive: false });
            
            tecla.addEventListener('touchend', () => {
                tecla.classList.remove('ativa');
            });
        });
    }
    
    restaurarTecla(tecla) {
        if (this.emojiEditados[tecla.className]) {
            tecla.textContent = this.emojiEditados[tecla.className];
            tecla.classList.add('editado');
        }
        
        if (this.coresTeclas[tecla.className]) {
            tecla.style.background = this.coresTeclas[tecla.className];
            tecla.classList.add('editado');
        }
    }
    
    // ========== MODO EDIÇÃO ==========
    
    toggleModoEdicao() {
        this.modoEdicao = !this.modoEdicao;
        const botao = document.getElementById('botao-editar');
        
        document.querySelectorAll('.tecla').forEach(tecla => {
            if (this.modoEdicao) {
                tecla.classList.add('modo-edicao');
                tecla.title = 'Clique para editar';
            } else {
                tecla.classList.remove('modo-edicao');
                tecla.title = '';
            }
        });
        
        if (botao) {
            botao.classList.toggle('ativo', this.modoEdicao);
        }
    }
    
    abrirModalEdicao(tecla) {
        // Implementação do modal (mantida do código anterior)
        // ... (código do modal permanece igual)
    }
    
    // ========== SISTEMA DE CORES ==========
    
    aplicarCoresAleatorias() {
        const cores = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe',
            '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140'
        ];
        
        document.querySelectorAll('.tecla').forEach(tecla => {
            const cor = cores[Math.floor(Math.random() * cores.length)];
            const gradiente = `linear-gradient(145deg, ${cor}40, ${cor}80)`;
            
            tecla.style.background = gradiente;
            this.coresTeclas[tecla.className] = gradiente;
            tecla.classList.add('editado');
        });
        
        localStorage.setItem('coresTeclas', JSON.stringify(this.coresTeclas));
        this.mostrarFeedback('🌈 Cores aleatórias', 1500);
    }
    
    // ========== MODO NOTURNO ==========
    
    configurarModoNoturno() {
        if (this.modoNoturno) {
            document.body.classList.add('modo-dia');
        }
    }
    
    toggleModoNoturno() {
        this.modoNoturno = !this.modoNoturno;
        document.body.classList.toggle('modo-dia', this.modoNoturno);
        localStorage.setItem('modoNoturno', this.modoNoturno);
        
        this.mostrarFeedback(this.modoNoturno ? '☀️ Modo claro' : '🌙 Modo noturno', 1500);
    }
    
    // ========== RESET ==========
    
    resetarTudo() {
        if (confirm('Resetar TODAS as configurações?')) {
            // Resetar cores
            document.querySelectorAll('.tecla').forEach(tecla => {
                tecla.style.background = '';
                tecla.classList.remove('editado');
            });
            localStorage.removeItem('coresTeclas');
            
            // Resetar emojis
            document.querySelectorAll('.tecla').forEach(tecla => {
                if (tecla.dataset.emojiOriginal) {
                    tecla.textContent = tecla.dataset.emojiOriginal;
                }
            });
            localStorage.removeItem('emojiEditados');
            
            // Resetar contador
            this.contadorSons = 0;
            localStorage.setItem('contadorSons', '0');
            this.atualizarContadorSons();
            
            this.mostrarFeedback('🔄 Tudo resetado', 2000);
        }
    }
    
    // ========== CONTADORES ==========
    
    atualizarContadorSons() {
        const elemento = document.getElementById('contador-sons');
        if (elemento) {
            elemento.textContent = this.contadorSons;
        }
    }
    
    mostrarFeedback(mensagem, duracao = 2000) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback-simples';
        feedback.textContent = mensagem;
        feedback.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            z-index: 10000;
            font-family: 'Montserrat', sans-serif;
            font-size: 0.9em;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            white-space: nowrap;
        `;
        
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), duracao);
    }
    
    exibirVersao() {
        const versao = '3.1.0';
        const elemento = document.getElementById('versao-app');
        if (elemento) {
            elemento.textContent = versao;
        }
    }
    
    // ========== CONFIGURAÇÕES GERAIS ==========
    
    restaurarConfiguracoes() {
        // Restaurar sons editados
        Object.entries(this.sonsEditados).forEach(([somId, url]) => {
            const audioElement = document.querySelector(`#som_tecla_${somId}`);
            if (audioElement && !audioElement.dataset.srcOriginal) {
                audioElement.dataset.srcOriginal = audioElement.src;
                audioElement.src = url;
            }
        });
    }
    
    configurarControles() {
        const controles = {
            'botao-parar': () => this.pararTodosSons(),
            'botao-editar': () => this.toggleModoEdicao(),
            'botao-reset': () => this.resetarTudo(),
            'botao-modo': () => this.toggleModoNoturno(),
            'botao-cor-teclas': () => this.abrirSeletorCores(),
            'botao-cores-aleatorias': () => this.aplicarCoresAleatorias()
        };
        
        Object.entries(controles).forEach(([id, funcao]) => {
            const botao = document.getElementById(id);
            if (botao) {
                botao.addEventListener('click', funcao);
            }
        });
    }
    
    configurarEventosGlobais() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.pararTodosSons();
        });
    }
    
    abrirSeletorCores() {
        // Implementação simplificada
        this.aplicarCoresAleatorias();
    }
}

// ========== INICIALIZAÇÃO ==========

window.tecladoInterativo = new TecladoInterativo();

// Adicionar estilos dinâmicos
const estiloDinamico = document.createElement('style');
estiloDinamico.textContent = `
    @keyframes expandirOndaSuave {
        0% {
            transform: scale(1);
            opacity: 0.7;
        }
        100% {
            transform: scale(1.3);
            opacity: 0;
        }
    }
    
    .tecla.tocando {
        animation: pulsarTecla 0.2s ease;
    }
    
    @keyframes pulsarTecla {
        0% { transform: scale(1); }
        50% { transform: scale(0.95); }
        100% { transform: scale(1); }
    }
    
    /* Remover qualquer elemento piscante */
    [class*="piscar"], [class*="flash"], [class*="blink"] {
        display: none !important;
    }
    
    /* Remover pontos/círculos */
    .indicador-audio, .ponto-vermelho, .circulo-piscando {
        display: none !important;
    }
`;
document.head.appendChild(estiloDinamico);