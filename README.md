# TestMe

TestMe 是一个面向航空类课程的在线自测工具，支持按章节练习、模拟考试和错题复习。打开即用，无需注册。

在线使用：[https://syenzzz.github.io/TestMe/](https://syenzzz.github.io/TestMe/)

## 功能

- 内置航空电子系统、飞机结构与部附件修理、航空动力装置结构与系统三门题库，可按作业章节练习或随机进行模拟考试。
- 支持单选、多选、判断、填空和简答题；答题卡显示进度并支持跳题。
- 提交后自动评分，展示逐题答案；错题加入复习队列，按间隔复习计划安排后续练习。
- 答题进度、成绩记录和复习数据保存在当前浏览器本地。清除浏览器数据或更换设备后不会自动同步。

## 本地开发

需要 Node.js 22 和 npm。

```bash
npm ci
npm run dev
```

访问终端输出的地址，默认路径为 `http://localhost:5173/TestMe/`。

```bash
npm test       # 运行测试
npm run build  # 类型检查并构建生产版本
npm run lint   # 运行 ESLint
```

## 项目结构

```text
src/
  components/  页面和界面组件
  data/        内置题库
  hooks/       答题状态
  parsers/     题目和文档解析工具
  utils/       评分、本地存储和间隔复习
  __tests__/   单元测试
public/        静态资源
.github/       GitHub Actions 部署工作流
```

项目使用 React、TypeScript、Vite、Tailwind CSS 和 Vitest。

## 部署

推送到 `master` 后，GitHub Actions 使用 Node.js 22 构建并部署到 GitHub Pages。Vite 的基础路径为 `/TestMe/`；部署到其他仓库路径时需相应调整 `vite.config.ts`。
