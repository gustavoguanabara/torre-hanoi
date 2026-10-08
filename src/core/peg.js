import { Disk } from './disk.js';

/**
 * Entidade de Pino / Haste (Peg)
 * Implementa uma pilha LIFO com regras formais da Torre de Hanói:
 * O elemento no índice 0 repousa na base (maior diâmetro)
 * e o elemento no índice (length - 1) está no topo (menor diâmetro).
 */
export class Peg {
  /**
   * @param {number} id - Identificador numérico do pino (0, 1 ou 2).
   * @param {string} [name] - Nome legível do pino.
   */
  constructor(id, name = `Pino ${id + 1}`) {
    if (!Number.isInteger(id) || id < 0) {
      throw new Error(`ID de pino inválido: ${id}. Deve ser um inteiro não-negativo.`);
    }

    this._id = id;
    this._name = name;
    /** @type {Disk[]} */
    this._disks = [];
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get count() {
    return this._disks.length;
  }

  get disks() {
    return [...this._disks];
  }

  /**
   * Verifica se a pilha está vazia.
   * @returns {boolean}
   */
  isEmpty() {
    return this._disks.length === 0;
  }

  /**
   * Obtém o disco atualmente no topo sem removê-lo.
   * @returns {Disk | null}
   */
  peek() {
    if (this._disks.length === 0) return null;
    return this._disks[this._disks.length - 1];
  }

  /**
   * Valida se um determinado disco pode ser pousado no topo deste pino.
   * Regra clássica: Haste vazia aceita qualquer disco;
   * caso já contenha discos, o novo disco deve ter diâmetro estritamente menor que o do topo.
   * @param {Disk} disk
   * @returns {boolean}
   */
  canAccept(disk) {
    if (!disk || !(disk instanceof Disk)) {
      return false;
    }
    const topDisk = this.peek();
    if (!topDisk) {
      return true; // Pino vazio aceita qualquer disco
    }
    return disk.size < topDisk.size;
  }

  /**
   * Insere um disco no topo da pilha respeitando as regras do quebra-cabeça.
   * @param {Disk} disk
   * @returns {boolean}
   * @throws {Error} Se a inserção violar as regras de tamanho.
   */
  push(disk) {
    if (!this.canAccept(disk)) {
      const topDisk = this.peek();
      throw new Error(
        `ILLEGAL_PLACEMENT: Não é permitido colocar o disco ${disk?.size} sobre o disco ${topDisk?.size} no ${this._name}.`
      );
    }
    this._disks.push(disk);
    return true;
  }

  /**
   * Remove e retorna o disco do topo da pilha.
   * @returns {Disk | null}
   */
  pop() {
    if (this.isEmpty()) {
      return null;
    }
    return this._disks.pop();
  }

  /**
   * Remove todos os discos do pino.
   */
  clear() {
    this._disks = [];
  }

  /**
   * Representação simplificada dos tamanhos dos discos presentes na haste.
   * @returns {number[]}
   */
  toArray() {
    return this._disks.map(d => d.size);
  }
}
