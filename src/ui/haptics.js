/**
 * Utilitário de Feedback Tátil (Haptic Feedback)
 * Emite micropulsos de vibração sutis e responsivos em dispositivos móveis compatíveis.
 * Em navegadores que não suportam navigator.vibrate ou em desktops, opera em fallback silencioso.
 */
export function triggerHaptic(type) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      switch (type) {
        case 'grab':
        case 'drop':
          // Micropulso suave ao segurar ou soltar um disco
          navigator.vibrate(20);
          break;
        case 'select':
          // Pulso tátil leve de clique/seleção
          navigator.vibrate(12);
          break;
        case 'error':
          // Pulso duplo distintivo para jogada inválida
          navigator.vibrate([35, 45, 35]);
          break;
        default:
          break;
      }
    } catch {
      // Ignora falhas de permissão ou exceções silenciosamente
    }
  }
}
