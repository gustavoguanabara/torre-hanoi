/**
 * Sistema de Internacionalização (i18n)
 * Dicionário bilíngue nativo em JavaScript Puro (PT-BR padrão / EN-US).
 */

export const translations = {
  'pt-BR': {
    title: 'Torre de Hanói',
    subtitle: 'Simulador Didático de Raciocínio Lógico',
    moves: 'Movimentos',
    optimal: 'Mínimo Ótimo',
    time: 'Tempo',
    hints: 'Dicas Usadas',
    diskCount: 'Discos:',
    targetPeg: 'Destino:',
    undo: 'Desfazer',
    hintBtn: 'Pedir Dica',
    statusBtn: '🩺 Status',
    testsBtn: '🧪 Testes',
    peg1: 'Pino 1 (Origem)',
    peg2: 'Pino 2',
    peg3: 'Pino 3',
    targetBadge: '★ Destino',
    victoryTitle: '🎉 Desafio Concluído com Sucesso!',
    victorySubtitle: 'Parabéns! Você transferiu todos os discos respeitando a lógica clássica.',
    metricMoves: 'Movimentos realizados:',
    metricOptimal: 'Mínimo teórico ótimo:',
    metricTime: 'Tempo de resolução:',
    metricHints: 'Dicas consultadas:',
    tierMaster: '🌟 Mestre da Lógica (Perfeito)',
    tierGood: '👍 Muito Eficiente',
    tierCompleted: '💡 Concluído - Pode Otimizar',
    btnNextLevel: 'Avançar Nível (+1 disco)',
    btnPlayAgain: 'Jogar Novamente',
    illegalMoveMsg: 'Movimento inválido: disco maior não pode ser depositado sobre disco menor.',
    emptyPegMsg: 'O pino selecionado está vazio. Escolha um pino com discos.',
    hintActiveMsg: 'Dica: Mova o disco {size} do {from} para o {to}.',
    footerInfo: 'Torre de Hanói • Desenvolvido com HTML5 Canvas, CSS3 e JavaScript Puro (ES2022+)',
    statusCredit: 'Torre de Hanói - Desenvolvido por Gustavo Guanabara + Antigravity',
    versionTooltip: 'Versão atual: v1.0.1',
    statusTooltip: 'Painel de Status do Ambiente',
    testsTooltip: 'Suíte de Testes Automatizados',
    targetPeg2Tooltip: 'Destino: Pino 2',
    targetPeg3Tooltip: 'Destino: Pino 3',
    diskDecTooltip: 'Diminuir discos (-1)',
    diskIncTooltip: 'Aumentar discos (+1)',
    soundOnTooltip: 'Desativar efeitos sonoros (Mudo)',
    soundOffTooltip: 'Ativar efeitos sonoros'
  },
  'en-US': {
    title: 'Tower of Hanoi',
    subtitle: 'Educational Logical Reasoning Simulator',
    moves: 'Moves',
    optimal: 'Optimal Minimum',
    time: 'Time',
    hints: 'Hints Used',
    diskCount: 'Disks:',
    targetPeg: 'Target:',
    undo: 'Undo',
    hintBtn: 'Get Hint',
    statusBtn: '🩺 Status',
    testsBtn: '🧪 Tests',
    peg1: 'Peg 1 (Source)',
    peg2: 'Peg 2',
    peg3: 'Peg 3',
    targetBadge: '★ Target',
    victoryTitle: '🎉 Challenge Successfully Solved!',
    victorySubtitle: 'Congratulations! You transferred all disks following classical rules.',
    metricMoves: 'Total moves made:',
    metricOptimal: 'Theoretical minimum:',
    metricTime: 'Elapsed time:',
    metricHints: 'Hints used:',
    tierMaster: '🌟 Logic Master (Perfect)',
    tierGood: '👍 Highly Efficient',
    tierCompleted: '💡 Completed - Can Optimize',
    btnNextLevel: 'Next Level (+1 disk)',
    btnPlayAgain: 'Play Again',
    illegalMoveMsg: 'Invalid move: larger disk cannot be placed on top of a smaller disk.',
    emptyPegMsg: 'Selected peg is empty. Please choose a peg containing disks.',
    hintActiveMsg: 'Hint: Move disk {size} from {from} to {to}.',
    footerInfo: 'Tower of Hanoi • Built with HTML5 Canvas, CSS3 & Pure JavaScript (ES2022+)',
    statusCredit: 'Tower of Hanoi - Developed by Gustavo Guanabara + Antigravity',
    versionTooltip: 'Current version: v1.0.1',
    statusTooltip: 'Environment Status Dashboard',
    testsTooltip: 'Automated Test Suite',
    targetPeg2Tooltip: 'Target: Peg 2',
    targetPeg3Tooltip: 'Target: Peg 3',
    diskDecTooltip: 'Decrease disks (-1)',
    diskIncTooltip: 'Increase disks (+1)',
    soundOnTooltip: 'Mute sound effects',
    soundOffTooltip: 'Unmute sound effects'
  }
};

class I18nManager {
  constructor() {
    this._currentLang = 'pt-BR';
    this._subscribers = [];
  }

  get currentLang() {
    return this._currentLang;
  }

  setLanguage(lang) {
    if (!translations[lang]) return;
    this._currentLang = lang;
    this._notify();
  }

  t(key, params = {}) {
    let text = translations[this._currentLang]?.[key] || translations['pt-BR']?.[key] || key;
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return text;
  }

  subscribe(callback) {
    if (typeof callback === 'function') {
      this._subscribers.push(callback);
    }
  }

  _notify() {
    for (const cb of this._subscribers) {
      cb(this._currentLang, this.t.bind(this));
    }
  }
}

export const i18n = new I18nManager();
