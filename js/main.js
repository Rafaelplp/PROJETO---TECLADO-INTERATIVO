// main.js - Teclado Interativo v3.2.0
// Correções: Modo edição, sistema de cores e responsividade

class TecladoInterativo {
    constructor() {
        this.audioAtual = null;
        this.modoEdicao = false;
        this.modoNoturno = localStorage.getItem('modoNoturno') === 'true';
        this.contadorSons = parseInt(localStorage.getItem('contadorSons')) || 0;
        this.coresTeclas = JSON.parse(localStorage.getItem('coresTeclas')) || {};
        this.sonsEditados = JSON.parse(localStorage.getItem('sonsEditados')) || {};
        this.emojiEditados = JSON.parse(localStorage.getItem('emojiEditados')) || {};
        
        this.inicializar();
    }

    inicializar() {
        console.log('🎹 Teclado Interativo v3.2.0 iniciando...');
        
        this.configurarModoNoturno();
        this.configurarTeclas();
        this.configurarControles();
        this.restaurarConfiguracoes();
        this.atualizarContadorSons();
        this.configurarEventosGlobais();
        this.exibirVersao();
        
        // Remover elementos indesejados
        this.removerElementosIndesejados();
    }

    // ========== CONFIGURAÇÃO DAS TECLAS ==========
    
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
            
            // Configurar eventos
            tecla.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.modoEdicao) {
                    this.abrirModalEdicao(tecla);
                } else {
                    this.tocarSom(idAudio);
                }
            });
            
            // Touch para mobile
            tecla.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                tecla.classList.add('ativa');
                if (!this.modoEdicao) {
                    this.tocarSom(idAudio);
                }
            }, { passive: false });
            
            tecla.addEventListener('touchend', () => {
                tecla.classList.remove('ativa');
            });
        });
    }
    
    restaurarConfiguracoesTecla(tecla) {
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
                console.log('Erro ao tocar som, tentando novamente...', error);
                // Tentar novamente
                setTimeout(() => audioElement.play().catch(e => {
                    console.error('Falha ao reproduzir áudio:', e);
                }), 100);
            }).then(() => {
                // Sucesso
                this.onSomTocadoSucesso(audioElement);
            });
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
        
        // Atualizar contador
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
            this.mostrarFeedback(this.modoEdicao ? '✏️ Modo edição ativo' : '✅ Modo normal', 1500);
        }
    }
    
    abrirModalEdicao(tecla) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        // Extrair cor atual
        let corAtual = '#667eea';
        if (tecla.style.background) {
            const match = tecla.style.background.match(/#[0-9A-Fa-f]{6}/);
            if (match) corAtual = match[0];
        }
        
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
                               value="${tecla.textContent}" maxlength="2">
                        <small>Máx. 2 caracteres</small>
                    </div>
                    
                    <div class="grupo-form">
                        <label>Cor da tecla:</label>
                        <div class="seletor-cor-container">
                            <input type="color" id="editar-cor" value="${corAtual}" class="input-cor">
                            <div class="preview-cor" style="background: ${tecla.style.background || '#667eea'}"></div>
                        </div>
                        
                        <div class="paleta-cores">
                            ${['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
                               '#7209B7', '#3A86FF', '#FB5607', '#8338EC', '#FF006E',
                               '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'].map(cor => `
                                <div class="cor-rapida" style="background: ${cor}" data-cor="${cor}"></div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="grupo-form">
                        <label>Alterar som (opcional):</label>
                        <input type="file" id="editar-som" accept="audio/*" class="input-som">
                        <small>MP3, máximo 5MB</small>
                    </div>
                </div>
                
                <div class="modal-botoes">
                    <button class="btn-modal btn-salvar">💾 Salvar</button>
                    <button class="btn-modal btn-reset">↩️ Resetar</button>
                    <button class="btn-modal btn-testar">▶️ Testar</button>
                    <button class="btn-modal btn-cancelar">❌ Cancelar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Configurar eventos do modal
        this.configurarModalEdicao(tecla, modal);
    }
    
    configurarModalEdicao(tecla, modal) {
        const btnFechar = modal.querySelector('.btn-fechar');
        const btnCancelar = modal.querySelector('.btn-cancelar');
        const btnSalvar = modal.querySelector('.btn-salvar');
        const btnReset = modal.querySelector('.btn-reset');
        const btnTestar = modal.querySelector('.btn-testar');
        const inputCor = modal.querySelector('#editar-cor');
        const previewCor = modal.querySelector('.preview-cor');
        const coresRapidas = modal.querySelectorAll('.cor-rapida');
        
        // Cores rápidas
        coresRapidas.forEach(corEl => {
            corEl.addEventListener('click', () => {
                const cor = corEl.dataset.cor;
                inputCor.value = cor;
                previewCor.style.background = cor;
            });
        });
        
        // Atualizar preview
        inputCor.addEventListener('input', () => {
            previewCor.style.background = inputCor.value;
        });
        
        // Botão testar
        btnTestar.addEventListener('click', () => {
            const somId = tecla.dataset.som;
            this.tocarSom(`#som_tecla_${somId}`);
        });
        
        // Botão salvar
        btnSalvar.addEventListener('click', () => {
            this.salvarEdicaoTecla(tecla, modal);
        });
        
        // Botão reset
        btnReset.addEventListener('click', () => {
            if (confirm('Resetar esta tecla para o padrão?')) {
                this.resetarTeclaIndividual(tecla);
                modal.remove();
            }
        });
        
        // Fechar modal
        const fecharModal = () => modal.remove();
        btnFechar.addEventListener('click', fecharModal);
        btnCancelar.addEventListener('click', fecharModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharModal();
        });
    }
    
    salvarEdicaoTecla(tecla, modal) {
        const novoEmoji = modal.querySelector('#editar-emoji').value.trim();
        const novaCor = modal.querySelector('#editar-cor').value;
        const arquivoSom = modal.querySelector('#editar-som').files[0];
        
        // Salvar emoji
        if (novoEmoji) {
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
        if (arquivoSom && arquivoSom.size <= 5 * 1024 * 1024) {
            const url = URL.createObjectURL(arquivoSom);
            const somId = tecla.dataset.som;
            const audioElement = document.querySelector(`#som_tecla_${somId}`);
            
            if (audioElement) {
                // Salvar original se for a primeira vez
                if (!audioElement.dataset.srcOriginal) {
                    audioElement.dataset.srcOriginal = audioElement.src;
                }
                
                audioElement.src = url;
                this.sonsEditados[somId] = url;
                tecla.classList.add('editado');
            }
        }
        
        // Salvar no localStorage
        this.salvarNoLocalStorage();
        
        modal.remove();
        this.mostrarFeedback('✅ Tecla atualizada!', 1500);
    }
    
    resetarTeclaIndividual(tecla) {
        const className = tecla.className;
        const somId = tecla.dataset.som;
        
        // Resetar emoji
        if (tecla.dataset.emojiOriginal) {
            tecla.textContent = tecla.dataset.emojiOriginal;
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
        
        // Remover marca editado
        tecla.classList.remove('editado');
        
        // Atualizar localStorage
        this.salvarNoLocalStorage();
        
        this.mostrarFeedback('↩️ Tecla resetada', 1500);
    }
    
    // ========== SISTEMA DE CORES ==========
    
    aplicarCoresAleatorias() {
        const cores = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe',
            '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140',
            '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2'
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
    
    abrirSeletorCores() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>🎨 Seletor de Cores</h3>
                    <button class="btn-fechar">×</button>
                </div>
                
                <div class="modal-conteudo">
                    <div class="grupo-form">
                        <label>Selecionar cor:</label>
                        <input type="color" id="seletor-cor-unica" value="#667eea" class="input-cor-grande">
                    </div>
                    
                    <div class="grupo-form">
                        <label>Cores rápidas:</label>
                        <div class="paleta-grande">
                            ${[
                                '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
                                '#7209B7', '#3A86FF', '#FB5607', '#8338EC', '#FF006E',
                                '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe',
                                '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140'
                            ].map(cor => `
                                <div class="cor-rapida-grande" style="background: ${cor}" data-cor="${cor}"></div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="modal-botoes">
                    <button class="btn-modal btn-aplicar-todas">🎨 Aplicar a todas</button>
                    <button class="btn-modal btn-aleatorias">🎲 Aleatórias</button>
                    <button class="btn-modal btn-reset-cores">↩️ Resetar cores</button>
                    <button class="btn-modal btn-cancelar">❌ Fechar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Configurar eventos
        const btnFechar = modal.querySelector('.btn-fechar');
        const btnCancelar = modal.querySelector('.btn-cancelar');
        const btnAplicarTodas = modal.querySelector('.btn-aplicar-todas');
        const btnAleatorias = modal.querySelector('.btn-aleatorias');
        const btnResetCores = modal.querySelector('.btn-reset-cores');
        const inputCor = modal.querySelector('#seletor-cor-unica');
        const coresRapidas = modal.querySelectorAll('.cor-rapida-grande');
        
        // Cores rápidas
        coresRapidas.forEach(corEl => {
            corEl.addEventListener('click', () => {
                inputCor.value = corEl.dataset.cor;
            });
        });
        
        // Aplicar cor única a todas
        btnAplicarTodas.addEventListener('click', () => {
            this.aplicarCorUnica(inputCor.value);
            modal.remove();
        });
        
        // Cores aleatórias
        btnAleatorias.addEventListener('click', () => {
            this.aplicarCoresAleatorias();
            modal.remove();
        });
        
        // Resetar cores
        btnResetCores.addEventListener('click', () => {
            this.resetarTodasCores();
            modal.remove();
        });
        
        // Fechar
        const fecharModal = () => modal.remove();
        btnFechar.addEventListener('click', fecharModal);
        btnCancelar.addEventListener('click', fecharModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharModal();
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
        this.mostrarFeedback(`🎨 Cor aplicada a todas`, 1500);
    }
    
    resetarTodasCores() {
        if (confirm('Resetar cores de TODAS as teclas?')) {
            document.querySelectorAll('.tecla').forEach(tecla => {
                tecla.style.background = '';
                tecla.classList.remove('editado');
                delete this.coresTeclas[tecla.className];
            });
            
            localStorage.removeItem('coresTeclas');
            this.mostrarFeedback('↩️ Cores resetadas', 1500);
        }
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
        if (confirm('Resetar TODAS as configurações?\n\n• Cores personalizadas\n• Emojis editados\n• Sons customizados\n• Contador de sons')) {
            // Resetar cores
            this.resetarTodasCores();
            
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
            
            // Resetar contador
            this.contadorSons = 0;
            localStorage.setItem('contadorSons', '0');
            this.atualizarContadorSons();
            
            // Sair do modo edição
            if (this.modoEdicao) {
                this.toggleModoEdicao();
            }
            
            this.mostrarFeedback('🔄 Tudo resetado', 2000);
        }
    }
    
    // ========== FUNÇÕES AUXILIARES ==========
    
    salvarNoLocalStorage() {
        localStorage.setItem('emojiEditados', JSON.stringify(this.emojiEditados));
        localStorage.setItem('coresTeclas', JSON.stringify(this.coresTeclas));
        localStorage.setItem('sonsEditados', JSON.stringify(this.sonsEditados));
    }
    
    atualizarContadorSons() {
        const elemento = document.getElementById('contador-sons');
        if (elemento) {
            elemento.textContent = this.contadorSons;
        }
    }
    
    mostrarFeedback(mensagem, duracao = 1500) {
        // Remover feedback anterior
        const anterior = document.querySelector('.feedback-rapido');
        if (anterior) anterior.remove();
        
        // Criar novo
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
            animation: feedbackEntrada 0.3s ease, feedbackSaida 0.3s ease ${duracao - 300}ms forwards;
        `;
        
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), duracao);
    }
    
    exibirVersao() {
        const versao = '3.2.0';
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
        // Mapeamento dos botões
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
                botao.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                    funcao();
                }, { passive: false });
            }
        });
    }
    
    configurarEventosGlobais() {
        // ESC para parar sons
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.pararTodosSons();
        });
        
        // Prevenir scroll em toque nas teclas
        document.addEventListener('touchmove', (e) => {
            if (e.target.classList.contains('tecla')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    removerElementosIndesejados() {
        // Remover elementos que piscam
        const elementos = document.querySelectorAll('.indicador-audio, .ponto-vermelho, [class*="piscar"]');
        elementos.forEach(el => el.remove());
    }
}

// ========== INICIALIZAÇÃO ==========

// Criar instância global
window.tecladoInterativo = new TecladoInterativo();

// Adicionar estilos dinâmicos
const estiloDinamico = document.createElement('style');
estiloDinamico.textContent = `
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
    
    @keyframes feedbackSaida {
        from {
            opacity: 1;
        }
        to {
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
    
    /* Estilos para o modal */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        padding: 20px;
        backdrop-filter: blur(10px);
    }
    
    .modal-container {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-radius: 20px;
        padding: 25px;
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    
    body.modo-dia .modal-container {
        background: linear-gradient(135deg, #ffffff, #f5f5f5);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .modal-header h3 {
        margin: 0;
        color: #00d4ff;
        font-size: 1.3em;
    }
    
    body.modo-dia .modal-header h3 {
        color: #0077cc;
    }
    
    .btn-fechar {
        background: none;
        border: none;
        font-size: 1.8em;
        color: #ff6b6b;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .modal-conteudo {
        margin-bottom: 20px;
    }
    
    .grupo-form {
        margin-bottom: 20px;
    }
    
    .grupo-form label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #00d4ff;
    }
    
    body.modo-dia .grupo-form label {
        color: #0077cc;
    }
    
    .input-emoji, .input-cor, .input-som, .input-cor-grande {
        width: 100%;
        padding: 12px;
        border-radius: 10px;
        border: 2px solid rgba(255,255,255,0.1);
        background: rgba(255,255,255,0.05);
        color: white;
        font-family: 'Montserrat', sans-serif;
        font-size: 1em;
        margin-bottom: 5px;
    }
    
    body.modo-dia .input-emoji, 
    body.modo-dia .input-cor,
    body.modo-dia .input-som,
    body.modo-dia .input-cor-grande {
        background: white;
        color: #333;
        border-color: rgba(0,0,0,0.1);
    }
    
    .seletor-cor-container {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 10px;
    }
    
    .preview-cor {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        border: 2px solid rgba(255,255,255,0.2);
    }
    
    .paleta-cores, .paleta-grande {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
        margin-top: 10px;
    }
    
    .cor-rapida, .cor-rapida-grande {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 6px;
        cursor: pointer;
        border: 2px solid transparent;
        transition: transform 0.2s;
    }
    
    .cor-rapida:hover, .cor-rapida-grande:hover {
        transform: scale(1.1);
    }
    
    .modal-botoes {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
    }
    
    .btn-modal {
        padding: 12px 20px;
        border: none;
        border-radius: 10px;
        font-family: 'Montserrat', sans-serif;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.9em;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex: 1;
        min-width: 120px;
    }
    
    .btn-salvar {
        background: linear-gradient(135deg, #00d4ff, #0077cc);
        color: white;
    }
    
    .btn-reset, .btn-reset-cores {
        background: rgba(255,255,255,0.1);
        color: white;
    }
    
    .btn-testar, .btn-aleatorias {
        background: linear-gradient(135deg, #f093fb, #f5576c);
        color: white;
    }
    
    .btn-cancelar {
        background: rgba(255,107,107,0.2);
        color: #ff6b6b;
    }
    
    .btn-aplicar-todas {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
    }
    
    @media (max-width: 768px) {
        .modal-container {
            padding: 20px;
            margin: 10px;
            max-height: 80vh;
        }
        
        .modal-botoes {
            flex-direction: column;
        }
        
        .btn-modal {
            width: 100%;
        }
        
        .paleta-cores, .paleta-grande {
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
        }
    }
    
    @media (max-width: 480px) {
        .modal-header h3 {
            font-size: 1.1em;
        }
        
        .grupo-form label {
            font-size: 0.9em;
        }
        
        .input-emoji, .input-cor, .input-som, .input-cor-grande {
            padding: 10px;
            font-size: 0.9em;
        }
        
        .paleta-cores, .paleta-grande {
            grid-template-columns: repeat(3, 1fr);
        }
    }
`;
document.head.appendChild(estiloDinamico);