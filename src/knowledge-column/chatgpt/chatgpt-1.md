---
title: 秋招临近，如何巧用 ChatGPT 帮你金九银十斩获各路大厂 Offer？
---

## 前言

大家好，我是「周三不Coding」。

最近，很多互联网公司秋招提前批已经开始，相信小伙伴们一定在疯狂地备战秋招面试中。

在我之前的几篇文章中，也分享过我准备春招、面试大厂的一些经验。

今天，我们再来结合今年最火热的 ChatGPT，教一下大家如何利用 ChatGPT，提高面试准备效率，尽快全面掌握面试知识点，在秋招提前批中拿到大厂门票！

## 提示工程 Prompt Engineering

在开始正式的内容前，先给大家补充一下提示工程 「Prompt Engineering」 相关的知识～

Prompt Engineering 是伴随 ChatGPT 火起来的一个高杠杆的技术。

Prompt 简单理解就是给 ChatGPT 等 AI 模型的指令，这个指令可以是一个简单的问题、一段材料、一段代码。在不久的将来，也可能是几张图片、一段语音、一段视频。AI 模型会基于此，生成相对应的回复。

而 Prompt Engineering 则是一门工程技术，通过设计与优化 Prompt，使得 AI 模型输出更加准确、更符合预期的结果。

举个🌰，一个低质量的 Prompt 如下：

```
请给我列举一些面试常见的题目。
```

这是一个非常模糊的问题，没有说明题目类型、题目数量、额外限定条件。那么 AI 模型就会输出模糊、不符合预期的结果。

优化后的 Prompt 如下：

```
请给我列举 10 道 Java 基础高频面试题。你只需要列举问题，不需要提供答案。
```

如此一来，AI 模型最后输出的结果大概率是符合我们预期的。这里我们除了加入数量、类型等前提外，还做了额外的限定。这个技巧叫 「To do and Not to do」

> Prompt Engineering 还有其他技巧，比如 Basic Prompt Framework / CRISPE Prompt Framework，Role Prompting、Few-Shot Prompting 等 Prompt Skill。大家有兴趣的话，我之后再专门写一篇文章介绍一下～

大家简单了解一下 PE 即可，在使用 ChatGPT 的时候，尽可能将指令描述清楚。接下来，我们进入正式内容！

我们可以通过三个角度，利用 ChatGPT 辅助我们高效准备面试！

-   列举面试题目
-   模拟面试
-   分析、复盘面试

## 列举面试题目

在准备面试的过程中，我们会花费很多时间去搜集面试题，而其中很多面试题都是比较经典的，很长一段时间内都不会有变化。因此，我们可以让 ChatGPT 帮我们做这件事情。

在这个部分，我们需要用到 Role Prompting，通俗易懂点来说就是给 ChatGPT 预设置一个角色。示例如下：

![image-20230712235059787](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ed2115ebdf9d48b8a07b1060d95012b4~tplv-k3u1fbpfcp-zoom-1.image)

接下来，我们便可以直接让 ChatGPT 帮忙列举题目。

![image-20230712235250017](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/502d0ba6e9ad45cb99116508619258e0~tplv-k3u1fbpfcp-zoom-1.image)

大家可以看到，ChatGPT 列举的题目中有一些还是比较热门的，比如重载和重写的区别、多线程、同步异步、反射、String 等题目。

通过这种方法，便可以生成各种领域的技术面试题目，就不需要在网上找各种低质量的面试题库啦～

之后，我们也可以让 ChatGPT 给出每道题目的答案。不过它给出的答案可能比较理论化，如果基础掌握不扎实的同学，还是建议去搜索一下具体的实战案例，并加以理解，不盲目地使用 ChatGPT。

这里拓展思路为：**ChatGPT 辅助制作一个面试知识库**。

-   如果你对于面试题目掌握的比较好，可以鉴别 ChatGPT 生成的问题答案是否正确，那么你可以快速生成答案，并将其以 Markdown 文档的形式记录在 Vuepress 这种静态网站中，便于之后反复复习。

## 模拟面试

我们还可以让 ChatGPT 帮我们做免费的 “模拟面试”，检验一下我们的复习成果，这一下子就省了一笔找人模拟面试的钱！

我们仍然需要用到 Role Prompting 技巧，给 ChatGPT 预设一个技术面试官的角色，示例如下：

![image-20230713000303263](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a8b791e63e564dc999d00c5ce64a7c01~tplv-k3u1fbpfcp-zoom-1.image)

接着，我们给出一份面试题目列表，并测试一下：

![image-20230713000341169](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3bd759b70f40488c826404d62ebd829a~tplv-k3u1fbpfcp-zoom-1.image)

当 ChatGPT 给出题目的时候，我们便可以在心里想一下这道题目的答案，看看自己会不会。

-   如果不会，则记录下来，用于之后反复复习
-   否则，就继续进行下一道

这里我给出的面试题目比较少，所以看起来效果没那么明显。大家在给面试题目列表的时候，最好随机选择一些题目，题目数量多一些，这样模拟面试的复习效果更好。

顺便提一下我之前安利的一个开源框架：「Dify」，我在 [这篇文章](https://juejin.cn/post/7247906556229828645) 中有详细讲解它的使用。

- 我们可以将大量的面试题目制作为一份「面试数据集」，输入到 GPT 语言模型中作为它的上下文，这样就不会存在数量限制啦，输出题目更加随机，翻倍提升效率！

## 面试复盘

我们可以将自己对于面试题目的回答输入给 ChatGPT，让它从各个维度判断一下回答的是否正确、是否完美，并提出可以改善的地方。

这个对于 HR 面试来说很有用，HR 面试中会涉及到各种行为面试题，ChatGPT 很擅于分析和回答此类题目。

首先，我们先定义一个「面试评判者」的角色：

![image-20230713001622878](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/184d4bf2083748ba8ed0b229f08cb1e8~tplv-k3u1fbpfcp-zoom-1.image)

接着，我们抛出一个 HR 面试中的经典问题：你认为你最大的缺点是什么？

![image-20230713001700527](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2db7167d1a0b40d0a5bd88c83990fcbb~tplv-k3u1fbpfcp-zoom-1.image)

让我们看看 ChatGPT 如何回答！

![image-20230713001742839](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/334a9c459b2841ac976fa8aa89e3e13b~tplv-k3u1fbpfcp-zoom-1.image)

ChatGPT 给出的回答确实可圈可点，根据我们之前的角色定义，分析了回答表现良好的地方和表现不足的地方，并给出了提升建议和示范回答。

由此可见，我们确实可以利用 ChatGPT 来帮助我们找到面试中的问题所在，进行及时的复盘。

> 突然想到一个 💡：让 ChatGPT 评判一下这篇文章，让它帮忙改一改哈哈哈哈～

## 总结

以上就是今天要分享的全部内容啦～

大家在使用之前，需要简单了解一下 Promp Engineering，在使用过程中，尽可能多地加入一些细节，把 ChatGPT “调教” 得更加符合预期，让它帮助你高效率地准备面试～

如果这篇文章对你有帮助的话，麻烦帮忙点个赞支持一下呀，蟹蟹啦！

如果大家还有什么关于 ChatGPT 辅助准备面试的小技巧，可以评论分享一下～下期再见！