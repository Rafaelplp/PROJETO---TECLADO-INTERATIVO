// contadorVisitas.js - Sistema otimizado
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Elementos
        const contadorOnline = document.getElementById('contador-online');
        const contadorTotal = document.getElementById('contador-total');
        const ultimoAcesso = document.getElementById('ultimo-acesso');
        
        // Inicializar ou recuperar valores
        let total = parseInt(localStorage.getItem('visitasTotal')) || 0;
        let online = parseInt(localStorage.getItem('visitasOnline')) || 0;
        let ultimo = localStorage.getItem('ultimoAcesso');
        
        // Incrementar visitas
        total++;
        online++;
        
        // Salvar
        localStorage.setItem('visitasTotal', total.toString());
        localStorage.setItem('visitasOnline', online.toString());
        
        // Atualizar data/hora
        const agora = new Date();
        const formatoData = agora.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
        const formatoHora = agora.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const dataFormatada = `${formatoData} ${formatoHora}`;
        
        localStorage.setItem('ultimoAcesso', dataFormatada);
        
        // Atualizar elementos
        if (contadorTotal) contadorTotal.textContent = total.toLocaleString();
        if (contadorOnline) contadorOnline.textContent = online.toLocaleString();
        if (ultimoAcesso) ultimoAcesso.textContent = dataFormatada;
        
        // Simular usuários online (variar entre +-1)
        setInterval(() => {
            try {
                const onlineAtual = parseInt(localStorage.getItem('visitasOnline')) || online;
                const variacao = Math.random() > 0.5 ? 1 : -1;
                const novoOnline = Math.max(1, onlineAtual + variacao);
                
                localStorage.setItem('visitasOnline', novoOnline.toString());
                if (contadorOnline) contadorOnline.textContent = novoOnline.toLocaleString();
            } catch (e) {
                // Ignorar erros no intervalo
            }
        }, 30000);
        
    } catch (error) {
        console.log('Contador de visitas: usando valores padrão');
        // Valores padrão em caso de erro
        const elementos = ['contador-online', 'contador-total', 'ultimo-acesso'];
        elementos.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = id.includes('online') ? '1' : 
                               id.includes('total') ? '1' : 'Agora';
        });
    }
});