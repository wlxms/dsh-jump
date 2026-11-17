# dsh-jump

IDE 跳转的 DSH 子插件适配层。当前是**骨架**，不是完整实现。

## 为什么独立

- IDE 探测、最近工作区匹配、复用窗口、启动 CLI 与 EHM 渲染无关
- 以后其他 DSH 插件也可以调用 `/ide-jump/open`
- 核心算法以后可以再抽成零依赖的 `ide-jump-core`

## 目录规划

```text
dsh-jump/
├─ lib/
│  ├─ index.js       # 当前：Host 骨架 /ide-jump/health
│  └─ core/          # 迁移后：catalog / detect / windows / workspace / launch
├─ cordis.patch.yml
├─ dsh.plugin.json
├─ package.json
└─ README.md
```

## 计划接口

```text
GET  /ide-jump/health
GET  /ide-jump/ides
POST /ide-jump/settings   { jumpIde }
POST /ide-jump/open       { file, line?, column? }
```

## 依赖方向

```text
dsh-ehm  ──调用──>  dsh-jump /ide-jump/*
dsh-jump ──不依赖──> dsh-ehm
dsh-jump ──不依赖──> enhance-mermaid
```

## 迁移原则

1. 先把核心算法从 `dsh-ehm/lib/index.js` 移到 `dsh-jump/lib/core/`
2. dsh-ehm 的 `/ehm/open` 改为请求 `dsh-jump`，失败时回退 DSH 内置
3. 设置从 `~/.dsh-ehm/settings.json` 迁移到 `~/.dsh-jump/settings.json`，保留旧值回退
4. 最后再考虑抽零依赖 `ide-jump-core`
