<p align="center"><img src="docs/icon.svg" width="96" alt=""></p>

# cc-esol

<p align="center"><a href="README.md">English</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.es.md">Español</a> · <b>中文</b></p>

<p align="center"><a href="https://mods.aidojo.si/mods/rapha-rodrigues--cc-esol--cc-esol/"><img src="docs/awesome.re-svg-1.svg" alt="Mentioned in an Awesome list"></a> <a href="https://mods.aidojo.si/mods/rapha-rodrigues--cc-esol--cc-esol/"><img src="https://raw.githubusercontent.com/karanb192/awesome-claude-code-mods/main/badges/rapha-rodrigues--cc-esol--cc-esol-reach.svg" alt="reach"></a> <a href="https://mods.aidojo.si/mods/rapha-rodrigues--cc-esol--cc-esol/"><img src="https://raw.githubusercontent.com/karanb192/awesome-claude-code-mods/main/badges/rapha-rodrigues--cc-esol--cc-esol-validates.svg" alt="validates"></a></p>

*由英文 README 翻译而来，英文版为准。欢迎修正。*

**在每天使用 Claude Code 的过程中学英语。**

ESOL 是 *English for Speakers of Other Languages* 的缩写，意为“面向其他语言使用者的英语”。cc-esol 是 [Claude Code](https://claude.com/claude-code) 的一位被动英语教练：你照常写 prompt，你打字或口述的英语会被纠正并写进一份学习日志，想看的时候再看。它只做纠正这一件事，所以能与你已在使用的专注、主题或状态栏类 mod 共存。

## 工作方式

1. 点击 prompt 下方的 **💡 esol**，打开 **Settings**，把 coaching 设为 **On**，选择你的母语。
2. 你用英语写的每个 prompt 都和以前一样执行。Claude，也就是你正在对话的那个模型，会把它的地道英语版本连同原因写进一个本地文件：`~/.claude/english-learning/learning.md`。
3. 面板按时间倒序列出你的纠正。**Review** 让模型读取日志并在面板内作答：反复出现的模式、来自母语的干扰、这些问题是否在减少，以及三个练习。

<img src="docs/screenshots/esol-tab.png" alt="ESOL 面板：最近的纠正，其中一条展开，显示原文、地道版本和原因" width="420">

用你母语写的 prompt 不会被处理，斜杠命令、简短回复（"yes"、"continue"）以及用其他文字书写的 prompt 也一样。已经地道的英语不会被记录。缩写中缺少的撇号（"dont"、"im"、"thats"）视为打字速度问题而忽略；用词选择（its/it's、your/you're、their/they're）会被纠正。英语 prompt 里夹着的一个母语单词被视为词汇空缺：条目会给出对应的英语说法。

## 开口说

练习最快的方式是口述。Claude Code 自带语音听写（`/voice`），灯泡旁的 **Voice** 按钮负责开关并显示状态。教练纠正的是转录文本的英语，不是你的发音；识别器很可能听错的词会被标记为 `[STT?]`，而不算作语法错误。在 `/config` 里把听写语言保持为英语：用它说母语会得到乱码文本，这会推动你去说英语。

语音听写是 Claude Code 的功能，不是本插件的。它需要登录 claude.ai 账号（API key、Bedrock、Vertex AI 或 Foundry 下不可用）、本地麦克风（SSH 或网页版不可用）以及 Claude Code 2.1.69 或更新版本；转录本身不消耗 token。详见 [Claude Code 语音听写文档](https://code.claude.com/docs/en/voice-dictation)。

## 面板

点击 prompt 下方的 **💡 esol**，或输入 `/esol`。**Tab** 移动，**Enter** 选择，**Esc** 关闭。灯泡和 **Voice** 位于 Claude Code 及你的其他 mod 在这一行所绘内容的旁边。面板跟随 Claude Code 的主题；其他 mod 的面板打开时它会自行关闭，所以侧栏一次只显示一个。

在找 cc-esol 1.x 里的 Focus 横幅、Model 页面、主题或状态栏编辑器？它们现在是一个独立插件：[cc-focusdeck](https://github.com/rapha-rodrigues/cc-focusdeck)。

## 隐私与成本

**你的文字去了哪里**

- 日志是一个本地文件，`~/.claude/english-learning/learning.md`，默认所有项目共用。设置 `ENGLISH_COACH_LOG` 可以把它移到别处，比如一个会同步的笔记文件夹。插件自己不会把任何内容发送到任何地方。
- 纠正由你正在对话的模型写出，形式是对插件 `english_log` 工具的一次调用，它是你对话的一部分。你的 prompt 和它的纠正走的是本次会话使用的同一个 API，没有其他去处。
- **Review** 会把日志（最多最新的 150,000 个字符）在一次请求中发给模型，并把回答保存在插件的 store 里，即 `~/.claude/plugins/store/cc-esol_*.json` 这个 JSON 文件。`/cc-esol:english-review` 命令在对话记录中做同样的事，并列出每一条目。
- 要全部删除：删掉日志文件；删掉 store 文件可以丢弃保存的 review 和设置（coaching 回到 Off）。卸载插件不会动日志。

**它的成本**（估算，约四个字符算一个 token）

- coaching 开启时：`english_log` 工具描述中的规则约 700 个 token，随工具列表发送并被缓存；每个英文 prompt 旁边约 40 个 token；每次纠正是一次工具调用，约 150 到 300 个输出 token，并留在对话里。关闭时：没有开销，工具在 ToolSearch 后面等待。
- Voice：没有开销。它只读取 Claude Code 本来就会产生的信息，从不往请求里添加内容。
- 作为参照：Claude Code 的每次请求本来就带有数万个 token 的 system prompt 和工具定义，所以固定部分很小；随使用增长的是纠正本身。开启或关闭 coaching 会重写一次 prompt 缓存。
- 插件从不修改 Claude Code 的 system prompt：它对 Claude 说的话随自己工具的描述以及你的 prompt 一起传送。

## 要求与安装

Claude Code 2.1.299 或更新版本，macOS、Linux 或 Windows。在 2.1.310 上开发和测试。

```
claude plugin marketplace add rapha-rodrigues/cc-esol
claude plugin install cc-esol@esol --scope user
```

运行 `/reload-plugins` 或开启新会话，然后点击 **💡 esol** 或输入 `/esol`。更新：

```
claude plugin marketplace update esol && claude plugin update cc-esol@esol
```

**从 1.x 升级：** coaching 的设置和学习日志都会保留。Focus、Model 页面、主题和状态栏已移到 [cc-focusdeck](https://github.com/rapha-rodrigues/cc-focusdeck)，它从自己的设置开始：升级前，先在 Themes 页面选择 **Claude Code default**，并处理完状态栏任何未完成的 Uninstall 或 Put it back，然后在那里重新设置。

**从 `--plugin-dir` 检出升级：** 插件的 store 按安装来源区分，所以从 marketplace 安装会以默认设置开始（coaching Off，没有保存的 review）。学习日志不受影响：它在 store 之外。

<details>
<summary><b>用 AI 代理安装</b></summary>

把你的编码代理指向本仓库，让它安装插件。代理的步骤：

1. 运行 `claude --version`；必须是 2.1.299 或更高。
2. 运行 `claude plugin marketplace add rapha-rodrigues/cc-esol`。
3. 运行 `claude plugin install cc-esol@esol --scope user`。
4. 确认 `claude plugin list` 显示 `cc-esol` 已启用，然后让用户运行 `/reload-plugins`。

在 Windows 的 Git Bash 中运行时，路径请使用正斜杠。

</details>

## 语言

教练设置里有二十种语言可选，或选 **Other** 并输入名称。语言只告诉教练该留意哪种母语干扰；判断一个 prompt 是否为英语的门槛对你的语言一无所知，因此适用于任何语言。面板本身使用英语。

## 常见问题

- **没有出现任何条目。** 打开面板的 Settings，确认 coaching 是 On。hook 在会话启动时加载：安装或更新后重启 Claude Code，或运行 `/reload-plugins`。
- **我母语的 prompt 被纠正了。** 它的英语单词达到了阈值（push、merge、fix 这类借词也算）。在 Settings 里调高阈值。Claude 看出一条消息不是英语时也会跳过它。
- **一条英语 prompt 没被纠正。** 它里面的日常英语单词太少（简短、满是术语的 prompt）。在 Settings 里调低阈值或最少词数。
- **Voice 按钮显示 `/voice` 不可用。** 用 claude.ai 账号登录（`/login`）；听写在 API key 或第三方提供商下不可用。
- **日志一直在变大。** 没有任何机制修剪它。重命名归档即可；下一条目会重新创建文件。超过 4 MiB 后面板停止预览，Review 会要求先归档。
- **提示说 cc-esol 的某个 hook 被跳过。** 1.0.1 之前的版本使用了两个经典 hook 事件，而在 Team 或 Enterprise 账号上，Claude Code 内置的防护（`cc-plugin-sec-default`）会对用户插件屏蔽这些事件，并在每个 prompt 和每次工具调用时提示。更新插件后提示即消失；cc-esol 在任何账号上的表现都相同。
- 更多内容见 [docs/english-coach.md](docs/english-coach.md)。

## 开发

```
claude --plugin-dir ./plugins/cc-esol
claude plugin validate ./plugins/cc-esol
claude plugin test ./plugins/cc-esol
```

发布流程见 [docs/releasing.md](docs/releasing.md)；变更记录在 [CHANGELOG.md](CHANGELOG.md)。

## 更多 Claude Code 插件

[cc-focusdeck](https://github.com/rapha-rodrigues/cc-focusdeck)，同一作者：在 prompt 上方显示任务进度的 Focus 横幅、模型与 effort 控制、终端主题和状态栏编辑器。可与 cc-esol 一起安装，也可单独安装。

## 许可

[MIT](LICENSE)。
