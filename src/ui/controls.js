import { i18n } from './i18n.js';
import { soundManager } from './sound.js';

/**
 * Gerenciador de Controles de Interface e Modais (ControlsManager)
 * Atualiza placares, controla desfazimento (Undo), pedidos de dica,
 * seletores visuais compactos de discos/destino e modal de vitória.
 */
export class ControlsManager {
  /**
   * @param {Object} options
   * @param {Function} options.onRestartGame - Disparado quando altera discos ou destino
   * @param {Function} options.onUndoClick - Disparado ao clicar em Desfazer
   * @param {Function} options.onHintClick - Disparado ao pedir dica
   * @param {Function} options.onNextLevelClick - Disparado ao avançar para o próximo nível
   */
  constructor({ onRestartGame, onUndoClick, onHintClick, onNextLevelClick }) {
    this.onRestartGame = onRestartGame;
    this.onUndoClick = onUndoClick;
    this.onHintClick = onHintClick;
    this.onNextLevelClick = onNextLevelClick;

    this.currentDiskCount = 3;
    this.currentTargetPegId = 2; // Pino 3 (índice 2)

    // Cache de elementos do DOM
    this.elMoves = document.getElementById('val-moves');
    this.elOptimal = document.getElementById('val-optimal');
    this.elTimer = document.getElementById('val-timer');
    this.elHints = document.getElementById('val-hints');

    // Controles visuais compactos
    this.btnDiskDec = document.getElementById('btn-disk-dec');
    this.btnDiskInc = document.getElementById('btn-disk-inc');
    this.valDiskCount = document.getElementById('val-disk-count');

    this.btnTargetPeg2 = document.getElementById('btn-target-peg2');
    this.btnTargetPeg3 = document.getElementById('btn-target-peg3');

    this.btnUndo = document.getElementById('btn-undo');
    this.btnHint = document.getElementById('btn-hint');
    this.btnSound = document.getElementById('btn-sound');

    this.btnLangPt = document.getElementById('btn-lang-pt');
    this.btnLangEn = document.getElementById('btn-lang-en');

    // Status bar do sistema
    this.elStatusCredit = document.getElementById('status-brand-credit');
    this.elVersionBadge = document.getElementById('status-version-badge');
    this.linkStatus = document.getElementById('link-status');
    this.linkTests = document.getElementById('link-tests');

    this._createVictoryModal();
    this._createToastContainer();
    this._setupEventListeners();
    this.setDiskCount(3);
    this.setTargetPegId(2);

    try {
      const savedLang = typeof window !== 'undefined' && window.localStorage?.getItem('hanoi_lang_pref');
      if (savedLang === 'en-US' || savedLang === 'pt-BR') {
        this._changeLanguage(savedLang);
      }
    } catch {}

    this.updateLanguageTexts();
  }

  _setupEventListeners() {
    this.btnSound?.addEventListener('click', () => {
      soundManager.toggleMute();
      this.updateSoundButton();
      if (!soundManager.isMuted) {
        soundManager.playClick();
      }
    });

    this.btnDiskDec?.addEventListener('click', () => {
      if (this.currentDiskCount > 2) {
        soundManager.playClick();
        this.setDiskCount(this.currentDiskCount - 1);
        this.onRestartGame(this.currentDiskCount, this.currentTargetPegId);
      }
    });

    this.btnDiskInc?.addEventListener('click', () => {
      if (this.currentDiskCount < 10) {
        soundManager.playClick();
        this.setDiskCount(this.currentDiskCount + 1);
        this.onRestartGame(this.currentDiskCount, this.currentTargetPegId);
      }
    });

    this.btnTargetPeg2?.addEventListener('click', () => {
      if (this.currentTargetPegId !== 1) {
        soundManager.playClick();
        this.setTargetPegId(1);
        this.onRestartGame(this.currentDiskCount, 1);
      }
    });

    this.btnTargetPeg3?.addEventListener('click', () => {
      if (this.currentTargetPegId !== 2) {
        soundManager.playClick();
        this.setTargetPegId(2);
        this.onRestartGame(this.currentDiskCount, 2);
      }
    });

    this.btnUndo?.addEventListener('click', () => {
      this.onUndoClick();
    });

    this.btnHint?.addEventListener('click', () => {
      this.onHintClick();
    });

    this.btnLangPt?.addEventListener('click', () => {
      soundManager.playClick();
      this._changeLanguage('pt-BR');
    });

    this.btnLangEn?.addEventListener('click', () => {
      soundManager.playClick();
      this._changeLanguage('en-US');
    });

    // Inscreve-se nas mudanças de idioma do i18n
    i18n.subscribe(() => {
      this.updateLanguageTexts();
    });
  }

  setDiskCount(count) {
    this.currentDiskCount = Math.max(2, Math.min(10, count));
    if (this.valDiskCount) {
      this.valDiskCount.textContent = this.currentDiskCount;
    }
    if (this.btnDiskDec) {
      this.btnDiskDec.disabled = this.currentDiskCount <= 2;
    }
    if (this.btnDiskInc) {
      this.btnDiskInc.disabled = this.currentDiskCount >= 10;
    }
  }

  setTargetPegId(targetId) {
    this.currentTargetPegId = targetId;
    if (targetId === 1) {
      this.btnTargetPeg2?.classList.add('active');
      this.btnTargetPeg3?.classList.remove('active');
    } else {
      this.btnTargetPeg3?.classList.add('active');
      this.btnTargetPeg2?.classList.remove('active');
    }
  }

  _changeLanguage(lang) {
    i18n.setLanguage(lang);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('hanoi_lang_pref', lang);
      }
    } catch {}

    if (lang === 'pt-BR') {
      this.btnLangPt?.classList.add('active');
      this.btnLangEn?.classList.remove('active');
    } else {
      this.btnLangEn?.classList.add('active');
      this.btnLangPt?.classList.remove('active');
    }
  }

  updateLanguageTexts() {
    const t = (k) => i18n.t(k);

    const titleEl = document.getElementById('lbl-title');
    if (titleEl) titleEl.textContent = t('title');

    const movesLbl = document.getElementById('lbl-moves');
    if (movesLbl) movesLbl.textContent = t('moves');

    const optLbl = document.getElementById('lbl-optimal');
    if (optLbl) optLbl.textContent = t('optimal');

    const timerLbl = document.getElementById('lbl-timer');
    if (timerLbl) timerLbl.textContent = t('time');

    const hintsLbl = document.getElementById('lbl-hints');
    if (hintsLbl) hintsLbl.textContent = t('hints');

    if (this.btnUndo) {
      this.btnUndo.title = t('undo');
      this.btnUndo.setAttribute('aria-label', t('undo'));
    }

    if (this.btnHint) {
      this.btnHint.title = t('hintBtn');
      this.btnHint.setAttribute('aria-label', t('hintBtn'));
    }

    if (this.elStatusCredit) {
      this.elStatusCredit.textContent = t('statusCredit');
    }

    if (this.elVersionBadge) {
      this.elVersionBadge.title = t('versionTooltip');
      this.elVersionBadge.setAttribute('aria-label', t('versionTooltip'));
    }

    if (this.linkStatus) {
      this.linkStatus.title = t('statusTooltip');
      this.linkStatus.setAttribute('aria-label', t('statusTooltip'));
    }

    if (this.linkTests) {
      this.linkTests.title = t('testsTooltip');
      this.linkTests.setAttribute('aria-label', t('testsTooltip'));
    }

    if (this.btnDiskDec) {
      this.btnDiskDec.title = t('diskDecTooltip');
      this.btnDiskDec.setAttribute('aria-label', t('diskDecTooltip'));
    }

    if (this.btnDiskInc) {
      this.btnDiskInc.title = t('diskIncTooltip');
      this.btnDiskInc.setAttribute('aria-label', t('diskIncTooltip'));
    }

    if (this.btnTargetPeg2) {
      this.btnTargetPeg2.title = t('targetPeg2Tooltip');
      this.btnTargetPeg2.setAttribute('aria-label', t('targetPeg2Tooltip'));
    }

    if (this.btnTargetPeg3) {
      this.btnTargetPeg3.title = t('targetPeg3Tooltip');
      this.btnTargetPeg3.setAttribute('aria-label', t('targetPeg3Tooltip'));
    }

    this.updateSoundButton();
  }

  updateSoundButton() {
    if (!this.btnSound) return;
    const isMuted = soundManager.isMuted;
    this.btnSound.textContent = isMuted ? '🔇' : '🔊';
    const tooltipKey = isMuted ? 'soundOffTooltip' : 'soundOnTooltip';
    this.btnSound.title = i18n.t(tooltipKey);
    this.btnSound.setAttribute('aria-label', i18n.t(tooltipKey));
  }

  updateMetrics(snapshot, formattedTime = null) {
    if (this.elMoves) this.elMoves.textContent = snapshot.moveCount;
    if (this.elOptimal) this.elOptimal.textContent = snapshot.optimalMoves;
    if (this.elHints) this.elHints.textContent = snapshot.hintCount;
    if (formattedTime && this.elTimer) this.elTimer.textContent = formattedTime;

    if (this.btnUndo) {
      this.btnUndo.disabled = snapshot.moveCount === 0;
    }
  }

  showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `app-toast ${isError ? 'toast-error' : 'toast-info'}`;
    toast.textContent = message;

    this.toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  showVictoryModal(snapshot, formattedTime) {
    const t = (k) => i18n.t(k);
    let tierText = t('tierCompleted');
    let tierClass = 'tier-completed';

    if (snapshot.tier === 'MASTER') {
      tierText = t('tierMaster');
      tierClass = 'tier-master';
    } else if (snapshot.tier === 'GOOD') {
      tierText = t('tierGood');
      tierClass = 'tier-good';
    }

    const modalContent = `
      <div class="modal-card">
        <h2 class="modal-title">${t('victoryTitle')}</h2>
        <p class="modal-subtitle">${t('victorySubtitle')}</p>

        <div class="tier-badge ${tierClass}">${tierText}</div>

        <div class="modal-metrics">
          <div class="modal-metric-row">
            <span>${t('metricMoves')}</span>
            <strong>${snapshot.moveCount}</strong>
          </div>
          <div class="modal-metric-row">
            <span>${t('metricOptimal')}</span>
            <strong>${snapshot.optimalMoves}</strong>
          </div>
          <div class="modal-metric-row">
            <span>${t('metricTime')}</span>
            <strong>${formattedTime || '00:00'}</strong>
          </div>
          <div class="modal-metric-row">
            <span>${t('metricHints')}</span>
            <strong>${snapshot.hintCount}</strong>
          </div>
        </div>

        <div class="modal-actions">
          <button id="modal-btn-replay" class="btn">${t('btnPlayAgain')}</button>
          ${snapshot.diskCount < 10 ? `<button id="modal-btn-next" class="btn btn-accent">${t('btnNextLevel')}</button>` : ''}
        </div>
      </div>
    `;

    this.victoryModal.innerHTML = modalContent;
    this.victoryModal.style.display = 'flex';

    document.getElementById('modal-btn-replay')?.addEventListener('click', () => {
      this.victoryModal.style.display = 'none';
      this.onRestartGame(snapshot.diskCount, snapshot.targetPegId);
    });

    document.getElementById('modal-btn-next')?.addEventListener('click', () => {
      this.victoryModal.style.display = 'none';
      const nextCount = Math.min(10, snapshot.diskCount + 1);
      this.setDiskCount(nextCount);
      this.onRestartGame(nextCount, snapshot.targetPegId);
    });
  }

  _createVictoryModal() {
    this.victoryModal = document.createElement('div');
    this.victoryModal.className = 'victory-modal-overlay';
    this.victoryModal.style.display = 'none';
    document.body.appendChild(this.victoryModal);
  }

  _createToastContainer() {
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'toast-container';
    document.body.appendChild(this.toastContainer);
  }
}
