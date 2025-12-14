// main.js - Teclado Interativo v4.4.1
// Rodapé centralizado + Scroll seguro sem ativar botões

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
        this.touchMoveThreshold = 10; // pixels para considerar como scroll
        this.isScrolling = false;
        
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
        
        // Inicializar áudio
        this.inicializarAudio();
        
        console.log('✅ Teclado pronto para uso!');
    }
    
    // Adicionar novo método para ajustar o menu:
    ajustarMenuParaTela() {
        const menu = document.querySelector('.menu-superior');
        if (!menu) return;
        
        // Verificar se o menu cabe na tela
        const verificarAjuste = () => {
            const botoes = menu.querySelectorAll('.botao-menu');
            const larguraMenu = menu.offsetWidth;
            const larguraBotoes = Array.from(bots).reduce((total, botao) => {
                return total + botao.offsetWidth;
            }, 0);
            
            // Adicionar gap (12px * número de gaps)
            const gapTotal = (botoes.length - 1) * 12;
            const larguraTotalNecessaria = larguraBotoes + gapTotal + 40; // + padding
            
            // Se não couber, reduzir escala
            if (larguraTotalNecessaria > larguraMenu && larguraMenu > 0) {
                const fatorEscala = larguraMenu / larguraTotalNecessaria * 0.9;
                menu.style.transform = `scale(${Math.min(fatorEscala, 0.75)})`;
            }
        };
        
        // Verificar após carregamento e redimensionamento
        setTimeout(verificarAjuste, 100);
        window.addEventListener('resize', verificarAjuste);
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
        // Elementos que têm scroll horizontal - REMOVER MENU DA LISTA
        const elementosComScroll = [
            '.rodape',
            '.contador-visitas'
        ];
        
        elementosComScroll.forEach(seletor => {
            const elementos = document.querySelectorAll(seletor);
            elementos.forEach(elemento => {
                this.configurarScrollSeguro(elemento);
            });
        });
        
        // Configurar para o teclado também
        const tecladoContainer = document.querySelector('.teclado-container');
        if (tecladoContainer) {
            this.configurarScrollVerticalSeguro(tecladoContainer);
        }
        
        // Configurar eventos de touch para detectar scroll
        this.configurarDetecaoScroll();
    }
    
    configurarScrollSeguro(elemento) {
        if (!elemento) return;
        
        // Prevenir comportamento padrão de arrastar
        elemento.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.isScrolling = false;
            
            // Adicionar classe de scroll ativo
            elemento.classList.add('scrolling-active');
            
            // Adicionar classe scrolling aos botões dentro do elemento
            const botoes = elemento.querySelectorAll('.botao-menu, .contador-item');
            botoes.forEach(botao => botao.classList.add('scrolling'));
        }, { passive: true });
        
        elemento.addEventListener('touchmove', (e) => {
            if (!this.touchStartX || !this.touchStartY) return;
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            
            const deltaX = Math.abs(touchX - this.touchStartX);
            const deltaY = Math.abs(touchY - this.touchStartY);
            
            // Se o movimento for maior que o threshold, é scroll
            if (deltaX > this.touchMoveThreshold || deltaY > this.touchMoveThreshold) {
                this.isScrolling = true;
                
                // Manter classe scrolling nos botões
                const botoes = elemento.querySelectorAll('.botao-menu, .contador-item');
                botoes.forEach(botao => botao.classList.add('scrolling'));
            }
        }, { passive: true });
        
        elemento.addEventListener('touchend', (e) => {
            // Limpar timeout anterior
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }
            
            // Remover classe scrolling após um delay
            this.scrollTimeout = setTimeout(() => {
                this.isScrolling = false;
                elemento.classList.remove('scrolling-active');
                
                const botoes = elemento.querySelectorAll('.botao-menu, .contador-item');
                botoes.forEach(botao => botao.classList.remove('scrolling'));
            }, 100);
            
            this.touchStartX = 0;
            this.touchStartY = 0;
        }, { passive: true });
        
        // Também para mouse wheel
        elemento.addEventListener('wheel', (e) => {
            this.isScrolling = true;
            elemento.classList.add('scrolling-active');
            
            const botoes = elemento.querySelectorAll('.botao-menu, .contador-item');
            botoes.forEach(botao => botao.classList.add('scrolling'));
            
            // Remover após scroll
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => {
                this.isScrolling = false;
                elemento.classList.remove('scrolling-active');
                botoes.forEach(botao => botao.classList.remove('scrolling'));
            }, 150);
        }, { passive: true });
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

    // ========== CONFIGURAÇÃO DAS TECLAS (COM PREVENÇÃO DE SCROLL) ==========
    
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
            
            oscillator.frequency.value = 1; // Frequência muito baixa
            gainNode.gain.value = 0.001; // Quase inaudível
            
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
        const versao = '4.4.0';
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
    }
     // Novo método para otimizar layout
     otimizarLayout() {
        // Função para ajustar layout baseado na orientação
        const ajustarLayout = () => {
            const isLandscape = window.innerWidth > window.innerHeight;
            const appContainer = document.querySelector('.app-container');
            const tecladoContainer = document.querySelector('.teclado-container');
            const rodape = document.querySelector('.rodape');
            
            if (!appContainer || !tecladoContainer || !rodape) return;
            
            if (isLandscape) {
                // Modo paisagem
                document.body.style.overflowY = 'auto';
                appContainer.style.minHeight = 'auto';
                
                // Calcular altura disponível
                const alturaViewport = window.innerHeight;
                const alturaMenu = document.querySelector('.menu-superior').offsetHeight;
                const alturaCabecalho = document.querySelector('.cabecalho').offsetHeight;
                const alturaRodape = rodape.offsetHeight;
                const margens = 40;
                
                const alturaDisponivel = alturaViewport - alturaMenu - alturaCabecalho - alturaRodape - margens;
                
                // Ajustar teclado
                tecladoContainer.style.maxHeight = `${Math.max(alturaDisponivel, 200)}px`;
                tecladoContainer.style.overflowY = 'auto';
                
                // Garantir que rodapé esteja visível
                rodape.scrollIntoView({ behavior: 'smooth', block: 'end' });
            } else {
                // Modo retrato
                document.body.style.overflowY = 'auto';
                appContainer.style.minHeight = '100vh';
                tecladoContainer.style.maxHeight = 'none';
                tecladoContainer.style.overflowY = 'visible';
            }
            
            // Garantir que o rodapé não tenha scroll horizontal
            rodape.style.overflowX = 'hidden';
            rodape.style.whiteSpace = 'normal';
            
            // Ajustar contador para caber sem scroll
            const contadorVisitas = rodape.querySelector('.contador-visitas');
            if (contadorVisitas) {
                const larguraRodape = rodape.offsetWidth;
                const larguraItens = Array.from(contadorVisitas.children).reduce((total, item) => {
                    return total + item.offsetWidth;
                }, 0);
                
                // Se não couber em uma linha, quebrar
                if (larguraItens > larguraRodape * 0.9) {
                    contadorVisitas.style.flexWrap = 'wrap';
                    contadorVisitas.style.justifyContent = 'center';
                } else {
                    contadorVisitas.style.flexWrap = 'nowrap';
                }
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
        
        // Verificar periodicamente
        setInterval(ajustarLayout, 2000);
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

// Adicionar em main.js
const temas = {
    'neon': { primaria: '#0a0a0a', secundaria: '#1a1a1a', destaque: '#00ff88' },
    'pastel': { primaria: '#f8f9fa', secundaria: '#e9ecef', destaque: '#ff6b8b' },
    'retro': { primaria: '#2d3047', secundaria: '#419d78', destaque: '#e0a458' }
  };

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

  // Script para garantir menu horizontal e centralizado
function garantirMenuHorizontal() {
    const menu = document.querySelector('.menu-superior');
    if (!menu) return;
    
    // Remover overflow e scroll
    menu.style.overflowX = 'visible';
    menu.style.overflowY = 'hidden';
    
    // Calcular largura total dos botões
    const botoes = menu.querySelectorAll('.botao-menu');
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
    
    // Se for maior que a tela, reduzir proporcionalmente
    const larguraTela = window.innerWidth * 0.9; // 90% da tela
    if (larguraTotal > larguraTela) {
        const fatorReducao = larguraTela / larguraTotal;
        menu.style.transform = `scale(${Math.min(fatorReducao, 0.8)})`;
    } else {
        menu.style.transform = 'scale(0.75)';
    }
    
    // Centralizar
    menu.style.marginLeft = 'auto';
    menu.style.marginRight = 'auto';
    menu.style.justifyContent = 'center';
}

// Executar quando carregar e redimensionar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(garantirMenuHorizontal, 100);
    window.addEventListener('resize', garantirMenuHorizontal);
    window.addEventListener('orientationchange', () => {
        setTimeout(garantirMenuHorizontal, 300);
    });
});