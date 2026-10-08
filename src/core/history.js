/**
 * Gerenciador de Histórico de Jogadas (MoveHistory)
 * Responsável pelo rastreamento ordenado de movimentos para permitir Desfazer (Undo) ilimitado.
 */
export class MoveHistory {
  constructor() {
    /** @type {Array<{ fromPegId: number, toPegId: number, diskSize: number, timestamp: number }>} */
    this._records = [];
  }

  /**
   * Quantidade de movimentos registrados no histórico.
   * @returns {number}
   */
  get count() {
    return this._records.length;
  }

  /**
   * Indica se há pelo menos um movimento disponível para desfazer.
   * @returns {boolean}
   */
  canUndo() {
    return this._records.length > 0;
  }

  /**
   * Registra um movimento legal recém-executado.
   * @param {number} fromPegId - Pino de origem.
   * @param {number} toPegId - Pino de destino.
   * @param {number} diskSize - Tamanho do disco movimentado.
   * @param {number} [timestamp] - Momento da execução.
   */
  recordMove(fromPegId, toPegId, diskSize, timestamp = Date.now()) {
    this._records.push({
      fromPegId,
      toPegId,
      diskSize,
      timestamp
    });
  }

  /**
   * Retira e retorna o último movimento registrado para restauração de estado.
   * @returns {{ fromPegId: number, toPegId: number, diskSize: number, timestamp: number } | null}
   */
  popLastMove() {
    if (this._records.length === 0) {
      return null;
    }
    return this._records.pop();
  }

  /**
   * Inspeciona o último movimento sem removê-lo.
   * @returns {{ fromPegId: number, toPegId: number, diskSize: number, timestamp: number } | null}
   */
  peekLastMove() {
    if (this._records.length === 0) {
      return null;
    }
    return this._records[this._records.length - 1];
  }

  /**
   * Retorna uma cópia rasa de todos os registros armazenados.
   * @returns {Array<{ fromPegId: number, toPegId: number, diskSize: number, timestamp: number }>}
   */
  getRecords() {
    return [...this._records];
  }

  /**
   * Limpa integralmente o histórico de movimentos.
   */
  clear() {
    this._records = [];
  }

  /**
   * Restaura registros no histórico a partir de uma lista serializada.
   * @param {Array<{ fromPegId: number, toPegId: number, diskSize: number, timestamp: number }>} records
   */
  loadRecords(records) {
    if (Array.isArray(records)) {
      this._records = records.map(r => ({
        fromPegId: Number(r.fromPegId),
        toPegId: Number(r.toPegId),
        diskSize: Number(r.diskSize),
        timestamp: Number(r.timestamp) || Date.now()
      }));
    }
  }
}
