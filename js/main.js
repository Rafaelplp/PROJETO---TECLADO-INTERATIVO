// main.js - Teclado Interativo v4.2.0
// Menu e rodapé 25% menores, sem sobreposição

class TecladoInterativo {
    constructor() {
        // Estado do aplicativo
        this.audioAtual = null;
        this.modoEdicao = false;
        this.modoNoturno = localStorage.getItem('modoNoturno') === 'true';
        this.coresTeclas = JSON.parse(localStorage.getItem('coresTeclas')) || {};
        this.sonsEditados = JSON.parse(localStorage.getItem('sonsEditados')) || {};
        this.emojiEditados = JSON.parse(localStorage.getItem('emojiEditados')) || {};
        
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
    
    inicializar() {
        console.log('🎹 Teclado Interativo v4.2.0 - Iniciando...');
        
        // Configurar modo noturno
        this.configurarModoNoturno();
        
        // Configurar elementos
        this.configurarTeclas();
        this.configurarControles();
        this.restaurarConfiguracoes();
        this.configurarEventosGlobais();
        this.exibirVersao();
        
        // Inicializar áudio
        this.inicializarAudio();
        
        console.log('✅ Teclado pronto para uso!');
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
            
            // Configurar eventos
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
        // Evento de clique (desktop)
        tecla.addEventListener('click', (e) => {
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
        
        // Eventos de touch (mobile)
        tecla.addEventListener('touchstart', (e) => {
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
            
            if (this.modoEdicao) {
                this.abrirModalEdicao(tecla);
            } else {
                this.tocarSom(idAudio);
            }
            
            setTimeout(() => {
                this.touchAtivo = false;
                tecla.classList.remove('ativa');
            }, this.toqueDelay);
            
        }, { passive: false });
        
        tecla.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            tecla.classList.remove('ativa');
        }, { passive: false });
    }

    // ========== SISTEMA DE SOM ==========
    
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
        
        if (tecla) {
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
                        <label>Alterar som (opcional):</label>
                        <input type="file" id="editar-som" accept="audio/*" class="input-som">
                        <small>MP3, máximo 5MB</small>
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
        
        // Cores rápidas
        coresRapidas.forEach(corEl => {
            corEl.addEventListener('click', () => {
                const cor = corEl.dataset.cor;
                inputCor.value = cor;
                previewCor.style.background = cor;
            });
        });
        
        // Atualizar preview da cor
        inputCor.addEventListener('input', () => {
            previewCor.style.background = inputCor.value;
        });
        
        // Exemplos de emoji
        exemplosEmoji.forEach(exemplo => {
            exemplo.addEventListener('click', () => {
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
        });
        
        // Testar som
        btnTesteSom.addEventListener('click', () => {
            const somId = btnTesteSom.dataset.som;
            this.tocarSom(`#som_tecla_${somId}`);
        });
        
        // Salvar
        btnSalvar.addEventListener('click', () => {
            this.salvarEdicaoTecla(tecla, modal);
        });
        
        // Resetar
        btnReset.addEventListener('click', () => {
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
        if (arquivoSom && arquivoSom.size <= 5 * 1024 * 1024) {
            const url = URL.createObjectURL(arquivoSom);
            const somId = tecla.dataset.som;
            const audioElement = document.querySelector(`#som_tecla_${somId}`);
            
            if (audioElement) {
                // Salvar original
                if (!audioElement.dataset.srcOriginal) {
                    audioElement.dataset.srcOriginal = audioElement.src;
                }
                
                audioElement.src = url;
                this.sonsEditados[somId] = url;
                tecla.classList.add('editado');
            }
        }
        
        // Salvar no localStorage
        this.salvarConfiguracoes();
        
        modal.remove();
        this.mostrarFeedback('✅ Tecla atualizada!', 1500);
    }
    
    // ========== FUNÇÕES PARA TRATAR EMOJIS ==========
    
    decodificarEmoji(codigo) {
        // Se já for um emoji direto, retorna
        if (!codigo.includes('&#')) return codigo;
        
        // Converte código HTML para emoji
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = codigo;
        return tempDiv.textContent || tempDiv.innerText || codigo;
    }
    
    codificarParaHTML(emoji) {
        // Tenta encontrar código HTML correspondente
        for (const [key, value] of Object.entries(this.emojiCodes)) {
            if (key === emoji) {
                return value;
            }
        }
        // Se não encontrar, retorna o emoji original
        return emoji;
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
            audioElement.src = audioElement.dataset.srcOriginal;
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
                    audio.src = audio.dataset.srcOriginal;
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
        localStorage.setItem('sonsEditados', JSON.stringify(this.sonsEditados));
    }
    
    mostrarFeedback(mensagem, duracao = 1500) {
        // Remover anterior
        const anterior = document.querySelector('.feedback-rapido');
        if (anterior) anterior.remove();
        
        // Criar novo
        const feedback = document.createElement('div');
        feedback.className = 'feedback-rapido';
        feedback.textContent = mensagem;
        
        document.body.appendChild(feedback);
        
        // Remover após duração
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transition = 'opacity 0.3s';
            setTimeout(() => feedback.remove(), 300);
        }, duracao - 300);
    }
    
    exibirVersao() {
        const versao = '4.2.0';
        const elemento = document.getElementById('versao-app');
        if (elemento) {
            elemento.textContent = versao;
        }
        localStorage.setItem('app_version', versao);
    }
    
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
            'botao-editar': () => this.toggleModoEdicao(),
            // 'botao-cor-teclas' REMOVIDO conforme solicitado
            'botao-cores-aleatorias': () => this.aplicarCoresAleatorias(),
            'botao-modo': () => this.toggleModoNoturno(),
            'botao-parar': () => this.pararTodosSons(),
            'botao-reset': () => this.resetarTudo()
        };
        
        Object.entries(controles).forEach(([id, funcao]) => {
            const botao = document.getElementById(id);
            if (botao) {
                botao.addEventListener('click', funcao);
                botao.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    funcao();
                }, { passive: false });
            }
        });
        
        // Remover botão de cores do DOM
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
    }
}

// ========== INICIALIZAÇÃO ==========

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.tecladoInterativo = new TecladoInterativo();
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