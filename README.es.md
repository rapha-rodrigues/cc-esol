<p align="center"><img src="docs/icon.svg" width="96" alt=""></p>

# cc-esol

<p align="center"><a href="README.md">English</a> · <a href="README.pt-BR.md">Português</a> · <b>Español</b> · <a href="README.zh-CN.md">中文</a></p>

<p align="center">Listado en AIDojo: <a href="https://mods.aidojo.si/mods/rapha-rodrigues--cc-esol--cc-esol/"><img src="https://raw.githubusercontent.com/karanb192/awesome-claude-code-mods/main/badges/rapha-rodrigues--cc-esol--cc-esol-validates.svg" alt="validates"></a></p>

*Traducido del README en inglés, que es la versión de referencia. Las correcciones son bienvenidas.*

**Aprende inglés con tu uso diario de Claude Code.**

ESOL significa *English for Speakers of Other Languages*, inglés para hablantes de otras lenguas. cc-esol es un coach de inglés pasivo para [Claude Code](https://claude.com/claude-code): sigues escribiendo tus prompts como siempre, y el inglés que tecleas o dictas se corrige en un registro de aprendizaje que lees cuando quieras. Hace el coaching y nada más, así que convive con los mods de foco, tema o status line que ya usas.

## Cómo funciona

1. Haz clic en **💡 esol** debajo del prompt, abre **Settings**, activa el coaching (**On**) y elige tu idioma.
2. Cada prompt que escribes en inglés se ejecuta exactamente igual que antes. Claude, el mismo modelo con el que ya hablas, escribe una versión nativa con los motivos en un único archivo local: `~/.claude/english-learning/learning.md`.
3. El panel lista tus correcciones, de la más reciente a la más antigua. **Review** pide al modelo que lea el registro y responda dentro del panel: patrones recurrentes, interferencia de tu idioma, si van desapareciendo, tres ejercicios.

<img src="docs/screenshots/esol-tab.png" alt="El panel ESOL: las últimas correcciones, una abierta con el original, la versión nativa y los motivos" width="420">

Los prompts en tu idioma se dejan en paz, igual que los comandos de barra, las respuestas cortas ("yes", "continue") y los prompts escritos en otro alfabeto. El inglés que ya es natural no se registra. Los apóstrofos que faltan en contracciones ("dont", "im", "thats") se ignoran como velocidad de tecleo; las elecciones de palabra (its/it's, your/you're, their/they're) sí se corrigen. Una sola palabra de tu idioma dentro de un prompt en inglés se trata como una laguna de vocabulario: la entrada te da el término en inglés.

## Háblalo

La forma más rápida de practicar es dictar. Claude Code tiene su propio dictado por voz (`/voice`), y el botón **Voice** junto a la bombilla lo activa, lo desactiva y muestra su estado. El coach corrige el inglés de la transcripción, no tu pronunciación; una palabra que el reconocedor probablemente oyó mal se marca con `[STT?]` en vez de contar como error gramatical. Mantén el idioma del dictado en inglés en `/config`: hablar tu idioma con él produce texto confuso, lo que te empuja hacia el inglés.

El dictado por voz es una función de Claude Code, no de este plugin. Requiere iniciar sesión con una cuenta de claude.ai (no funciona con clave de API, Bedrock, Vertex AI ni Foundry), un micrófono local (no por SSH ni en la web) y Claude Code 2.1.69 o más reciente; la transcripción en sí no consume tokens. Detalles en la [documentación de dictado por voz de Claude Code](https://code.claude.com/docs/es/voice-dictation).

## El panel

Haz clic en **💡 esol** debajo del prompt, o escribe `/esol`. **Tab** se mueve, **Enter** selecciona, **Esc** cierra. La bombilla y **Voice** quedan junto a lo que Claude Code y tus otros mods dibujan en esa fila. El panel sigue el tema de Claude Code y se cierra cuando se abre el panel de otro mod, así que la barra lateral muestra uno a la vez.

¿Buscas la banda Focus, la página Model, los temas o el editor de status line que tenía cc-esol 1.x? Ahora son un plugin propio: [cc-focusdeck](https://github.com/rapha-rodrigues/cc-focusdeck).

## Privacidad y costo

**Adónde van tus palabras**

- El registro es un único archivo local, `~/.claude/english-learning/learning.md`, compartido por todos los proyectos por defecto. Define `ENGLISH_COACH_LOG` para moverlo, por ejemplo a una carpeta de notas sincronizada. El plugin no envía nada a ningún sitio por su cuenta.
- Las correcciones las escribe el modelo con el que ya hablas, como una llamada a la herramienta `english_log` del plugin, que forma parte de tu conversación. Tu prompt y su corrección viajan por la misma API que el resto de la sesión, y por ninguna otra.
- **Review** envía el registro (como máximo sus 150.000 caracteres más recientes) al modelo en una sola petición y guarda la respuesta en el store del plugin, un archivo JSON en `~/.claude/plugins/store/cc-esol_*.json`. El comando `/cc-esol:english-review` hace lo mismo en la transcripción, listando todas las entradas.
- Para borrarlo todo: elimina el archivo del registro, y elimina el archivo del store para descartar la review guardada y los ajustes (el coaching vuelve a Off). Desinstalar el plugin deja el registro en su sitio.

**Cuánto cuesta** (estimaciones, a unos cuatro caracteres por token)

- Con el coaching activado: unos 700 tokens de reglas en la descripción de la herramienta `english_log`, enviados con la lista de herramientas y cacheados; unos 40 tokens junto a cada prompt en inglés; y cada corrección es una llamada a herramienta de unos 150 a 300 tokens de salida, que se queda en la conversación. Desactivado: nada, la herramienta espera detrás de ToolSearch.
- Voice: nada. Lee lo que Claude Code ya emite y nunca añade nada a una petición.
- Para comparar: cada petición de Claude Code ya lleva decenas de miles de tokens de system prompt y definiciones de herramientas, así que la parte fija es pequeña; las correcciones son lo que crece con el uso. Activar o desactivar el coaching reescribe la caché del prompt una vez.
- El plugin nunca cambia el system prompt de Claude Code: lo que le dice a Claude viaja en la descripción de su propia herramienta y junto a tus prompts.

## Requisitos e instalación

Claude Code 2.1.299 o más reciente, en macOS, Linux o Windows. Desarrollado y probado en la 2.1.310.

```
claude plugin marketplace add rapha-rodrigues/cc-esol
claude plugin install cc-esol@esol --scope user
```

Ejecuta `/reload-plugins` o abre una sesión nueva, luego haz clic en **💡 esol** o escribe `/esol`. Para actualizar:

```
claude plugin marketplace update esol && claude plugin update cc-esol@esol
```

**Si vienes de la 1.x:** los ajustes del coaching y el registro de aprendizaje se mantienen. Focus, la página Model, los temas y la status line pasaron a [cc-focusdeck](https://github.com/rapha-rodrigues/cc-focusdeck), que arranca con sus propios ajustes: antes de actualizar, elige **Claude Code default** en la página Themes y resuelve cualquier Uninstall o Put it back pendiente de la status line, y luego vuelve a configurarlos allí.

**Si vienes de un checkout con `--plugin-dir`:** el store del plugin se indexa por el origen de la instalación, así que la instalación desde el marketplace arranca con los ajustes por defecto (coaching Off, ninguna review guardada). El registro de aprendizaje queda intacto: vive fuera del store.

<details>
<summary><b>Instalar con un agente de IA</b></summary>

Apunta tu agente de código a este repositorio y pídele que instale el plugin. Pasos para el agente:

1. Ejecuta `claude --version`; debe ser 2.1.299 o superior.
2. Ejecuta `claude plugin marketplace add rapha-rodrigues/cc-esol`.
3. Ejecuta `claude plugin install cc-esol@esol --scope user`.
4. Comprueba que `claude plugin list` muestra `cc-esol` habilitado y pide al usuario que ejecute `/reload-plugins`.

En Windows, usa barras normales en las rutas al ejecutar en Git Bash.

</details>

## Idiomas

Veinte idiomas para elegir en los ajustes del coach, u **Other** con el nombre escrito. El idioma solo le dice al coach qué hábitos de interferencia buscar; el filtro que decide si un prompt está en inglés no sabe nada de tu idioma, así que funciona con cualquiera. El panel en sí habla inglés.

## Problemas frecuentes

- **No aparece ninguna entrada.** Abre los Settings del panel y comprueba que el coaching está On. Los hooks se cargan al iniciar la sesión: reinicia Claude Code o ejecuta `/reload-plugins` después de instalar o actualizar.
- **Un prompt en mi idioma fue corregido.** Sus palabras en inglés alcanzaron el umbral (préstamos como push, merge o fix cuentan). Sube el umbral en Settings. Claude también omite un mensaje que ve que no está en inglés.
- **Un prompt en inglés no fue corregido.** Pocas de sus palabras son inglés cotidiano (prompts cortos y llenos de jerga). Baja el umbral o el mínimo de palabras en Settings.
- **El botón Voice dice que `/voice` no está disponible.** Inicia sesión con una cuenta de claude.ai (`/login`); el dictado no funciona con clave de API ni con un proveedor de terceros.
- **El registro no deja de crecer.** Nada lo poda. Archívalo con un rename; la siguiente entrada recrea el archivo. Pasados 4 MiB el panel deja de mostrar la vista previa y Review pide archivar primero.
- **Un aviso dice que se omitió un hook de cc-esol.** Las versiones anteriores a la 1.0.1 usaban dos eventos de hook clásicos que la protección integrada de Claude Code (`cc-plugin-sec-default`) bloquea para los plugins del usuario en cuentas Team y Enterprise, y la protección lo avisaba en cada prompt y cada llamada a herramienta. Actualiza el plugin y el aviso desaparece; cc-esol funciona igual en cualquier cuenta.
- Más en [docs/english-coach.md](docs/english-coach.md).

## Desarrollo

```
claude --plugin-dir ./plugins/cc-esol
claude plugin validate ./plugins/cc-esol
claude plugin test ./plugins/cc-esol
```

Las releases siguen [docs/releasing.md](docs/releasing.md); los cambios están en [CHANGELOG.md](CHANGELOG.md).

## Más para Claude Code

[cc-focusdeck](https://github.com/rapha-rodrigues/cc-focusdeck), del mismo autor: una banda Focus con el progreso de la tarea sobre el prompt, controles de modelo y esfuerzo, temas de terminal y un editor de status line. Se instala junto a cc-esol o por separado.

## Licencia

[MIT](LICENSE).
