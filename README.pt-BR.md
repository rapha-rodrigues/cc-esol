<p align="center"><img src="docs/icon.svg" width="96" alt=""></p>

# cc-esol

<p align="center"><a href="README.md">English</a> · <b>Português</b> · <a href="README.es.md">Español</a> · <a href="README.zh-CN.md">中文</a></p>

**Aprenda inglês no seu uso diário do Claude Code.**

ESOL quer dizer *English for Speakers of Other Languages*, inglês para falantes de outras línguas. O cc-esol é uma barra lateral para o [Claude Code](https://claude.com/claude-code) com um coach de inglês passivo: você continua escrevendo seus prompts como sempre, e o inglês que digita ou dita é corrigido num registro de aprendizado que você lê quando quiser. A mesma barra traz o modo Focus, temas de terminal, controles de modelo e esforço, um editor de status line e um botão de voz.

## Como funciona

1. Abra a barra lateral, ligue o coaching (**On**) na aba ESOL e escolha a sua língua.
2. Cada prompt que você escreve em inglês roda exatamente como antes. O Claude, o mesmo modelo com quem você já está conversando, escreve a versão nativa dele com os motivos num único arquivo local: `~/.claude/english-learning/learning.md`.
3. A aba lista as suas correções, da mais recente para a mais antiga. **Review** pede ao modelo que leia o registro e responda dentro da aba: padrões recorrentes, interferência da sua língua, se eles estão sumindo, três exercícios.

<img src="docs/screenshots/esol-tab.png" alt="A aba ESOL: as últimas correções, uma aberta com o original, a versão nativa e os motivos" width="420">

Prompts na sua língua ficam de fora, assim como comandos de barra, respostas curtas ("yes", "continue") e prompts escritos em outro alfabeto. Inglês que já está natural não é registrado. Apóstrofos faltando em contrações ("dont", "im", "thats") são ignorados como velocidade de digitação; as escolhas de palavra (its/it's, your/you're, their/they're) são corrigidas. Uma única palavra da sua língua dentro de um prompt em inglês é tratada como lacuna de vocabulário: a entrada te dá o termo em inglês.

## Fale

O jeito mais rápido de praticar é ditar. O Claude Code tem ditado por voz próprio (`/voice`), e o botão **Voice** ao lado do botão do canto liga e desliga o ditado e mostra o estado dele. O coach corrige o inglês da transcrição, não a sua pronúncia; uma palavra que o reconhecedor provavelmente ouviu errado recebe a marca `[STT?]` em vez de contar como erro de gramática. Mantenha a língua do ditado em inglês no `/config`: falar a sua língua com ele produz texto embaralhado, o que te empurra para o inglês.

O ditado por voz é um recurso do Claude Code, não deste plugin. Ele exige login com conta claude.ai (não funciona com chave de API, Bedrock, Vertex AI ou Foundry), um microfone local (não por SSH nem na web) e Claude Code 2.1.69 ou mais novo; a transcrição em si não gasta tokens. Detalhes na [documentação de ditado por voz do Claude Code](https://code.claude.com/docs/pt/voice-dictation).

## Privacidade e custo

**Para onde vão as suas palavras**

- O registro é um único arquivo local, `~/.claude/english-learning/learning.md`, compartilhado por todos os projetos por padrão. Defina `ENGLISH_COACH_LOG` para movê-lo, por exemplo para uma pasta de notas sincronizada. O plugin não envia nada a lugar nenhum por conta própria.
- As correções são escritas pelo modelo com quem você já está conversando, como uma chamada à ferramenta `english_log` do plugin, que faz parte da sua conversa. O seu prompt e a correção dele viajam pela mesma API que o resto da sessão, e por nenhuma outra.
- **Review** envia o registro (no máximo os 150.000 caracteres mais recentes) ao modelo numa única requisição e guarda a resposta no store do plugin, um arquivo JSON em `~/.claude/plugins/store/cc-esol_*.json`. O comando `/cc-esol:english-review` faz o mesmo na transcrição, listando todas as entradas.
- Para apagar tudo: remova o arquivo do registro e remova o arquivo do store para descartar a review guardada e as configurações (o coaching volta a Off). Desinstalar o plugin deixa o registro no lugar.

**Quanto custa**

- Themes, Model, Status line, Voice e Icons não gastam tokens: eles leem o que o Claude Code já emite e nunca acrescentam nada a uma requisição. O Focus não custa nada desligado: a ferramenta `focus_progress` dele fica atrás do ToolSearch. Ligado, custa três coisas: a definição da ferramenta na lista de ferramentas (cerca de 1.200 caracteres, cacheada com o resto da lista), uma linha de 132 caracteres ao lado de cada prompt que você digita e as chamadas do Claude à ferramenta: o plano uma vez, depois só o número de cada passo quando ele começa, enviado na mesma mensagem da primeira chamada de ferramenta daquele passo, sem requisição própria. Ligar ou desligar o Focus reescreve o cache do prompt uma vez, no turno seguinte.
- O plugin nunca altera o system prompt do Claude Code: o que ele diz ao Claude viaja na descrição da própria ferramenta e ao lado dos seus prompts.
- O ESOL não é de graça. Com o coaching ligado, as regras de coaching viajam na descrição da ferramenta `english_log` do próprio plugin (menos de 4.096 caracteres com o resto dela), na lista de ferramentas cacheada de cada requisição, e não no histórico. Cada prompt corrigido carrega uma linha extra de cerca de 160 caracteres, a medição do filtro. Cada correção é uma chamada de ferramenta cujos argumentos são o seu original, a reescrita e os motivos, e essa chamada fica na conversa como qualquer outra. Com o coaching desligado nada é acrescentado e a ferramenta espera atrás do ToolSearch.
- Medido com um roteiro fixo de dez prompts, coaching desligado e ligado, mesmo modelo e versão: veja [Custo medido](#custo-medido) abaixo.

## O resto da barra lateral

Clique em **💡 esol** no canto inferior direito, ou digite `/esol` (também `/esol model`, `/esol settings`, `/esol themes`, `/esol focus`, `/esol statusline`, `/esol editor`). Três abas: **ESOL**, **Model**, **Settings**. **Tab** move, **Enter** seleciona, **Esc** fecha. Ao lado do botão do canto, **Model** pula para a página Model e **Voice** liga e desliga o ditado.

<img src="docs/screenshots/footer.png" alt="O rodapé: as três linhas do ccstatusline, depois o botão do canto, Model e Voice on" width="720">

### Model

O modelo (Fable, Opus, Sonnet, Haiku ou o padrão do Claude Code), o esforço de low a max e o modo de permissão em que as sessões novas começam. A troca de modelo roda o `/model` do próprio Claude Code; o esforço vale para toda requisição e é lembrado; o modo da sessão em andamento muda com **shift+tab**, e a escolha aqui é salva como `permissions.defaultMode`.

<img src="docs/screenshots/model.png" alt="A página Model: chips de modelo, chips de esforço de low a max, o modo em andamento e o modo das sessões novas" width="420">

### Focus

Uma faixa acima do prompt com o título da tarefa, um relógio, uma barra de progresso e os passos. Com o Focus ligado, o Claude envia o plano para a ferramenta própria da faixa, `focus_progress`, antes de uma tarefa com mais de duas chamadas de ferramenta, e depois o número de cada passo quando ele começa, então cada linha anda de pendente para em andamento e concluída; a lista de todos, as tasks ou um plano aprovado no plan mode também alimentam a faixa quando a sessão os tem. Sob o passo em andamento fica um feed das últimas chamadas de ferramenta tal como o próprio Claude as descreveu ("Read the settings page and its tests"): clique numa linha, ou chegue nela com ctrl+x tab, para abrir o que a chamada executou e as primeiras linhas que ela imprimiu, e de novo para fechar; as chamadas ficam até o seu próximo prompt. Chamadas e resultados de ferramentas somem da transcrição com o Focus ligado, exceto uma chamada que falhou ou foi interrompida; o ctrl+o mostra todas as chamadas por inteiro. O fim do turno com passos pendentes pausa a faixa, e um turno interrompido ou com erro diz isso; o seu próximo prompt retoma. `[–]` encolhe a faixa para uma linha. Cores: blue, dark, light, green, pink, rainbow ou uma personalizada.

<img src="docs/screenshots/focus-band.png" alt="A faixa Focus acima do prompt: o título e o relógio da tarefa, a barra de progresso, os passos com seus relógios e, sob o passo em andamento, as chamadas dele, uma aberta no comando que executou e nas primeiras linhas que imprimiu" width="720">

No layout de tela cheia, três issues abertas do Claude Code ([#102893](https://github.com/anthropics/claude-code/issues/102893), [#104197](https://github.com/anthropics/claude-code/issues/104197), [#104462](https://github.com/anthropics/claude-code/issues/104462)) podem fazer a roda do mouse pular ou a última linha piscar nas linhas ocultas.

### Themes

Mais de cem temas de cor de terminal do [terminalcolors.com](https://terminalcolors.com), baixados uma vez para `~/.claude/cc-esol/themes/`. Clique num tema: as cores do Claude Code seguem (gravadas como `~/.claude/themes/cc-esol.json` e definidas em `~/.claude/settings.json`; reinicie uma vez na primeira troca, ao vivo depois disso) e o fundo do terminal também, no Windows Terminal (durante a sessão, depois restaurado) e em terminais que aceitam cores OSC (Ghostty, iTerm2, kitty, WezTerm, Terminal.app). **Claude Code default** devolve as cores originais.

<img src="docs/screenshots/themes.png" alt="A página Themes: uma lista pesquisável de temas, cada um com sua amostra de oito cores, o escolhido marcado" width="420">

### Status line e Layout Editor

A página Status line instala, confere e remove o [ccstatusline](https://github.com/sirmalloc/ccstatusline), uma status line de terceiros. Install grava o bloco `statusLine` em `~/.claude/settings.json` (guardando o que havia, para o Uninstall) e uma configuração inicial onde não existe nenhuma; uma status line que você mesmo definiu é mostrada e deixada em paz. **Layout Editor** edita `~/.config/ccstatusline/settings.json` no lugar: linhas, widgets, cores, powerline e layout, com um preview ao vivo desenhado pelo seu próprio comando de status line. Save faz um ensaio do candidato do mesmo jeito, faz backup do arquivo e o substitui num único passo, preservando tudo o que não edita. Detalhes em [docs/statusline.md](docs/statusline.md).

<p>
<img src="docs/screenshots/statusline.png" alt="A página Status line: Layout Editor, Check version, Remove the statusLine setting e o aviso sobre o ccstatusline" width="420">
<img src="docs/screenshots/layout-editor.png" alt="O Layout Editor: as três linhas, os widgets de uma delas com suas cores, o preview ao vivo" width="420">
</p>

### Settings

A chave do Focus e a cor dele, o tema como um chip com o nome dele, a status line e o conjunto de ícones (Nerd Font, Unicode ou Auto: Nerd Font quando a sua configuração do ccstatusline desenha powerline, então nenhuma fonte é instalada nem exigida).

<img src="docs/screenshots/settings.png" alt="A aba Settings: Focus On/Off, o conjunto de ícones e as linhas da cor do Focus, do tema e da status line" width="420">

## Requisitos e instalação

Claude Code 2.1.299 ou mais novo, em macOS, Linux ou Windows. Desenvolvido e testado na 2.1.306.

```
claude plugin marketplace add rapha-rodrigues/cc-esol
claude plugin install cc-esol@esol --scope user
```

Rode `/reload-plugins` ou abra uma sessão nova, depois clique em **💡 esol** ou digite `/esol`. Para atualizar:

```
claude plugin marketplace update esol && claude plugin update cc-esol@esol
```

**Vindo de um checkout com `--plugin-dir`:** o store do plugin é indexado pela origem da instalação, então a instalação pelo marketplace começa com as configurações padrão (coaching Off, nenhuma review guardada). O registro de aprendizado fica intacto: ele mora fora do store.

<details>
<summary><b>Instalar com um agente de IA</b></summary>

Aponte o seu agente de código para este repositório e peça que instale o plugin. Passos para o agente:

1. Rode `claude --version`; precisa ser 2.1.299 ou superior.
2. Rode `claude plugin marketplace add rapha-rodrigues/cc-esol`.
3. Rode `claude plugin install cc-esol@esol --scope user`.
4. Confira que `claude plugin list` mostra `cc-esol` habilitado e peça ao usuário que rode `/reload-plugins`.

No Windows, use barras normais nos caminhos ao rodar no Git Bash.

</details>

## Línguas

Vinte línguas para escolher nas configurações do ESOL, ou **Other** com o nome digitado. A língua só diz ao coach que hábitos de interferência procurar; o filtro que decide se um prompt é inglês não sabe nada sobre a sua língua, então funciona para qualquer uma. A barra lateral em si fala inglês.

## Custo medido

Pendente: o roteiro de dez prompts em [docs/releasing.md](docs/releasing.md) é rodado com coaching desligado e ligado antes de cada release que mexa nos textos de coaching, e as leituras do `/usage` são publicadas aqui com o modelo e a versão do Claude Code.

## Problemas comuns

- **Nenhuma entrada aparece.** Abra as Settings da aba ESOL e confira que o coaching está On. Os hooks carregam no início da sessão: reinicie o Claude Code ou rode `/reload-plugins` depois de instalar ou atualizar.
- **Um prompt na minha língua foi corrigido.** As palavras em inglês dele atingiram o corte (empréstimos como push, merge ou fix contam). Suba o corte nas Settings. O Claude também pula uma mensagem que ele vê que não é inglês.
- **Um prompt em inglês não foi corrigido.** Poucas palavras dele são inglês do dia a dia (prompts curtos e cheios de jargão). Baixe o corte ou o mínimo de palavras nas Settings.
- **O botão Voice diz que `/voice` não está disponível.** Entre com uma conta claude.ai (`/login`); o ditado não funciona com chave de API nem com provedor de terceiros.
- **O registro não para de crescer.** Nada o poda. Arquive com um rename; a próxima entrada recria o arquivo. Acima de 4 MiB a aba para de mostrar a prévia e o Review pede para arquivar antes.
- **Um aviso diz que um hook do cc-esol foi pulado.** Em login de conta Team ou Enterprise, a proteção embutida do Claude Code (`cc-plugin-sec-default`) mantém os plugins do usuário longe do system prompt e dos eventos de hook clássicos, e avisa isso na transcrição. O cc-esol é construído sobre o que passa, então o coaching, a faixa e o resto funcionam como descrito; a única perda ali é a linha "Running in" da página Model, que nunca fica sabendo o modo de permissão atual (shift+tab continua trocando). Nada a configurar.
- Mais em [docs/english-coach.md](docs/english-coach.md) e [docs/statusline.md](docs/statusline.md).

## Desenvolvimento

```
claude --plugin-dir ./plugins/cc-esol
claude plugin validate ./plugins/cc-esol
claude plugin test ./plugins/cc-esol
```

Releases seguem [docs/releasing.md](docs/releasing.md); as mudanças estão em [CHANGELOG.md](CHANGELOG.md).

## Licença e créditos

[MIT](LICENSE).

O [ccstatusline](https://github.com/sirmalloc/ccstatusline) é um projeto separado de Matthew Breedlove, sob licença MIT; nada dele vem neste plugin, que apenas o recomenda, instala e edita a configuração dele. Os temas de terminal vêm do [terminalcolors.com](https://terminalcolors.com) e são baixados em tempo de execução, a seu pedido; nenhum deles vem aqui tampouco.
