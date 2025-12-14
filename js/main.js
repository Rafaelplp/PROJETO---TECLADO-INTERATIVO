// main.js - Teclado Interativo v4.4.1
// Rodapé completo + Adaptação responsiva completa

class TecladoInterativo {
    constructor() {
        // Estado do aplicativo
        this.audioAtual = null;
        this.modoEdicao = false;
        this.modoNoturno = localStorage.getItem('modoNoturno') === 'true';
        this.coresTeclas = JSON.parse(localStorage.getItem('coresTeclas')) || {};
        this.sonsEditados = JSON.parse(localStorage.getItem('sonsEditados')) || {};
        this.emojiEditados = JSON.parse(localStorage.getItem('emojiEditados')) || {};

        // Controle de scroll
        this.scrollAtivo = false;
        this.scrollTimeout = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchMoveThreshold = 10;
        this.isScrolling = false;
        this.resizeTimeout = null;
        this.ultimaOrientacao = window.orientation;
        
        // Formatos de áudio suportados
        this.formatosSuportados = [
            'audio/mpeg',      // MP3
            'audio/mp4',       // MP4/AAC
            'audio/ogg',       // OGG
            'audio/wav',       // WAV
            'audio/webm',      // WebM
            'audio/aac',       // AAC
            'audio/x-m4a',     // M4A
            'audio/x-ms-wma',  // WMA
            'audio/flac'       // FLAC
        ];
        
        // Controle de toque
        this.ultimoToque = 0;
        this.toqueDelay = 300;
        this.touchAtivo = false;
        
        // Dicionário de emojis HTML
        this.emojiCodes = {
            '😊': '&#128578',
            '😂': '&#128514',
            '🤣': '&#129315',
            '😍': '&#128525',
            '😎': '&#128526',
            '😭': '&#128557',
            '😘': '&#128536',
            '🤔': '&#129300',
            '😴': '&#128564',
            '👍': '&#128077',
            '👎': '&#128078',
            '👏': '&#128079',
            '🙏': '&#128591',
            '🎮': '&#127918',
            '🎵': '&#127925',
            '✨': '&#10024',
            '🔥': '&#128293',
            '💀': '&#128128',
            '💩': '&#128169',
            '👻': '&#128123',
            '👽': '&#128125',
            '🤖': '&#129302',
            '🎉': '&#127881',
            '🎊': '&#127882',
            '💯': '&#128175',
            '❤️': '&#10084;&#65039'
        };

        // Otimizar layout para diferentes orientações
        this.otimizarLayout();
        // Inicializar
        this.inicializar();
    }

    // ========== INICIALIZAÇÃO ==========
    
    inicializar() {
        console.log('🎹 Teclado Interativo v4.4.1 - Iniciando...');
        
        // Configurar modo noturno
        this.configurarModoNoturno();
        
        // Configurar elementos
        this.configurarTeclas();
        this.configurarControles();
        this.restaurarConfiguracoes();
        this.configurarEventosGlobais();
        this.configurarEventosScroll();
        this.exibirVersao();
        
        // Ajustar menu para caber na tela
        this.ajustarMenuParaTela();
        
        // Ajustar layout dinamicamente
        setTimeout(() => this.ajustarLayoutDinamico(), 100);
        
        // Inicializar áudio
        this.inicializarAudio();
        
        console.log('✅ Teclado pronto para uso!');
    }
    
    // ========== AJUSTE DINÂMICO DE LAYOUT ==========
    
    ajustarLayoutDinamico() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const larguraTela = window.innerWidth;
        const alturaTela = window.innerHeight;
        
        // Elementos
        const menu = document.querySelector('.menu-superior');
        const rodape = document.querySelector('.rodape');
        const contadorVisitas = document.querySelector('.contador-visitas');
        const itensContador = document.querySelectorAll('.contador-item');
        
        if (!menu || !rodape || !contadorVisitas) return;
        
        // 1. Ajustar Menu
        this.ajustarMenuParaTela();
        
        // 2. Ajustar Rodapé para caber SEM scroll
        const larguraRodape = rodape.offsetWidth || larguraTela * 0.9;
        const larguraDisponivel = larguraRodape * 0.9;
        
        // Calcular largura total dos itens
        let larguraTotalItens = 0;
        itensContador.forEach(item => {
            const estilo = window.getComputedStyle(item);
            const margem = parseInt(estilo.marginLeft) + parseInt(estilo.marginRight);
            larguraTotalItens += item.offsetWidth + margem;
        });
        
        // Adicionar gap
        const estiloContador = window.getComputedStyle(contadorVisitas);
        const gap = parseInt(estiloContador.gap) || 8;
        larguraTotalItens += gap * (itensContador.length - 1);
        
        // Se não couber, reduzir escala do rodapé
        if (larguraTotalItens > larguraDisponivel && larguraDisponivel > 0) {
            const fatorReducao = larguraDisponivel / larguraTotalItens;
            const escala = Math.min(fatorReducao * 0.9, 0.65);
            rodape.style.transform = `scale(${escala})`;
            
            // Ajustar também o contador
            contadorVisitas.style.gap = `${Math.max(gap * 0.7, 4)}px`;
        } else {
            rodape.style.transform = isLandscape ? 'scale(0.6)' : 'scale(0.75)';
            contadorVisitas.style.gap = '8px';
        }
        
        rodape.style.transformOrigin = 'center';
        
        // 3. Ajustar teclado em paisagem
        if (isLandscape) {
            const tecladoContainer = document.querySelector('.teclado-container');
            if (tecladoContainer) {
                const alturaMenu = menu.offsetHeight || 50;
                const alturaRodape = rodape.offsetHeight || 50;
                const alturaDisponivel = alturaTela - alturaMenu - alturaRodape - 100;
                tecladoContainer.style.maxHeight = `${Math.max(alturaDisponivel, 200)}px`;
                tecladoContainer.style.overflowY = 'auto';
            }
            
            // Reduzir cabeçalho em paisagem
            const cabecalho = document.querySelector('.cabecalho');
            if (cabecalho && alturaTela < 500) {
                cabecalho.style.display = 'none';
            } else if (cabecalho) {
                cabecalho.style.display = 'flex';
            }
        } else {
            // Restaurar modo retrato
            const tecladoContainer = document.querySelector('.teclado-container');
            if (tecladoContainer) {
                tecladoContainer.style.maxHeight = 'none';
                tecladoContainer.style.overflowY = 'visible';
            }
            
            const cabecalho = document.querySelector('.cabecalho');
            if (cabecalho) {
                cabecalho.style.display = 'flex';
            }
        }
        
        // 4. Garantir que não haja scroll horizontal no rodapé
        rodape.style.overflowX = 'hidden';
        rodape.style.overflowY = 'hidden';
        
        // Forçar quebra de linha se necessário (último recurso)
        if (larguraTotalItens > larguraDisponivel * 1.5) {
            contadorVisitas.style.flexWrap = 'wrap';
            contadorVisitas.style.justifyContent = 'center';
        } else {
            contadorVisitas.style.flexWrap = 'nowrap';
        }
    }
    
    ajustarMenuParaTela() {
        const menu = document.querySelector('.menu-superior');
        if (!menu) return;
        
        const botoes = menu.querySelectorAll('.botao-menu');
        const larguraMenu = menu.offsetWidth || window.innerWidth * 0.9;
        
        // Calcular largura necessária
        let larguraTotal = 0;
        botoes.forEach(botao => {
            const estilo = window.getComputedStyle(botao);
            const margem = parseInt(estilo.marginLeft) + parseInt(estilo.marginRight);
            larguraTotal += botao.offsetWidth + margem;
        });
        
        // Adicionar gap
        const estiloMenu = window.getComputedStyle(menu);
        const gap = parseInt(estiloMenu.gap) || 12;
        larguraTotal += gap * (botoes.length - 1);
        
        // Adicionar padding
        larguraTotal += parseInt(estiloMenu.paddingLeft) + parseInt(estiloMenu.paddingRight);
        
        // Calcular fator de escala
        const isLandscape = window.innerWidth > window.innerHeight;
        const larguraMaxima = window.innerWidth * (isLandscape ? 0.95 : 0.9);
        const larguraAlvo = Math.min(larguraMaxima, 650);
        
        if (larguraTotal > larguraAlvo && larguraAlvo > 0) {
            const fatorEscala = larguraAlvo / larguraTotal;
            menu.style.transform = `scale(${Math.min(fatorEscala * 0.95, 0.75)})`;
        } else {
            menu.style.transform = isLandscape ? 'scale(0.6)' : 'scale(0.75)';
        }
        
        menu.style.transformOrigin = 'center';
    }
    
    inicializarAudio() {
        // Garantir que todos os áudios estão carregados
        document.querySelectorAll('audio').forEach(audio => {
            audio.preload = 'auto';
            audio.load();
            
            // Adicionar tratamento de erro
            audio.addEventListener('error', (e) => {
                console.error(`❌ Erro no áudio ${audio.id}:`, e);
                this.mostrarFeedback(`❌ Erro no som ${audio.id.replace('som_tecla_', '')}`, 3000);
            });
        });
    }

    // ========== SISTEMA DE SCROLL SEGURO ==========
    
    configurarEventosScroll() {
        // Configurar para o teclado
        const tecladoContainer = document.querySelector('.teclado-container');
        if (tecladoContainer) {
            this.configurarScrollVerticalSeguro(tecladoContainer);
        }
        
        // Configurar eventos de touch para detectar scroll
        this.configurarDetecaoScroll();
    }
    
    configurarScrollVerticalSeguro(elemento) {
        if (!elemento) return;
        
        elemento.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
            this.isScrolling = false;
        }, { passive: true });
        
        elemento.addEventListener('touchmove', (e) => {
            if (!this.touchStartY) return;
            
            const touchY = e.touches[0].clientY;
            const deltaY = Math.abs(touchY - this.touchStartY);
            
            if (deltaY > this.touchMoveThreshold) {
                this.isScrolling = true;
                
                // Adicionar classe scrolling nas teclas
                const teclas = elemento.querySelectorAll('.tecla');
                teclas.forEach(tecla => tecla.classList.add('scrolling'));
            }
        }, { passive: true });
        
        elemento.addEventListener('touchend', () => {
            // Remover classe scrolling das teclas
            const teclas = elemento.querySelectorAll('.tecla');
            teclas.forEach(tecla => tecla.classList.remove('scrolling'));
            
            this.touchStartY = 0;
            this.isScrolling = false;
        }, { passive: true });
    }
    
    configurarDetecaoScroll() {
        // Detectar scroll global
        document.addEventListener('scroll', () => {
            this.scrollAtivo = true;
            
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => {
                this.scrollAtivo = false;
            }, 100);
        }, { passive: true });
    }

    // ========== CONFIGURAÇÃO DAS TECLAS ==========
    
    configurarTeclas() {
        const teclas = document.querySelectorAll('.tecla');
        
        teclas.forEach(tecla => {
            const somId = tecla.dataset.som;
            const idAudio = `#som_tecla_${somId}`;
            
            // Restaurar configurações salvas
            this.restaurarConfiguracoesTecla(tecla);
            
            // Salvar emoji original
            if (!tecla.dataset.emojiOriginal) {
                tecla.dataset.emojiOriginal = tecla.innerHTML;
            }
            
            // Configurar eventos com prevenção de scroll
            this.configurarEventosTecla(tecla, idAudio);
        });
    }
    
    restaurarConfiguracoesTecla(tecla) {
        // Restaurar emoji
        if (this.emojiEditados[tecla.className]) {
            const emojiEditado = this.emojiEditados[tecla.className];
            tecla.innerHTML = this.decodificarEmoji(emojiEditado);
            tecla.classList.add('editado');
        }
        
        // Restaurar cor
        if (this.coresTeclas[tecla.className]) {
            tecla.style.background = this.coresTeclas[tecla.className];
            tecla.classList.add('editado');
        }
    }
    
    configurarEventosTecla(tecla, idAudio) {
        // Evento de clique (desktop) - com verificação de scroll
        tecla.addEventListener('click', (e) => {
            if (this.scrollAtivo || this.isScrolling || tecla.classList.contains('scrolling')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            const agora = Date.now();
            if (agora - this.ultimoToque < this.toqueDelay) return;
            this.ultimoToque = agora;
            
            if (this.modoEdicao) {
                this.abrirModalEdicao(tecla);
            } else {
                this.tocarSom(idAudio);
            }
        });
        
        // Eventos de touch (mobile) - com prevenção durante scroll
        tecla.addEventListener('touchstart', (e) => {
            if (this.isScrolling || tecla.classList.contains('scrolling')) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            if (this.touchAtivo) return;
            this.touchAtivo = true;
            
            const agora = Date.now();
            if (agora - this.ultimoToque < this.toqueDelay) {
                this.touchAtivo = false;
                return;
            }
            this.ultimoToque = agora;
            
            tecla.classList.add('ativa');
        }, { passive: false });
        
        tecla.addEventListener('touchend', (e) => {
            if (this.isScrolling || tecla.classList.contains('scrolling')) {
                tecla.classList.remove('ativa');
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            if (this.touchAtivo) {
                if (this.modoEdicao) {
                    this.abrirModalEdicao(tecla);
                } else {
                    this.tocarSom(idAudio);
                }
            }
            
            this.touchAtivo = false;
            tecla.classList.remove('ativa');
            
            // Reset após delay
            setTimeout(() => {
                this.touchAtivo = false;
            }, this.toqueDelay);
        }, { passive: false });
        
        tecla.addEventListener('touchcancel', () => {
            tecla.classList.remove('ativa');
            this.touchAtivo = false;
        });
    }

    // ========== SISTEMA DE SOM ==========
    
    tocarSom(idElementoAudio) {
        if (this.isScrolling || this.scrollAtivo) return;
        
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
        
        // Tocar novo som
        this.audioAtual = audioElement;
        audioElement.currentTime = 0;
        
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Sucesso
                this.onSomTocadoSucesso(audioElement);
            }).catch(error => {
                console.log('❌ Erro ao tocar, tentando desbloquear...', error);
                
                // Tentar desbloquear áudio
                this.desbloquearAudioMobile();
                
                // Tentar novamente após delay
                setTimeout(() => {
                    audioElement.play().then(() => {
                        this.onSomTocadoSucesso(audioElement);
                    }).catch(e => {
                        console.error('❌ Falha definitiva:', e);
                        this.mostrarFeedback('🔊 Toque novamente para ativar sons', 3000);
                    });
                }, 100);
            });
        }
    }
    
    desbloquearAudioMobile() {
        // Criar contexto de áudio para desbloquear
        if (window.AudioContext || window.webkitAudioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            // Tocar som silencioso
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 1;
            gainNode.gain.value = 0.001;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.001);
        }
    }
    
    onSomTocadoSucesso(audioElement) {
        // Feedback visual
        const somId = audioElement.id.replace('som_tecla_', '');
        const tecla = document.querySelector(`[data-som="${somId}"]`);
        
        if (tecla && !tecla.classList.contains('scrolling')) {
            tecla.classList.add('tocando');
            setTimeout(() => tecla.classList.remove('tocando'), 300);
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
        
        this.mostrarFeedback('⏹️ Todos os sons parados', 1500);
    }

    // ========== MODO EDIÇÃO ==========
    
    toggleModoEdicao() {
        if (this.isScrolling || this.scrollAtivo) return;
        
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
            this.mostrarFeedback(this.modoEdicao ? '✏️ Modo edição ativo' : '✅ Modo normal', 1500);
        }
    }
    
    abrirModalEdicao(tecla) {
        if (this.isScrolling || this.scrollAtivo) return;
        
        // Fechar modal existente
        const modalExistente = document.querySelector('.modal-overlay');
        if (modalExistente) modalExistente.remove();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        // Extrair cor atual
        let corAtual = '#667eea';
        const estilo = window.getComputedStyle(tecla);
        const background = estilo.backgroundImage || estilo.backgroundColor;
        if (background) {
            const match = background.match(/#[0-9A-Fa-f]{6}/i);
            if (match) corAtual = match[0];
        }
        
        // Preparar exemplos de emojis
        const exemplosEmoji = `
            <div class="emoji-exemplos">
                <div class="emoji-exemplo" data-emoji="&#129300">&#129300</div>
                <div class="emoji-exemplo" data-emoji="&#128578">&#128578</div>
                <div class="emoji-exemplo" data-emoji="&#128565">&#128565</div>
                <div class="emoji-exemplo" data-emoji="&#129315">&#129315</div>
                <div class="emoji-exemplo" data-emoji="&#128525">&#128525</div>
                <div class="emoji-exemplo" data-emoji="&#127918">&#127918</div>
                <div class="emoji-exemplo" data-emoji="&#127925">&#127925</div>
                <div class="emoji-exemplo" data-emoji="&#10024">&#10024</div>
                <div class="emoji-exemplo" data-emoji="&#128514">&#128514</div>
                <div class="emoji-exemplo" data-emoji="&#128557">&#128557</div>
            </div>
        `;
        
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>✏️ Editar Tecla</h3>
                    <button class="btn-fechar">×</button>
                </div>
                
                <div class="modal-conteudo">
                    <div class="grupo-form">
                        <label>Emoji/Texto:</label>
                        <input type="text" id="editar-emoji" class="input-emoji" 
                               value="${tecla.innerHTML}" maxlength="15" placeholder="Digite emoji ou código HTML">
                        <small>Aceita emojis diretos ou códigos HTML (ex: &#129300)</small>
                        ${exemplosEmoji}
                    </div>
                    
                    <div class="grupo-form">
                        <label>Cor da tecla:</label>
                        <div class="seletor-cor-container">
                            <input type="color" id="editar-cor" value="${corAtual}" class="input-cor">
                            <div class="preview-cor" style="background: ${corAtual}"></div>
                        </div>
                        
                        <div class="paleta-cores">
                            <div class="cor-rapida" data-cor="#FF6B6B"></div>
                            <div class="cor-rapida" data-cor="#4ECDC4"></div>
                            <div class="cor-rapida" data-cor="#FFD166"></div>
                            <div class="cor-rapida" data-cor="#06D6A0"></div>
                            <div class="cor-rapida" data-cor="#118AB2"></div>
                            <div class="cor-rapida" data-cor="#7209B7"></div>
                            <div class="cor-rapida" data-cor="#3A86FF"></div>
                            <div class="cor-rapida" data-cor="#FB5607"></div>
                            <div class="cor-rapida" data-cor="#8338EC"></div>
                            <div class="cor-rapida" data-cor="#FF006E"></div>
                            <div class="cor-rapida" data-cor="#00FF88"></div>
                            <div class="cor-rapida" data-cor="#FFDD00"></div>
                        </div>
                    </div>
                    
                    <div class="grupo-form">
                        <label>Alterar som:</label>
                        <input type="file" id="editar-som" accept="audio/*,video/mp4" class="input-som">
                        <small>Formatos suportados: MP3, MP4, OGG, WAV, AAC, M4A, WMA, FLAC (máx. 10MB)</small>
                        <button class="btn-teste-som" data-som="${tecla.dataset.som}">
                            🔊 Testar som atual
                        </button>
                        <div class="info-formatos">
                            <span class="info-icon">ℹ️</span>
                            <span class="info-texto">MP4 funciona como áudio (extrai o áudio do vídeo)</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-botoes">
                    <button class="btn-modal btn-salvar">💾 Salvar</button>
                    <button class="btn-modal btn-reset">↩️ Resetar</button>
                    <button class="btn-modal btn-cancelar">❌ Cancelar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Adicionar estilo para a info de formatos
        const style = document.createElement('style');
        style.textContent = `
            .info-formatos {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-top: 5px;
                padding: 5px 8px;
                background: rgba(0, 212, 255, 0.1);
                border-radius: 6px;
                border: 1px solid rgba(0, 212, 255, 0.2);
            }
            
            .info-icon {
                font-size: 0.8rem;
                flex-shrink: 0;
            }
            
            .info-texto {
                font-size: 0.7rem;
                opacity: 0.9;
                line-height: 1.2;
            }
        `;
        document.head.appendChild(style);
        
        // Configurar eventos do modal
        this.configurarModalEdicao(tecla, modal, style);
    }
    
    configurarModalEdicao(tecla, modal, styleElement) {
        // Elementos do modal
        const btnFechar = modal.querySelector('.btn-fechar');
        const btnCancelar = modal.querySelector('.btn-cancelar');
        const btnSalvar = modal.querySelector('.btn-salvar');
        const btnReset = modal.querySelector('.btn-reset');
        const btnTesteSom = modal.querySelector('.btn-teste-som');
        const inputCor = modal.querySelector('#editar-cor');
        const previewCor = modal.querySelector('.preview-cor');
        const coresRapidas = modal.querySelectorAll('.cor-rapida');
        const inputEmoji = modal.querySelector('#editar-emoji');
        const exemplosEmoji = modal.querySelectorAll('.emoji-exemplo');
        const inputSom = modal.querySelector('#editar-som');
        
        // Prevenir interação durante scroll no modal
        const elementosInterativos = [btnFechar, btnCancelar, btnSalvar, btnReset, btnTesteSom, inputCor, inputEmoji, inputSom];
        
        elementosInterativos.forEach(elemento => {
            if (elemento) {
                elemento.addEventListener('touchstart', (e) => {
                    if (this.isScrolling) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }, { passive: false });
            }
        });
        
        // Cores rápidas
        coresRapidas.forEach(corEl => {
            corEl.addEventListener('click', () => {
                if (this.isScrolling) return;
                const cor = corEl.dataset.cor;
                inputCor.value = cor;
                previewCor.style.background = cor;
            });
            
            corEl.addEventListener('touchstart', (e) => {
                if (this.isScrolling) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, { passive: false });
        });
        
        // Atualizar preview da cor
        inputCor.addEventListener('input', () => {
            if (this.isScrolling) return;
            previewCor.style.background = inputCor.value;
        });
        
        // Exemplos de emoji
        exemplosEmoji.forEach(exemplo => {
            exemplo.addEventListener('click', () => {
                if (this.isScrolling) return;
                const emoji = exemplo.dataset.emoji;
                inputEmoji.value = emoji;
                // Feedback visual
                exemplo.style.transform = 'scale(1.2)';
                exemplo.style.background = 'rgba(0, 212, 255, 0.3)';
                setTimeout(() => {
                    exemplo.style.transform = '';
                    exemplo.style.background = '';
                }, 300);
            });
            
            exemplo.addEventListener('touchstart', (e) => {
                if (this.isScrolling) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, { passive: false });
        });
        
        // Validação do arquivo de som
        inputSom.addEventListener('change', (e) => {
            if (this.isScrolling) return;
            
            const arquivo = e.target.files[0];
            if (arquivo) {
                const tamanhoMB = arquivo.size / (1024 * 1024);
                const tipo = arquivo.type;
                
                if (tamanhoMB > 10) {
                    this.mostrarFeedback('❌ Arquivo muito grande (máx. 10MB)', 3000);
                    e.target.value = '';
                    return;
                }
                
                // Verificar se é um formato suportado
                const formatoSuportado = tipo.startsWith('audio/') || 
                                       tipo === 'video/mp4' || 
                                       tipo === 'video/quicktime' ||
                                       this.formatosSuportados.includes(tipo);
                
                if (!formatoSuportado) {
                    this.mostrarFeedback(`❌ Formato não suportado: ${tipo}`, 3000);
                    e.target.value = '';
                    return;
                }
                
                this.mostrarFeedback(`✅ Arquivo válido: ${arquivo.name}`, 2000);
            }
        });
        
        // Testar som
        btnTesteSom.addEventListener('click', () => {
            if (this.isScrolling) return;
            const somId = btnTesteSom.dataset.som;
            this.tocarSom(`#som_tecla_${somId}`);
        });
        
        // Salvar
        btnSalvar.addEventListener('click', () => {
            if (this.isScrolling) return;
            this.salvarEdicaoTecla(tecla, modal);
        });
        
        // Resetar
        btnReset.addEventListener('click', () => {
            if (this.isScrolling) return;
            if (confirm('Resetar esta tecla para o padrão?')) {
                this.resetarTeclaIndividual(tecla);
                modal.remove();
                styleElement.remove();
            }
        });
        
        // Fechar
        const fecharModal = () => {
            modal.remove();
            styleElement.remove();
        };
        
        btnFechar.addEventListener('click', fecharModal);
        btnCancelar.addEventListener('click', fecharModal);
        modal.addEventListener('click', (e) => {
            if (this.isScrolling) return;
            if (e.target === modal) fecharModal();
        });
    }
    
    salvarEdicaoTecla(tecla, modal) {
        let novoEmoji = modal.querySelector('#editar-emoji').value.trim();
        const novaCor = modal.querySelector('#editar-cor').value;
        const arquivoSom = modal.querySelector('#editar-som').files[0];
        
        // Processar emoji
        if (novoEmoji) {
            // Se for código HTML, converter para emoji
            if (novoEmoji.includes('&#')) {
                novoEmoji = this.decodificarEmoji(novoEmoji);
            }
            
            // Salvar emoji
            tecla.innerHTML = novoEmoji;
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
            const tamanhoMB = arquivoSom.size / (1024 * 1024);
            if (tamanhoMB <= 10) {
                const url = URL.createObjectURL(arquivoSom);
                const somId = tecla.dataset.som;
                const audioElement = document.querySelector(`#som_tecla_${somId}`);
                
                if (audioElement) {
                    // Salvar original
                    if (!audioElement.dataset.srcOriginal) {
                        const sourceOriginal = audioElement.querySelector('source');
                        if (sourceOriginal) {
                            audioElement.dataset.srcOriginal = sourceOriginal.src;
                        }
                    }
                    
                    // Remover sources antigos
                    while (audioElement.firstChild) {
                        audioElement.removeChild(audioElement.firstChild);
                    }
                    
                    // Criar novo source baseado no tipo do arquivo
                    const source = document.createElement('source');
                    
                    // Determinar tipo MIME
                    let tipoMIME = arquivoSom.type;
                    if (tipoMIME === 'video/mp4') {
                        tipoMIME = 'audio/mp4';
                    } else if (tipoMIME === 'video/quicktime') {
                        tipoMIME = 'audio/mp4';
                    } else if (!tipoMIME.startsWith('audio/')) {
                        tipoMIME = 'audio/mpeg';
                    }
                    
                    source.src = url;
                    source.type = tipoMIME;
                    audioElement.appendChild(source);
                    
                    this.sonsEditados[somId] = {
                        url: url,
                        type: tipoMIME,
                        name: arquivoSom.name
                    };
                    tecla.classList.add('editado');
                    
                    // Recarregar o áudio
                    audioElement.load();
                }
            }
        }
        
        // Salvar no localStorage
        this.salvarConfiguracoes();
        
        modal.remove();
        this.mostrarFeedback('✅ Tecla atualizada!', 1500);
    }
    
    // ========== FUNÇÕES PARA TRATAR EMOJIS ==========
    
    decodificarEmoji(codigo) {
        if (!codigo.includes('&#')) return codigo;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = codigo;
        return tempDiv.textContent || tempDiv.innerText || codigo;
    }

    resetarTeclaIndividual(tecla) {
        const className = tecla.className;
        const somId = tecla.dataset.som;
        
        // Resetar emoji
        if (tecla.dataset.emojiOriginal) {
            tecla.innerHTML = this.decodificarEmoji(tecla.dataset.emojiOriginal);
        }
        delete this.emojiEditados[className];
        
        // Resetar cor
        tecla.style.background = '';
        delete this.coresTeclas[className];
        
        // Resetar som
        const audioElement = document.querySelector(`#som_tecla_${somId}`);
        if (audioElement && audioElement.dataset.srcOriginal) {
            while (audioElement.firstChild) {
                audioElement.removeChild(audioElement.firstChild);
            }
            
            const source = document.createElement('source');
            source.src = audioElement.dataset.srcOriginal;
            source.type = 'audio/mpeg';
            audioElement.appendChild(source);
            audioElement.load();
            
            delete this.sonsEditados[somId];
        }
        
        // Remover marca
        tecla.classList.remove('editado');
        
        // Salvar
        this.salvarConfiguracoes();
        
        this.mostrarFeedback('↩️ Tecla resetada', 1500);
    }

    // ========== SISTEMA DE CORES ==========
    
    aplicarCoresAleatorias() {
        if (this.isScrolling || this.scrollAtivo) return;
        
        const cores = [
            '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
            '#7209B7', '#3A86FF', '#FB5607', '#8338EC', '#FF006E',
            '#00FF88', '#FFDD00', '#667eea', '#f093fb', '#4facfe'
        ];
        
        document.querySelectorAll('.tecla').forEach(tecla => {
            const cor = cores[Math.floor(Math.random() * cores.length)];
            const gradiente = `linear-gradient(145deg, ${cor}40, ${cor}80)`;
            
            tecla.style.background = gradiente;
            this.coresTeclas[tecla.className] = gradiente;
            tecla.classList.add('editado');
        });
        
        localStorage.setItem('coresTeclas', JSON.stringify(this.coresTeclas));
        this.mostrarFeedback('🌈 Cores aleatórias aplicadas', 1500);
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
        if (this.isScrolling || this.scrollAtivo) return;
        
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

    // ========== RESET GERAL ==========
    
    resetarTudo() {
        if (this.isScrolling || this.scrollAtivo) return;
        
        if (confirm('Resetar TODAS as configurações?\n\n• Cores personalizadas\n• Emojis editados\n• Sons customizados')) {
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
                    tecla.innerHTML = this.decodificarEmoji(tecla.dataset.emojiOriginal);
                }
                tecla.classList.remove('editado');
            });
            localStorage.removeItem('emojiEditados');
            
            // Resetar sons
            document.querySelectorAll('audio').forEach(audio => {
                if (audio.dataset.srcOriginal) {
                    while (audio.firstChild) {
                        audio.removeChild(audio.firstChild);
                    }
                    const source = document.createElement('source');
                    source.src = audio.dataset.srcOriginal;
                    source.type = 'audio/mpeg';
                    audio.appendChild(source);
                    audio.load();
                }
            });
            localStorage.removeItem('sonsEditados');
            
            // Sair do modo edição
            if (this.modoEdicao) {
                this.toggleModoEdicao();
            }
            
            this.mostrarFeedback('🔄 Tudo resetado', 2000);
        }
    }

    // ========== FUNÇÕES AUXILIARES ==========
    
    salvarConfiguracoes() {
        localStorage.setItem('emojiEditados', JSON.stringify(this.emojiEditados));
        localStorage.setItem('coresTeclas', JSON.stringify(this.coresTeclas));
        
        const sonsEditadosSimples = {};
        Object.entries(this.sonsEditados).forEach(([key, value]) => {
            if (typeof value === 'object' && value.url) {
                sonsEditadosSimples[key] = value.url;
            } else {
                sonsEditadosSimples[key] = value;
            }
        });
        localStorage.setItem('sonsEditados', JSON.stringify(sonsEditadosSimples));
    }
    
    mostrarFeedback(mensagem, duracao = 1500) {
        const anterior = document.querySelector('.feedback-rapido');
        if (anterior) anterior.remove();
        
        const feedback = document.createElement('div');
        feedback.className = 'feedback-rapido';
        feedback.textContent = mensagem;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transition = 'opacity 0.3s';
            setTimeout(() => feedback.remove(), 300);
        }, duracao - 300);
    }
    
    exibirVersao() {
        const versao = '4.4.1';
        const elemento = document.getElementById('versao-app');
        if (elemento) {
            elemento.textContent = versao;
        }
        localStorage.setItem('app_version', versao);
    }
    
    restaurarConfiguracoes() {
        Object.entries(this.sonsEditados).forEach(([somId, value]) => {
            const audioElement = document.querySelector(`#som_tecla_${somId}`);
            if (audioElement && !audioElement.dataset.srcOriginal) {
                const sourceOriginal = audioElement.querySelector('source');
                if (sourceOriginal) {
                    audioElement.dataset.srcOriginal = sourceOriginal.src;
                }
                
                if (value) {
                    let url;
                    if (typeof value === 'object' && value.url) {
                        url = value.url;
                    } else {
                        url = value;
                    }
                    
                    while (audioElement.firstChild) {
                        audioElement.removeChild(audioElement.firstChild);
                    }
                    
                    const source = document.createElement('source');
                    source.src = url;
                    source.type = typeof value === 'object' ? value.type : 'audio/mpeg';
                    audioElement.appendChild(source);
                    audioElement.load();
                }
            }
        });
    }
    
    configurarControles() {
        const controles = {
            'botao-editar': () => this.toggleModoEdicao(),
            'botao-cores-aleatorias': () => this.aplicarCoresAleatorias(),
            'botao-modo': () => this.toggleModoNoturno(),
            'botao-parar': () => this.pararTodosSons(),
            'botao-reset': () => this.resetarTudo()
        };
        
        Object.entries(controles).forEach(([id, funcao]) => {
            const botao = document.getElementById(id);
            if (botao) {
                // Configurar eventos com prevenção de scroll
                const handler = (e) => {
                    if (this.isScrolling || this.scrollAtivo || botao.classList.contains('scrolling')) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                    funcao();
                };
                
                botao.addEventListener('click', handler);
                botao.addEventListener('touchstart', (e) => {
                    if (this.isScrolling || botao.classList.contains('scrolling')) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                    e.preventDefault();
                    handler(e);
                }, { passive: false });
            }
        });
        
        // Remover botão de cores se existir
        const botaoCores = document.getElementById('botao-cor-teclas');
        if (botaoCores) {
            botaoCores.style.display = 'none';
        }
    }
    
    configurarEventosGlobais() {
        // ESC para parar sons
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.pararTodosSons();
        });
        
        // Desbloquear áudio em interação
        document.addEventListener('click', () => {
            if (window.AudioContext || window.webkitAudioContext) {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
            }
        }, { once: true });
        
        // Prevenir comportamento padrão de arrastar
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
        });
        
        // Prevenir zoom com dois dedos
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Melhorar performance de scroll
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Ajustar layout ao redimensionar
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.ajustarLayoutDinamico();
            }, 100);
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.ajustarLayoutDinamico();
            }, 300);
        });
    }
    
    otimizarLayout() {
        // Função para ajustar layout baseado na orientação
        const ajustarLayout = () => {
            const isLandscape = window.innerWidth > window.innerHeight;
            
            if (isLandscape) {
                // Modo paisagem
                document.body.style.overflowY = 'auto';
                
                // Garantir que rodapé esteja visível
                const rodape = document.querySelector('.rodape');
                if (rodape) {
                    rodape.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            } else {
                // Modo retrato
                document.body.style.overflowY = 'auto';
            }
        };
        
        // Executar ajustes inicialmente
        setTimeout(ajustarLayout, 100);
        
        // Reajustar em eventos
        window.addEventListener('resize', ajustarLayout);
        window.addEventListener('orientationchange', () => {
            setTimeout(ajustarLayout, 300);
        });
        
        // Ajustar quando conteúdo carregar
        window.addEventListener('load', ajustarLayout);
    }
}

// ========== INICIALIZAÇÃO ==========

document.addEventListener('DOMContentLoaded', () => {
    window.tecladoInterativo = new TecladoInterativo();

    // Garantir que a página tenha scroll vertical se necessário
    const verificarScroll = () => {
        const bodyHeight = document.body.scrollHeight;
        const viewportHeight = window.innerHeight;
        
        if (bodyHeight > viewportHeight) {
            document.body.style.overflowY = 'auto';
            document.documentElement.style.overflowY = 'auto';
        } else {
            document.body.style.overflowY = 'hidden';
            document.documentElement.style.overflowY = 'hidden';
        }
    };
    
    setTimeout(verificarScroll, 500);
    window.addEventListener('resize', verificarScroll);

});

// Função global para forçar ajustes
function forcarAjusteLayout() {
    const app = window.tecladoInterativo;
    if (app && app.ajustarLayoutDinamico) {
        app.ajustarLayoutDinamico();
    }
    
    // Garantir que rodapé não tenha scroll
    const rodape = document.querySelector('.rodape');
    if (rodape) {
        rodape.style.overflowX = 'hidden';
        rodape.style.overflowY = 'hidden';
        
        // Forçar quebra de linha se necessário
        const contador = rodape.querySelector('.contador-visitas');
        if (contador) {
            const larguraRodape = rodape.offsetWidth;
            const larguraContador = contador.scrollWidth;
            
            if (larguraContador > larguraRodape * 0.9) {
                contador.style.flexWrap = 'wrap';
                contador.style.justifyContent = 'center';
            } else {
                contador.style.flexWrap = 'nowrap';
            }
        }
    }
}

// Executar ao carregar e redimensionar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(forcarAjusteLayout, 200);
    
    // Ajustar após imagens/carregamento
    window.addEventListener('load', () => {
        setTimeout(forcarAjusteLayout, 500);
    });
    
    // Monitorar redimensionamento
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(forcarAjusteLayout, 250);
    });
    
    // Monitorar mudança de orientação
    window.addEventListener('orientationchange', () => {
        setTimeout(forcarAjusteLayout, 400);
    });
});

// Adicionar suporte a atalhos de teclado
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    const keyMap = {
      '1': '.tecla_pom',
      '2': '.tecla_clap',
      '3': '.tecla_tim',
      '4': '.tecla_extra1',
      'q': '.tecla_puff',
      'w': '.tecla_splash',
      'e': '.tecla_toim',
      'r': '.tecla_extra2',
      'a': '.tecla_psh',
      's': '.tecla_tic',
      'd': '.tecla_tom',
      'f': '.tecla_extra3'
    };
    
    if (keyMap[e.key]) {
      const tecla = document.querySelector(keyMap[e.key]);
      if (tecla) tecla.click();
    }
  });