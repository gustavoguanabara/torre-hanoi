# 🗼 Torre de Hanói (Tower of Hanoi)

> **Simulador didático e interativo da clássica Torre de Hanói**, desenvolvido em **Vanilla Web** (HTML5 Canvas 2D, CSS3 moderno e JavaScript puro ES2022+ com ES Modules nativos), com arquitetura **100% Zero-Dependency** pronta para execução direta e publicação no **GitHub Pages**.

![Versão](https://img.shields.io/badge/versão-1.0.1-38bdf8?style=flat-square)
![Zero-Dependency](https://img.shields.io/badge/dependências-zero-10b981?style=flat-square)
![Canvas 2D](https://img.shields.io/badge/render-Canvas%202D%20%40%2060FPS-fbbf24?style=flat-square)
![Testes](https://img.shields.io/badge/testes-50%20aprovados-10b981?style=flat-square)
![Licença](https://img.shields.io/badge/licença-MIT-blue?style=flat-square)

---

## 🎯 Sobre o Projeto

A **Torre de Hanói** é um tradicional quebra-cabeça matemático inventado pelo matemático francês Édouard Lucas em 1883. O desafio consiste em transferir todos os discos do pino de origem (Pino 1) para um pino de destino (Pino 3 ou Pino 2), respeitando rigorosamente três regras fundamentais:

1. **Apenas um disco** pode ser movido por vez.
2. Cada movimento consiste em pegar o disco do topo de uma das hastes e colocá-lo no topo de outra haste.
3. **Nenhum disco pode ser pousado sobre um disco de diâmetro menor.**

O número mínimo teórico de movimentos necessários para resolver a Torre de Hanói com $n$ discos é dado pela fórmula matemática:

$$\text{Mínimo Ótimo} = 2^n - 1$$

---

## ✨ Funcionalidades Principais

- 🎮 **Renderização Fluida a 60 FPS:** Tabuleiro interativo desenhado via Canvas 2D com suporte a telas HiDPI / Retina (`devicePixelRatio`), cantos suavizados e física de animação.
- 📱 **Otimizado para Touch & Mobile:** 
  - Arrastar e soltar ergonômico com elevação vertical de 50px acima do ponto de contato para que o dedo não obstrua a visualização do disco e da torre de destino.
  - Alternativa de interação por dois toques (selecionar origem $\rightarrow$ tocar destino).
  - Alvos de toque generosos (hitboxes de 38px a 44px) e Canvas com proporção adaptável (4:3 para smartphones em modo retrato e 16:10 para widescreen).
- 📳 **Feedback Tátil (Haptics):** Micropulsos de vibração tátil sutil através da Vibration API em dispositivos móveis compatíveis (ao segurar, soltar, selecionar e pulso duplo em jogadas inválidas).
- 🔊 **Efeitos Sonoros Procedurais (Web Audio API):** Áudio sintetizado em tempo real sem arquivos pesados externos:
  - *Pegar disco:* Estalo suave com pitch ascendente.
  - *Encaixar disco:* Impacto amadeirado ressonante cuja frequência é inversamente proporcional ao tamanho do disco (discos grandes geram graves profundos).
  - *Movimento inválido:* Pulso duplo suave com filtro passa-baixa.
  - *Dicas / Vitória / Desfazer:* Arpejos harmônicos e fanfarra triunfal celestial.
  - Controle de áudio no cabeçalho (🔊 / 🔇) com memória local e respeito a políticas de autoplay.
- 💡 **Sistema Inteligente de Dicas (Hint):**
  - Algoritmo de menor caminho (BFS) que orienta o jogador a partir de **qualquer estado intermediário**, mesmo que jogadas subótimas tenham sido feitas.
  - Seta direcional animada com curva de Bézier (algoritmo de De Casteljau), vetor tangente em tempo real e pulsos luminosos de origem e destino.
- ↩️ **Desfazer Ilimitado (Undo):** Reversão passo a passo de jogadas a qualquer momento.
- 💾 **Persistência Local e Restauração de Sessão:** Estado do tabuleiro, contagem de movimentos, tempo decorrido, histórico de Undo e preferências salvas no `localStorage`, restaurando tudo perfeitamente após recarregar a página (F5/Refresh).
- 🌐 **Internacionalização Dinâmica (i18n):** Alternância instantânea em tempo real entre **Português (Brasil)** 🇧🇷 e **Inglês (US)** 🇺🇸 sem recarregar a página.
- 🏆 **Modal de Vitória e Classificação de Desempenho:** Confetes com física de partículas vetoriais e atribuição de selos didáticos baseados na eficiência matemática em relação ao mínimo de $2^n - 1$:
  - 🌟 **Mestre da Lógica:** Exatamente $2^n - 1$ movimentos.
  - 👍 **Muito Eficiente:** Até 150% do mínimo ótimo.
  - 💡 **Concluído:** Desafio finalizado com oportunidade de otimização.
- 📊 **Status Bar do Sistema:** Rodapé moderno exibindo créditos autorais, tag de versão atual (`v1.0.1`) e atalhos rápidos para o painel de diagnóstico (`🩺`) e suíte de testes (`🧪`).

---

## 📂 Estrutura do Repositório

```text
torre-hanoi/
├── index.html             # Interface principal da aplicação
├── status.html            # Painel visual de status do ambiente e diagnóstico
├── server.js              # Servidor HTTP nativo leve em Node.js (Zero-Dependency)
├── package.json           # Metadados e scripts de execução/teste
├── css/
│   └── style.css          # Folha de estilos moderna com variáveis CSS e responsividade
├── src/
│   ├── main.js            # Ponto de entrada e orquestração dos módulos
│   ├── core/              # Regras de negócio puras (sem acoplamento à UI)
│   │   ├── index.js       # Barrel export
│   │   ├── disk.js        # Entidade imutável Disco com cálculo de cores HSL
│   │   ├── peg.js         # Entidade Pino / Torre (pilha LIFO com validação)
│   │   ├── history.js     # Pilha de jogadas para suporte a Undo ilimitado
│   │   ├── solver.js      # Resolvedor ótimo recursivo e motor BFS de dicas
│   │   ├── hanoi.js       # Controlador de jogo, eventos e métricas
│   │   └── storage.js     # Persistência e restauração de estado no localStorage
│   ├── canvas/            # Renderização gráfica e captura de interação
│   │   ├── renderer.js    # Render loop a 60 FPS com suporte HiDPI/Retina
│   │   ├── input.js       # Pointer Events unificados (Mouse, Touch e Caneta)
│   │   └── particles.js   # Sistema de confetes vetoriais para vitória
│   └── ui/                # Componentes de interface de usuário e utilitários
│       ├── controls.js    # Gerenciador de botões, modais e métricas
│       ├── timer.js       # Cronômetro de partida com formatação MM:SS
│       ├── i18n.js        # Dicionário bilíngue nativo e reativo
│       ├── haptics.js     # Feedback tátil via Vibration API
│       └── sound.js       # Síntese acústica em tempo real via Web Audio API
└── tests/
    ├── test.html          # Interface web interativa para rodar testes no navegador
    ├── runner.js          # Mini test-runner isomórfico zero-dependency
    ├── cli_runner.js      # Adaptador para execução de testes via terminal
    └── core.test.js       # 50 testes automatizados cobrindo todas as regras e módulos
```

---

## 🚀 Como Executar o Projeto

Como o projeto é construído em **Vanilla Web puro (Zero-Dependency)**, você **não precisa instalar nenhuma biblioteca ou pacote via npm**.

### Opção 1: Servidor Nativo Node.js (Recomendado)

```bash
# Iniciar o servidor local nativo
npm start
# ou
node server.js
```

Abra no navegador em: **`http://localhost:3000`**

### Opção 2: Servidor Embutido Python

```bash
# Caso prefira utilizar Python
npm run serve:py
# ou
python3 -m http.server 8000
```

Abra no navegador em: **`http://localhost:8000`**

### Opção 3: Extensões de Editor ou Qualquer Servidor Estático

Você pode utilizar o **Live Server** (VS Code), Caddy, Nginx, Apache ou qualquer outro servidor web estático apontando para a raiz do repositório.

---

## 🧪 Testes Automatizados

O projeto possui **50 testes unitários automatizados** com **100% de aprovação**, garantindo a integridade matemática das regras do quebra-cabeça, invariantes de pinos, cálculo de cores, motor de dicas, persistência e internacionalização.

### Executar Testes no Terminal (CLI):

```bash
npm test
```

### Executar Testes no Navegador:

Abra o arquivo [`tests/test.html`](tests/test.html) no navegador ou clique no ícone **🧪** na barra de status inferior da aplicação.

---

## 🩺 Diagnóstico do Ambiente (Smoke Test)

Para verificar os recursos do seu navegador (suporte a Canvas 2D, Pointer Events, Vibration API, Web Audio API, LocalStorage e ES Modules), acesse o painel de status abrindo [`status.html`](status.html) ou clicando no ícone **🩺** na barra de status.

---

## 🌐 Publicação no GitHub Pages

Este repositório está 100% preparado para hospedagem estática direta e gratuita no **GitHub Pages**:

1. Crie um repositório no seu GitHub (ex: `torre-hanoi`).
2. Faça o envio do código para a branch principal (`main`):
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/torre-hanoi.git
   git branch -M main
   git push -u origin main --tags
   ```
3. No GitHub, vá em **Settings** $\rightarrow$ **Pages**.
4. Em **Build and deployment** $\rightarrow$ **Source**, selecione **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)` e clique em **Save**.
6. Em instantes, seu simulador estará disponível publicamente na URL:
   `https://SEU-USUARIO.github.io/torre-hanoi/`

---

## 👨‍💻 Créditos e Autoria

- **Autor:** Gustavo Guanabara
- **Concepção e Desenvolvimento:** Gustavo Guanabara + Antigravity (Google DeepMind)
- **Versão:** 1.0.1
- **Licença:** [MIT](LICENSE)
