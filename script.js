document.addEventListener('alpine:init', () => {
    Alpine.data('athleteDashboard', function () {
      return {
        // --- DADOS ---
        athleteName: "José da Silva",
        photoSrc: '',
        logoPosition: 'top-right',
        lastRaceData: {
            nome: "Desafio da Serra 7km", distancia: "7.02 km", tempo: "00:35:20",
            pace: "5:02 /km", elevacao: "35 metros"
        },
        raceHistory: [
            { data: "2025-02-15", prova: "Corrida de Verão 5km", tempo: "00:24:10", posGeral: 120, posCat: 25, pontos: 130 },
            { data: "2025-05-20", prova: "Circuito das Cidades 10km", tempo: "00:50:35", posGeral: 180, posCat: 40, pontos: 100 },
            { data: "2025-08-10", prova: "Night Run 5km", tempo: "00:23:45", posGeral: 95, posCat: 18, pontos: 145 },
            { data: "2025-11-05", prova: "Desafio da Serra 7km", tempo: "00:35:20", posGeral: 80, posCat: 15, pontos: 160 }
        ],
        
        // --- ESTADO DA INTERFACE ---
        dataBlock: { x: 20, y: 150, width: 250, height: 180 },
        dragging: null,
        resizing: null,
        
        // --- DADOS COMPUTADOS ---
        get summary() {
            const timeToSeconds = (timeStr) => {
                if (!timeStr) return Infinity; const parts = timeStr.split(':');
                if (parts.length !== 3) return Infinity;
                return (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
            };
            const resultados = this.raceHistory;
            if (resultados.length === 0) return { totalPoints: 0, record: { tempo: '-', prova: '-' }, totalRaces: 0 };
            const record = resultados.reduce((best, current) => (timeToSeconds(current.tempo) < timeToSeconds(best.tempo) ? current : best));
            return {
                totalPoints: resultados.reduce((sum, r) => sum + r.pontos, 0),
                record: record,
                totalRaces: resultados.length,
            };
        },

        // --- MÉTODOS ---
        init() {
            this.initChart();
            const moveHandler = (e) => { this.dragMove(e); this.resizeMove(e); };
            const endHandler = () => { this.dragEnd(); this.resizeEnd(); };
            
            window.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', endHandler);
            window.addEventListener('touchmove', moveHandler, { passive: false });
            window.addEventListener('touchend', endHandler);
        },
        
        handleFileUpload(event) {
            const file = event.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => { this.photoSrc = e.target.result; };
            reader.readAsDataURL(file);
        },
        
        dragStart(event) {
            if (event.target === this.$refs.resizeHandle) return;
            this.dragging = {
                startX: (event.touches ? event.touches[0].clientX : event.clientX) - this.dataBlock.x,
                startY: (event.touches ? event.touches[0].clientY : event.clientY) - this.dataBlock.y,
            };
        },
        dragMove(event) {
            if (this.dragging) {
                event.preventDefault();
                this.dataBlock.x = (event.touches ? event.touches[0].clientX : event.clientX) - this.dragging.startX;
                this.dataBlock.y = (event.touches ? event.touches[0].clientY : event.clientY) - this.dragging.startY;
            }
        },
        dragEnd() { this.dragging = null; },
        
        resizeStart(event) {
            event.stopPropagation();
            this.resizing = {
                startX: (event.touches ? event.touches[0].clientX : event.clientX),
                startY: (event.touches ? event.touches[0].clientY : event.clientY),
                initialW: this.dataBlock.width, initialH: this.dataBlock.height
            };
        },
        resizeMove(event) {
            if (this.resizing) {
                event.preventDefault();
                this.dataBlock.width = this.resizing.initialW + ((event.touches ? event.touches[0].clientX : event.clientX) - this.resizing.startX);
                this.dataBlock.height = this.resizing.initialH + ((event.touches ? event.touches[0].clientY : event.clientY) - this.resizing.startY);
            }
        },
        resizeEnd() { this.resizing = null; },

        downloadImage() {
            alert('A lógica de download com canvas será implementada na próxima etapa.');
        },

        initChart() {
            const canvasElement = this.$refs.chartCanvas;
            if(!canvasElement) return;
            const timeToSeconds = (timeStr) => {
                const parts = timeStr.split(':'); if (parts.length !== 3) return 0;
                return (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
            };
            const chronologicalResults = [...this.raceHistory].reverse();
            new Chart(canvasElement, {
                type: 'line', data: {
                    labels: chronologicalResults.map(r => new Date(r.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })),
                    datasets: [{
                        label: 'Tempo (min)', data: chronologicalResults.map(r => (timeToSeconds(r.tempo) / 60).toFixed(2)),
                        fill: true, backgroundColor: 'rgba(29, 185, 84, 0.2)', borderColor: 'rgba(29, 185, 84, 1)',
                        tension: 0.3, pointBackgroundColor: '#fff',
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }
      };
    });
});