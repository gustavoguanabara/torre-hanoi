/**
 * Gerenciador de Persistência do Estado do Jogo (GameStorage)
 * Responsável por salvar e recuperar o estado completo da partida no Web Storage (localStorage).
 * Permite que o jogador recarregue a página (refresh) e continue a partida exatamente de onde parou.
 * Inclui fallback para memória caso o storage do navegador não esteja acessível.
 */
export class GameStorage {
  /**
   * @param {string} [storageKey='hanoi_game_state_v1']
   */
  constructor(storageKey = 'hanoi_game_state_v1') {
    this.storageKey = storageKey;
    this._memoryFallback = null;
  }

  /**
   * Testa a disponibilidade do localStorage no ambiente atual.
   * @returns {boolean}
   */
  isStorageAvailable() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__hanoi_storage_probe__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Salva o estado atual da sessão do jogo.
   * @param {Object} session
   * @param {Object} session.game - Dados exportados de HanoiGame.exportState()
   * @param {number} [session.elapsedSeconds=0] - Tempo acumulado em segundos
   * @param {boolean} [session.isTimerRunning=false] - Indica se o cronômetro estava ativo
   * @returns {boolean}
   */
  saveSession({ game, elapsedSeconds = 0, isTimerRunning = false }) {
    if (!game || typeof game !== 'object') return false;

    try {
      const payload = JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        game,
        elapsedSeconds: Math.max(0, Math.floor(Number(elapsedSeconds) || 0)),
        isTimerRunning: Boolean(isTimerRunning)
      });

      if (this.isStorageAvailable()) {
        window.localStorage.setItem(this.storageKey, payload);
      } else {
        this._memoryFallback = payload;
      }
      return true;
    } catch (e) {
      console.warn('Não foi possível persistir o estado do jogo:', e);
      return false;
    }
  }

  /**
   * Recupera a sessão salva no storage, validando sua integridade.
   * @returns {{ game: Object, elapsedSeconds: number, isTimerRunning: boolean, savedAt: number } | null}
   */
  loadSession() {
    try {
      let raw = null;
      if (this.isStorageAvailable()) {
        raw = window.localStorage.getItem(this.storageKey);
      } else {
        raw = this._memoryFallback;
      }

      if (!raw) return null;

      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || !data.game) {
        return null;
      }

      // Valida integridade das regras da partida salva
      if (!this.validateGameData(data.game)) {
        this.clearSession();
        return null;
      }

      return {
        game: data.game,
        elapsedSeconds: Math.max(0, Number(data.elapsedSeconds) || 0),
        isTimerRunning: Boolean(data.isTimerRunning),
        savedAt: Number(data.savedAt) || Date.now()
      };
    } catch (e) {
      console.warn('Erro ao restaurar sessão salva do jogo:', e);
      return null;
    }
  }

  /**
   * Valida rigorosamente a consistência das regras de Hanói nos dados salvos.
   * Garante que nenhum estado inconsistente, corrompido ou inválido seja carregado.
   * @param {Object} gameData
   * @returns {boolean}
   */
  validateGameData(gameData) {
    if (!gameData || typeof gameData !== 'object') return false;

    const { diskCount, targetPegId, pegs } = gameData;

    // 1. Valida quantidade de discos e pino de destino
    if (!Number.isInteger(diskCount) || diskCount < 2 || diskCount > 10) return false;
    if (targetPegId !== 1 && targetPegId !== 2) return false;

    // 2. Valida estrutura dos 3 pinos
    if (!Array.isArray(pegs) || pegs.length !== 3) return false;

    // 3. Valida ordenação estrita em cada pino (base maior, topo menor)
    const collectedDisks = [];
    for (const peg of pegs) {
      if (!Array.isArray(peg)) return false;
      for (let i = 0; i < peg.length - 1; i++) {
        if (peg[i] <= peg[i + 1]) {
          return false; // Disco menor abaixo de maior -> violação de regra!
        }
      }
      collectedDisks.push(...peg);
    }

    // 4. Valida conservação de massa: exatamente diskCount discos
    if (collectedDisks.length !== diskCount) return false;

    // 5. Valida que todos os discos de 1 a diskCount estão presentes sem duplicação
    collectedDisks.sort((a, b) => a - b);
    for (let i = 0; i < diskCount; i++) {
      if (collectedDisks[i] !== i + 1) return false;
    }

    return true;
  }

  /**
   * Remove a sessão salva.
   */
  clearSession() {
    try {
      if (this.isStorageAvailable()) {
        window.localStorage.removeItem(this.storageKey);
      }
      this._memoryFallback = null;
    } catch (e) {
      console.warn('Erro ao limpar storage da sessão:', e);
    }
  }

  /**
   * Verifica se há uma sessão válida e carregável.
   * @returns {boolean}
   */
  hasSavedSession() {
    return this.loadSession() !== null;
  }
}
