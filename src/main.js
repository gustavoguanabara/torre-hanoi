/**
 * Ponto de Entrada Principal (Application Bootstrap)
 * Integração completa entre Core desacoplado, Renderizador Canvas 2D,
 * Gerenciador de Pointer Events, Cronômetro, Efeitos e i18n.
 */

import { HanoiGame, GameStorage } from './core/index.js';
import { CanvasRenderer } from './canvas/renderer.js';
import { InputHandler } from './canvas/input.js';
import { ParticleSystem } from './canvas/particles.js';
import { GameTimer } from './ui/timer.js';
import { ControlsManager } from './ui/controls.js';
import { i18n } from './ui/i18n.js';
import { triggerHaptic } from './ui/haptics.js';
import { soundManager } from './ui/sound.js';

class HanoiApplication {
  constructor() {
    this.canvas = document.getElementById('hanoiCanvas');
    if (!this.canvas) {
      console.error('Elemento #hanoiCanvas não encontrado no DOM.');
      return;
    }

    // 1. Estado visual gráfico
    this.visualState = {
      selectedPegId: null,
      draggedDisk: null,
      activeHint: null,
      shakeState: null,
      animatingDisk: null
    };

    this.hintTimeoutId = null;

    // 2. Inicialização dos subsistemas
    this.storage = new GameStorage();
    this.renderer = new CanvasRenderer(this.canvas);
    this.particles = new ParticleSystem();

    this.timer = new GameTimer({
      onTick: (formattedTime) => {
        this.controls.updateMetrics(this.game.getSnapshot(), formattedTime);
      }
    });

    this.game = new HanoiGame({
      diskCount: 3,
      targetPegId: 2,
      onVictory: (snapshot) => {
        this.handleVictory(snapshot);
      }
    });

    this.inputHandler = new InputHandler(this.canvas, this.renderer, {
      onAttemptMove: (from, to) => this.handleMoveAttempt(from, to),
      onVisualChange: () => this.syncVisualState(),
      getGameState: () => this.game.getSnapshot()
    });

    this.controls = new ControlsManager({
      onRestartGame: (disks, target) => this.restartGame(disks, target),
      onUndoClick: () => this.handleUndo(),
      onHintClick: () => this.handleHint(),
      onNextLevelClick: (nextDisks) => this.restartGame(nextDisks, this.game.targetPegId)
    });

    // 3. Listeners globais
    window.addEventListener('resize', () => {
      this.renderer.resize();
    });

    window.addEventListener('beforeunload', () => {
      this.saveCurrentSession();
    });

    window.addEventListener('pagehide', () => {
      this.saveCurrentSession();
    });

    // Desbloqueia AudioContext em qualquer primeiro gesto do usuário (conformidade total mobile iOS/Android)
    const unlockEvents = ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown'];
    const unlockAudio = () => {
      const ctx = soundManager._getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        // Reproduz um buffer silencioso para aquecer o subsistema de áudio no iOS Safari
        try {
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        } catch {}

        if (ctx.state === 'running') {
          unlockEvents.forEach((ev) => window.removeEventListener(ev, unlockAudio));
        }
      }
    };
    unlockEvents.forEach((ev) => window.addEventListener(ev, unlockAudio, { passive: true }));

    // 4. Restaura sessão anterior salva (se houver) ou inicializa estado padrão
    this.restoreSavedSession();

    this.controls.updateLanguageTexts();
    this.controls.updateMetrics(this.game.getSnapshot(), this.timer.getFormattedTime());
    this.startRenderLoop();

    console.log('🏛️ Torre de Hanói inicializada com sucesso.');
  }

  syncVisualState() {
    this.visualState.selectedPegId = this.inputHandler.selectedPegId;
    this.visualState.draggedDisk = this.inputHandler.draggedDisk;
  }

  handleMoveAttempt(fromPegId, toPegId) {
    // Inicia o cronômetro no primeiro movimento
    if (this.game.moveCount === 0 && !this.timer.isRunning) {
      this.timer.start();
    }

    // Limpa dica visual ao jogar
    this.clearHint();

    const result = this.game.moveDisk(fromPegId, toPegId);
    this.inputHandler.clearSelection();
    this.syncVisualState();

    if (result.success) {
      soundManager.playDrop(result.disk?.size || 3, this.game.diskCount);
      this.controls.updateMetrics(this.game.getSnapshot(), this.timer.getFormattedTime());
      this.saveCurrentSession();
    } else {
      soundManager.playError();
      this.triggerShakeError(toPegId, result.reason);
    }
  }

  handleUndo() {
    this.clearHint();
    const success = this.game.undo();
    if (success) {
      soundManager.playUndo();
      this.inputHandler.clearSelection();
      this.syncVisualState();
      this.controls.updateMetrics(this.game.getSnapshot(), this.timer.getFormattedTime());
      this.saveCurrentSession();
    }
  }

  handleHint() {
    if (this.game.isWon) return;

    const hint = this.game.getHint();
    this.controls.updateMetrics(this.game.getSnapshot(), this.timer.getFormattedTime());

    if (!hint) return;

    this.visualState.activeHint = {
      ...hint,
      startTime: performance.now()
    };
    this.saveCurrentSession();
    soundManager.playHint();

    // Toast com instrução clara da dica
    const fromName = this.game.pegs[hint.fromPegId].name;
    const toName = this.game.pegs[hint.toPegId].name;
    const msg = i18n.t('hintActiveMsg', {
      size: hint.diskSize,
      from: fromName,
      to: toName
    });
    this.controls.showToast(msg, false);

    if (this.hintTimeoutId) clearTimeout(this.hintTimeoutId);
    this.hintTimeoutId = setTimeout(() => {
      this.clearHint();
    }, 4500);
  }

  clearHint() {
    this.visualState.activeHint = null;
    if (this.hintTimeoutId) {
      clearTimeout(this.hintTimeoutId);
      this.hintTimeoutId = null;
    }
  }

  triggerShakeError(pegId, reason) {
    triggerHaptic('error');

    this.visualState.shakeState = {
      pegId: pegId >= 0 && pegId <= 2 ? pegId : 0,
      progress: 0,
      startTime: performance.now()
    };

    let msg = i18n.t('illegalMoveMsg');
    if (reason === 'EMPTY_PEG') {
      msg = i18n.t('emptyPegMsg');
    }
    this.controls.showToast(msg, true);
  }

  handleVictory(snapshot) {
    this.timer.pause();
    this.clearHint();
    soundManager.playVictory();
    this.particles.explode(this.renderer.width, this.renderer.height, 140);
    this.controls.updateMetrics(snapshot, this.timer.getFormattedTime());
    this.saveCurrentSession();

    setTimeout(() => {
      this.controls.showVictoryModal(snapshot, this.timer.getFormattedTime());
    }, 400);
  }

  restartGame(diskCount, targetPegId) {
    this.timer.reset();
    this.clearHint();
    this.particles.clear();
    this.inputHandler.clearSelection();
    this.syncVisualState();

    this.game.init(diskCount, targetPegId);
    this.controls.updateMetrics(this.game.getSnapshot(), '00:00');
    this.saveCurrentSession();
  }

  saveCurrentSession() {
    this.storage.saveSession({
      game: this.game.exportState(),
      elapsedSeconds: this.timer.elapsedSeconds,
      isTimerRunning: this.timer.isRunning
    });
  }

  restoreSavedSession() {
    const saved = this.storage.loadSession();
    if (!saved) return;

    try {
      this.game.loadState(saved.game);
      this.controls.setDiskCount(saved.game.diskCount);
      this.controls.setTargetPegId(saved.game.targetPegId);
      this.timer.setElapsedSeconds(saved.elapsedSeconds);

      if (saved.isTimerRunning && !saved.game.isWon) {
        this.timer.start();
      }

      console.log('🔄 Partida anterior recuperada com sucesso do armazenamento local.');
    } catch (e) {
      console.warn('Falha ao restaurar partida salva:', e);
      this.storage.clearSession();
    }
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      // 1. Atualiza tremor de erro
      if (this.visualState.shakeState) {
        const elapsed = timestamp - this.visualState.shakeState.startTime;
        const duration = 320; // 320ms
        if (elapsed >= duration) {
          this.visualState.shakeState = null;
        } else {
          this.visualState.shakeState.progress = elapsed / duration;
        }
      }

      // 2. Atualiza física de confetes
      this.particles.update();

      // 3. Renderiza o frame
      this.syncVisualState();
      this.renderer.render(this.game.getSnapshot(), this.visualState, this.particles, timestamp);

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Inicialização automática
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new HanoiApplication());
} else {
  new HanoiApplication();
}
