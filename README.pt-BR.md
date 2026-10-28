<p align="center"><img src="docs/icon.svg" width="96" alt=""></p>

# cc-esol

<p align="center"><a href="README.md">English</a> · <b>Português</b> · <a href="README.es.md">Español</a> · <a href="README.zh-CN.md">中文</a></p>

<p align="center"><a href="https://mods.aidojo.si/mods/rapha-rodrigues--cc-esol--cc-esol/"><img src="https://raw.githubusercontent.com/karanb192/awesome-claude-code-mods/main/badges/rapha-rodrigues--cc-esol--cc-esol-reach.svg" alt="reach"></a> <a href="https://mods.aidojo.si/mods/rapha-rodrigues--cc-esol--cc-esol/"><img src="https://raw.githubusercontent.com/karanb192/awesome-claude-code-mods/main/badges/rapha-rodrigues--cc-esol--cc-esol-validates.svg" alt="validates"></a></p>

**Aprenda inglês no seu uso diário do Claude Code.**

ESOL quer dizer *English for Speakers of Other Languages*, inglês para falantes de outras línguas. O cc-esol é um coach de inglês passivo para o [Claude Code](https://claude.com/claude-code): você continua escrevendo seus prompts como sempre, e o inglês que digita ou dita é corrigido num registro de aprendizado que você lê quando quiser. Ele faz o coaching e mais nada, então convive com os mods de foco, tema ou status line que você já usa.

## Como funciona

1. Clique em **💡 esol** abaixo do prompt, abra **Settings**, ligue o coaching (**On**) e escolha a sua língua.
2. Cada prompt que você escreve em inglês roda exatamente como antes. O Claude, o mesmo modelo com quem você já está conversando, escreve a versão nativa dele com os motivos num único arquivo local: `~/.claude/english-learning/learning.md`.
3. O painel lista as suas correções, da mais recente para a mais antiga. **Review** pede ao modelo que leia o registro e responda dentro do painel: padrões recorrentes, interferência da sua língua, se eles estão sumindo, três exercícios.

<img src="docs/screenshots/esol-tab.png" alt="O painel ESOL: as últimas correções, uma aberta com o original, a versão nativa e os motivos" width="420">

Prompts na sua língua ficam de fora, assim como comandos de barra, respostas curtas ("yes", "continue") e prompts escritos em outro alfabeto. Inglês que já está natural não é registrado. Apóstrofos faltando em contrações ("dont", "im", "thats") são ignorados como velocidade de digitação; as escolhas de palavra (its/it's, your/you're, their/they're) são corrigidas. Uma única palavra da sua língua dentro de um prompt em inglês é tratada como lacuna de vocabulário: a entrada te dá o termo em inglês.

## Fale

O jeito mais rápido de praticar é ditar. O Claude Code tem ditado por voz próprio (`/voice`), e o botão **Voice** ao lado da lâmpada liga e desliga o ditado e mostra o estado dele. O coach corrige o inglês da transcrição, não a sua pronúncia; uma palavra que o reconhecedor provavelmente ouviu errado recebe a marca `[STT?]` em vez de contar como erro de gramática. Mantenha a língua do ditado em inglês no `/config`: falar a sua língua com ele produz texto embaralhado, o que te empurra para o inglês.

O ditado por voz é um recurso do Claude Code, não deste plugin. Ele exige login com conta claude.ai (não funciona com chave de API, Bedrock, Vertex AI ou Foundry), um microfone local (não por SSH nem na web) e Claude Code 2.1.69 ou mais novo; a transcrição em si não gasta tokens. Detalhes na [documentação de ditado por voz do Claude Code](https://code.claude.com/docs/pt/voice-dictation).

## O painel

Clique em **💡 esol** abaixo do prompt, ou digite `/esol`. **Tab** move, **Enter** seleciona, **Esc** fecha. A lâmpada e o **Voice** ficam ao lado do que o Claude Code e os seus outros mods desenham nessa linha. O painel segue o tema do Claude Code e se fecha quando o painel de outro mod abre, então a lateral mostra um de cada vez.

Procurando a faixa Focus, a página Model, os temas ou o editor de status line que o cc-esol 1.x tinha? Eles viraram um plugin próprio: [cc-focusdeck](https://github.com/rapha-rodrigues/cc-focusdeck).

## Privacidade e custo

**Para onde vão as suas palavras**

- O registro é um único arquivo local, `~/.claude/english-learning/learning.md`, compartilhado por todos os projetos por padrão. Defina `ENGLISH_COACH_LOG` para movê-lo, por exemplo para uma pasta de notas sincronizada. O plugin não envia nada a lugar nenhum por conta própria.
- As correções são escritas pelo modelo com quem você já está conversando, como uma chamada à ferramenta `english_log` do plugin, que faz parte da sua conversa. O seu prompt e a correção dele viajam pela mesma API que o resto da sessão, e por nenhuma outra.
- **Review** envia o registro (no máximo os 150.000 caracteres mais recentes) ao modelo numa única requisição e guarda a resposta no store do plugin, um arquivo JSON em `~/.claude/plugins/store/cc-esol_*.json`. O comando `/cc-esol:english-review` faz o mesmo na transcrição, listando todas as entradas.
- Para apagar tudo: remova o arquivo do registro e remova o arquivo do store para descartar a review guardada e as configurações (o coaching volta a Off). Desinstalar o plugin deixa o registro no lugar.

**Quanto custa** (estimativas, a cerca de quatro caracteres por token)

- Com o coaching ligado: cerca de 700 tokens de regras na descrição da ferramenta `english_log`, enviados com a lista de ferramentas e cacheados; cerca de 40 tokens ao lado de cada prompt em inglês; e cada correção é uma chamada de ferramenta de uns 150 a 300 tokens de saída, que fica na conversa. Desligado: nada, a ferramenta espera atrás do ToolSearch.
- Voice: nada. Ele lê o que o Claude Code já emite e nunca acrescenta nada a uma requisição.
- Para comparar: cada requisição do Claude Code já leva dezenas de milhares de tokens de system prompt e definições de ferramentas, então a parte fixa é pequena; as correções são o que cresce com o uso. Ligar ou desligar o coaching reescreve o cache do prompt uma vez.
- O plugin nunca altera o system prompt do Claude Code: o que ele diz ao Claude viaja na descrição da própria ferramenta e ao lado dos seus prompts.

## Requisitos e instalação

Claude Code 2.1.299 ou mais novo, em macOS, Linux ou Windows. Desenvolvido e testado na 2.1.310.

```
claude plugin marketplace add rapha-rodrigues/cc-esol
claude plugin install cc-esol@esol --scope user
```

Rode `/reload-plugins` ou abra uma sessão nova, depois clique em **💡 esol** ou digite `/esol`. Para atualizar:

```
claude plugin marketplace update esol && claude plugin update cc-esol@esol
```

**Vindo da 1.x:** as configurações do coaching e o registro de aprendizado continuam. Focus, a página Model, os temas e a status line foram para o [cc-focusdeck](https://github.com/rapha-rodrigues/cc-focusdeck), que começa com configurações próprias: antes de atualizar, escolha **Claude Code default** na página Themes e resolva qualquer Uninstall ou Put it back pendente da status line, depois configure tudo de novo lá.

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

Vinte línguas para escolher nas configurações do coach, ou **Other** com o nome digitado. A língua só diz ao coach que hábitos de interferência procurar; o filtro que decide se um prompt é inglês não sabe nada sobre a sua língua, então funciona para qualquer uma. O painel em si fala inglês.

## Problemas comuns

- **Nenhuma entrada aparece.** Abra as Settings do painel e confira que o coaching está On. Os hooks carregam no início da sessão: reinicie o Claude Code ou rode `/reload-plugins` depois de instalar ou atualizar.
- **Um prompt na minha língua foi corrigido.** As palavras em inglês dele atingiram o corte (empréstimos como push, merge ou fix contam). Suba o corte nas Settings. O Claude também pula uma mensagem que ele vê que não é inglês.
- **Um prompt em inglês não foi corrigido.** Poucas palavras dele são inglês do dia a dia (prompts curtos e cheios de jargão). Baixe o corte ou o mínimo de palavras nas Settings.
- **O botão Voice diz que `/voice` não está disponível.** Entre com uma conta claude.ai (`/login`); o ditado não funciona com chave de API nem com provedor de terceiros.
- **O registro não para de crescer.** Nada o poda. Arquive com um rename; a próxima entrada recria o arquivo. Acima de 4 MiB o painel para de mostrar a prévia e o Review pede para arquivar antes.
- **Um aviso diz que um hook do cc-esol foi pulado.** Versões anteriores à 1.0.1 usavam dois eventos de hook clássicos que a proteção embutida do Claude Code (`cc-plugin-sec-default`) bloqueia para plugins do usuário em contas Team e Enterprise, e a proteção avisava isso a cada prompt e chamada de ferramenta. Atualize o plugin e o aviso some; o cc-esol funciona igual em qualquer conta.
- Mais em [docs/english-coach.md](docs/english-coach.md).

## Desenvolvimento

```
claude --plugin-dir ./plugins/cc-esol
claude plugin validate ./plugins/cc-esol
claude plugin test ./plugins/cc-esol
```

Releases seguem [docs/releasing.md](docs/releasing.md); as mudanças estão em [CHANGELOG.md](CHANGELOG.md).

## Mais para o Claude Code

[cc-focusdeck](https://github.com/rapha-rodrigues/cc-focusdeck), do mesmo autor: uma faixa Focus com o progresso da tarefa acima do prompt, controles de modelo e esforço, temas de terminal e um editor de status line. Instala junto com o cc-esol ou sozinho.

## Licença

[MIT](LICENSE).
