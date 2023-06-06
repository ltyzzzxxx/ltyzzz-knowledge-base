import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import { searchProPlugin } from "vuepress-plugin-search-pro";
import { autoCatalogPlugin } from "vuepress-plugin-auto-catalog";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "Tycho's Knowledge Base",
  description: "Tycho的个人知识库～",

  theme,

  plugins: [
    searchProPlugin({
      // 索引全部内容
      indexContent: true,
      // 为分类和标签添加索引
      customFields: [
        {
          getter: (page) => page.frontmatter.category,
          formatter: "分类：$content",
        },
        {
          getter: (page) => page.frontmatter.tag,
          formatter: "标签：$content",
        },
      ],
    }),
    autoCatalogPlugin({
      
    }),
  ],
  // Enable it with pwa
  // shouldPrefetch: false,
});
