import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/qa-column/": [
    {
      text: "📖 MySQL 问答",
      collapsible: true,
      prefix: "mysql/",
      children: [
        "MySQL 基础",
        "MySQL 索引",
        "MySQL 事务",
        "MySQL 锁",
        "MySQL 日志",
        "MySQL 应用"
      ],
    },
    {
      text: "📖 Redis 问答",
      collapsible: true,
      prefix: "redis/",
      children: [
        "Redis 基础应用", 
        "Redis 线程模型", 
        "Redis 内存管理", 
        "Redis 持久化",
        "Redis 缓存常见问题",
        "Redis 性能评估",
        "Redis 事务",
        "Redis 集群",
        "Redis 应用",
      ],
    },
    {
      text: "📖 操作系统问答",
      collapsible: true,
      prefix: "operate-system/",
      children: [],
    },
    {
      text: "📖 计算机网络问答",
      collapsible: true,
      prefix: "computer-network/",
      children: [],
    },
    {
      text: "📖 分布式锁问答",
      collapsible: true,
      link: "distributed-lock",
    },
    {
      text: "📖 设计模式问答",
      collapsible: true,
      link: "design-pattern",
    },
    {
      text: "📖 消息队列问答",
      collapsible: true,
      prefix: "message-queue/",
      children: [],
    },
    {
      text: "📖 RPC 问答",
      collapsible: true,
      prefix: "rpc/",
      children: [
        "RPC 基本概念", 
        "RPC 实现方案", 
        "RPC 其他问题", 
      ],
    }
  ],
  "/experiences/": [
    {
      text: "成功入职字节！分享一些 Idea！",
      collapsible: true,
      link: "interview-experience",
    },
    {
      text: "在字节工作一个月，我总结了 10 条心得与体会。",
      collapsible: true,
      link: "work-experience",
    },
    {
      text: "应届生想要入职大厂，应该如何准备八股文？方法论分享！",
      collapsible: true,
      link: "bagu-experience"
    },
    {
      text: "如何从 0 到 1 落地你的第一个开源项目？破局分享！",
      collapsible: true,
      link: "opensource-experience"
    },
    {
      text: "深夜，我被自己 ”rm -rf“ 删库了...",
      collapsible: true,
      link: "rmrf-experience"
    },
    {
      text: "写博客一个月，我收获了什么？",
      collapsible: true,
      link: "blog-experience"
    }
  ],
  "/knowledge-column/microservice": [
    {
      text: "从根儿上学习微服务01：微服务的“前世今生”",
      collapsible: true,
      link: "microservice-1",
    },
    {
      text: "从根儿上学习微服务02：如何划分微服务？",
      collapsible: true,
      link: "microservice-2",
    },
    {
      text: "从根儿上学习微服务03：关于微服务技术，你需要掌握什么？",
      collapsible: true,
      link: "microservice-3",
    },
  ],
  "/knowledge-column/chatgpt": [
    {
      text: "1. 秋招临近，如何巧用 ChatGPT 帮你金九银十斩获各路大厂 Offer？",
      collapsible: true,
      link: "chatgpt-1",
    }
  ],
  "/projects/gpt-terminal": [
    {
      text: "🌟 GPT Terminal 项目 README",
      collapsible: true,
      link: "readme.md",
    },
    {
      text: "1. 耗时一下午，我实现了 GPT Terminal，真正拥有了专属于我的 GPT 终端！",
      collapsible: true,
      link: "gpt-terminal-1",
    },
    {
      text: "2. 如何用 GPT 在 5 分钟内 ”调教“ 出一个专属于你的 ”小黑子“？",
      collapsible: true,
      link: "gpt-terminal-2",
    },
    {
      text: "3. 如何丝滑实现 ChatGPT 打字机流式回复？Server-Sent Events！",
      collapsible: true,
      link: "gpt-terminal-3",
    },
    {
      text: "4. 我是如何让我的 GPT “长记性” 的？轻松实现有 “记忆” 的 GPT！",
      collapsible: true,
      link: "gpt-terminal-4",
    },
    {
      text: "5. 一个合格的 ChatGPT 应用需要具备什么？一文带你打通 GPT 产品功能！",
      collapsible: true,
      link: "gpt-terminal-5",
    },
    {
      text: "6. 开发一个 ChatGPT 真的只是当 “接口侠“ 吗？GPT Terminal 细节分享！",
      collapsible: true,
      link: "gpt-terminal-6",
    },
    {
      text: "7. 如何借助于 OpenAI 以命令的方式在 GPT 终端上画一只 “坤”？",
      collapsible: true,
      link: "gpt-terminal-7",
    },
    {
      text: "8. 不满足当 ChatGPT “接口侠”？轻松可视化 Fine-tuning 训练你的模型！",
      collapsible: true,
      link: "gpt-terminal-8",
    },
    {
      text: "9. 耗时一下午，我终于上线了我的 GPT 终端！（内含详细部署方案记录）",
      collapsible: true,
      link: "gpt-terminal-9",
    }
  ],
  "/learning-everyday": [
    {
      text: "📖 202211 ～ 202304",
      collapsible: true,
      link: "past",
    },
  ],
  "/": [
    {
      text: "入站必看",
      icon: "eye",
      link: "home",
    },
    {
      text: "关于我",
      icon: "info",
      link: "about-me",
    },
  ],
});
