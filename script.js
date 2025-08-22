// Painel DPO Atleta — Alpine.js component com drag/resize + export PNG
document.addEventListener('alpine:init', () => {
  Alpine.data('athleteDashboard', () => ({
    // ======= Estado =======
    athleteName: 'Atleta',
    raceHistory: [],
    summary: { totalPoints: 0, totalRaces: 0, record: { timeSec: null, timeLabel: '--:--', raceLabel: '' } },
    photoSrc: null,
    logoPosition: 'top-right',

    // Posição e tamanho do bloco de dados (na prévia, em px)
    blockX: 12,
    blockY: 12,
    blockW: 200,
    blockH: 120,

    // refs runtime
    _dragging: false,
    _resizing: false,
    _dragOffsetX: 0,
    _dragOffsetY: 0,
    _startW: 0,
    _startH: 0,
    _startX: 0,
    _startY: 0,

    // imagem source dimensions
    _imgEl: null,
    _imgNaturalW: 0,
    _imgNaturalH: 0,

    chart: null,

    get lastRaceData(){
      if (!this.raceHistory.length) return { race:'', dateStr:'', timeLabel:'', points:0 };
      return this.raceHistory[this.raceHistory.length - 1];
    },

    get logoGhostStyle(){
      // Calcula a posição da “ghost” da logo para indicar o canto
      const preview = this.$refs.preview;
      if (!preview) return {};
      const pad = 12;
      // largura base da ghost: 24% da largura da prévia
      const w = preview.clientWidth * 0.24;
      const pos = { left: 'unset', right: 'unset', top: 'unset', bottom: 'unset' };
      if (this.logoPosition.includes('left'))  pos.left  = pad + 'px'; else pos.right = pad + 'px';
      if (this.logoPosition.includes('top'))   pos.top   = pad + 'px'; else pos.bottom= pad + 'px';
      return { width: w + 'px', ...pos };
    },

    // ======= Inicialização =======
    init(){
      // Mock de 4 corridas (substituir por fetch real se necessário)
      const resultados = [
        { dateStr:'2025-03-02', race:'COC (5 km)', timeLabel:'00:23:44', posOverall: 112, posCategory: 18, points: 10 },
        { dateStr:'2025-04-20', race:'Rei e Rainha (5 km)', timeLabel:'00:22:58', posOverall: 97,  posCategory: 14, points: 12 },
        { dateStr:'2025-06-09', race:'Franciosi (5 km)',    timeLabel:'00:22:31', posOverall: 89,  posCategory: 12, points: 15 },
        { dateStr:'2025-08-10', race:'Com Maria (5 km)',    timeLabel:'00:21:59', posOverall: 76,  posCategory: 9,  points: 18 },
      ];
      // Ordena por data ascendente
      this.raceHistory = [...resultados].sort((a,b) => a.dateStr.localeCompare(b.dateStr));
      this.athleteName = 'Calil';

      // KPIs
      this.summary.totalRaces = this.raceHistory.length;
      this.summary.totalPoints = this.raceHistory.reduce((acc, r) => acc + (Number(r.points)||0), 0);
      // recorde = menor tempo em segundos
      const toSec = (t) => {
        const [hh, mm, ss] = t.split(':').map(Number);
        return (hh*3600 + mm*60 + ss);
      };
      const withSec = this.raceHistory.map(r => ({...r, timeSec: toSec(r.timeLabel)}));
      const best = withSec.reduce((min, r) => r.timeSec < min.timeSec ? r : min, withSec[0]);
      this.summary.record = { timeSec: best.timeSec, timeLabel: best.timeLabel, raceLabel: best.race };

      // Dimensões iniciais do bloco relativas à prévia
      this.$nextTick(() => {
        const pv = this.$refs.preview;
        if (pv){
          this.blockW = Math.round(pv.clientWidth * 0.55);
          this.blockH = Math.round(pv.clientHeight * 0.22);
          this.blockX = Math.round(pv.clientWidth * 0.06);
          this.blockY = Math.round(pv.clientHeight * 0.06);
        }
      });

      // Chart
      this.setupChart(withSec);
    },

    setupChart(series){
      const ctx = document.getElementById('evolutionChart').getContext('2d');
      const labels = series.map(r => r.dateStr);
      const data = series.map(r => r.timeSec);
      // Converte para "min:seg" no tooltip
      const fmt = (sec) => {
        const m = Math.floor(sec/60), s = sec%60;
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      };
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Tempo (s)',
            data,
            tension: 0.3,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `Tempo: ${fmt(ctx.parsed.y)}`
              }
            }
          },
          scales: {
            y: {
              ticks: {
                callback: (v) => fmt(v)
              }
            }
          }
        }
      });
    },

    // ======= Upload da foto =======
    handleFileUpload(e){
      const file = e.target.files?.[0];
      if (!file) return;
      const fr = new FileReader();
      fr.onload = () => {
        this.photoSrc = fr.result;
        this.$nextTick(() => {
          // guarda dimensões naturais
          const img = this.$root.querySelector('.preview__img');
          this._imgEl = img;
          if (img && img.naturalWidth){
            this._imgNaturalW = img.naturalWidth;
            this._imgNaturalH = img.naturalHeight;
          } else {
            // fallback: cria Image para garantir natural sizes
            const im = new Image();
            im.onload = () => {
              this._imgNaturalW = im.naturalWidth;
              this._imgNaturalH = im.naturalHeight;
            };
            im.src = this.photoSrc;
          }
        });
      };
      fr.readAsDataURL(file);
    },

    // ======= Drag do bloco =======
    startDrag(ev){
      ev.preventDefault();
      this._dragging = true;
      const rect = this.$refs.dataBlock.getBoundingClientRect();
      this._dragOffsetX = ev.clientX - rect.left;
      this._dragOffsetY = ev.clientY - rect.top;
      const move = (e) => this.onDrag(e);
      const up = () => this.stopDrag(move, up);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up, { once:true });
    },
    onDrag(e){
      if (!this._dragging) return;
      const pv = this.$refs.preview.getBoundingClientRect();
      let nx = e.clientX - pv.left - this._dragOffsetX;
      let ny = e.clientY - pv.top  - this._dragOffsetY;
      // limites
      nx = Math.max(0, Math.min(nx, pv.width - this.blockW));
      ny = Math.max(0, Math.min(ny, pv.height - this.blockH));
      this.blockX = Math.round(nx);
      this.blockY = Math.round(ny);
    },
    stopDrag(move, up){
      this._dragging = false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    },

    // ======= Resize do bloco =======
    startResize(ev){
      ev.preventDefault();
      this._resizing = true;
      this._startW = this.blockW;
      this._startH = this.blockH;
      this._startX = ev.clientX;
      this._startY = ev.clientY;
      const move = (e) => this.onResize(e);
      const up = () => this.stopResize(move, up);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up, { once:true });
    },
    onResize(e){
      if (!this._resizing) return;
      const pv = this.$refs.preview.getBoundingClientRect();
      let w = this._startW + (e.clientX - this._startX);
      let h = this._startH + (e.clientY - this._startY);
      const minW = Math.max(140, pv.width * 0.25);
      const minH = Math.max(90,  pv.height * 0.12);
      w = Math.max(minW, Math.min(w, pv.width - this.blockX));
      h = Math.max(minH, Math.min(h, pv.height - this.blockY));
      this.blockW = Math.round(w);
      this.blockH = Math.round(h);
    },
    stopResize(move, up){
      this._resizing = false;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    },

    resetBlock(){
      const pv = this.$refs.preview;
      if (!pv) return;
      this.blockW = Math.round(pv.clientWidth * 0.55);
      this.blockH = Math.round(pv.clientHeight * 0.22);
      this.blockX = Math.round(pv.clientWidth * 0.06);
      this.blockY = Math.round(pv.clientHeight * 0.06);
    },

    // ======= Export =======
    async exportImage(){
      if (!this.photoSrc){
        alert('Envie uma foto primeiro.');
        return;
      }
      // Carrega imagem original
      const img = await this.loadImage(this.photoSrc);
      const srcW = img.naturalWidth, srcH = img.naturalHeight;

      // Canvas base na resolução da foto
      const canvas = document.createElement('canvas');
      canvas.width = srcW;
      canvas.height = srcH;
      const ctx = canvas.getContext('2d');

      // Desenha a foto
      ctx.drawImage(img, 0, 0, srcW, srcH);

      // Calcula escala: preview px -> original px
      const pv = this.$refs.preview.getBoundingClientRect();
      const scaleX = srcW / pv.width;
      const scaleY = srcH / pv.height;

      // Desenha bloco de dados
      const bx = Math.round(this.blockX * scaleX);
      const by = Math.round(this.blockY * scaleY);
      const bw = Math.round(this.blockW * scaleX);
      const bh = Math.round(this.blockH * scaleY);

      // fundo semi-transparente
      ctx.fillStyle = 'rgba(15,18,24,0.72)';
      ctx.fillRect(bx, by, bw, bh);

      // borda
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = Math.max(2, Math.round(Math.min(bw, bh) * 0.006));
      ctx.strokeRect(bx, by, bw, bh);

      // textos
      const pad = Math.round(Math.min(bw, bh) * 0.12);
      ctx.fillStyle = '#e9f1fb';
      ctx.font = `${Math.round(bh*0.18)}px Inter, Arial, sans-serif`;
      ctx.fillText(this.lastRaceData.race, bx + pad, by + pad + Math.round(bh*0.18));
      ctx.font = `${Math.round(bh*0.15)}px Inter, Arial, sans-serif`;
      let line = by + pad + Math.round(bh*0.18) + Math.round(bh*0.16) + 6;
      ctx.fillStyle = '#c9d2df';
      ctx.fillText(`Data: ${this.lastRaceData.dateStr}`, bx + pad, line);
      line += Math.round(bh*0.16);
      ctx.fillText(`Tempo: ${this.lastRaceData.timeLabel}`, bx + pad, line);
      line += Math.round(bh*0.16);
      ctx.fillText(`Pontos: ${this.lastRaceData.points}`, bx + pad, line);

      // Desenha logo num dos cantos
      const logo = await this.loadImage('logo.png');
      // largura relativa: 24% da largura da imagem final
      const lw = Math.round(srcW * 0.24);
      const lh = Math.round(logo.naturalHeight * (lw / logo.naturalWidth));
      const m = Math.round(Math.min(srcW, srcH) * 0.03);
      let lx = 0, ly = 0;
      const pos = this.logoPosition;
      if (pos.includes('left')) lx = m; else lx = srcW - lw - m;
      if (pos.includes('top'))  ly = m; else ly = srcH - lh - m;
      ctx.drawImage(logo, lx, ly, lw, lh);

      // baixa
      const a = document.createElement('a');
      a.download = `conquista_${this.athleteName.replace(/\s+/g,'_').toLowerCase()}.png`;
      a.href = canvas.toDataURL('image/png');
      document.body.appendChild(a);
      a.click();
      a.remove();
    },

    loadImage(src){
      return new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => rej(new Error('Falha ao carregar imagem: ' + src));
        im.src = src;
      });
    },
  }));
});
