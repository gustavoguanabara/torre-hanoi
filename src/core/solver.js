/**
 * Resolvedor Matemático e Sistema de Dicas (HanoiSolver)
 * Implementa o algoritmo recursivo clássico ótimo e o resolvedor de menor caminho
 * para sugestão de dicas (hints) a partir de qualquer estado do tabuleiro.
 */
export class HanoiSolver {
  /**
   * Retorna a quantidade mínima teórica de movimentos para resolver n discos: M(n) = 2^n - 1.
   * @param {number} diskCount
   * @returns {number}
   */
  static getOptimalMoveCount(diskCount) {
    if (!Number.isInteger(diskCount) || diskCount < 1) {
      throw new Error(`Número inválido de discos: ${diskCount}. Deve ser um inteiro >= 1.`);
    }
    return Math.pow(2, diskCount) - 1;
  }

  /**
   * Gera a sequência completa de movimentos ótimos do estado inicial até o destino.
   * @param {number} diskCount - Quantidade total de discos.
   * @param {number} [fromPegId=0] - Pino de origem.
   * @param {number} [toPegId=2] - Pino de destino.
   * @param {number} [auxPegId=1] - Pino auxiliar.
   * @returns {Array<{ fromPegId: number, toPegId: number, diskSize: number }>}
   */
  static generateSolution(diskCount, fromPegId = 0, toPegId = 2, auxPegId = 1) {
    if (!Number.isInteger(diskCount) || diskCount < 1) {
      throw new Error(`Quantidade de discos inválida: ${diskCount}`);
    }

    const moves = [];

    const solveHanoi = (n, origin, target, auxiliary) => {
      if (n === 1) {
        moves.push({ fromPegId: origin, toPegId: target, diskSize: 1 });
        return;
      }
      // 1. Move n - 1 discos da origem para o auxiliar usando o destino
      solveHanoi(n - 1, origin, auxiliary, target);
      // 2. Move o maior disco diretamente para o destino
      moves.push({ fromPegId: origin, toPegId: target, diskSize: n });
      // 3. Move n - 1 discos do auxiliar para o destino usando a origem
      solveHanoi(n - 1, auxiliary, target, origin);
    };

    solveHanoi(diskCount, fromPegId, toPegId, auxPegId);
    return moves;
  }

  /**
   * Obtém o próximo movimento ótimo a partir do estado atual dos pinos.
   * Funciona para qualquer estado legal dos discos no tabuleiro.
   * @param {Array<{ disks: Array<{ size: number }> } | import('./peg.js').Peg>} pegs - Os 3 pinos.
   * @param {number} targetPegId - Pino de destino final (normalmente 1 ou 2).
   * @returns {{ fromPegId: number, toPegId: number, diskSize: number } | null}
   */
  static getNextHint(pegs, targetPegId) {
    // 1. Mapeia a localização atual de cada disco (1..N)
    const diskPositions = {};
    let maxDiskSize = 0;

    pegs.forEach((peg, pegIndex) => {
      const diskList = Array.isArray(peg.disks) ? peg.disks : [];
      diskList.forEach((disk) => {
        const size = disk.size;
        diskPositions[size] = pegIndex;
        if (size > maxDiskSize) {
          maxDiskSize = size;
        }
      });
    });

    if (maxDiskSize === 0) {
      return null;
    }

    // 2. Busca recursiva do próximo passo ótimo
    const findNextMove = (k, target) => {
      if (k < 1) return null;

      const current = diskPositions[k];
      if (current === target) {
        // O disco k já repousa no destino desejado; resolver discos menores no mesmo destino
        return findNextMove(k - 1, target);
      }

      // O disco k precisa transitar de current para target.
      // Para isso ser legal, todos os discos menores 1..(k-1) precisam estar no terceiro pino.
      const other = 3 - current - target;

      let allSmallerInOther = true;
      for (let i = 1; i < k; i++) {
        if (diskPositions[i] !== other) {
          allSmallerInOther = false;
          break;
        }
      }

      if (allSmallerInOther) {
        // Discos menores já estão no terceiro pino; disco k pode se mover diretamente
        return {
          fromPegId: current,
          toPegId: target,
          diskSize: k
        };
      }

      // Caso contrário, a meta imediata é transferir os discos menores para o terceiro pino
      return findNextMove(k - 1, other);
    };

    return findNextMove(maxDiskSize, targetPegId);
  }
}
