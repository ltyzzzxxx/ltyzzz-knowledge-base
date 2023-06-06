import { navbar } from "vuepress-theme-hope";

export default navbar([
  { 
    text: "入站必看", 
    icon: "eye", 
    link: "/home.md" 
  },
  {
    text: "问答自查",
    icon: "question",
    link: "/qa-column",
  },
  {
    text: "学习笔记",
    icon: "blog",
    link: "/learning-notes"
  },
  {
    text: "书单推荐",
    icon: "list",
    link: "/book-recommendations"
  },
  {
    text: "经验分享",
    icon: "share",
    link: "/experiences"
  },
  {
    text: "每日一学",
    icon: "clipboard-check",
    link: "/learning-everyday"
  },
  {
    text: "每月一读",
    icon: "book",
    link: "/reading-everyday"
  }
]);
