// contadorVisitas.js - Versão Simplificada
class ContadorVisitas {
    constructor() {
        this.contadorTotal = parseInt(localStorage.getItem('teclado_total_acessos')) || 0;
        this.contadorOnline = 1; // Sempre mostra 1 online
        this.ultimoAcesso = new Date();
        this.inicializar();
    }

    inicializar() {
        // Incrementar contador total
        this.contadorTotal++;
        localStorage.setItem('teclado_total_acessos', this.contadorTotal.toString());
        
        // Atualizar último acesso
        localStorage.setItem('teclado_ultimo_acesso', this.ultimoAcesso.toISOString());
        
        // Atualizar display
        this.atualizarDisplay();
        
        // Atualizar periodicamente
        setInterval(() => this.atualizarDisplay(), 60000);
    }

    atualizarDisplay() {
        // Atualizar contador online (fixo em 1 para simplicidade)
        const onlineEl = document.getElementById('contador-online');
        if (onlineEl) onlineEl.textContent = this.contadorOnline;
        
        // Atualizar contador total
        const totalEl = document.getElementById('contador-total');
        if (totalEl) totalEl.textContent = this.contadorTotal.toLocaleString('pt-BR');
        
        // Atualizar último acesso
        const ultimoEl = document.getElementById('ultimo-acesso');
        if (ultimoEl) {
            ultimoEl.textContent = this.formatarTempo(this.ultimoAcesso);
        }
    }

    formatarTempo(data) {
        const agora = new Date();
        const diferenca = agora - data;
        const minutos = Math.floor(diferenca / 60000);
        
        if (minutos < 1) return 'Agora';
        if (minutos < 60) return `${minutos}m`;
        if (minutos < 1440) return `${Math.floor(minutos / 60)}h`;
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.contadorVisitas = new ContadorVisitas();
});