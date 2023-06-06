import { navbar } from "vuepress-theme-hope";

export default navbar([
  { 
    text: "入站必看", 
    icon: "java", 
    link: "/home.md" 
  },
  {
    text: "问答自查",
    icon: "github",
    link: "/qa-column",
  },
  {
    text: "学习笔记",
    icon: "book",
    link: "/learning-notes"
  },
  {
    text: "书单推荐",
    icon: "book",
    link: "/book-recommendations"
  },
  {
    text: "经验分享",
    icon: "book",
    link: "/experiences"
  },
  {
    text: "每日一学",
    icon: "book",
    link: "/learning-everyday"
  },
  {
    text: "每月一读",
    icon: "book",
    link: "/reading-everyday"
  }
]);
