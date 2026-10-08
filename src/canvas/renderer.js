/**
 * Renderizador Gráfico Canvas 2D da Torre de Hanói (CanvasRenderer)
 * Render loop fluido a 60 FPS, geometria paramétrica responsiva e suporte a telas HiDPI/Retina.
 */
export class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.width = 0;
    this.height = 0;

    // Cache de posições geométricas
    this.pegX = [0, 0, 0];
    this.pegY = 0;
    this.pegWidth = 10;
    this.pegHeight = 0;
    this.baseX = 0;
    this.baseY = 0;
    this.baseWidth = 0;
    this.resize();

    // Observador responsivo: atualiza a geometria assim que o container alterar de tamanho
    if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
      this._resizeObserver = new ResizeObserver(() => {
        this.resize();
      });
      this._resizeObserver.observe(this.canvas.parentElement);
    }
  }

  /**
   * Recalcula dimensões físicas para garantir renderização nítida (HiDPI).
   */
  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Atualização da geometria paramétrica
    const isNarrow = this.width < 540;
    const baseMargin = isNarrow
      ? Math.max(10, this.width * 0.03)
      : Math.max(20, this.width * 0.05);

    this.baseX = baseMargin;
    this.baseWidth = this.width - baseMargin * 2;
    this.baseHeight = Math.max(14, this.height * 0.05);
    this.baseY = this.height - (isNarrow ? Math.max(16, this.height * 0.06) : Math.max(22, this.height * 0.07));

    this.pegHeight = Math.min(this.height * (isNarrow ? 0.72 : 0.70), 350);
    this.pegY = this.baseY - this.pegHeight;
    this.pegWidth = Math.max(6, Math.min(14, this.width * (isNarrow ? 0.018 : 0.015)));

    this.pegX = [
      this.baseX + this.baseWidth * 0.2,
      this.baseX + this.baseWidth * 0.5,
      this.baseX + this.baseWidth * 0.8
    ];
  }

  /**
   * Calcula a largura de um disco baseado em seu tamanho e total de discos.
   * Garante largura mínima confortável mesmo para o disco 1.
   */
  getDiskWidth(size, totalDisks) {
    const isNarrow = this.width < 540;
    const minWidth = Math.max(isNarrow ? 44 : 54, this.width * 0.08);
    const maxWidth = this.baseWidth * (isNarrow ? 0.28 : 0.27);
    const progress = (size - 1) / Math.max(1, totalDisks - 1);
    return minWidth + (maxWidth - minWidth) * progress;
  }

  /**
   * Calcula a altura de cada disco empilhado ("discos gordinhos").
   * Escala suavemente de 22px (com 10 discos) até 42px (com poucos discos).
   */
  getDiskHeight(totalDisks) {
    const availableHeight = this.pegHeight * 0.82;
    const calculatedHeight = availableHeight / totalDisks;
    return Math.max(20, Math.min(42, calculatedHeight));
  }

  /**
   * Desenha um frame completo do jogo.
   * @param {Object} gameState - Snapshot do estado atual do jogo.
   * @param {Object} visualState - Estado gráfico (seleção, arrasto, dica, animação).
   * @param {import('./particles.js').ParticleSystem} [particleSystem]
   * @param {number} [timestamp]
   */
  render(gameState, visualState = {}, particleSystem = null, timestamp = performance.now()) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Desenha os pinos e a base
    this._renderBase(ctx);
    this._renderPegs(ctx, gameState, visualState);

    // 2. Desenha o indicador visual de dica ativa
    if (visualState.activeHint) {
      this._renderHintArrow(ctx, visualState.activeHint, timestamp);
    }

    // 3. Desenha os discos estáticos empilhados
    this._renderDisks(ctx, gameState, visualState);

    // 4. Desenha o disco em modo de arrasto pelo jogador
    if (visualState.draggedDisk) {
      this._renderDraggedDisk(ctx, visualState.draggedDisk, gameState.diskCount);
    }

    // 5. Desenha animação transitória de encaixe suave se houver
    if (visualState.animatingDisk) {
      this._renderAnimatingDisk(ctx, visualState.animatingDisk, gameState.diskCount);
    }

    // 6. Desenha confetes de celebração se houver
    if (particleSystem && particleSystem.isActive()) {
      particleSystem.render(ctx);
    }
  }

  _renderBase(ctx) {
    ctx.save();
    const grad = ctx.createLinearGradient(0, this.baseY, 0, this.baseY + this.baseHeight);
    grad.addColorStop(0, '#334155');
    grad.addColorStop(1, '#0f172a');

    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    ctx.beginPath();
    ctx.roundRect(this.baseX, this.baseY, this.baseWidth, this.baseHeight, 8);
    ctx.fill();
    ctx.restore();
  }

  _renderPegs(ctx, gameState, visualState) {
    const targetPegId = gameState.targetPegId;
    const selectedPegId = visualState.selectedPegId;
    const shakeState = visualState.shakeState;

    this.pegX.forEach((x, idx) => {
      ctx.save();

      // Aplica efeito de tremor caso o pino esteja em erro
      let offsetX = 0;
      if (shakeState && shakeState.pegId === idx) {
        offsetX = Math.sin(shakeState.progress * Math.PI * 6) * 8 * (1 - shakeState.progress);
      }

      const pegCenterX = x + offsetX;
      const isTarget = idx === targetPegId;
      const isSelected = idx === selectedPegId;

      // Glow especial para o pino de destino ou selecionado
      if (isSelected) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 16;
      } else if (isTarget) {
        ctx.shadowColor = 'rgba(56, 189, 248, 0.35)';
        ctx.shadowBlur = 10;
      }

      // Haste vertical
      ctx.fillStyle = isSelected ? '#7dd3fc' : (isTarget ? '#38bdf8' : '#64748b');
      ctx.beginPath();
      ctx.roundRect(pegCenterX - this.pegWidth / 2, this.pegY, this.pegWidth, this.pegHeight, 4);
      ctx.fill();
      ctx.restore();
    });
  }

  _renderDisks(ctx, gameState, visualState) {
    const diskHeight = this.getDiskHeight(gameState.diskCount);
    const selectedPegId = visualState.selectedPegId;
    const draggedDisk = visualState.draggedDisk;
    const animatingDisk = visualState.animatingDisk;

    gameState.pegs.forEach((peg, pegIndex) => {
      const baseXPos = this.pegX[pegIndex];
      const diskList = peg.disks;

      diskList.forEach((disk, diskIndex) => {
        // Se este disco for o que está sendo arrastado ou animado, pula o desenho na haste
        if (draggedDisk && draggedDisk.pegId === pegIndex && diskIndex === diskList.length - 1) {
          return;
        }
        if (animatingDisk && animatingDisk.pegId === pegIndex && diskIndex === diskList.length - 1) {
          return;
        }

        const isTopDisk = diskIndex === diskList.length - 1;
        const isSelected = selectedPegId === pegIndex && isTopDisk;

        const diskWidth = this.getDiskWidth(disk.size, gameState.diskCount);
        // Se selecionado, levita ligeiramente para feedback visual
        const elevation = isSelected ? 16 : 0;
        const diskY = this.baseY - (diskIndex + 1) * diskHeight - elevation;

        this._drawSingleDisk(ctx, baseXPos, diskY, diskWidth, diskHeight, disk, isSelected);
      });
    });
  }

  _drawSingleDisk(ctx, centerX, y, width, height, disk, isElevated = false) {
    ctx.save();

    if (isElevated) {
      ctx.shadowColor = 'rgba(56, 189, 248, 0.65)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = -5;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
    }

    const borderRadius = Math.max(6, Math.min(10, height * 0.24));

    // Corpo do disco com gradiente tridimensional vívido
    const grad = ctx.createLinearGradient(0, y, 0, y + height);
    grad.addColorStop(0, disk.color || '#38bdf8');
    grad.addColorStop(1, '#0f172a');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(centerX - width / 2, y, width, height - 2, borderRadius);
    ctx.fill();

    // Borda superior reflexiva suave
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(centerX - width / 2 + 1, y + 1, width - 2, (height - 2) * 0.35, Math.max(4, borderRadius - 2));
    ctx.stroke();

    // Número do disco em destaque
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#060b14';
    ctx.font = `bold ${Math.max(12, Math.min(17, height * 0.45))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(disk.size, centerX, y + (height - 2) / 2);

    ctx.restore();
  }

  _renderDraggedDisk(ctx, dragged, totalDisks) {
    const diskWidth = this.getDiskWidth(dragged.size, totalDisks);
    const diskHeight = this.getDiskHeight(totalDisks);
    this._drawSingleDisk(ctx, dragged.x, dragged.y - diskHeight / 2, diskWidth, diskHeight, dragged, true);
  }

  _renderAnimatingDisk(ctx, anim, totalDisks) {
    const diskWidth = this.getDiskWidth(anim.size, totalDisks);
    const diskHeight = this.getDiskHeight(totalDisks);
    this._drawSingleDisk(ctx, anim.x, anim.y, diskWidth, diskHeight, anim, true);
  }

  /**
   * Renderiza a seta de dica com animação dinâmica e direcional no sentido da origem ao destino.
   * Utiliza algoritmo de De Casteljau para traçado da sub-curva de Bézier e alinhamento tangencial da seta.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} hint - Dados da dica ({ fromPegId, toPegId, startTime })
   * @param {number} timestamp - Timestamp em ms do render loop
   */
  _renderHintArrow(ctx, hint, timestamp = performance.now()) {
    const fromX = this.pegX[hint.fromPegId];
    const toX = this.pegX[hint.toPegId];
    const pegY = this.pegY;

    // Altura proporcional da curva garantindo passagem acima das hastes intermediárias
    const span = Math.abs(hint.fromPegId - hint.toPegId);
    const arcClearance = span > 1 ? 65 : 46;
    const peakY = Math.max(12, pegY - arcClearance);
    const midX = (fromX + toX) / 2;

    // Ciclo de repetição contínua da animação (1500ms por varredura)
    const startTime = hint.startTime || 0;
    const elapsed = Math.max(0, timestamp - startTime);
    const cycleDuration = 1500;
    const cycleTime = elapsed % cycleDuration;

    // Fase 1: Traçado dinâmico da origem até o destino (0 a 900ms)
    // Fase 2: Fixação no destino com impacto e pulso (900 a 1250ms)
    // Fase 3: Fade-out suave antes de reiniciar o fluxo (1250 a 1500ms)
    let t = 1;
    let alpha = 1;

    if (cycleTime < 900) {
      // Easing cúbico para avanço orgânico e desaceleração suave ao se aproximar do destino
      const p = cycleTime / 900;
      t = Math.max(0.02, 1 - Math.pow(1 - p, 3));
    } else if (cycleTime > 1250) {
      alpha = Math.max(0, 1 - (cycleTime - 1250) / 250);
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    // Pontos de controle da parábola completa: P0 (origem), P1 (controle/ápice), P2 (destino)
    const p0 = { x: fromX, y: pegY };
    const p1 = { x: midX, y: peakY };
    const p2 = { x: toX, y: pegY };

    // Sub-curva quadrática de Bézier de 0 até t via De Casteljau
    const q0 = p0;
    const q1 = {
      x: (1 - t) * p0.x + t * p1.x,
      y: (1 - t) * p0.y + t * p1.y
    };
    const q2 = {
      x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
      y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y
    };

    // 1. Marcador luminoso na origem (ponto de partida do disco)
    const originPulse = 1 + Math.sin(elapsed * 0.008) * 0.15;
    ctx.beginPath();
    ctx.arc(fromX, pegY, 5 * originPulse, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.fill();

    // 2. Traço dinâmico da trajetória com fluxo contínuo de traços pontilhados
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.setLineDash([8, 5]);
    ctx.lineDashOffset = -(elapsed * 0.035);
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(q0.x, q0.y);
    ctx.quadraticCurveTo(q1.x, q1.y, q2.x, q2.y);
    ctx.stroke();

    // 3. Cálculo do vetor tangente exato no ponto de avanço q2
    const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
    const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    const angle = Math.atan2(dy, dx);

    // 4. Ponta de flecha moderna alinhada dinamicamente à tangente da curva
    ctx.setLineDash([]);
    const arrowLength = Math.max(13, Math.min(18, this.width * 0.035));
    const arrowWidth = arrowLength * 0.72;
    const arrowScale = Math.min(1, t / 0.15);

    ctx.save();
    ctx.translate(q2.x, q2.y);
    ctx.rotate(angle);
    ctx.scale(arrowScale, arrowScale);

    ctx.beginPath();
    ctx.moveTo(0, 0); // Ponta da flecha na coordenada q2
    ctx.lineTo(-arrowLength, -arrowWidth / 2);
    ctx.lineTo(-arrowLength * 0.65, 0); // Recorte aerodinâmico interno
    ctx.lineTo(-arrowLength, arrowWidth / 2);
    ctx.closePath();

    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();

    // 5. Efeito de pulso e impacto ao atingir o pino de destino
    if (cycleTime >= 900 && cycleTime < 1300) {
      const pulseProgress = (cycleTime - 900) / 400;
      ctx.beginPath();
      ctx.arc(toX, pegY, 6 + pulseProgress * 22, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(251, 191, 36, ${Math.max(0, 1 - pulseProgress)})`;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 8;
      ctx.stroke();
    }

    ctx.restore();
  }
}
