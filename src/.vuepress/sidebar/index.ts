import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/qa-column/": [
    {
      text: "MySQL问答",
      icon: "start",
      collapsible: true,
      prefix: "mysql/",
      children: []
    },
    {
      text: "Redis问答",
      icon: "start",
      collapsible: true,
      prefix: "redis/",
      children: ["1", "2", "3", "4"]
    },
    {
      text: "操作系统问答",
      icon: "start",
      collapsible: true,
      prefix: "operate-system/",
      children: []
    },
    {
      text: "计算机网络问答",
      icon: "start",
      collapsible: true,
      prefix: "computer-network/",
      children: []
    },
    {
      text: "分布式锁问答",
      icon: "start",
      collapsible: true,
      link: "distributed-lock"
    },
    {
      text: "设计模式问答",
      icon: "start",
      collapsible: true,
      link: "design-pattern"
    },
    {
      text: "消息队列问答",
      icon: "start",
      collapsible: true,
      link: "message-queue"
    }
  ],
  "/": [
    {
      text: "入站必看",
      icon: "eye",
      link: "home"
    }
  ]
})
