/**
 * Utilitário de Feedback Tátil Multiplataforma (Haptic Feedback)
 * Emite pulsos e vibrações físicas em smartphones e tablets compatíveis.
 *
 * Suporte Duplo Nativo:
 * 1. Android / Chrome: navigator.vibrate com pulsos calibrados e perceptíveis.
 * 2. iOS / Safari: WebKit Taptic Switch trick (<input type="checkbox" switch> + label.click())
 *    que aciona o Taptic Engine do iPhone mesmo na ausência de navigator.vibrate.
 */

const VIBRATION_PATTERNS = {
  grab: 40,                    // Pulso firme de segurar o disco
  drop: 45,                    // Impacto sólido ao pousar o disco na torre
  select: 25,                  // Clique tátil rápido de seleção/botão
  undo: 30,                    // Retorno sutil ao desfazer
  error: [50, 60, 50],         // Duplo pulso distintivo de jogada inválida
  victory: [60, 80, 60, 80, 120] // Sequência comemorativa triunfal
};

let iosSwitchLabel = null;

/**
 * Obtém ou cria de forma preguiçosa o elemento de alternância tátil para iOS Safari.
 * @returns {HTMLLabelElement|null}
 */
function getIOSHapticLabel() {
  if (typeof document === 'undefined') return null;
  if (!iosSwitchLabel) {
    try {
      const container = document.createElement('div');
      container.setAttribute('aria-hidden', 'true');
      container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.setAttribute('switch', '');
      checkbox.id = 'hanoi-haptic-switch';

      const label = document.createElement('label');
      label.htmlFor = 'hanoi-haptic-switch';
      label.id = 'hanoi-haptic-label';

      container.appendChild(checkbox);
      container.appendChild(label);
      document.body?.appendChild(container);

      iosSwitchLabel = label;
    } catch {
      iosSwitchLabel = null;
    }
  }
  return iosSwitchLabel;
}

/**
 * Dispara vibração ou resposta háptica física no dispositivo móvel.
 * @param {'grab'|'drop'|'select'|'undo'|'error'|'victory'} type - Tipo da ação realizada
 */
export function triggerHaptic(type) {
  let hasVibrated = false;

  // 1. Android / Chrome / Browsers com suporte a navigator.vibrate
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      const pattern = VIBRATION_PATTERNS[type] ?? 25;
      hasVibrated = Boolean(navigator.vibrate(pattern));
    } catch {
      // Ignora falhas de permissão silenciosamente
    }
  }

  // 2. iOS / Safari / WebKit Taptic Engine (mesmo quando navigator.vibrate não existe)
  // Também aciona se navigator.vibrate retornou falso no dispositivo móvel
  if (!hasVibrated || (typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || ''))) {
    try {
      const label = getIOSHapticLabel();
      if (label) {
        label.click();

        // Para erro, emite um segundo pulso rápido
        if (type === 'error') {
          setTimeout(() => {
            try { label.click(); } catch {}
          }, 85);
        } else if (type === 'victory') {
          setTimeout(() => {
            try { label.click(); } catch {}
          }, 120);
          setTimeout(() => {
            try { label.click(); } catch {}
          }, 240);
        }
      }
    } catch {}
  }
}
