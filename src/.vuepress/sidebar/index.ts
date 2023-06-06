import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/qa-column/": [
    {
      text: "Redis问答",
      icon: "start",
      collapsible: true,
      prefix: "redis/",
      children: ["1", "2", "3", "4"]
    },
    {
      text: "MySQL问答",
      icon: "start",
      collapsible: true,
      prefix: "mysql/",
      children: []
    },
  ]
})
