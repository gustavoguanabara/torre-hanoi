/**
 * Gerenciador Unificado de Entradas do Canvas (InputHandler)
 * Suporta Pointer Events modernos (Mouse, Touch, Stylus) combinando
 * arrastar e soltar (drag and drop) e seleção por dois toques.
 * Otimizado para telas sensíveis ao toque com elevação ergonômica e haptics.
 */
import { triggerHaptic } from '../ui/haptics.js';
import { soundManager } from '../ui/sound.js';

export class InputHandler {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('./renderer.js').CanvasRenderer} renderer
   * @param {Object} options
   * @param {Function} options.onAttemptMove - Callback (fromPegId, toPegId)
   * @param {Function} options.onVisualChange - Notifica alteração gráfica para repintura
   * @param {Function} options.getGameState - Função que retorna o snapshot atual do jogo
   */
  constructor(canvas, renderer, { onAttemptMove, onVisualChange, getGameState }) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.onAttemptMove = onAttemptMove;
    this.onVisualChange = onVisualChange;
    this.getGameState = getGameState;

    // Garante que toques no canvas não disparem gestos padrão do navegador (ex: scroll)
    this.canvas.style.touchAction = 'none';

    // Estado de interação
    this.selectedPegId = null;
    this.draggedDisk = null;
    this.isDragging = false;
    this.pointerStartPos = { x: 0, y: 0 };
    this.activePointerId = null;

    // Configurações touch
    this.isTouch = false;
    this.touchOffsetY = 50; // Elevação ergonômica em pixels acima do dedo para discos mais gordinhos

    this._bindEvents();
  }

  _bindEvents() {
    this.canvas.addEventListener('pointerdown', this._onPointerDown.bind(this));
    window.addEventListener('pointermove', this._onPointerMove.bind(this));
    window.addEventListener('pointerup', this._onPointerUp.bind(this));
    window.addEventListener('pointercancel', this._onPointerCancel.bind(this));
  }

  /**
   * Converte coordenadas de tela do cliente para o espaço de coordenadas lógicas do Canvas.
   */
  _getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  /**
   * Localiza o pino mais próximo de uma coordenada horizontal X.
   * Utiliza tolerância generosa para acomodar a precisão de dedos em telas touch.
   */
  _findNearestPeg(x) {
    const pegX = this.renderer.pegX;
    const threshold = Math.max(48, this.renderer.baseWidth * 0.20);
    let closestIndex = -1;
    let minDistance = Infinity;

    pegX.forEach((px, idx) => {
      const dist = Math.abs(x - px);
      if (dist < minDistance && dist <= threshold) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    return closestIndex;
  }

  _onPointerDown(e) {
    // Permite apenas o ponteiro primário ativo
    if (this.activePointerId !== null && this.activePointerId !== e.pointerId) return;

    this.isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
    const coords = this._getCanvasCoords(e);
    const pegId = this._findNearestPeg(coords.x);
    const gameState = this.getGameState();

    if (pegId === -1) {
      // Clicou fora dos pinos: desseleciona se houver pino ativo
      if (this.selectedPegId !== null) {
        this.selectedPegId = null;
        this.onVisualChange();
      }
      return;
    }

    const peg = gameState.pegs[pegId];
    const hasDisks = peg && peg.disks.length > 0;

    // Cenário A: Já existia um pino selecionado no modo dois cliques
    if (this.selectedPegId !== null) {
      if (this.selectedPegId === pegId) {
        // Clicou no mesmo pino: cancela seleção
        this.selectedPegId = null;
        triggerHaptic('select');
        this.onVisualChange();
        return;
      }
      // Clicou em outro pino: tenta a transferência imediata
      const from = this.selectedPegId;
      this.selectedPegId = null;
      triggerHaptic('drop');
      this.onAttemptMove(from, pegId);
      return;
    }

    // Cenário B: Nenhum pino selecionado. Inicia preparação para arrasto ou clique
    if (hasDisks) {
      this.activePointerId = e.pointerId;
      this.canvas.setPointerCapture?.(e.pointerId);

      const topDisk = peg.disks[peg.disks.length - 1];
      this.pointerStartPos = { x: coords.x, y: coords.y };

      const initialY = this.isTouch ? coords.y - this.touchOffsetY : coords.y;

      this.draggedDisk = {
        pegId,
        size: topDisk.size,
        color: topDisk.color,
        x: coords.x,
        y: initialY
      };

      this.isDragging = false; // Só vira arrasto após deslocamento mínimo
      triggerHaptic('grab');
      soundManager.playGrab();
    }
  }

  _onPointerMove(e) {
    if (this.activePointerId !== e.pointerId || !this.draggedDisk) return;

    const coords = this._getCanvasCoords(e);
    const dx = coords.x - this.pointerStartPos.x;
    const dy = coords.y - this.pointerStartPos.y;
    const dist = Math.hypot(dx, dy);

    if (!this.isDragging && dist > 6) {
      this.isDragging = true;
    }

    if (this.isDragging) {
      const offsetY = this.isTouch ? this.touchOffsetY : 0;
      this.draggedDisk.x = coords.x;
      this.draggedDisk.y = coords.y - offsetY;
      this.onVisualChange();
    }
  }

  _onPointerUp(e) {
    if (this.activePointerId !== e.pointerId) return;

    const coords = this._getCanvasCoords(e);
    const sourcePegId = this.draggedDisk ? this.draggedDisk.pegId : null;

    if (this.isDragging && sourcePegId !== null) {
      // Modo Arrastar e Soltar concluído
      const destPegId = this._findNearestPeg(coords.x);
      this.draggedDisk = null;
      this.isDragging = false;
      this.activePointerId = null;

      if (destPegId !== -1 && destPegId !== sourcePegId) {
        triggerHaptic('drop');
        this.onAttemptMove(sourcePegId, destPegId);
      } else {
        // Soltou no mesmo pino ou fora da área válida: repinta para retornar à haste
        this.onVisualChange();
      }
    } else if (sourcePegId !== null) {
      // Foi apenas um clique simples (sem arrasto significativo): ativa seleção para modo 2 toques
      this.selectedPegId = sourcePegId;
      this.draggedDisk = null;
      this.isDragging = false;
      this.activePointerId = null;
      triggerHaptic('select');
      this.onVisualChange();
    } else {
      this.draggedDisk = null;
      this.isDragging = false;
      this.activePointerId = null;
    }
  }

  _onPointerCancel(e) {
    if (this.activePointerId === e.pointerId) {
      this.draggedDisk = null;
      this.isDragging = false;
      this.selectedPegId = null;
      this.activePointerId = null;
      this.onVisualChange();
    }
  }

  clearSelection() {
    this.selectedPegId = null;
    this.draggedDisk = null;
    this.isDragging = false;
  }
}
