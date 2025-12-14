class ContadorVisitas {
    constructor() {
        this.contadorOnline = 0;
        this.contadorTotal = 0;
        this.ultimoAcesso = null;
        this.usuarioId = this.gerarUsuarioId();
        this.inicializar();
    }

    gerarUsuarioId() {
        let usuarioId = localStorage.getItem('teclado_usuario_id');
        if (!usuarioId) {
            usuarioId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('teclado_usuario_id', usuarioId);
        }
        return usuarioId;
    }

    async inicializar() {
        await this.registrarAcesso();
        this.atualizarDisplay();
        this.configurarEventos();
        this.iniciarAtualizacaoPeriodica();
    }

    async registrarAcesso() {
        try {
            // Incrementa contador local
            this.contadorTotal = parseInt(localStorage.getItem('teclado_total_acessos')) || 0;
            this.contadorTotal++;
            localStorage.setItem('teclado_total_acessos', this.contadorTotal.toString());
            
            // Salva último acesso
            this.ultimoAcesso = new Date();
            localStorage.setItem('teclado_ultimo_acesso', this.ultimoAcesso.toISOString());
            
            // Simulação de contador online (em um sistema real, isso seria feito no backend)
            this.contadorOnline = this.calcularUsuariosOnline();
            
            // Aqui você pode adicionar uma chamada para um backend real:
            // await fetch('/api/registrar-acesso', { method: 'POST', body: JSON.stringify({ usuarioId: this.usuarioId }) });
            
        } catch (error) {
            console.error('Erro ao registrar acesso:', error);
            // Fallback para contagem local
            this.contadorOnline = 1;
        }
    }

    calcularUsuariosOnline() {
        // Simula usuários online baseado em acessos recentes
        let usuariosAtivos = JSON.parse(localStorage.getItem('teclado_usuarios_ativos') || '{}');
        const agora = Date.now();
        
        // Remove usuários inativos (última atividade > 5 minutos)
        for (const [id, timestamp] of Object.entries(usuariosAtivos)) {
            if (agora - timestamp > 5 * 60 * 1000) {
                delete usuariosAtivos[id];
            }
        }
        
        // Adiciona/atualiza usuário atual
        usuariosAtivos[this.usuarioId] = agora;
        localStorage.setItem('teclado_usuarios_ativos', JSON.stringify(usuariosAtivos));
        
        return Object.keys(usuariosAtivos).length;
    }

    atualizarDisplay() {
        const contadorOnlineElement = document.getElementById('contador-online');
        const contadorTotalElement = document.getElementById('contador-total');
        const ultimoAcessoElement = document.getElementById('ultimo-acesso');
        
        if (contadorOnlineElement) {
            contadorOnlineElement.textContent = this.contadorOnline;
        }
        
        if (contadorTotalElement) {
            contadorTotalElement.textContent = this.contadorTotal.toLocaleString('pt-BR');
        }
        
        if (ultimoAcessoElement && this.ultimoAcesso) {
            ultimoAcessoElement.textContent = this.formatarData(this.ultimoAcesso);
        }
    }

    formatarData(data) {
        const agora = new Date();
        const diferencaMs = agora - data;
        const diferencaMinutos = Math.floor(diferencaMs / (1000 * 60));
        
        if (diferencaMinutos < 1) {
            return 'Agora mesmo';
        } else if (diferencaMinutos < 60) {
            return `Há ${diferencaMinutos} minuto${diferencaMinutos !== 1 ? 's' : ''}`;
        } else if (diferencaMinutos < 1440) {
            const horas = Math.floor(diferencaMinutos / 60);
            return `Há ${horas} hora${horas !== 1 ? 's' : ''}`;
        } else {
            return data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    configurarEventos() {
        // Atualiza último acesso quando o usuário interage
        ['click', 'keydown', 'mousemove'].forEach(evento => {
            document.addEventListener(evento, () => {
                this.ultimoAcesso = new Date();
                localStorage.setItem('teclado_ultimo_acesso', this.ultimoAcesso.toISOString());
                this.atualizarDisplay();
            }, { passive: true });
        });

        // Atualiza contadores quando a página ganha foco
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.contadorOnline = this.calcularUsuariosOnline();
                this.atualizarDisplay();
            }
        });
    }

    iniciarAtualizacaoPeriodica() {
        // Atualiza contador online a cada minuto
        setInterval(() => {
            this.contadorOnline = this.calcularUsuariosOnline();
            this.atualizarDisplay();
        }, 60000);
        
        // Atualiza formato do tempo a cada 30 segundos
        setInterval(() => {
            this.atualizarDisplay();
        }, 30000);
    }

    resetarContadores() {
        if (confirm('Tem certeza que deseja resetar todos os contadores? Isso não pode ser desfeito.')) {
            localStorage.removeItem('teclado_total_acessos');
            localStorage.removeItem('teclado_usuarios_ativos');
            localStorage.removeItem('teclado_ultimo_acesso');
            
            this.contadorTotal = 0;
            this.contadorOnline = 1;
            this.ultimoAcesso = new Date();
            
            this.atualizarDisplay();
            alert('Contadores resetados com sucesso!');
        }
    }
}

// Inicializa o contador quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    window.contadorVisitas = new ContadorVisitas();

    // Exibir versão do app
function exibirVersaoApp() {
    const versao = '2.0.0'; // Atualize conforme novas versões
    const elementoVersao = document.getElementById('versao-app');
    
    if (elementoVersao) {
        elementoVersao.textContent = versao;
    }
    
    // Salvar no localStorage para referência
    localStorage.setItem('app_version', versao);
    
    // Log para debugging
    console.log(`🎹 Teclado Interativo v${versao}`);
}

// Chamar na inicialização
document.addEventListener('DOMContentLoaded', exibirVersaoApp);
    
    // Adiciona botão de reset (opcional)
    /*const rodape = document.querySelector('.rodape');
    if (rodape) {
        const botaoResetContadores = document.createElement('button');
        botaoResetContadores.textContent = '🔄 Resetar Contadores';
        botaoResetContadores.className = 'botao-reset-contadores';
        botaoResetContadores.style.cssText = `
            background: transparent;
            border: 1px solid rgba(255,255,255,0.3);
            color: #ff6b6b;
            padding: 5px 10px;
            border-radius: 15px;
            cursor: pointer;
            font-size: 0.8em;
            margin-left: 20px;
            transition: all 0.3s ease;
        `;
        botaoResetContadores.onclick = () => window.contadorVisitas.resetarContadores();
        botaoResetContadores.onmouseover = () => {
            botaoResetContadores.style.backgroundColor = 'rgba(255,107,107,0.1)';
        };
        botaoResetContadores.onmouseout = () => {
            botaoResetContadores.style.backgroundColor = 'transparent';
        };
        
        rodape.querySelector('.creditos').appendChild(botaoResetContadores);*/
    }
);