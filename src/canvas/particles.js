/**
 * Sistema de Partículas e Confetes Vetoriais (ParticleSystem)
 * Celebração de vitória 100% nativa em Canvas 2D sem dependências externas.
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.colors = [
      '#38bdf8', '#fbbf24', '#10b981', '#f43f5e', '#a855f7',
      '#3b82f6', '#ec4899', '#f97316', '#14b8a6', '#eab308'
    ];
  }

  /**
   * Dispara uma rajada de confetes a partir do topo e laterais do tabuleiro.
   * @param {number} width - Largura atual do canvas.
   * @param {number} height - Altura atual do canvas.
   * @param {number} [count=120] - Quantidade de partículas.
   */
  explode(width, height, count = 120) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const fromLeft = Math.random() < 0.5;
      const x = fromLeft ? Math.random() * (width * 0.35) : width * 0.65 + Math.random() * (width * 0.35);
      const y = Math.random() * (height * 0.4);

      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8 + (fromLeft ? 2 : -2),
        vy: -Math.random() * 8 - 4,
        size: Math.random() * 8 + 4,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        opacity: 1,
        fadeSpeed: Math.random() * 0.005 + 0.003,
        shape: Math.random() > 0.4 ? 'rect' : 'circle'
      });
    }
  }

  /**
   * Atualiza as posições com gravidade e resistência do ar.
   */
  update() {
    if (this.particles.length === 0) return;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // Gravidade
      p.vx *= 0.98; // Atrito com o ar
      p.rotation += p.vRot;
      p.opacity -= p.fadeSpeed;

      if (p.opacity <= 0 || p.y > 1000) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Desenha os confetes no contexto 2D.
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (this.particles.length === 0) return;

    ctx.save();
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Verifica se há confetes ativos em movimento.
   * @returns {boolean}
   */
  isActive() {
    return this.particles.length > 0;
  }

  /**
   * Limpa todas as partículas ativas.
   */
  clear() {
    this.particles = [];
  }
}
