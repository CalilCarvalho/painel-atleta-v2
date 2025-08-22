// Dados de Exemplo para a última corrida (para o editor de imagem)
const lastRaceData = {
    nome: "Desafio da Serra 7km",
    distancia: "7.02 km",
    tempo: "00:35:20",
    pace: "5:02 /km",
    elevacao: "35 metros"
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Seleção de todos os elementos do HTML ---
    const photoUploadInput = document.getElementById('photo-upload');
    const backgroundPhoto = document.getElementById('background-photo');
    const dataBlock = document.getElementById('data-block');
    const previewContainer = document.getElementById('preview-container');
    const downloadBtn = document.getElementById('download-btn');
    const logoPositionButtons = document.querySelector('#photo-editor-sidebar .logo-position');
    const dataPositionButtons = document.querySelector('#photo-editor-sidebar .data-position');
    const welcomeMessage = document.getElementById('welcome-message');
    const cardPoints = document.getElementById('card-points');
    const cardRecord = document.getElementById('card-record');
    const cardRaces = document.getElementById('card-races');
    const evolutionChartCanvas = document.getElementById('evolutionChart').getContext('2d');
    const racesTbody = document.getElementById('races-tbody');
    
    // --- Dados Fictícios para o Painel ---
    const athleteName = "José da Silva"; 
    const mockResults = [
        { data: "2025-02-15", prova: "Corrida de Verão 5km", tempo: "00:24:10", posGeral: 120, posCat: 25, pontos: 130 },
        { data: "2025-05-20", prova: "Circuito das Cidades 10km - Etapa I", tempo: "00:50:35", posGeral: 180, posCat: 40, pontos: 100 },
        { data: "2025-08-10", prova: "Night Run 5km", tempo: "00:23:45", posGeral: 95, posCat: 18, pontos: 145 },
        { data: "2025-11-05", prova: "Desafio da Serra 7km", tempo: "00:35:20", posGeral: 80, posCat: 15, pontos: 160 }
    ];
    const resultados = mockResults.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    let logoPosition = 'top-right';

    // --- Funções Auxiliares ---
    function timeToSeconds(timeStr) {
        if (!timeStr || typeof timeStr !== 'string') return Infinity;
        const parts = timeStr.split(':');
        if (parts.length !== 3) return Infinity;
        return (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
    }
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return "00:00:00";
        return new Date(seconds * 1000).toISOString().slice(11, 19);
    }

    // --- Lógica do Editor de Foto ---
    function setupPhotoEditor() {
        document.getElementById('race-name').textContent = lastRaceData.nome;
        document.getElementById('stat-distance').textContent = lastRaceData.distancia;
        document.getElementById('stat-time').textContent = lastRaceData.tempo;
        document.getElementById('stat-pace').textContent = lastRaceData.pace;
        document.getElementById('stat-elevation').textContent = lastRaceData.elevacao;

        photoUploadInput.addEventListener('change', (event) => {
            if (event.target.files && event.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        if (img.width > img.height) {
                            alert("Atenção: Recomendamos o uso de fotos verticais para um melhor resultado.");
                        }
                        backgroundPhoto.src = e.target.result;
                        previewContainer.style.border = 'none';
                        dataBlock.style.visibility = 'visible';
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(event.target.files[0]);
            }
        });

        logoPositionButtons.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                logoPosition = e.target.dataset.position;
                logoPositionButtons.querySelector('.active')?.classList.remove('active');
                e.target.classList.add('active');
            }
        });

        dataPositionButtons.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const position = e.target.dataset.position;
                dataBlock.style.top = 'auto'; dataBlock.style.left = 'auto';
                dataBlock.style.bottom = 'auto'; dataBlock.style.right = 'auto';
                const margin = '15px';
                switch (position) {
                    case 'top-left': dataBlock.style.top = margin; dataBlock.style.left = margin; break;
                    case 'top-right': dataBlock.style.top = margin; dataBlock.style.right = margin; break;
                    case 'bottom-left': dataBlock.style.bottom = margin; dataBlock.style.left = margin; break;
                    case 'bottom-right': dataBlock.style.bottom = margin; dataBlock.style.right = margin; break;
                }
                dataPositionButtons.querySelector('.active')?.classList.remove('active');
                e.target.classList.add('active');
            }
        });

        let isDragging = false, offsetX, offsetY;
        dataBlock.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - dataBlock.getBoundingClientRect().left;
            offsetY = e.clientY - dataBlock.getBoundingClientRect().top;
        });
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                const containerRect = previewContainer.getBoundingClientRect();
                let newLeft = e.clientX - containerRect.left - offsetX;
                let newTop = e.clientY - containerRect.top - offsetY;
                if (newLeft < 0) newLeft = 0;
                if (newTop < 0) newTop = 0;
                if (newLeft + dataBlock.offsetWidth > containerRect.width) newLeft = containerRect.width - dataBlock.offsetWidth;
                if (newTop + dataBlock.offsetHeight > containerRect.height) newTop = containerRect.height - dataBlock.offsetHeight;
                dataBlock.style.left = `${newLeft}px`;
                dataBlock.style.top = `${newTop}px`;
                dataBlock.style.bottom = 'auto';
                dataBlock.style.right = 'auto';
            }
        });
        document.addEventListener('mouseup', () => { isDragging = false; });
        
        downloadBtn.addEventListener('click', () => {
            if (!backgroundPhoto.src || backgroundPhoto.src === window.location.href) {
                alert('Por favor, envie uma foto primeiro!');
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const userImg = new Image();
            userImg.crossOrigin = 'anonymous';
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';

            Promise.all([
                new Promise((resolve, reject) => { userImg.onload = resolve; userImg.onerror = reject; userImg.src = backgroundPhoto.src; }),
                new Promise((resolve, reject) => { logoImg.onload = resolve; logoImg.onerror = reject; logoImg.src = 'logo.png'; })
            ]).then(() => {
                canvas.width = userImg.naturalWidth;
                canvas.height = userImg.naturalHeight;
                ctx.drawImage(userImg, 0, 0);

                const scaleX = canvas.width / previewContainer.offsetWidth;
                
                drawDataBlockOnCanvas(ctx, canvas, scaleX);
                drawLogoOnCanvas(ctx, canvas, logoImg, scaleX);

                const link = document.createElement('a');
                link.download = 'minha-conquista.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            }).catch(err => {
                console.error("Erro ao carregar imagens:", err);
                alert("Não foi possível carregar a foto ou a logo. Verifique se o arquivo 'logo.png' está na mesma pasta e se a foto enviada é válida.");
            });
        });
    }

    function drawDataBlockOnCanvas(ctx, canvas, scale) {
        const blockRect = dataBlock.getBoundingClientRect();
        const containerRect = previewContainer.getBoundingClientRect();
        const blockX = (blockRect.left - containerRect.left) * scale;
        let blockY = (blockRect.top - containerRect.top) * scale; // Usamos 'let' para poder ajustar
        const blockWidth = blockRect.width * scale;
        const blockHeight = blockRect.height * scale;
        
        // **INÍCIO DA LÓGICA ANTI-CORTE**
        // Garante que o bloco não seja desenhado para fora da imagem na parte inferior
        if (blockY + blockHeight > canvas.height) {
            blockY = canvas.height - blockHeight - (15 * scale); // Recua da borda inferior
        }
        // Garante que o bloco não seja desenhado para fora na parte superior
        if (blockY < 0) {
            blockY = 15 * scale; // Afasta da borda superior
        }
        // **FIM DA LÓGICA ANTI-CORTE**

        // Desenha o fundo do bloco
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(blockX, blockY, blockWidth, blockHeight);
        
        // Configurações de texto
        ctx.fillStyle = 'white';
        const padding = 15 * scale;
        
        // Título da Prova
        ctx.font = `bold ${18 * scale}px Inter, sans-serif`;
        ctx.fillText(lastRaceData.nome, blockX + padding, blockY + padding + (18 * scale));

        // Linha divisória
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(blockX + padding, blockY + padding + (28 * scale));
        ctx.lineTo(blockX + blockWidth - padding, blockY + padding + (28 * scale));
        ctx.stroke();

        // Estatísticas
        const stats = [
            { icon: '🛣️', label: 'Distância', value: lastRaceData.distancia },
            { icon: '⏱️', label: 'Tempo', value: lastRaceData.tempo },
            { icon: '🏃', label: 'Pace', value: lastRaceData.pace },
            { icon: '⛰️', label: 'Elevação', value: lastRaceData.elevacao }
        ];
        
        let currentY = blockY + padding + (55 * scale);
        const iconSize = 20 * scale; // Tamanho do ícone
        const lineHeight = 30 * scale; // Espaçamento entre linhas

        stats.forEach(stat => {
            // Desenha o ícone (emoji)
            ctx.font = `${iconSize}px sans-serif`;
            ctx.fillText(stat.icon, blockX + padding, currentY);

            // Desenha o texto (label e valor)
            const textX = blockX + padding + (iconSize * 1.5);
            ctx.fillStyle = '#B3B3B3';
            ctx.font = `normal ${12 * scale}px Inter, sans-serif`;
            ctx.fillText(stat.label, textX, currentY - (iconSize / 4));
            
            ctx.fillStyle = 'white';
            ctx.font = `bold ${16 * scale}px Inter, sans-serif`;
            ctx.fillText(stat.value, textX, currentY + (iconSize / 2));

            currentY += lineHeight;
        });
    }

    function drawLogoOnCanvas(ctx, canvas, logoImg, scale) {
        if (!logoImg || !logoImg.complete || logoImg.naturalHeight === 0) return;
        
        const logoWidth = canvas.width * 0.4; // Logo com 40% da largura
        const logoHeight = logoImg.height * (logoWidth / logoImg.width);
        const margin = 20 * scale;

        // A logo agora é sempre fixa no canto superior direito
        let logoX = canvas.width - logoWidth - margin;
        let logoY = margin;
        
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
    }


    // --- Lógica do Painel Principal ---
    function populateDashboard() {
        welcomeMessage.textContent = `Olá, ${athleteName}!`;
        
        const totalPoints = resultados.reduce((sum, r) => sum + r.pontos, 0);
        const record = resultados.reduce((best, current) => (timeToSeconds(current.tempo) < timeToSeconds(best.tempo) ? current : best), resultados[0]);
        const totalRaces = resultados.length;
        const oldestRace = resultados[resultados.length - 1];

        cardPoints.innerHTML = `<div class="title">Pontos no Circuito</div><div class="value">${totalPoints}</div><div class="subtitle">Total Acumulado</div>`;
        cardRecord.innerHTML = `<div class="title">Recorde Pessoal</div><div class="value">${record.tempo}</div><div class="subtitle">Em "${record.prova}"</div>`;
        cardRaces.innerHTML = `<div class="title">Provas Concluídas</div><div class="value">${totalRaces}</div><div class="subtitle">Desde ${new Date(oldestRace.data).toLocaleDateString('pt-BR', {year: 'numeric', month: 'short', timeZone: 'UTC'})}</div>`;

        racesTbody.innerHTML = ''; 
        resultados.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(r.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                <td>${r.prova}</td>
                <td><strong>${r.tempo}</strong></td>
                <td>${r.posGeral}º</td>
                <td>${r.posCat}º</td>
                <td>${r.pontos}</td>
            `;
            racesTbody.appendChild(tr);
        });

        const chronologicalResults = [...resultados].reverse();
        new Chart(evolutionChartCanvas, {
            type: 'line',
            data: {
                labels: chronologicalResults.map(r => new Date(r.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })),
                datasets: [{
                    label: 'Tempo (em minutos)',
                    data: chronologicalResults.map(r => (timeToSeconds(r.tempo) / 60).toFixed(2)),
                    fill: true,
                    backgroundColor: 'rgba(29, 185, 84, 0.2)',
                    borderColor: 'rgba(29, 185, 84, 1)',
                    tension: 0.3,
                    pointBackgroundColor: '#fff',
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context) => 'Tempo: ' + formatTime(parseFloat(context.raw) * 60) } }
                },
                scales: { y: { ticks: { color: 'rgba(255, 255, 255, 0.7)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }, x: { ticks: { color: 'rgba(255, 255, 255, 0.7)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } } }
            }
        });
    }

    // --- Inicializa a Aplicação ---
    setupPhotoEditor();
    populateDashboard();
});