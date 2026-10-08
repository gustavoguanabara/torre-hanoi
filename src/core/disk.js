/**
 * Entidade de Disco (Disk)
 * Representa um disco individual na Torre de Hanói.
 * O diâmetro e ordem lógica são definidos por 'size' (1 a N, onde 1 é o menor disco).
 */
export class Disk {
  /**
   * @param {number} size - Tamanho/diâmetro ordinal do disco (1 a totalDisks).
   * @param {number} totalDisks - Total de discos na partida para cálculo de cor.
   */
  constructor(size, totalDisks = 10) {
    if (!Number.isInteger(size) || size < 1) {
      throw new Error(`Tamanho inválido para disco: ${size}. Deve ser um inteiro >= 1.`);
    }

    this._size = size;
    this._totalDisks = Math.max(size, totalDisks);
    this._color = this._calculateColor(this._size, this._totalDisks);
    Object.freeze(this);
  }

  /**
   * Tamanho / diâmetro relativo do disco.
   * @returns {number}
   */
  get size() {
    return this._size;
  }

  /**
   * Cor única gerada em HSL baseada na escala do disco para alto contraste.
   * @returns {string}
   */
  get color() {
    return this._color;
  }

  /**
   * Calcula um tom HSL harmonioso e distinto para cada diâmetro.
   * @private
   */
  _calculateColor(size, total) {
    // Variação de matiz entre 190 (ciano/azul) até 350 (rosa/magenta)
    const hue = Math.round(190 + ((size - 1) / Math.max(1, total - 1)) * 160);
    return `hsl(${hue}, 85%, 55%)`;
  }

  /**
   * Representação em string para debug.
   */
  toString() {
    return `Disk(${this._size})`;
  }

  /**
   * Serialização simples.
   */
  toJSON() {
    return {
      size: this._size,
      color: this._color
    };
  }
}
