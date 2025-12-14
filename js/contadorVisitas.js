// contadorVisitas.js - Sistema de contagem simplificado
class ContadorVisitas {
    constructor() {
        this.contadorTotal = parseInt(localStorage.getItem('teclado_total_acessos')) || 0;
        this.ultimoAcesso = new Date();
        this.inicializar();
    }

    inicializar() {
        // Incrementar contador
        this.contadorTotal++;
        localStorage.setItem('teclado_total_acessos', this.contadorTotal.toString());
        
        // Salvar último acesso
        localStorage.setItem('teclado_ultimo_acesso', this.ultimoAcesso.toISOString());
        
        // Atualizar display
        this.atualizarDisplay();
        
        // Atualizar periodicamente
        setInterval(() => this.atualizarDisplay(), 60000);
    }

    atualizarDisplay() {
        // Online (simplificado - sempre 1)
        const onlineEl = document.getElementById('contador-online');
        if (onlineEl) onlineEl.textContent = '1';
        
        // Total
        const totalEl = document.getElementById('contador-total');
        if (totalEl) totalEl.textContent = this.contadorTotal;
        
        // Último acesso
        const ultimoEl = document.getElementById('ultimo-acesso');
        if (ultimoEl) {
            ultimoEl.textContent = this.formatarUltimoAcesso();
        }
    }

    formatarUltimoAcesso() {
        const agora = new Date();
        const diferenca = agora - this.ultimoAcesso;
        const minutos = Math.floor(diferenca / 60000);
        
        if (minutos < 1) return 'Agora';
        if (minutos < 60) return `${minutos}m`;
        if (minutos < 1440) return `${Math.floor(minutos / 60)}h`;
        return `${Math.floor(minutos / 1440)}d`;
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    new ContadorVisitas();
});