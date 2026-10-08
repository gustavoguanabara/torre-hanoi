/**
 * Gerenciador de Cronômetro da Partida (GameTimer)
 * Mede com precisão o tempo decorrido desde o primeiro movimento até a conclusão.
 */
export class GameTimer {
  /**
   * @param {Object} [options]
   * @param {Function} [options.onTick] - Callback invocado a cada segundo com a string formatada 'MM:SS'.
   */
  constructor({ onTick = null } = {}) {
    this.onTick = onTick;
    this._elapsedSeconds = 0;
    this._timerId = null;
    this._isRunning = false;
  }

  get elapsedSeconds() {
    return this._elapsedSeconds;
  }

  get isRunning() {
    return this._isRunning;
  }

  /**
   * Inicia a contagem de tempo. Se já estiver rodando, não duplica.
   */
  start() {
    if (this._isRunning) return;
    this._isRunning = true;

    this._timerId = setInterval(() => {
      this._elapsedSeconds++;
      if (typeof this.onTick === 'function') {
        this.onTick(this.getFormattedTime(), this._elapsedSeconds);
      }
    }, 1000);
  }

  /**
   * Pausa o cronômetro sem zerar o tempo acumulado.
   */
  pause() {
    if (!this._isRunning) return;
    this._isRunning = false;
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
  }

  /**
   * Pausa e zera o tempo decorrido.
   */
  reset() {
    this.pause();
    this._elapsedSeconds = 0;
    if (typeof this.onTick === 'function') {
      this.onTick('00:00', 0);
    }
  }

  /**
   * Define o tempo acumulado diretamente (para restauração de sessão).
   * @param {number} seconds
   */
  setElapsedSeconds(seconds) {
    this._elapsedSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    if (typeof this.onTick === 'function') {
      this.onTick(this.getFormattedTime(), this._elapsedSeconds);
    }
  }

  /**
   * Retorna a representação formatada no formato 'MM:SS'.
   * @returns {string}
   */
  getFormattedTime() {
    const minutes = Math.floor(this._elapsedSeconds / 60);
    const seconds = this._elapsedSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(minutes)}:${pad(seconds)}`;
  }
}
