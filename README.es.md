<p align="center"><img src="docs/icon.svg" width="96" alt=""></p>

# cc-esol

<p align="center"><a href="README.md">English</a> · <a href="README.pt-BR.md">Português</a> · <b>Español</b> · <a href="README.zh-CN.md">中文</a></p>

*Traducido del README en inglés, que es la versión de referencia. Las correcciones son bienvenidas.*

**Aprende inglés con tu uso diario de Claude Code.**

ESOL significa *English for Speakers of Other Languages*, inglés para hablantes de otras lenguas. cc-esol es una barra lateral para [Claude Code](https://claude.com/claude-code) con un coach de inglés pasivo: sigues escribiendo tus prompts como siempre, y el inglés que tecleas o dictas se corrige en un registro de aprendizaje que lees cuando quieras. La misma barra incluye el modo Focus, temas de terminal, controles de modelo y esfuerzo, un editor de status line y un botón de voz.

## Cómo funciona

1. Abre la barra lateral, activa el coaching (**On**) en la pestaña ESOL y elige tu idioma.
2. Cada prompt que escribes en inglés se ejecuta exactamente igual que antes. Claude, el mismo modelo con el que ya hablas, escribe una versión nativa con los motivos en un único archivo local: `~/.claude/english-learning/learning.md`.
3. La pestaña lista tus correcciones, de la más reciente a la más antigua. **Review** pide al modelo que lea el registro y responda dentro de la pestaña: patrones recurrentes, interferencia de tu idioma, si van desapareciendo, tres ejercicios.

<img src="docs/screenshots/esol-tab.png" alt="La pestaña ESOL: las últimas correcciones, una abierta con el original, la versión nativa y los motivos" width="420">

Los prompts en tu idioma se dejan en paz, igual que los comandos de barra, las respuestas cortas ("yes", "continue") y los prompts escritos en otro alfabeto. El inglés que ya es natural no se registra. Los apóstrofos que faltan en contracciones ("dont", "im", "thats") se ignoran como velocidad de tecleo; las elecciones de palabra (its/it's, your/you're, their/they're) sí se corrigen. Una sola palabra de tu idioma dentro de un prompt en inglés se trata como una laguna de vocabulario: la entrada te da el término en inglés.

## Háblalo

La forma más rápida de practicar es dictar. Claude Code tiene su propio dictado por voz (`/voice`), y el botón **Voice** junto al botón de la esquina lo activa, lo desactiva y muestra su estado. El coach corrige el inglés de la transcripción, no tu pronunciación; una palabra que el reconocedor probablemente oyó mal se marca con `[STT?]` en vez de contar como error gramatical. Mantén el idioma del dictado en inglés en `/config`: hablar tu idioma con él produce texto confuso, lo que te empuja hacia el inglés.

El dictado por voz es una función de Claude Code, no de este plugin. Requiere iniciar sesión con una cuenta de claude.ai (no funciona con clave de API, Bedrock, Vertex AI ni Foundry), un micrófono local (no por SSH ni en la web) y Claude Code 2.1.69 o más reciente; la transcripción en sí no consume tokens. Detalles en la [documentación de dictado por voz de Claude Code](https://code.claude.com/docs/es/voice-dictation).

## Privacidad y costo

**Adónde van tus palabras**

- El registro es un único archivo local, `~/.claude/english-learning/learning.md`, compartido por todos los proyectos por defecto. Define `ENGLISH_COACH_LOG` para moverlo, por ejemplo a una carpeta de notas sincronizada. El plugin no envía nada a ningún sitio por su cuenta.
- Las correcciones las escribe el modelo con el que ya hablas, como una llamada a la herramienta `english_log` del plugin, que forma parte de tu conversación. Tu prompt y su corrección viajan por la misma API que el resto de la sesión, y por ninguna otra.
- **Review** envía el registro (como máximo sus 150.000 caracteres más recientes) al modelo en una sola petición y guarda la respuesta en el store del plugin, un archivo JSON en `~/.claude/plugins/store/cc-esol_*.json`. El comando `/cc-esol:english-review` hace lo mismo en la transcripción, listando todas las entradas.
- Para borrarlo todo: elimina el archivo del registro, y elimina el archivo del store para descartar la review guardada y los ajustes (el coaching vuelve a Off). Desinstalar el plugin deja el registro en su sitio.

**Cuánto cuesta** (estimaciones, a unos cuatro caracteres por token)

- Themes, Model, Status line, Voice e Icons: nada. Leen lo que Claude Code ya emite y nunca añaden nada a una petición.
- Coaching de ESOL, activado: unos 700 tokens de reglas en la descripción de la herramienta `english_log`, enviados con la lista de herramientas y cacheados; unos 40 tokens junto a cada prompt en inglés; y cada corrección es una llamada a herramienta de unos 150 a 300 tokens de salida, que se queda en la conversación. Desactivado: nada, la herramienta espera detrás de ToolSearch.
- Focus, activado: unos 350 tokens para la herramienta `focus_progress`, también cacheados; unos 35 tokens junto a cada prompt; y las actualizaciones de Claude, unos 100 tokens de salida para un plan y 25 más por paso, enviados junto con sus otras llamadas a herramientas. Desactivado: nada.
- Para comparar: cada petición de Claude Code ya lleva decenas de miles de tokens de system prompt y definiciones de herramientas, así que la parte fija es pequeña; las correcciones son lo que crece con el uso. Activar o desactivar cualquiera de los dos reescribe la caché del prompt una vez.
- El plugin nunca cambia el system prompt de Claude Code: lo que le dice a Claude viaja en la descripción de sus propias herramientas y junto a tus prompts.

## El resto de la barra lateral

Haz clic en **💡 esol** abajo a la derecha, o escribe `/esol` (también `/esol model`, `/esol settings`, `/esol themes`, `/esol focus`, `/esol statusline`, `/esol editor`). Tres pestañas: **ESOL**, **Model**, **Settings**. **Tab** se mueve, **Enter** selecciona, **Esc** cierra. Junto al botón de la esquina, **Model** salta a la página Model y **Voice** activa o desactiva el dictado.

<img src="docs/screenshots/footer.png" alt="El pie: las tres líneas de ccstatusline, luego el botón de la esquina, Model y Voice on" width="720">

### Model

El modelo (Fable, Opus, Sonnet, Haiku o el predeterminado de Claude Code), el esfuerzo de low a max y el modo de permisos con el que arrancan las sesiones nuevas. El cambio de modelo ejecuta el `/model` del propio Claude Code; el esfuerzo se aplica a cada petición y se recuerda; el modo de la sesión en curso cambia con **shift+tab**, y la elección aquí se guarda como `permissions.defaultMode`.

<img src="docs/screenshots/model.png" alt="La página Model: chips de modelo, chips de esfuerzo de low a max, el modo en curso y el modo de las sesiones nuevas" width="420">

### Focus

Una banda sobre el prompt con el título de la tarea, un reloj, una barra de progreso y los pasos. Con Focus activado, Claude envía su plan a la herramienta propia de la banda, `focus_progress`, antes de una tarea de más de dos llamadas a herramienta, y luego el número de cada paso cuando empieza, así que cada línea pasa de pendiente a en curso y a terminada; la lista de todos, las tasks o un plan aprobado en plan mode también alimentan la banda cuando la sesión los tiene. Bajo el paso en curso queda un feed de las últimas llamadas a herramienta tal como el propio Claude las describió ("Read the settings page and its tests"): haz clic en una fila, o llega a ella con ctrl+x tab, para abrir lo que la llamada ejecutó y las primeras líneas que imprimió, y otra vez para cerrarla; las llamadas se quedan hasta tu siguiente prompt. Las llamadas y los resultados de herramientas desaparecen de la transcripción con Focus activado, salvo una llamada que falló o fue interrumpida; ctrl+o muestra todas las llamadas completas. El fin del turno con pasos pendientes pausa la banda, y un turno interrumpido o con error lo dice; tu siguiente prompt la reanuda. `[–]` la encoge a una línea. Colores: blue, dark, light, green, pink, rainbow o uno personalizado.

<img src="docs/screenshots/focus-band.png" alt="La banda Focus sobre el prompt: el título, el reloj y el recuento de llamadas de la tarea, la barra de progreso, los pasos con sus relojes, el paso en curso resaltado y sus llamadas debajo" width="860">

En el diseño a pantalla completa, tres issues abiertas de Claude Code ([#102893](https://github.com/anthropics/claude-code/issues/102893), [#104197](https://github.com/anthropics/claude-code/issues/104197), [#104462](https://github.com/anthropics/claude-code/issues/104462)) pueden hacer que la rueda salte o que la última fila parpadee en las filas ocultas.

### Themes

Más de cien temas de color de terminal de [terminalcolors.com](https://terminalcolors.com), descargados una vez en `~/.claude/cc-esol/themes/`. Haz clic en uno: los colores de Claude Code lo siguen (escritos como `~/.claude/themes/cc-esol.json` y definidos en `~/.claude/settings.json`; reinicia una vez la primera vez, en vivo después) y también el fondo del terminal en Windows Terminal (durante la sesión, luego restaurado) y en terminales que aceptan colores OSC (Ghostty, iTerm2, kitty, WezTerm, Terminal.app). **Claude Code default** devuelve los colores originales.

<img src="docs/screenshots/themes.png" alt="La página Themes: una lista de temas con búsqueda, cada uno con su muestra de ocho colores, el elegido marcado" width="420">

### Status line y Layout Editor

La página Status line instala, comprueba y elimina [ccstatusline](https://github.com/sirmalloc/ccstatusline), una status line de terceros. Install escribe el bloque `statusLine` en `~/.claude/settings.json` (guardando lo que había, para Uninstall) y una configuración inicial donde no existe ninguna; una status line que definiste tú se muestra y se deja en paz. **Layout Editor** edita `~/.config/ccstatusline/settings.json` en el sitio: líneas, widgets, colores, powerline y disposición, con una vista previa en vivo dibujada por tu propio comando de status line. Save ensaya el candidato de la misma forma, hace copia de seguridad del archivo y lo reemplaza en un solo paso, conservando todo lo que no edita. Detalles en [docs/statusline.md](docs/statusline.md).

<p>
<img src="docs/screenshots/statusline.png" alt="La página Status line: Layout Editor, Check version, Remove the statusLine setting y el aviso sobre ccstatusline" width="420">
<img src="docs/screenshots/layout-editor.png" alt="El Layout Editor: las tres líneas, los widgets de una con sus colores, la vista previa en vivo" width="420">
</p>

### Settings

El interruptor de Focus y su color, el tema como un chip con su nombre, la status line y el juego de iconos (Nerd Font, Unicode o Auto: Nerd Font cuando tu configuración de ccstatusline dibuja powerline, así que nunca se instala ni se exige ninguna fuente).

<img src="docs/screenshots/settings.png" alt="La pestaña Settings: Focus On/Off y el chip del color de Focus, el tema como un chip con su nombre, el chip de la status line y, al final, el juego de iconos" width="420">

## Requisitos e instalación

Claude Code 2.1.299 o más reciente, en macOS, Linux o Windows. Desarrollado y probado en la 2.1.306.

```
claude plugin marketplace add rapha-rodrigues/cc-esol
claude plugin install cc-esol@esol --scope user
```

Ejecuta `/reload-plugins` o abre una sesión nueva, luego haz clic en **💡 esol** o escribe `/esol`. Para actualizar:

```
claude plugin marketplace update esol && claude plugin update cc-esol@esol
```

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

Veinte idiomas para elegir en los ajustes de ESOL, u **Other** con el nombre escrito. El idioma solo le dice al coach qué hábitos de interferencia buscar; el filtro que decide si un prompt está en inglés no sabe nada de tu idioma, así que funciona con cualquiera. La barra lateral en sí habla inglés.

## Problemas frecuentes

- **No aparece ninguna entrada.** Abre los Settings de la pestaña ESOL y comprueba que el coaching está On. Los hooks se cargan al iniciar la sesión: reinicia Claude Code o ejecuta `/reload-plugins` después de instalar o actualizar.
- **Un prompt en mi idioma fue corregido.** Sus palabras en inglés alcanzaron el umbral (préstamos como push, merge o fix cuentan). Sube el umbral en Settings. Claude también omite un mensaje que ve que no está en inglés.
- **Un prompt en inglés no fue corregido.** Pocas de sus palabras son inglés cotidiano (prompts cortos y llenos de jerga). Baja el umbral o el mínimo de palabras en Settings.
- **El botón Voice dice que `/voice` no está disponible.** Inicia sesión con una cuenta de claude.ai (`/login`); el dictado no funciona con clave de API ni con un proveedor de terceros.
- **El registro no deja de crecer.** Nada lo poda. Archívalo con un rename; la siguiente entrada recrea el archivo. Pasados 4 MiB la pestaña deja de mostrar la vista previa y Review pide archivar primero.
- **Un aviso dice que se omitió un hook de cc-esol.** Con una sesión iniciada en una cuenta Team o Enterprise, la protección integrada de Claude Code (`cc-plugin-sec-default`) mantiene a los plugins del usuario lejos del system prompt y de los eventos de hook clásicos, y lo dice en la transcripción. cc-esol está construido sobre lo que pasa, así que el coaching, la banda y el resto funcionan como se describe; lo único que se pierde ahí es la fila "Running in" de la página Model, que nunca llega a saber el modo de permisos actual (shift+tab sigue cambiándolo). Nada que configurar.
- Más en [docs/english-coach.md](docs/english-coach.md) y [docs/statusline.md](docs/statusline.md).

## Desarrollo

```
claude --plugin-dir ./plugins/cc-esol
claude plugin validate ./plugins/cc-esol
claude plugin test ./plugins/cc-esol
```

Las releases siguen [docs/releasing.md](docs/releasing.md); los cambios están en [CHANGELOG.md](CHANGELOG.md).

## Licencia y créditos

[MIT](LICENSE).

[ccstatusline](https://github.com/sirmalloc/ccstatusline) es un proyecto aparte de Matthew Breedlove, con licencia MIT; nada de él viene en este plugin, que solo lo recomienda, lo instala y edita su configuración. Los temas de terminal vienen de [terminalcolors.com](https://terminalcolors.com) y se descargan en tiempo de ejecución, a petición tuya; ninguno de ellos viene aquí tampoco.
