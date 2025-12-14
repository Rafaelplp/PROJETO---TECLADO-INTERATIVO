// main.js - Teclado Interativo v3.3.0
// Correções: Toque duplo, otimização mobile

class TecladoInterativo {
    constructor() {
        this.audioAtual = null;
        this.modoEdicao = false;
        this.modoNoturno = localStorage.getItem('modoNoturno') === 'true';
        this.contadorSons = parseInt(localStorage.getItem('contadorSons')) || 0;
        this.coresTeclas = JSON.parse(localStorage.getItem('coresTeclas')) || {};
        this.sonsEditados = JSON.parse(localStorage.getItem('sonsEditados')) || {};
        this.emojiEditados = JSON.parse(localStorage.getItem('emojiEditados')) || {};
        this.ultimoToque = 0; // Para prevenir toque duplo
        this.toqueDelay = 300; // Delay mínimo entre toques (ms)
        
        this.inicializar();
    }

    inicializar() {
        console.log('🎹 Teclado Interativo v3.3.0');
        
        this.configurarModoNoturno();
        this.configurarTeclas();
        this.configurarControles();
        this.restaurarConfiguracoes();
        this.atualizarContadorSons();
        this.configurarEventosGlobais();
        this.exibirVersao();
        
        // Configurar viewport para mobile
        this.configurarViewport();
    }

    // ========== CONFIGURAÇÃO DO VIEWPORT ==========
    
    configurarViewport() {
        // Ajustar viewport para iOS
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
            }
        }
    }

    // ========== CONFIGURAÇÃO DAS TECLAS (SEM TOQUE DUPLO) ==========
    
    configurarTeclas() {
        const teclas = document.querySelectorAll('.tecla');
        
        teclas.forEach(tecla => {
            const somId = tecla.dataset.som;
            const idAudio = `#som_tecla_${somId}`;
            
            // Restaurar configurações
            this.restaurarConfiguracoesTecla(tecla);
            
            // Salvar emoji original
            if (!tecla.dataset.emojiOriginal) {
                tecla.dataset.emojiOriginal = tecla.textContent;
            }
            
            // Configurar evento de clique (PREVENIR DUPLO)
            tecla.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const agora = Date.now();
                if (agora - this.ultimoToque < this.toqueDelay) {
                    return; // Ignorar toque muito rápido
                }
                this.ultimoToque = agora;
                
                if (this.modoEdicao) {
                    this.abrirModalEdicao(tecla);
                } else {
                    this.tocarSom(idAudio);
                }
            }, { passive: false });
            
            // Configurar touch para mobile (PREVENIR DUPLO)
            let touchIniciado = false;
            
            tecla.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (touchIniciado) return;
                touchIniciado = true;
                
                const agora = Date.now();
                if (agora - this.ultimoToque < this.toqueDelay) {
                    touchIniciado = false;
                    return;
                }
                this.ultimoToque = agora;
                
                tecla.classList.add('ativa');
                
                if (!this.modoEdicao) {
                    this.tocarSom(idAudio);
                } else {
                    this.abrirModalEdicao(tecla);
                }
                
                // Resetar após delay
                setTimeout(() => {
                    touchIniciado = false;
                    tecla.classList.remove('ativa');
                }, this.toqueDelay);
                
            }, { passive: false });
            
            tecla.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                tecla.classList.remove('ativa');
            }, { passive: false });
            
            tecla.addEventListener('touchcancel', () => {
                touchIniciado = false;
                tecla.classList.remove('ativa');
            });
        });
    }
    
    restaurarConfiguracoesTecla(tecla) {
        if (this.emojiEditados[tecla.className]) {
            tecla.textContent = this.emojiEditados[tecla.className];
            tecla.classList.add('editado');
        }
        
        if (this.coresTeclas[tecla.className]) {
            tecla.style.background = this.coresTeclas[tecla.className];
            tecla.classList.add('editado');
        }
    }
    
    // ========== SISTEMA DE SOM ==========
    
    tocarSom(idElementoAudio) {
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
        
        // Tocar novo som
        this.audioAtual = audioElement;
        audioElement.currentTime = 0;
        
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Tentando tocar novamente...');
                setTimeout(() => {
                    audioElement.play().catch(e => {
                        console.error('Falha ao reproduzir áudio:', e);
                    });
                }, 50);
            }).then(() => {
                this.onSomTocadoSucesso(audioElement);
            });
        }
    }
    
    onSomTocadoSucesso(audioElement) {
        const somId = audioElement.id.replace('som_tecla_', '');
        const tecla = document.querySelector(`[data-som="${somId}"]`);
        
        if (tecla) {
            tecla.classList.add('tocando');
            setTimeout(() => tecla.classList.remove('tocando'), 300);
        }
        
        if (!this.modoEdicao) {
            this.contadorSons++;
            localStorage.setItem('contadorSons', this.contadorSons.toString());
            this.atualizarContadorSons();
        }
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
        
        this.mostrarFeedback('⏹️ Sons parados', 1500);
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
            this.mostrarFeedback(this.modoEdicao ? '✏️ Modo edição' : '✅ Modo normal', 1500);
        }
    }
    
    abrirModalEdicao(tecla) {
        // Código do modal (mantido do anterior)
        // ... (mesmo código do modal)
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
    
    abrirSeletorCores() {
        // Código do seletor de cores (mantido)
        // ... (mesmo código do seletor)
    }
    
    // ========== MODO NOTURNO ==========
    
    configurarModoNoturno() {
        if (this.modoNoturno) {
            document.body.classList.add('modo-dia');
            const botao = document.getElementById('botao-modo');
            if (botao) {
                botao.innerHTML = '<span class="icone">☀️</span><span class="texto">Claro</span>';
            }
        }
    }
    
    toggleModoNoturno() {
        this.modoNoturno = !this.modoNoturno;
        document.body.classList.toggle('modo-dia', this.modoNoturno);
        localStorage.setItem('modoNoturno', this.modoNoturno);
        
        const botao = document.getElementById('botao-modo');
        if (botao) {
            if (this.modoNoturno) {
                botao.innerHTML = '<span class="icone">☀️</span><span class="texto">Claro</span>';
                this.mostrarFeedback('☀️ Modo claro', 1500);
            } else {
                botao.innerHTML = '<span class="icone">🌙</span><span class="texto">Noturno</span>';
                this.mostrarFeedback('🌙 Modo noturno', 1500);
            }
        }
    }
    
    // ========== CONTADORES E FEEDBACK ==========
    
    atualizarContadorSons() {
        const elemento = document.getElementById('contador-sons');
        if (elemento) {
            elemento.textContent = this.contadorSons;
        }
    }
    
    mostrarFeedback(mensagem, duracao = 1500) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback-rapido';
        feedback.textContent = mensagem;
        feedback.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            font-size: 14px;
            z-index: 10000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            white-space: nowrap;
            pointer-events: none;
            user-select: none;
        `;
        
        document.body.appendChild(feedback);
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transition = 'opacity 0.3s';
            setTimeout(() => feedback.remove(), 300);
        }, duracao - 300);
    }
    
    exibirVersao() {
        const versao = '3.3.0';
        const elemento = document.getElementById('versao-app');
        if (elemento) {
            elemento.textContent = versao;
        }
    }
    
    // ========== CONFIGURAÇÕES ==========
    
    restaurarConfiguracoes() {
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
                // Prevenir múltiplos cliques
                let cliqueAtivo = false;
                
                botao.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (cliqueAtivo) return;
                    cliqueAtivo = true;
                    
                    funcao();
                    
                    setTimeout(() => {
                        cliqueAtivo = false;
                    }, 500);
                });
                
                botao.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (cliqueAtivo) return;
                    cliqueAtivo = true;
                    
                    funcao();
                    
                    setTimeout(() => {
                        cliqueAtivo = false;
                    }, 500);
                }, { passive: false });
            }
        });
    }
    
    configurarEventosGlobais() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.pararTodosSons();
        });
        
        // Prevenir scroll em toque
        document.addEventListener('touchmove', (e) => {
            if (e.target.classList.contains('tecla') || 
                e.target.classList.contains('botao-menu')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Detectar orientação
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.ajustarLayoutOrientacao();
            }, 100);
        });
    }
    
    ajustarLayoutOrientacao() {
        // Forçar redimensionamento
        document.body.style.height = window.innerHeight + 'px';
        
        // Ajustar teclado se necessário
        const teclado = document.querySelector('.teclado-principal');
        if (teclado && window.innerHeight < 500) {
            // Modo paisagem muito baixo
            teclado.style.gap = '5px';
            const teclas = document.querySelectorAll('.tecla');
            teclas.forEach(tecla => {
                tecla.style.fontSize = '1.4rem';
            });
        }
    }
    
    resetarTudo() {
        if (confirm('Resetar TODAS as configurações?')) {
            // Resetar cores
            document.querySelectorAll('.tecla').forEach(tecla => {
                tecla.style.background = '';
                tecla.classList.remove('editado');
                delete this.coresTeclas[tecla.className];
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
}

// Inicializar
window.tecladoInterativo = new TecladoInterativo();

// Adicionar CSS dinâmico para feedback
const estilo = document.createElement('style');
estilo.textContent = `
    @keyframes feedbackEntrada {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    .feedback-rapido {
        animation: feedbackEntrada 0.3s ease;
    }
    
    /* Melhorar performance */
    .tecla, .botao-menu {
        will-change: transform;
    }
    
    /* Otimizar para mobile */
    @media (max-width: 768px) {
        .tecla {
            -webkit-tap-highlight-color: transparent;
        }
    }
`;
document.head.appendChild(estilo);