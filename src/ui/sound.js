/**
 * Gerenciador de Efeitos Sonoros Procedurais (SoundManager)
 * Sintetiza áudio nativo em tempo real via Web Audio API.
 * 100% Zero-Dependency, livre de direitos autorais (Public Domain / CC0),
 * sem latência de rede e com frequência de impacto adaptada ao tamanho do disco.
 */
export class SoundManager {
  constructor() {
    this._ctx = null;
    this._isMuted = false; // Som ligado é SEMPRE o padrão

    this._silentAudio = null;
    this._unlocked = false;

    // Configura a sessão de áudio imediatamente se suportado pelo navegador
    if (typeof navigator !== 'undefined' && navigator.audioSession) {
      try {
        navigator.audioSession.type = 'playback';
      } catch {}
    }

    // Pré-carrega o elemento silencioso assim que o DOM estiver pronto
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading' && typeof document.addEventListener === 'function') {
        document.addEventListener('DOMContentLoaded', () => this._initSilentAudio(), { once: true });
      } else {
        this._initSilentAudio();
      }

      // Restaura o áudio silencioso e o contexto ao retornar para a aba no celular
      if (typeof document.addEventListener === 'function') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && !this._isMuted) {
            if (this._silentAudio && this._silentAudio.paused) {
              this._silentAudio.play().catch(() => {});
            }
            if (this._ctx && this._ctx.state === 'suspended') {
              this._ctx.resume().catch(() => {});
            }
          }
        });
      }
    }

    // O som só fica desligado se o usuário tiver explicitamente escolhido desligar na barra superior
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Limpa valor legado que poderia silenciar o jogo indevidamente ao atualizar a página
        if (window.localStorage.getItem('hanoi_sound_enabled') === 'false') {
          window.localStorage.removeItem('hanoi_sound_enabled');
        }

        // Lê a preferência explícita definida pelo botão da barra superior
        const userMuted = window.localStorage.getItem('hanoi_sound_user_muted');
        this._isMuted = userMuted === 'true';
      }
    } catch {
      this._isMuted = false;
    }
  }

  get isMuted() {
    return this._isMuted;
  }

  /**
   * Inicializa o elemento de áudio silencioso HTML5.
   * No iOS Safari, a reprodução de um elemento <audio> com playsinline força
   * o WebKit a elevar a categoria de áudio para "Playback", furando a chave
   * física de modo silencioso/vibrar e permitindo que a Web Audio API soe no alto-falante.
   */
  _initSilentAudio() {
    if (typeof document === 'undefined' || this._silentAudio) return;

    try {
      const audio = document.createElement('audio');
      // WAV PCM mono silencioso mínimo (44 bytes, 8000Hz)
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      audio.loop = true;
      audio.preload = 'auto';
      audio.setAttribute('playsinline', '');
      audio.setAttribute('webkit-playsinline', '');
      audio.setAttribute('x-webkit-airplay', 'deny');
      audio.style.position = 'fixed';
      audio.style.top = '-9999px';
      audio.style.left = '-9999px';
      audio.style.width = '1px';
      audio.style.height = '1px';
      audio.style.opacity = '0';
      audio.style.pointerEvents = 'none';

      document.body?.appendChild(audio);
      this._silentAudio = audio;
    } catch {}
  }

  /**
   * Desbloqueia o áudio e ativa o bypass de modo silencioso.
   * Deve ser disparado nos primeiros gestos do usuário (touch, click, pointerdown).
   */
  unlock() {
    this._initSilentAudio();

    if (typeof navigator !== 'undefined' && navigator.audioSession) {
      try {
        navigator.audioSession.type = 'playback';
      } catch {}
    }

    const ctx = this._getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (!this._isMuted && this._silentAudio) {
      this._silentAudio.play().catch(() => {});
    }

    this._unlocked = true;
  }

  setMuted(muted) {
    this._isMuted = Boolean(muted);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (this._isMuted) {
          // Usuário escolheu explicitamente desligar o áudio
          window.localStorage.setItem('hanoi_sound_user_muted', 'true');
        } else {
          // Usuário ativou o áudio: remove a restrição de mudo
          window.localStorage.removeItem('hanoi_sound_user_muted');
        }
        window.localStorage.setItem('hanoi_sound_enabled', String(!this._isMuted));
      }
    } catch {}

    // Pausa ou retoma o áudio silencioso de bypass conforme a escolha do jogador
    if (this._silentAudio) {
      if (this._isMuted) {
        this._silentAudio.pause();
      } else {
        this._silentAudio.play().catch(() => {});
      }
    }
  }

  toggleMute() {
    this.setMuted(!this._isMuted);
    return this._isMuted;
  }

  _getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this._ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this._ctx = new AudioCtx();
      }
    }
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {});
    }

    // Garante que o áudio silencioso de bypass esteja rodando caso o som esteja ligado
    if (!this._isMuted) {
      this._initSilentAudio();
      if (this._silentAudio && this._silentAudio.paused) {
        this._silentAudio.play().catch(() => {});
      }
    }

    return this._ctx;
  }

  /**
   * Som de pegar o disco (estalo sutil com pitch ascendente rápido).
   */
  playGrab() {
    if (this._isMuted) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.05);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  /**
   * Som de soltar o disco na torre (impacto acústico amadeirado proporcional ao diâmetro do disco).
   * @param {number} [diskSize=3] - Tamanho do disco (1 a 10)
   * @param {number} [totalDisks=5] - Total de discos na partida
   */
  playDrop(diskSize = 3, totalDisks = 5) {
    if (this._isMuted) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Discos menores possuem timbre mais agudo; discos maiores ressoam com frequência mais grave
      const progress = Math.max(0, Math.min(1, (diskSize - 1) / Math.max(1, totalDisks - 1)));
      const baseFreq = 440 - progress * 220; // 440Hz a 220Hz

      // 1. Corpo principal do impacto (onda triangular com calor acústico)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * 1.15, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.08);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);

      // 2. Ressonância secundária para conferir peso a discos médios e grandes
      if (diskSize >= 2) {
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(baseFreq * 0.5, now);
        subGain.gain.setValueAtTime(0.01, now);
        subGain.gain.linearRampToValueAtTime(0.14, now + 0.005);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        subOsc.connect(subGain);
        subGain.connect(ctx.destination);

        subOsc.start(now);
        subOsc.stop(now + 0.08);
      }
    } catch {}
  }

  /**
   * Som de movimento inválido (duplo pulso grave suave e acolchoado).
   */
  playError() {
    if (this._isMuted) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      [0, 0.08].forEach((delay, idx) => {
        const t = now + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, t);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(idx === 0 ? 140 : 110, t);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.16, t + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.06);
      });
    } catch {}
  }

  /**
   * Som de dica solicitada (brilho cristalino ascendente com tríade harmônica pura).
   */
  playHint() {
    if (this._isMuted) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Tríade cristalina afinada: A5 (880Hz), C#6 (1108.7Hz), E6 (1318.5Hz)
      const notes = [880, 1108.7, 1318.5];

      notes.forEach((freq, idx) => {
        const t = now + idx * 0.045;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch {}
  }

  /**
   * Som de vitória / partida concluída (fanfarra triunfal em escala maior com acorde celestial final).
   */
  playVictory() {
    if (this._isMuted) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Arpejo alegre: C5, E5, G5, C6, E6
      const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51];

      arpeggio.forEach((freq, idx) => {
        const t = now + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === arpeggio.length - 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.6);
      });

      // Acorde sustentado de celebração
      const chordTime = now + arpeggio.length * 0.09;
      [523.25, 659.25, 1046.50].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, chordTime);

        gain.gain.setValueAtTime(0.01, chordTime);
        gain.gain.linearRampToValueAtTime(0.11, chordTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(chordTime);
        osc.stop(chordTime + 1.25);
      });
    } catch {}
  }

  /**
   * Som de desfazer jogada (pitch descendente simulando retorno no tempo).
   */
  playUndo() {
    if (this._isMuted) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  /**
   * Clique suave para botões de interface e seletores.
   */
  playClick() {
    if (this._isMuted) return;
    const ctx = this._getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }
}

export const soundManager = new SoundManager();
