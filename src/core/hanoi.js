import { Disk } from './disk.js';
import { Peg } from './peg.js';
import { MoveHistory } from './history.js';
import { HanoiSolver } from './solver.js';

/**
 * Motor Central de Regras da Torre de Hanói (HanoiGame)
 * Encapsula o estado, validações de movimento, desfazimento (Undo) e verificação de vitória.
 * Totalmente desacoplado de bibliotecas de interface gráfica e navegadores.
 */
export class HanoiGame {
  /**
   * @param {Object} [options]
   * @param {number} [options.diskCount=3] - Quantidade de discos (2 a 10).
   * @param {number} [options.targetPegId=2] - Índice do pino de destino (1 ou 2).
   * @param {Function} [options.onMove] - Callback invocado após movimento válido.
   * @param {Function} [options.onInvalidMove] - Callback invocado em tentativa inválida.
   * @param {Function} [options.onVictory] - Callback invocado ao atingir o estado de vitória.
   * @param {Function} [options.onUndo] - Callback invocado ao desfazer jogada.
   */
  constructor({
    diskCount = 3,
    targetPegId = 2,
    onMove = null,
    onInvalidMove = null,
    onVictory = null,
    onUndo = null
  } = {}) {
    this.onMove = onMove;
    this.onInvalidMove = onInvalidMove;
    this.onVictory = onVictory;
    this.onUndo = onUndo;

    this.init(diskCount, targetPegId);
  }

  /**
   * Inicializa ou reinicia o estado do jogo com os parâmetros informados.
   * @param {number} diskCount
   * @param {number} targetPegId
   */
  init(diskCount = 3, targetPegId = 2) {
    if (!Number.isInteger(diskCount) || diskCount < 2 || diskCount > 10) {
      throw new Error(`Quantidade de discos inválida: ${diskCount}. Deve estar entre 2 e 10.`);
    }

    if (!Number.isInteger(targetPegId) || (targetPegId !== 1 && targetPegId !== 2)) {
      throw new Error(`Pino de destino inválido: ${targetPegId}. Deve ser 1 ou 2.`);
    }

    this._diskCount = diskCount;
    this._targetPegId = targetPegId;
    this._moveCount = 0;
    this._hintCount = 0;
    this._isWon = false;
    this._history = new MoveHistory();

    // Cria os 3 pinos: Pino 1 (índice 0), Pino 2 (índice 1), Pino 3 (índice 2)
    this._pegs = [
      new Peg(0, 'Pino 1 (Origem)'),
      new Peg(1, 'Pino 2'),
      new Peg(2, 'Pino 3')
    ];

    // Popula o Pino 1 com discos ordenados do maior (base) ao menor (topo)
    for (let size = this._diskCount; size >= 1; size--) {
      this._pegs[0].push(new Disk(size, this._diskCount));
    }
  }

  get diskCount() {
    return this._diskCount;
  }

  get targetPegId() {
    return this._targetPegId;
  }

  get moveCount() {
    return this._moveCount;
  }

  get hintCount() {
    return this._hintCount;
  }

  get isWon() {
    return this._isWon;
  }

  get pegs() {
    return this._pegs;
  }

  get history() {
    return this._history;
  }

  /**
   * Retorna a quantidade teórica mínima de movimentos para a partida atual (2^n - 1).
   * @returns {number}
   */
  getOptimalMoveCount() {
    return HanoiSolver.getOptimalMoveCount(this._diskCount);
  }

  /**
   * Tenta mover o disco do topo do pino de origem para o pino de destino.
   * @param {number} fromPegId - Pino de origem (0, 1, 2).
   * @param {number} toPegId - Pino de destino (0, 1, 2).
   * @returns {{ success: boolean, reason?: string, disk?: Disk, fromPegId?: number, toPegId?: number, moveCount?: number, isWon?: boolean }}
   */
  moveDisk(fromPegId, toPegId) {
    // 1. Validações de limites e índices
    if (!Number.isInteger(fromPegId) || fromPegId < 0 || fromPegId > 2 ||
        !Number.isInteger(toPegId) || toPegId < 0 || toPegId > 2) {
      const result = { success: false, reason: 'INVALID_PEG_INDEX' };
      this._notifyInvalidMove(fromPegId, toPegId, result.reason);
      return result;
    }

    if (fromPegId === toPegId) {
      const result = { success: false, reason: 'SAME_PEG' };
      this._notifyInvalidMove(fromPegId, toPegId, result.reason);
      return result;
    }

    const sourcePeg = this._pegs[fromPegId];
    const targetPeg = this._pegs[toPegId];

    // 2. Validação de pino vazio
    if (sourcePeg.isEmpty()) {
      const result = { success: false, reason: 'EMPTY_PEG' };
      this._notifyInvalidMove(fromPegId, toPegId, result.reason);
      return result;
    }

    // 3. Validação de regra de tamanho (disco menor sobre maior)
    const diskToMove = sourcePeg.peek();
    if (!targetPeg.canAccept(diskToMove)) {
      const result = { success: false, reason: 'ILLEGAL_PLACEMENT', disk: diskToMove };
      this._notifyInvalidMove(fromPegId, toPegId, result.reason);
      return result;
    }

    // 4. Execução do movimento válido
    sourcePeg.pop();
    targetPeg.push(diskToMove);

    this._history.recordMove(fromPegId, toPegId, diskToMove.size);
    this._moveCount++;

    // 5. Verificação de vitória
    this._isWon = this.checkVictory();

    const result = {
      success: true,
      disk: diskToMove,
      fromPegId,
      toPegId,
      moveCount: this._moveCount,
      isWon: this._isWon
    };

    if (this._isWon && typeof this.onVictory === 'function') {
      this.onVictory(this.getSnapshot());
    }

    if (typeof this.onMove === 'function') {
      this.onMove(result);
    }

    return result;
  }

  /**
   * Reverte o último movimento válido registrado no histórico.
   * @returns {boolean} True se reverteu com sucesso; False se não há jogadas para desfazer.
   */
  undo() {
    if (!this._history.canUndo()) {
      return false;
    }

    const lastMove = this._history.popLastMove();
    const sourcePeg = this._pegs[lastMove.toPegId];
    const destPeg = this._pegs[lastMove.fromPegId];

    const disk = sourcePeg.pop();
    destPeg.push(disk);

    this._moveCount = Math.max(0, this._moveCount - 1);
    this._isWon = this.checkVictory();

    if (typeof this.onUndo === 'function') {
      this.onUndo({
        undoneMove: lastMove,
        moveCount: this._moveCount,
        isWon: this._isWon
      });
    }

    return true;
  }

  /**
   * Obtém a dica da próxima jogada ótima a ser executada a partir do estado atual.
   * @returns {{ fromPegId: number, toPegId: number, diskSize: number } | null}
   */
  getHint() {
    this._hintCount++;
    return HanoiSolver.getNextHint(this._pegs, this._targetPegId);
  }

  /**
   * Verifica se o estado atual satisfaz as condições de vitória.
   * @returns {boolean}
   */
  checkVictory() {
    return this._pegs[this._targetPegId].count === this._diskCount;
  }

  /**
   * Retorna o selo de classificação de eficiência de raciocínio atingido.
   * @returns {'MASTER' | 'GOOD' | 'COMPLETED'}
   */
  getPerformanceTier() {
    const optimal = this.getOptimalMoveCount();
    if (this._moveCount === optimal) {
      return 'MASTER'; // 🌟 Mestre da Lógica (Perfeito)
    }
    if (this._moveCount <= Math.floor(optimal * 1.5)) {
      return 'GOOD'; // 👍 Muito Eficiente
    }
    return 'COMPLETED'; // 💡 Concluído - Pode Otimizar
  }

  /**
   * Exporta uma fotografia imutável do estado atual da partida para visualizadores.
   * @returns {Object}
   */
  getSnapshot() {
    return {
      diskCount: this._diskCount,
      targetPegId: this._targetPegId,
      moveCount: this._moveCount,
      hintCount: this._hintCount,
      isWon: this._isWon,
      optimalMoves: this.getOptimalMoveCount(),
      tier: this.getPerformanceTier(),
      pegs: this._pegs.map(peg => ({
        id: peg.id,
        name: peg.name,
        disks: peg.disks.map(disk => disk.toJSON())
      }))
    };
  }

  /**
   * Reinicia a partida mantendo a configuração atual de discos e destino.
   */
  reset() {
    this.init(this._diskCount, this._targetPegId);
  }

  /**
   * Exporta os dados necessários para persistência e restauração da partida.
   * @returns {Object}
   */
  exportState() {
    return {
      diskCount: this._diskCount,
      targetPegId: this._targetPegId,
      moveCount: this._moveCount,
      hintCount: this._hintCount,
      isWon: this._isWon,
      pegs: this._pegs.map(peg => peg.disks.map(disk => disk.size)),
      history: this._history.getRecords()
    };
  }

  /**
   * Restaura o estado da partida a partir de um objeto exportado.
   * @param {Object} state - Estado serializado previamente salvo.
   * @returns {boolean} True se a restauração ocorreu com sucesso.
   */
  loadState(state) {
    if (!state || typeof state !== 'object') {
      throw new Error('Estado inválido para restauração.');
    }

    const { diskCount, targetPegId, moveCount = 0, hintCount = 0, pegs, history = [] } = state;

    if (!Number.isInteger(diskCount) || diskCount < 2 || diskCount > 10) {
      throw new Error(`Quantidade de discos inválida para restauração: ${diskCount}`);
    }

    if (targetPegId !== 1 && targetPegId !== 2) {
      throw new Error(`Pino de destino inválido para restauração: ${targetPegId}`);
    }

    if (!Array.isArray(pegs) || pegs.length !== 3) {
      throw new Error('Estrutura de pinos inválida para restauração.');
    }

    this._diskCount = diskCount;
    this._targetPegId = targetPegId;
    this._moveCount = Math.max(0, Number(moveCount) || 0);
    this._hintCount = Math.max(0, Number(hintCount) || 0);

    // Reconstrói as três pilhas de pinos com as instâncias exatas de Disk
    this._pegs = [
      new Peg(0, 'Pino 1 (Origem)'),
      new Peg(1, 'Pino 2'),
      new Peg(2, 'Pino 3')
    ];

    pegs.forEach((diskSizes, pegIdx) => {
      if (Array.isArray(diskSizes)) {
        diskSizes.forEach(size => {
          this._pegs[pegIdx].push(new Disk(size, this._diskCount));
        });
      }
    });

    // Reconstrói o histórico de desfazimento (Undo)
    this._history = new MoveHistory();
    this._history.loadRecords(history);

    this._isWon = this.checkVictory();
    return true;
  }

  /**
   * Notifica callback de movimento inválido caso registrado.
   * @private
   */
  _notifyInvalidMove(fromPegId, toPegId, reason) {
    if (typeof this.onInvalidMove === 'function') {
      this.onInvalidMove({ fromPegId, toPegId, reason });
    }
  }
}
