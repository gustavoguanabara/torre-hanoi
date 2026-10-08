/**
 * Suíte de Testes Unitários Completa do Core da Torre de Hanói
 * Cobre as entidades Disk, Peg, MoveHistory, HanoiSolver e HanoiGame,
 * garantindo conformidade matemática, desacoplamento e regras do TRD/BRD.
 */

import { describe, it, expect } from './runner.js';
import { Disk, Peg, MoveHistory, HanoiSolver, HanoiGame, GameStorage } from '../src/core/index.js';
import { GameTimer } from '../src/ui/timer.js';
import { i18n, translations } from '../src/ui/i18n.js';
import { triggerHaptic } from '../src/ui/haptics.js';
import { SoundManager, soundManager } from '../src/ui/sound.js';

describe('Entidade Disk', () => {
  it('deve instanciar um disco com tamanho e cor calculada', () => {
    const disk = new Disk(1, 3);
    expect(disk.size).toBe(1);
    expect(typeof disk.color).toBe('string');
    expect(disk.color).toContain('hsl(');
  });

  it('deve ser imutável após instanciação', () => {
    const disk = new Disk(2, 5);
    expect(() => {
      disk._size = 99;
    }).toThrow();
  });

  it('deve lançar exceção para tamanhos inválidos', () => {
    expect(() => new Disk(0)).toThrow();
    expect(() => new Disk(-2)).toThrow();
    expect(() => new Disk(1.5)).toThrow();
    expect(() => new Disk('abc')).toThrow();
  });

  it('deve exportar formato JSON e representação em string', () => {
    const disk = new Disk(3, 4);
    expect(disk.toString()).toBe('Disk(3)');
    expect(disk.toJSON().size).toBe(3);
    expect(disk.toJSON().color).toBe(disk.color);
  });
});

describe('Entidade Peg (Pilha LIFO)', () => {
  it('deve iniciar vazia com identificador e nome corretos', () => {
    const peg = new Peg(0, 'Pino 1 (Origem)');
    expect(peg.id).toBe(0);
    expect(peg.name).toBe('Pino 1 (Origem)');
    expect(peg.isEmpty()).toBe(true);
    expect(peg.count).toBe(0);
    expect(peg.peek()).toBe(null);
  });

  it('deve aceitar qualquer disco quando estiver vazia', () => {
    const peg = new Peg(1);
    const diskGrande = new Disk(5);
    expect(peg.canAccept(diskGrande)).toBe(true);
    peg.push(diskGrande);
    expect(peg.count).toBe(1);
    expect(peg.peek().size).toBe(5);
  });

  it('deve permitir colocar apenas discos menores sobre discos maiores', () => {
    const peg = new Peg(0);
    const disk3 = new Disk(3);
    const disk2 = new Disk(2);
    const disk1 = new Disk(1);

    peg.push(disk3);
    expect(peg.canAccept(disk2)).toBe(true);
    peg.push(disk2);
    expect(peg.canAccept(disk1)).toBe(true);
    peg.push(disk1);

    expect(peg.count).toBe(3);
    expect(peg.peek().size).toBe(1);
    expect(peg.toArray()).toEqual([3, 2, 1]);
  });

  it('deve rejeitar e lançar exceção ao tentar empilhar disco maior sobre menor', () => {
    const peg = new Peg(0);
    const disk1 = new Disk(1);
    const disk2 = new Disk(2);

    peg.push(disk1);
    expect(peg.canAccept(disk2)).toBe(false);
    expect(() => peg.push(disk2)).toThrow('ILLEGAL_PLACEMENT');
  });

  it('deve rejeitar disco de tamanho idêntico', () => {
    const peg = new Peg(0);
    const diskA = new Disk(2);
    const diskB = new Disk(2);

    peg.push(diskA);
    expect(peg.canAccept(diskB)).toBe(false);
    expect(() => peg.push(diskB)).toThrow('ILLEGAL_PLACEMENT');
  });

  it('deve desempilhar corretamente no padrão LIFO e retornar null quando vazia', () => {
    const peg = new Peg(2);
    peg.push(new Disk(2));
    peg.push(new Disk(1));

    const pop1 = peg.pop();
    expect(pop1.size).toBe(1);
    expect(peg.count).toBe(1);

    const pop2 = peg.pop();
    expect(pop2.size).toBe(2);
    expect(peg.isEmpty()).toBe(true);

    const popVazio = peg.pop();
    expect(popVazio).toBe(null);
  });

  it('deve limpar todos os discos com clear()', () => {
    const peg = new Peg(0);
    peg.push(new Disk(3));
    peg.push(new Disk(2));
    expect(peg.count).toBe(2);

    peg.clear();
    expect(peg.isEmpty()).toBe(true);
    expect(peg.count).toBe(0);
  });
});

describe('Entidade MoveHistory', () => {
  it('deve iniciar vazio com contagem zero e canUndo falso', () => {
    const history = new MoveHistory();
    expect(history.count).toBe(0);
    expect(history.canUndo()).toBe(false);
    expect(history.popLastMove()).toBe(null);
  });

  it('deve registrar movimentos e permitir desempilhar na ordem inversa', () => {
    const history = new MoveHistory();
    history.recordMove(0, 2, 1);
    history.recordMove(0, 1, 2);

    expect(history.count).toBe(2);
    expect(history.canUndo()).toBe(true);

    const ultimo = history.peekLastMove();
    expect(ultimo.fromPegId).toBe(0);
    expect(ultimo.toPegId).toBe(1);
    expect(ultimo.diskSize).toBe(2);

    const desfeito = history.popLastMove();
    expect(desfeito.toPegId).toBe(1);
    expect(history.count).toBe(1);

    history.clear();
    expect(history.canUndo()).toBe(false);
  });
});

describe('Resolvedor e Dicas (HanoiSolver)', () => {
  it('deve calcular rigorosamente 2^n - 1 para n entre 1 e 10', () => {
    expect(HanoiSolver.getOptimalMoveCount(1)).toBe(1);
    expect(HanoiSolver.getOptimalMoveCount(2)).toBe(3);
    expect(HanoiSolver.getOptimalMoveCount(3)).toBe(7);
    expect(HanoiSolver.getOptimalMoveCount(4)).toBe(15);
    expect(HanoiSolver.getOptimalMoveCount(5)).toBe(31);
    expect(HanoiSolver.getOptimalMoveCount(6)).toBe(63);
    expect(HanoiSolver.getOptimalMoveCount(7)).toBe(127);
    expect(HanoiSolver.getOptimalMoveCount(8)).toBe(255);
    expect(HanoiSolver.getOptimalMoveCount(9)).toBe(511);
    expect(HanoiSolver.getOptimalMoveCount(10)).toBe(1023);
  });

  it('deve gerar solução recursiva perfeita com exatamente 2^n - 1 passos para n=2, 3, 4', () => {
    for (const n of [2, 3, 4]) {
      const solution = HanoiSolver.generateSolution(n, 0, 2, 1);
      const esperado = Math.pow(2, n) - 1;
      expect(solution.length).toBe(esperado);
    }
  });

  it('deve resolver uma partida real de Hanói perfeitamente ao executar a solução gerada', () => {
    for (const n of [2, 3, 4, 5]) {
      const game = new HanoiGame({ diskCount: n, targetPegId: 2 });
      const solution = HanoiSolver.generateSolution(n, 0, 2, 1);

      for (const step of solution) {
        const moveRes = game.moveDisk(step.fromPegId, step.toPegId);
        expect(moveRes.success).toBe(true);
      }

      expect(game.isWon).toBe(true);
      expect(game.moveCount).toBe(Math.pow(2, n) - 1);
      expect(game.getPerformanceTier()).toBe('MASTER');
    }
  });

  it('deve calcular a próxima dica correta a partir do estado inicial', () => {
    const game = new HanoiGame({ diskCount: 3, targetPegId: 2 });
    const hint = game.getHint();
    expect(hint).toEqual({ fromPegId: 0, toPegId: 2, diskSize: 1 });
  });

  it('deve orientar o jogador corretamente mesmo se houver jogadas intermediárias', () => {
    const game = new HanoiGame({ diskCount: 3, targetPegId: 2 });
    // Passo 1: Move disco 1 de 0 para 2
    game.moveDisk(0, 2);

    // Próxima dica deve ser mover disco 2 de 0 para 1
    const hint = game.getHint();
    expect(hint).toEqual({ fromPegId: 0, toPegId: 1, diskSize: 2 });

    // Executa a dica
    game.moveDisk(hint.fromPegId, hint.toPegId);

    // Próxima dica deve ser mover disco 1 de 2 para 1
    const hint2 = game.getHint();
    expect(hint2).toEqual({ fromPegId: 2, toPegId: 1, diskSize: 1 });
  });

  it('deve retornar null para dica quando a partida já estiver ganha', () => {
    const game = new HanoiGame({ diskCount: 2, targetPegId: 2 });
    game.moveDisk(0, 1);
    game.moveDisk(0, 2);
    game.moveDisk(1, 2);

    expect(game.isWon).toBe(true);
    expect(game.getHint()).toBe(null);
  });
});

describe('Motor de Regras (HanoiGame)', () => {
  it('deve inicializar com configurações padrão (3 discos, destino pino 2)', () => {
    const game = new HanoiGame();
    expect(game.diskCount).toBe(3);
    expect(game.targetPegId).toBe(2);
    expect(game.moveCount).toBe(0);
    expect(game.hintCount).toBe(0);
    expect(game.isWon).toBe(false);

    expect(game.pegs[0].count).toBe(3);
    expect(game.pegs[1].count).toBe(0);
    expect(game.pegs[2].count).toBe(0);
    expect(game.pegs[0].toArray()).toEqual([3, 2, 1]);
  });

  it('deve suportar configuração personalizada de discos e destino alternativo', () => {
    const game = new HanoiGame({ diskCount: 5, targetPegId: 1 });
    expect(game.diskCount).toBe(5);
    expect(game.targetPegId).toBe(1);
    expect(game.pegs[0].count).toBe(5);
    expect(game.pegs[0].toArray()).toEqual([5, 4, 3, 2, 1]);
  });

  it('deve validar limites de discos (2 a 10) e pinos de destino permitidos (1 ou 2)', () => {
    expect(() => new HanoiGame({ diskCount: 1 })).toThrow();
    expect(() => new HanoiGame({ diskCount: 11 })).toThrow();
    expect(() => new HanoiGame({ targetPegId: 0 })).toThrow();
    expect(() => new HanoiGame({ targetPegId: 3 })).toThrow();
  });

  it('deve realizar movimentos válidos e atualizar contadores e pinos', () => {
    let callbackChamado = false;
    const game = new HanoiGame({
      diskCount: 3,
      onMove: (res) => {
        callbackChamado = true;
      }
    });

    const res = game.moveDisk(0, 2);
    expect(res.success).toBe(true);
    expect(res.disk.size).toBe(1);
    expect(res.fromPegId).toBe(0);
    expect(res.toPegId).toBe(2);
    expect(game.moveCount).toBe(1);
    expect(game.pegs[0].count).toBe(2);
    expect(game.pegs[2].count).toBe(1);
    expect(callbackChamado).toBe(true);
  });

  it('deve rejeitar tentativa de mover a partir de pino vazio (EMPTY_PEG)', () => {
    let erroRegistrado = null;
    const game = new HanoiGame({
      onInvalidMove: (err) => {
        erroRegistrado = err;
      }
    });

    const res = game.moveDisk(1, 2); // Pino 1 começa vazio
    expect(res.success).toBe(false);
    expect(res.reason).toBe('EMPTY_PEG');
    expect(game.moveCount).toBe(0);
    expect(erroRegistrado.reason).toBe('EMPTY_PEG');
  });

  it('deve rejeitar tentativa de mover para o mesmo pino (SAME_PEG)', () => {
    const game = new HanoiGame();
    const res = game.moveDisk(0, 0);
    expect(res.success).toBe(false);
    expect(res.reason).toBe('SAME_PEG');
    expect(game.moveCount).toBe(0);
  });

  it('deve rejeitar índices de pinos inexistentes (INVALID_PEG_INDEX)', () => {
    const game = new HanoiGame();
    expect(game.moveDisk(-1, 2).reason).toBe('INVALID_PEG_INDEX');
    expect(game.moveDisk(0, 4).reason).toBe('INVALID_PEG_INDEX');
  });

  it('deve rejeitar colocação de disco maior sobre menor (ILLEGAL_PLACEMENT)', () => {
    const game = new HanoiGame();
    game.moveDisk(0, 1); // Move disco 1 para pino 1

    // Tenta mover disco 2 do pino 0 para pino 1 (sobre disco 1)
    const res = game.moveDisk(0, 1);
    expect(res.success).toBe(false);
    expect(res.reason).toBe('ILLEGAL_PLACEMENT');
    expect(game.moveCount).toBe(1); // Não incrementou na falha
    expect(game.pegs[1].count).toBe(1);
    expect(game.pegs[1].peek().size).toBe(1);
  });

  it('deve desfazer movimentos corretamente (Undo ilimitado)', () => {
    let undoChamado = false;
    const game = new HanoiGame({
      onUndo: () => {
        undoChamado = true;
      }
    });

    // Estado inicial: [3, 2, 1] no pino 0
    game.moveDisk(0, 2); // Move disco 1 para 2
    game.moveDisk(0, 1); // Move disco 2 para 1
    expect(game.moveCount).toBe(2);

    const reverteu1 = game.undo();
    expect(reverteu1).toBe(true);
    expect(game.moveCount).toBe(1);
    expect(game.pegs[0].peek().size).toBe(2);
    expect(game.pegs[1].isEmpty()).toBe(true);
    expect(undoChamado).toBe(true);

    const reverteu2 = game.undo();
    expect(reverteu2).toBe(true);
    expect(game.moveCount).toBe(0);
    expect(game.pegs[0].toArray()).toEqual([3, 2, 1]);
    expect(game.pegs[2].isEmpty()).toBe(true);

    // Tentar desfazer além do início
    const reverteu3 = game.undo();
    expect(reverteu3).toBe(false);
    expect(game.moveCount).toBe(0);
  });

  it('deve reconhecer a vitória no pino configurado e disparar onVictory', () => {
    let victoryNotified = false;
    const game = new HanoiGame({
      diskCount: 2,
      targetPegId: 2,
      onVictory: () => {
        victoryNotified = true;
      }
    });

    game.moveDisk(0, 1);
    game.moveDisk(0, 2);
    expect(game.isWon).toBe(false);

    const finalMove = game.moveDisk(1, 2);
    expect(finalMove.success).toBe(true);
    expect(game.isWon).toBe(true);
    expect(victoryNotified).toBe(true);
    expect(game.getPerformanceTier()).toBe('MASTER');
  });

  it('deve reconhecer a vitória com destino alternativo (Pino 2)', () => {
    const game = new HanoiGame({ diskCount: 2, targetPegId: 1 });
    game.moveDisk(0, 2);
    game.moveDisk(0, 1);
    game.moveDisk(2, 1);

    expect(game.isWon).toBe(true);
    expect(game.pegs[1].count).toBe(2);
    expect(game.pegs[1].toArray()).toEqual([2, 1]);
  });

  it('deve classificar os selos de desempenho corretamente (Master, Good, Completed)', () => {
    // 2 discos -> optimal = 3
    const game = new HanoiGame({ diskCount: 2, targetPegId: 2 });
    // Partida perfeita: 3 movimentos
    game.moveDisk(0, 1);
    game.moveDisk(0, 2);
    game.moveDisk(1, 2);
    expect(game.getPerformanceTier()).toBe('MASTER');

    // Simula jogo com mais movimentos:
    const gameLongo = new HanoiGame({ diskCount: 2, targetPegId: 2 });
    gameLongo.moveDisk(0, 1);
    gameLongo.moveDisk(1, 0); // Desperdício
    gameLongo.moveDisk(0, 1);
    gameLongo.moveDisk(0, 2);
    gameLongo.moveDisk(1, 2); // Total 5 movimentos (5 <= 3 * 1.5 = 4.5 -> 5 é > 4) -> COMPLETED
    expect(gameLongo.getPerformanceTier()).toBe('COMPLETED');
  });

  it('deve gerar snapshots imutáveis com getSnapshot()', () => {
    const game = new HanoiGame({ diskCount: 3, targetPegId: 2 });
    game.moveDisk(0, 2);

    const snapshot = game.getSnapshot();
    expect(snapshot.diskCount).toBe(3);
    expect(snapshot.targetPegId).toBe(2);
    expect(snapshot.moveCount).toBe(1);
    expect(snapshot.pegs[0].disks.length).toBe(2);
    expect(snapshot.pegs[2].disks.length).toBe(1);
    expect(snapshot.optimalMoves).toBe(7);
  });

  it('deve reiniciar o jogo perfeitamente com reset()', () => {
    const game = new HanoiGame({ diskCount: 3, targetPegId: 2 });
    game.moveDisk(0, 2);
    game.moveDisk(0, 1);
    expect(game.moveCount).toBe(2);

    game.reset();
    expect(game.moveCount).toBe(0);
    expect(game.hintCount).toBe(0);
    expect(game.isWon).toBe(false);
    expect(game.pegs[0].count).toBe(3);
    expect(game.pegs[1].count).toBe(0);
    expect(game.pegs[2].count).toBe(0);
  });
});

describe('Módulo de Tempo (GameTimer)', () => {
  it('deve iniciar com zero segundos e estado pausado', () => {
    const timer = new GameTimer();
    expect(timer.elapsedSeconds).toBe(0);
    expect(timer.isRunning).toBe(false);
    expect(timer.getFormattedTime()).toBe('00:00');
  });

  it('deve formatar corretamente segundos e minutos em MM:SS', () => {
    const timer = new GameTimer();
    timer._elapsedSeconds = 5;
    expect(timer.getFormattedTime()).toBe('00:05');

    timer._elapsedSeconds = 65;
    expect(timer.getFormattedTime()).toBe('01:05');

    timer._elapsedSeconds = 3600;
    expect(timer.getFormattedTime()).toBe('60:00');
  });

  it('deve resetar o tempo acumulado', () => {
    const timer = new GameTimer();
    timer._elapsedSeconds = 42;
    timer.reset();
    expect(timer.elapsedSeconds).toBe(0);
    expect(timer.isRunning).toBe(false);
  });
});

describe('Módulo de Internacionalização (i18n)', () => {
  it('deve possuir suporte a português (pt-BR) e inglês (en-US)', () => {
    expect(Boolean(translations['pt-BR'])).toBe(true);
    expect(Boolean(translations['en-US'])).toBe(true);
  });

  it('deve traduzir chaves com interpolação de parâmetros', () => {
    i18n.setLanguage('pt-BR');
    const msgPt = i18n.t('hintActiveMsg', { size: 1, from: 'Pino 1', to: 'Pino 3' });
    expect(msgPt).toContain('Mova o disco 1');
    expect(msgPt).toContain('Pino 1');
    expect(msgPt).toContain('Pino 3');

    i18n.setLanguage('en-US');
    const msgEn = i18n.t('hintActiveMsg', { size: 1, from: 'Peg 1', to: 'Peg 3' });
    expect(msgEn).toContain('Move disk 1');
    expect(msgEn).toContain('Peg 1');
    expect(msgEn).toContain('Peg 3');

    // Restaura para pt-BR
    i18n.setLanguage('pt-BR');
  });

  it('deve notificar assinantes na mudança de idioma', () => {
    let notifiedLang = null;
    i18n.subscribe((lang) => {
      notifiedLang = lang;
    });

    i18n.setLanguage('en-US');
    expect(notifiedLang).toBe('en-US');

    i18n.setLanguage('pt-BR');
    expect(notifiedLang).toBe('pt-BR');
  });

  it('deve traduzir a frase de crédito da barra de status entre português e inglês', () => {
    i18n.setLanguage('pt-BR');
    expect(i18n.t('statusCredit')).toBe('Torre de Hanói - Desenvolvido por Gustavo Guanabara + Antigravity');

    i18n.setLanguage('en-US');
    expect(i18n.t('statusCredit')).toBe('Tower of Hanoi - Developed by Gustavo Guanabara + Antigravity');

    i18n.setLanguage('pt-BR');
  });

  it('deve traduzir o tooltip da tag de versão na barra de status', () => {
    i18n.setLanguage('pt-BR');
    expect(i18n.t('versionTooltip')).toBe('Versão atual: v1.0.1');

    i18n.setLanguage('en-US');
    expect(i18n.t('versionTooltip')).toBe('Current version: v1.0.1');

    i18n.setLanguage('pt-BR');
  });
});

describe('Módulo de Feedback Tátil (Haptics)', () => {
  it('deve executar sem erros quando navigator ou vibrate não estão definidos', () => {
    let error = null;
    try {
      triggerHaptic('grab');
      triggerHaptic('drop');
      triggerHaptic('select');
      triggerHaptic('error');
    } catch (e) {
      error = e;
    }
    expect(error).toBe(null);
  });

  it('deve acionar navigator.vibrate com os padrões adequados quando disponível', () => {
    const calls = [];
    const originalVibrate = globalThis.navigator?.vibrate;

    Object.defineProperty(globalThis.navigator, 'vibrate', {
      value: (pattern) => {
        calls.push(pattern);
        return true;
      },
      configurable: true,
      writable: true
    });

    triggerHaptic('grab');
    triggerHaptic('drop');
    triggerHaptic('select');
    triggerHaptic('error');

    expect(calls.length).toBe(4);
    expect(calls[0]).toBe(20);
    expect(calls[1]).toBe(20);
    expect(calls[2]).toBe(12);
    expect(Array.isArray(calls[3])).toBe(true);
    expect(calls[3][0]).toBe(35);

    if (originalVibrate) {
      Object.defineProperty(globalThis.navigator, 'vibrate', {
        value: originalVibrate,
        configurable: true,
        writable: true
      });
    } else {
      delete globalThis.navigator.vibrate;
    }
  });
});

describe('Persistência e Restauração de Sessão (GameStorage & HanoiGame)', () => {
  it('deve exportar e carregar o estado completo da partida sem perda de dados', () => {
    const game1 = new HanoiGame({ diskCount: 4, targetPegId: 2 });
    // Executa alguns movimentos:
    game1.moveDisk(0, 1);
    game1.moveDisk(0, 2);
    game1.moveDisk(1, 2);

    expect(game1.moveCount).toBe(3);
    const exportedState = game1.exportState();

    expect(exportedState.diskCount).toBe(4);
    expect(exportedState.targetPegId).toBe(2);
    expect(exportedState.moveCount).toBe(3);
    expect(exportedState.history.length).toBe(3);
    expect(exportedState.pegs[0]).toEqual([4, 3]);
    expect(exportedState.pegs[1]).toEqual([]);
    expect(exportedState.pegs[2]).toEqual([2, 1]);

    // Cria outra instância vazia e restaura o estado:
    const game2 = new HanoiGame();
    game2.loadState(exportedState);

    expect(game2.diskCount).toBe(4);
    expect(game2.targetPegId).toBe(2);
    expect(game2.moveCount).toBe(3);
    expect(game2.pegs[0].toArray()).toEqual([4, 3]);
    expect(game2.pegs[1].toArray()).toEqual([]);
    expect(game2.pegs[2].toArray()).toEqual([2, 1]);
    expect(game2.history.count).toBe(3);

    // Deve permitir continuar desfazendo os movimentos originais restaurados
    const undone = game2.undo();
    expect(undone).toBe(true);
    expect(game2.moveCount).toBe(2);
    expect(game2.pegs[1].toArray()).toEqual([1]);
    expect(game2.pegs[2].toArray()).toEqual([2]);
  });

  it('deve validar integridade matemática no GameStorage (rejeitando estados ilegais)', () => {
    const storage = new GameStorage('test_storage_integrity');

    // Estado válido
    const validGame = {
      diskCount: 3,
      targetPegId: 2,
      moveCount: 1,
      pegs: [[3, 2], [], [1]],
      history: []
    };
    expect(storage.validateGameData(validGame)).toBe(true);

    // Estado com disco maior sobre menor no mesmo pino
    const invalidPlacement = {
      diskCount: 3,
      targetPegId: 2,
      pegs: [[2, 3], [], [1]], // 3 sobre 2 -> ilegal!
      history: []
    };
    expect(storage.validateGameData(invalidPlacement)).toBe(false);

    // Estado com contagem total de discos incompatível
    const missingDisk = {
      diskCount: 3,
      targetPegId: 2,
      pegs: [[3], [], [1]], // falta o disco 2!
      history: []
    };
    expect(storage.validateGameData(missingDisk)).toBe(false);

    // Estado com pino de destino inválido
    const invalidTarget = {
      diskCount: 3,
      targetPegId: 0, // destino não pode ser 0
      pegs: [[3, 2, 1], [], []],
      history: []
    };
    expect(storage.validateGameData(invalidTarget)).toBe(false);
  });

  it('deve salvar e recuperar a sessão no storage com tempo decorrido e status do cronômetro', () => {
    const storage = new GameStorage('test_session_store');
    storage.clearSession();

    const game = new HanoiGame({ diskCount: 3, targetPegId: 2 });
    game.moveDisk(0, 2);

    const savedSuccess = storage.saveSession({
      game: game.exportState(),
      elapsedSeconds: 42,
      isTimerRunning: true
    });
    expect(savedSuccess).toBe(true);
    expect(storage.hasSavedSession()).toBe(true);

    const restoredSession = storage.loadSession();
    expect(restoredSession !== null).toBe(true);
    expect(restoredSession.elapsedSeconds).toBe(42);
    expect(restoredSession.isTimerRunning).toBe(true);
    expect(restoredSession.game.diskCount).toBe(3);
    expect(restoredSession.game.pegs[2]).toEqual([1]);

    storage.clearSession();
    expect(storage.hasSavedSession()).toBe(false);
    expect(storage.loadSession()).toBe(null);
  });

  it('deve permitir que o GameTimer receba o tempo decorrido restaurado com setElapsedSeconds', () => {
    const timer = new GameTimer();
    timer.setElapsedSeconds(125);
    expect(timer.elapsedSeconds).toBe(125);
    expect(timer.getFormattedTime()).toBe('02:05');
  });
});

describe('Módulo de Efeitos Sonoros (SoundManager)', () => {
  it('deve inicializar com som ativado por padrão e permitir alternar mudo', () => {
    const sm = new SoundManager();
    expect(sm.isMuted).toBe(false);

    sm.toggleMute();
    expect(sm.isMuted).toBe(true);

    sm.toggleMute();
    expect(sm.isMuted).toBe(false);

    sm.setMuted(true);
    expect(sm.isMuted).toBe(true);

    sm.setMuted(false);
    expect(sm.isMuted).toBe(false);
  });

  it('deve executar todos os métodos de reprodução de áudio sem lançar exceções', () => {
    const sm = new SoundManager();
    let error = null;

    try {
      sm.playGrab();
      sm.playDrop(1, 3);
      sm.playDrop(3, 3);
      sm.playError();
      sm.playHint();
      sm.playVictory();
      sm.playUndo();
      sm.playClick();
    } catch (e) {
      error = e;
    }

    expect(error).toBe(null);
  });

  it('não deve emitir sons quando estiver no modo mudo', () => {
    const sm = new SoundManager();
    sm.setMuted(true);

    // Se mudo, não deve sequer tentar instanciar AudioContext
    expect(sm._ctx).toBe(null);
    sm.playGrab();
    sm.playDrop(2, 5);
    sm.playVictory();
    expect(sm._ctx).toBe(null);
  });

  it('deve manter o som ligado por padrão ao recarregar a página e só silenciar sob escolha explícita', () => {
    const store = {};
    const mockStorage = {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    };
    const origWindow = globalThis.window;
    globalThis.window = { localStorage: mockStorage };

    // 1. Primeira carga ou atualização: som sempre ligado por padrão
    let sm = new SoundManager();
    expect(sm.isMuted).toBe(false);

    // 2. Usuário escolhe explicitamente mutar
    sm.setMuted(true);
    expect(sm.isMuted).toBe(true);
    expect(mockStorage.getItem('hanoi_sound_user_muted')).toBe('true');

    // 3. Ao recarregar com escolha explícita de mudo gravada, mantém mudo
    sm = new SoundManager();
    expect(sm.isMuted).toBe(true);

    // 4. Usuário ativa o som novamente
    sm.setMuted(false);
    expect(sm.isMuted).toBe(false);
    expect(mockStorage.getItem('hanoi_sound_user_muted')).toBe(null);

    // 5. Ao recarregar a página, mantém o som ligado
    sm = new SoundManager();
    expect(sm.isMuted).toBe(false);

    globalThis.window = origWindow;
  });
});



