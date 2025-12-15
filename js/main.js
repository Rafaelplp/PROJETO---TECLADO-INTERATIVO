// main.js - Teclado Meme Interativo v5.1
// Sistema de áudio aprimorado com controle de parada

class TecladoInterativo {
    constructor() {
        // Estado do aplicativo
        this.audioAtual = null;
        this.audioSourcesAtivas = new Set();
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
        
        // SISTEMA DE ÁUDIO DEFINITIVO
        this.audioContext = null;
        this.audioBuffers = new Map();
        this.audioUnlocked = false;
        this.audioElements = new Map();
        this.sonsPadrao = {
            'pom': 'among-sound.mp3',
            'clap': 'tf_nemesis.mp3',
            'tim': 'anime-sound.mp3',
            'extra1': 'creditos-finales.mp3',
            'puff': 'dun-dun-dun-sound.mp3',
            'splash': 'error_sound.mp3',
            'toim': 'george-micael.mp3',
            'extra2': 'lets-go-sound.mp3',
            'psh': 'm-e-o-w.mp3',
            'tic': 'para-tira-que-eu-vou-cagar.mp3',
            'tom': 'pedro-song.mp3',
            'extra3': 'yippee.mp3'
        };
        
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

        // Inicializar
        this.inicializar();
    }

    // ========== INICIALIZAÇÃO ==========
    
    async inicializar() {
        console.log('🎹 Teclado Meme Interativo v5.1 - Iniciando...');
        
        // Configurar modo noturno
        this.configurarModoNoturno();
        
        // Configurar elementos
        this.configurarTeclas();
        this.configurarControles();
        this.restaurarConfiguracoes();
        this.configurarEventosGlobais();
        this.configurarEventosScroll();
        this.exibirVersao();
        
        // Inicializar sistema de áudio
        await this.inicializarSistemaAudio();
        
        // Ajustar layout
        this.ajustarLayout();
        
        console.log('✅ Teclado pronto para uso!');
    }
    
    // ========== SISTEMA DE ÁUDIO DEFINITIVO ==========
    
    async inicializarSistemaAudio() {
        try {
            // Verificar se temos Web Audio API
            if (window.AudioContext || window.webkitAudioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
                
                // Tentar ativar o contexto imediatamente
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                
                console.log('✅ Web Audio API disponível');
                
                // Carregar todos os áudios em buffers
                await this.carregarAudioBuffers();
                
                // Configurar evento de desbloqueio
                this.configurarDesbloqueioAudio();
                
            } else {
                console.log('⚠️ Web Audio API não disponível, usando fallback HTML5');
                this.configurarAudioHTML5();
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema de áudio:', error);
            this.configurarAudioHTML5();
        }
    }
    
    async carregarAudioBuffers() {
        for (const [somId, arquivo] of Object.entries(this.sonsPadrao)) {
            try {
                const response = await fetch(`sounds-memes/${arquivo}`);
                if (!response.ok) {
                    throw new Error(`Arquivo não encontrado: ${arquivo}`);
                }
                
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.audioBuffers.set(somId, audioBuffer);
                console.log(`✅ Áudio carregado: ${arquivo}`);
            } catch (error) {
                console.warn(`⚠️ Não foi possível carregar ${arquivo}:`, error);
            }
        }
    }
    
    configurarDesbloqueioAudio() {
        // Desbloquear áudio na primeira interação do usuário
        const desbloquearAudio = async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                this.audioUnlocked = true;
                console.log('✅ Áudio desbloqueado pelo usuário');
                this.mostrarFeedback('🔊 Sons ativados!', 1500);
                
                // Remover event listeners após desbloqueio
                document.removeEventListener('click', desbloquearAudio);
                document.removeEventListener('touchstart', desbloquearAudio);
            }
        };
        
        document.addEventListener('click', desbloquearAudio, { once: true });
        document.addEventListener('touchstart', desbloquearAudio, { once: true });
        
        // Também desbloquear ao clicar em qualquer tecla
        document.querySelectorAll('.tecla').forEach(tecla => {
            tecla.addEventListener('click', desbloquearAudio, { once: true });
            tecla.addEventListener('touchstart', desbloquearAudio, { once: true });
        });
    }
    
    configurarAudioHTML5() {
        // Criar elementos de áudio HTML5 como fallback
        console.log('🔄 Usando sistema de áudio HTML5');
        
        // Mapear sons padrão para elementos de áudio
        Object.keys(this.sonsPadrao).forEach(somId => {
            const audioElement = document.querySelector(`#som_tecla_${somId}`);
            if (audioElement) {
                this.audioElements.set(somId, audioElement);
                audioElement.preload = 'auto';
                audioElement.load();
            }
        });
    }
    
    async tocarSom(somId) {
        if (this.isScrolling || this.scrollAtivo) return;
        
        try {
            // PARAR TODOS OS SONS ANTES DE TOCAR O NOVO
            this.pararSomAtual();
            
            // Tentar usar Web Audio API primeiro
            if (this.audioBuffers.has(somId) && this.audioContext && this.audioUnlocked) {
                await this.tocarSomWebAudio(somId);
            } 
            // Fallback para HTML5 Audio
            else if (this.audioElements.has(somId)) {
                await this.tocarSomHTML5(somId);
            }
            // Último fallback: elemento de áudio do DOM
            else {
                await this.tocarSomDOM(somId);
            }
            
            // Feedback visual
            this.animarTecla(somId);
            
        } catch (error) {
            console.error(`❌ Erro ao tocar som ${somId}:`, error);
            this.mostrarFeedback('🔊 Toque novamente para ativar', 1500);
            
            // Tentar desbloquear áudio
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                this.audioUnlocked = true;
                this.mostrarFeedback('✅ Áudio ativado! Tente novamente', 1500);
            }
        }
    }
    
    async tocarSomWebAudio(somId) {
        if (!this.audioContext || !this.audioUnlocked) {
            throw new Error('Áudio não desbloqueado');
        }
        
        const audioBuffer = this.audioBuffers.get(somId);
        if (!audioBuffer) {
            throw new Error(`Buffer de áudio não encontrado: ${somId}`);
        }
        
        // Criar source e conectar ao destino
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1.0;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Armazenar source ativa
        this.audioSourcesAtivas.add(source);
        
        // Configurar para remover da lista quando terminar
        source.onended = () => {
            source.disconnect();
            gainNode.disconnect();
            this.audioSourcesAtivas.delete(source);
        };
        
        // Tocar
        source.start(0);
    }
    
    async tocarSomHTML5(somId) {
        const audioElement = this.audioElements.get(somId);
        if (!audioElement) {
            throw new Error(`Elemento de áudio não encontrado: ${somId}`);
        }
        
        // Parar e reiniciar
        audioElement.pause();
        audioElement.currentTime = 0;
        
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
            await playPromise;
        }
        
        // Armazenar como áudio atual
        this.audioAtual = audioElement;
    }
    
    async tocarSomDOM(somId) {
        const audioElement = document.querySelector(`#som_tecla_${somId}`);
        if (!audioElement) {
            throw new Error(`Elemento de áudio DOM não encontrado: som_tecla_${somId}`);
        }
        
        // Parar e reiniciar
        audioElement.pause();
        audioElement.currentTime = 0;
        
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
            await playPromise;
        }
        
        // Armazenar como áudio atual
        this.audioAtual = audioElement;
    }
    
    // PARAR SOM ATUAL ANTES DE TOCAR OUTRO
    pararSomAtual() {
        // Parar Web Audio sources
        this.audioSourcesAtivas.forEach(source => {
            try {
                source.stop();
                source.disconnect();
            } catch (e) {
                // Ignorar erros se já estiver parado
            }
        });
        this.audioSourcesAtivas.clear();
        
        // Parar elementos HTML5
        this.audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        // Parar elementos do DOM
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        // Limpar referência atual
        this.audioAtual = null;
    }
    
    animarTecla(somId) {
        const tecla = document.querySelector(`[data-som="${somId}"]`);
        if (tecla && !tecla.classList.contains('scrolling')) {
            tecla.classList.add('tocando');
            setTimeout(() => tecla.classList.remove('tocando'), 300);
        }
    }
    
    pararTodosSons() {
        this.pararSomAtual();
        
        document.querySelectorAll('.tecla').forEach(tecla => {
            tecla.classList.remove('tocando', 'ativa');
        });
        
        this.mostrarFeedback('⏹️ Todos os sons parados', 1500);
    }

    // ========== AJUSTE DE LAYOUT ==========
    
    ajustarLayout() {
        // Remover todas as transformações de escala
        const menu = document.querySelector('.menu-superior');
        const rodape = document.querySelector('.rodape');
        
        if (menu) menu.style.transform = 'none';
        if (rodape) rodape.style.transform = 'none';
        
        // Garantir que tudo caiba na tela
        this.verificarEspacoDisponivel();
        
        // Configurar redimensionamento
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.verificarEspacoDisponivel(), 100);
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.verificarEspacoDisponivel(), 300);
        });
    }
    
    verificarEspacoDisponivel() {
        const alturaViewport = window.innerHeight;
        const larguraViewport = window.innerWidth;
        
        // Elementos principais
        const menu = document.querySelector('.menu-superior');
        const cabecalho = document.querySelector('.cabecalho');
        const tecladoContainer = document.querySelector('.teclado-container');
        const rodape = document.querySelector('.rodape');
        
        if (!menu || !cabecalho || !tecladoContainer || !rodape) return;
        
        // Calcular alturas
        const alturaMenu = menu.offsetHeight;
        const alturaCabecalho = cabecalho.offsetHeight;
        const alturaRodape = rodape.offsetHeight;
        const margens = 32; // Margens e gaps
        
        // Calcular altura disponível para o teclado
        const alturaDisponivel = alturaViewport - alturaMenu - alturaCabecalho - alturaRodape - margens;
        
        // Ajustar o container do teclado se necessário
        if (alturaDisponivel > 100) {
            tecladoContainer.style.maxHeight = `${alturaDisponivel}px`;
        } else {
            // Se a tela for muito pequena, reduzir ainda mais
            this.ajustarParaTelasMuitoPequenas();
        }
        
        // Garantir que menu e rodapé não cortem conteúdo
        this.garantirVisibilidadeCompleta();
    }
    
    ajustarParaTelasMuitoPequenas() {
        // Reduzir ainda mais os tamanhos para telas muito pequenas
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            // Modo paisagem: ajustar layout horizontal
            this.ajustarLayoutPaisagem();
        } else {
            // Modo retrato: ajustar tudo
            this.reduzirTamanhosElementos();
        }
    }
    
    ajustarLayoutPaisagem() {
        const appContainer = document.querySelector('.app-container');
        if (!appContainer) return;
        
        appContainer.style.flexDirection = 'row';
        appContainer.style.flexWrap = 'wrap';
        
        // Ajustar larguras
        const menu = document.querySelector('.menu-superior');
        const tecladoContainer = document.querySelector('.teclado-container');
        
        if (menu && tecladoContainer) {
            menu.style.width = '200px';
            menu.style.maxWidth = '200px';
            menu.style.flexDirection = 'column';
            menu.style.gap = '8px';
            
            tecladoContainer.style.flex = '1';
            tecladoContainer.style.maxWidth = 'calc(100% - 220px)';
        }
    }
    
    reduzirTamanhosElementos() {
        // Reduzir fontes e padding para caber em telas pequenas
        document.querySelectorAll('.botao-menu').forEach(botao => {
            botao.style.padding = '4px 6px';
            botao.style.fontSize = '0.6rem';
        });
        
        document.querySelectorAll('.tecla').forEach(tecla => {
            tecla.style.fontSize = '1.2rem';
            tecla.style.minHeight = '50px';
        });
        
        document.querySelectorAll('.contador-item').forEach(item => {
            item.style.padding = '4px 6px';
            item.style.fontSize = '0.6rem';
        });
    }
    
    garantirVisibilidadeCompleta() {
        // Garantir que menu e rodapé mostrem todo o conteúdo
        const menu = document.querySelector('.menu-superior');
        const rodape = document.querySelector('.rodape');
        
        if (menu) {
            menu.style.overflow = 'visible';
            menu.style.overflowX = 'visible';
            menu.style.overflowY = 'visible';
            
            // Ajustar botões do menu se estiverem cortando
            const botoesMenu = menu.querySelectorAll('.botao-menu');
            let larguraTotalBotoes = 0;
            
            botoesMenu.forEach(botao => {
                const estilo = window.getComputedStyle(botao);
                larguraTotalBotoes += botao.offsetWidth + 
                    parseInt(estilo.marginLeft) + 
                    parseInt(estilo.marginRight);
            });
            
            const larguraMenu = menu.offsetWidth;
            const paddingMenu = parseInt(window.getComputedStyle(menu).paddingLeft) * 2;
            const gapMenu = parseInt(window.getComputedStyle(menu).gap) * (botoesMenu.length - 1);
            
            const larguraNecessaria = larguraTotalBotoes + paddingMenu + gapMenu;
            
            if (larguraNecessaria > larguraMenu) {
                // Reduzir gap
                menu.style.gap = '4px';
                
                // Se ainda não couber, reduzir botões
                if (larguraNecessaria * 0.9 > larguraMenu) {
                    botoesMenu.forEach(botao => {
                        botao.style.padding = '6px 4px';
                        botao.style.fontSize = '0.6rem';
                    });
                }
            }
        }
        
        if (rodape) {
            rodape.style.overflow = 'visible';
            rodape.style.overflowX = 'visible';
            rodape.style.overflowY = 'visible';
            
            // Garantir que contadores fiquem visíveis
            const contadorVisitas = rodape.querySelector('.contador-visitas');
            if (contadorVisitas) {
                contadorVisitas.style.flexWrap = 'nowrap';
                contadorVisitas.style.overflow = 'visible';
                
                // Ajustar se não couber
                const itensContador = contadorVisitas.querySelectorAll('.contador-item');
                let larguraTotalItens = 0;
                
                itensContador.forEach(item => {
                    larguraTotalItens += item.offsetWidth;
                });
                
                const larguraRodape = rodape.offsetWidth;
                const paddingRodape = parseInt(window.getComputedStyle(rodape).paddingLeft) * 2;
                const gapContador = parseInt(window.getComputedStyle(contadorVisitas).gap) * (itensContador.length - 1);
                
                const larguraNecessariaContador = larguraTotalItens + paddingRodape + gapContador;
                
                if (larguraNecessariaContador > larguraRodape) {
                    // Reduzir gap
                    contadorVisitas.style.gap = '2px';
                    
                    // Reduzir padding dos itens
                    itensContador.forEach(item => {
                        item.style.padding = '4px 6px';
                    });
                    
                    // Se ainda não couber, reduzir fontes
                    if (larguraNecessariaContador * 0.9 > larguraRodape) {
                        itensContador.forEach(item => {
                            item.style.fontSize = '0.6rem';
                        });
                    }
                }
            }
        }
    }

    // ========== CONFIGURAÇÃO DAS TECLAS ==========
    
    configurarTeclas() {
        const teclas = document.querySelectorAll('.tecla');
        
        teclas.forEach(tecla => {
            const somId = tecla.dataset.som;
            
            // Restaurar configurações salvas
            this.restaurarConfiguracoesTecla(tecla);
            
            // Salvar emoji original
            if (!tecla.dataset.emojiOriginal) {
                tecla.dataset.emojiOriginal = tecla.innerHTML;
            }
            
            // Configurar eventos
            this.configurarEventosTecla(tecla, somId);
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
    
    configurarEventosTecla(tecla, somId) {
        // Evento de clique (desktop)
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
                this.tocarSom(somId);
            }
        });
        
        // Eventos de touch (mobile)
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
                    this.tocarSom(somId);
                }
            }
            
            this.touchAtivo = false;
            tecla.classList.remove('ativa');
            
            setTimeout(() => {
                this.touchAtivo = false;
            }, this.toqueDelay);
        }, { passive: false });
        
        tecla.addEventListener('touchcancel', () => {
            tecla.classList.remove('ativa');
            this.touchAtivo = false;
        });
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
                        <input type="file" id="editar-som" accept="audio/*" class="input-som">
                        <small>Formatos suportados: MP3, OGG, WAV (máx. 5MB)</small>
                        <button class="btn-teste-som" data-som="${tecla.dataset.som}">
                            🔊 Testar som atual
                        </button>
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
        
        // Configurar eventos do modal
        this.configurarModalEdicao(tecla, modal);
    }
    
    configurarModalEdicao(tecla, modal) {
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
        
        // Cores rápidas
        coresRapidas.forEach(corEl => {
            corEl.addEventListener('click', () => {
                if (this.isScrolling) return;
                const cor = corEl.dataset.cor;
                inputCor.value = cor;
                previewCor.style.background = cor;
            });
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
                exemplo.style.transform = 'scale(1.2)';
                exemplo.style.background = 'rgba(0, 212, 255, 0.3)';
                setTimeout(() => {
                    exemplo.style.transform = '';
                    exemplo.style.background = '';
                }, 300);
            });
        });
        
        // Validação do arquivo de som
        inputSom.addEventListener('change', (e) => {
            if (this.isScrolling) return;
            
            const arquivo = e.target.files[0];
            if (arquivo) {
                const tamanhoMB = arquivo.size / (1024 * 1024);
                
                if (tamanhoMB > 5) {
                    this.mostrarFeedback('❌ Arquivo muito grande (máx. 5MB)', 3000);
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
            this.tocarSom(somId);
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
            }
        });
        
        // Fechar
        const fecharModal = () => modal.remove();
        
        btnFechar.addEventListener('click', fecharModal);
        btnCancelar.addEventListener('click', fecharModal);
        modal.addEventListener('click', (e) => {
            if (this.isScrolling) return;
            if (e.target === modal) fecharModal();
        });
    }
    
    async salvarEdicaoTecla(tecla, modal) {
        let novoEmoji = modal.querySelector('#editar-emoji').value.trim();
        const novaCor = modal.querySelector('#editar-cor').value;
        const arquivoSom = modal.querySelector('#editar-som').files[0];
        
        // Processar emoji
        if (novoEmoji) {
            if (novoEmoji.includes('&#')) {
                novoEmoji = this.decodificarEmoji(novoEmoji);
            }
            
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
            if (tamanhoMB <= 5) {
                const url = URL.createObjectURL(arquivoSom);
                const somId = tecla.dataset.som;
                
                try {
                    // Carregar o novo áudio
                    const response = await fetch(url);
                    const arrayBuffer = await response.arrayBuffer();
                    
                    // Se Web Audio API estiver disponível, decodificar
                    if (this.audioContext && this.audioUnlocked) {
                        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                        this.audioBuffers.set(somId, audioBuffer);
                    }
                    
                    // Também criar elemento HTML5 para fallback
                    const audioElement = new Audio(url);
                    audioElement.preload = 'auto';
                    this.audioElements.set(somId, audioElement);
                    
                    this.sonsEditados[somId] = {
                        url: url,
                        name: arquivoSom.name,
                        data: arrayBuffer
                    };
                    tecla.classList.add('editado');
                    
                    console.log(`✅ Som personalizado salvo: ${arquivoSom.name}`);
                    
                } catch (error) {
                    console.error('❌ Erro ao salvar som personalizado:', error);
                    this.mostrarFeedback('❌ Erro ao salvar som', 2000);
                }
            }
        }
        
        // Salvar no localStorage
        this.salvarConfiguracoes();
        
        modal.remove();
        this.mostrarFeedback('✅ Tecla atualizada!', 1500);
    }
    
    decodificarEmoji(codigo) {
        if (!codigo.includes('&#')) return codigo;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = codigo;
        return tempDiv.textContent || tempDiv.innerText || codigo;
    }

    async resetarTeclaIndividual(tecla) {
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
        try {
            // Restaurar som padrão
            const arquivoPadrao = this.sonsPadrao[somId];
            if (arquivoPadrao) {
                const response = await fetch(`sounds-memes/${arquivoPadrao}`);
                const arrayBuffer = await response.arrayBuffer();
                
                if (this.audioContext && this.audioUnlocked) {
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    this.audioBuffers.set(somId, audioBuffer);
                }
                
                // Restaurar elemento HTML5
                const audioElement = document.querySelector(`#som_tecla_${somId}`);
                if (audioElement) {
                    this.audioElements.set(somId, audioElement);
                }
            }
            
            delete this.sonsEditados[somId];
            
        } catch (error) {
            console.warn(`⚠️ Erro ao resetar som ${somId}:`, error);
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
    
    async resetarTudo() {
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
            this.sonsEditados = {};
            localStorage.removeItem('sonsEditados');
            
            // Recarregar sons padrão
            try {
                await this.carregarAudioBuffers();
                this.configurarAudioHTML5();
                this.mostrarFeedback('🔄 Sons padrão restaurados', 2000);
            } catch (error) {
                console.error('Erro ao recarregar sons padrão:', error);
            }
            
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
        
        // Salvar sons editados de forma otimizada
        const sonsEditadosParaSalvar = {};
        Object.entries(this.sonsEditados).forEach(([key, value]) => {
            if (value && value.url) {
                sonsEditadosParaSalvar[key] = {
                    name: value.name,
                    url: value.url
                };
            }
        });
        localStorage.setItem('sonsEditados', JSON.stringify(sonsEditadosParaSalvar));
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
        const versao = '5.1';
        const elemento = document.getElementById('versao-app');
        if (elemento) {
            elemento.textContent = versao;
        }
        localStorage.setItem('app_version', versao);
    }
    
    restaurarConfiguracoes() {
        // Restaurar sons editados
        Object.entries(this.sonsEditados).forEach(([somId, value]) => {
            if (value && value.url) {
                try {
                    const audioElement = new Audio(value.url);
                    audioElement.preload = 'auto';
                    this.audioElements.set(somId, audioElement);
                } catch (error) {
                    console.warn(`Erro ao restaurar som ${somId}:`, error);
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
    }
    
    configurarEventosGlobais() {
        // ESC para parar sons
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.pararTodosSons();
        });
        
        // Ajustar layout ao redimensionar
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.verificarEspacoDisponivel(), 100);
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.verificarEspacoDisponivel(), 300);
        });
    }
    
    configurarEventosScroll() {
        // Configurar para o teclado
        const tecladoContainer = document.querySelector('.teclado-container');
        if (tecladoContainer) {
            tecladoContainer.addEventListener('touchstart', (e) => {
                this.touchStartY = e.touches[0].clientY;
                this.isScrolling = false;
            }, { passive: true });
            
            tecladoContainer.addEventListener('touchmove', (e) => {
                if (!this.touchStartY) return;
                
                const touchY = e.touches[0].clientY;
                const deltaY = Math.abs(touchY - this.touchStartY);
                
                if (deltaY > this.touchMoveThreshold) {
                    this.isScrolling = true;
                    
                    const teclas = tecladoContainer.querySelectorAll('.tecla');
                    teclas.forEach(tecla => tecla.classList.add('scrolling'));
                }
            }, { passive: true });
            
            tecladoContainer.addEventListener('touchend', () => {
                const teclas = tecladoContainer.querySelectorAll('.tecla');
                teclas.forEach(tecla => tecla.classList.remove('scrolling'));
                
                this.touchStartY = 0;
                this.isScrolling = false;
            }, { passive: true });
        }
        
        // Detectar scroll global
        document.addEventListener('scroll', () => {
            this.scrollAtivo = true;
            
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => {
                this.scrollAtivo = false;
            }, 100);
        }, { passive: true });
    }
}

// ========== INICIALIZAÇÃO ==========

document.addEventListener('DOMContentLoaded', async () => {
    // Criar instância do teclado
    window.tecladoInterativo = new TecladoInterativo();
    
    // Ajustar inicial
    setTimeout(() => {
        if (window.tecladoInterativo.verificarEspacoDisponivel) {
            window.tecladoInterativo.verificarEspacoDisponivel();
        }
    }, 500);
    
    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        
        const keyMap = {
            '1': '.tecla_pom', '2': '.tecla_clap', '3': '.tecla_tim', '4': '.tecla_extra1',
            'q': '.tecla_puff', 'w': '.tecla_splash', 'e': '.tecla_toim', 'r': '.tecla_extra2',
            'a': '.tecla_psh', 's': '.tecla_tic', 'd': '.tecla_tom', 'f': '.tecla_extra3'
        };
        
        if (keyMap[e.key]) {
            const tecla = document.querySelector(keyMap[e.key]);
            if (tecla) tecla.click();
        }
    });
});

// Função global para ajustar layout
function ajustarLayoutApp() {
    const app = window.tecladoInterativo;
    if (app && app.verificarEspacoDisponivel) {
        app.verificarEspacoDisponivel();
    }
}

// Executar ajustes em eventos
window.addEventListener('load', ajustarLayoutApp);
window.addEventListener('resize', ajustarLayoutApp);
window.addEventListener('orientationchange', () => {
    setTimeout(ajustarLayoutApp, 400);
});