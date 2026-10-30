# TestMe

在线自测工具 — 选择章节，逐题作答，自动评分。专为纸质题库数字化自测设计。

## ✨ 功能

- **章节选择** — 按作业章节自由选取，题目独立，满分各 100 分
- **多种题型** — 单选题、多选题、判断题、填空题、简答题
- **实时答题卡** — 侧栏答题卡，已答/未答一目了然，点击可跳转
- **自动评分** — 提交后即时出分，展示正确率与题目解析
- **历史记录** — 答题成绩自动保存在浏览器本地

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS 4 |
| 测试 | Vitest + Testing Library |
| 部署 | GitHub Pages (Actions 自动部署) |

## 🚀 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 生产构建
npm run build
```

开发服务器默认运行在 `http://localhost:5173`。

## 📁 项目结构

```
src/
├── components/    # UI 组件
│   ├── HomePage.tsx      # 首页 — 章节选择
│   ├── QuizPage.tsx      # 答题页
│   ├── QuestionCard.tsx   # 题目卡片
│   ├── AnswerSheet.tsx   # 答题卡
│   ├── ResultPage.tsx    # 成绩页
│   └── ProgressBar.tsx   # 进度条
├── hooks/         # 自定义 Hook
│   └── useQuiz.ts
├── data/          # 题库数据
│   └── avionics-exam.json
├── types/         # 类型定义
│   └── index.ts
├── utils/         # 工具函数
│   ├── grading.ts
│   ├── similarity.ts
│   └── storage.ts
└── parsers/       # 解析器（预留扩展）
    └── questionParser.ts
```

## 📦 部署

推送至 `master` 分支，GitHub Actions 自动构建并部署到 GitHub Pages。

在线地址：https://syenzzz.github.io/TestMe/
