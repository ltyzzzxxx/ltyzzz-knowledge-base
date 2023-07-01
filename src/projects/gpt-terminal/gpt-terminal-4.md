---
title: 我是如何让我的 GPT “长记性” 的？轻松实现有 “记忆” 的 GPT！
---

## 专栏目录

> [耗时一下午，我实现了 GPT Terminal，真正拥有了专属于我的 GPT 终端！](https://juejin.cn/post/7243252896392151097)
>
> [如何用 GPT 在 5 分钟内 ”调教“ 出一个专属于你的 ”小黑子“？](https://juejin.cn/post/7244174817679573047)
> 
> [如何丝滑实现 GPT 打字机流式回复？Server-Sent Events！](https://juejin.cn/post/7244604894408933432)
> 
> [我是如何让我的 GPT Terminal “长记性” 的？还是老配方！](https://juejin.cn/post/7245812754027823160)
>
> [一个合格的类 GPT 应用需要具备什么？一文带你打通 GPT 产品功能！](https://juejin.cn/post/7246435689419604026)
> 
> [开发一个 ChatGPT 真的只是当 "接口侠" 吗？GPT Terminal 细节分享！](https://juejin.cn/post/7246917539766091837)
> 
> [如何借助于 OpenAI 以命令的方式在 GPT 终端上画一只 “坤”？](https://juejin.cn/post/7247167843498115130)
>
> [不满足当 ChatGPT “接口侠”？轻松可视化 Fine-tuning 训练你的模型！](https://juejin.cn/post/7247906556229828645)
>
> [耗时一下午，我终于上线了我的 GPT 终端！（内含详细部署方案记录）](https://juejin.cn/post/7250639505527504933)

项目地址：[github.com/ltyzzzxxx/g…](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fltyzzzxxx%2Fgpt-web-terminal "https://github.com/ltyzzzxxx/gpt-web-terminal")

最新进度：目前已实现 `GPT` 在线角色 `DIY` 功能，还在处理细节中...

欢迎大家Star、提出 Issue & PR，一起快乐地用 `GPT Terminal` 玩耍吧～

## 前言

今天继续来教大家如何玩转 `OpenAI` 接口！

自从 `ChatGPT` 横空出世之后，市面上就涌现了大量的类 GPT 应用（网站、公众号、小程序、App等等），它们和 `ChatGPT` 提供的功能几乎不相上下。这一切都是源于 `OpenAI` 为开发者们提供了 `SDK` 与 `API` 服务，使得大家能够欢乐地调用接口～

然而，如果你不懂得如何使用它提供的服务，那么做出来的 `GPT` 应用与市面上的相比，可能有许多缺陷。今天，我就先带大家功克第一个缺陷：如何让你做的 `GPT` 应用长长 “记性” ！我会从理论与实战的角度，带大家制作出有 "记忆" 功能的 `GPT`！

## 接口分析

我们在发送消息时，都是请求 `OpenAI` 提供的 `createChatCompletion` SDK 或 去调用 `https://api.openai.com/v1/chat/completions` API 从而获取 `GPT` 响应。想必大家如果看过我之前写的文章，一定对这种方式不陌生。但是，如果你只是单纯地将当前用户的提问作为请求参数传递给接口中，`GPT` 只会给你返回当前问题的响应，它自身没有记录上下文的能力。因为，我们对于 `GPT` 的每次请求与响应，都是单独的，并不会被 `GPT` 所存储。

然而，在真实的聊天场景，与你聊天的人一定会知道对话的上下文。要想使得 `GPT` 更加智能，必须得具备这一特点。难道 OpenAI 团队不知道这一点吗？其实，解决方案还是老配方，答案还是藏在 `createChatCompletion`接口参数中！

大家应该还记得我在上上一篇[文章](https://juejin.cn/post/7244174817679573047)中，我通过以下流程实现了角色定制：

1. 在 `Markdown` 中按照模板格式，预先定义好角色信息以及具体问答 Case
2. 将其从 `Markdown` 格式转为了 `JSON` 对象数组
3. 请求 `createChatCompletion` 接口，参数 `messages` 即为转化好的对象数组

这时候聪明的大家估计已经想到了，这些预先定义好的角色信息和问答 Case，就是 `GPT` 可以参考的上下文啊！这样看来，要想让 `GPT` “长记性”，也可以通过这一思路实现！

我们只需要记录当前这次会话中，用户与 `GPT` 的聊天记录，并在下一次用户向 `GPT` 发送消息时，将之前的聊天记录与这次发送的消息一同作为 `createChatCompletion` 的 `messages` 参数，即可实现这一功能。

话不多说，我们开始实战环节！

## GPT Terminal 实战

### 存储方案

在前文中我们提到，需要将用户与 `GPT` 的聊天记录进行存储，所以我们需要确定存储方案。

在 `GPT Terminal` 项目中，我采用了 `LocalStorage` 前端存储技术以及 `Pinia` 状态管理框架来实现。

大家如果不熟悉 Pinia 语法，可以先看看基础教程或者直接跟着项目做一遍，用法很简单。

> 如下部分代码对应项目路径为：`src/core/commands/gpt/messagesStore.ts`

```js
import { defineStore } from "pinia";

interface Message {
  name: string;
  role: string;
  content: string;
}

export const useMessagesStore = defineStore("messages", {
  state: () => ({
    messages: [] as Message[]
  }),
  getters: {},
  persist: {
    key: "gpt-messages",
    storage: window.localStorage,
  },
  actions: {
    addMessage(msg: Message) {
      const {messages} = this.$state
      if (messages.length >= 20) {
        messages.shift()
      }
      messages.push(msg)
    },
    clearMessages() {
      this.$state.messages = []
    }
  }
})
```
在上面这段代码中，我定义了 `messages` 状态，添加了两个 `action`，分别为添加消息与清除消息， 并确定了 `LocalStorage` 的持久化方式。

其中，为了防止上下文堆积，我限制了 `messages` 数组的最大长度，也就是说最多只能存储 20 条聊天记录。如果超出 20 条之后，首元素就会被移除（类似于固定长度的双端队列）。

### 请求 GPT 服务

确定好存储方案后，我们需要在对应的 `Vue3` 组件中引入 `useMessagesStore`。

> 如下部分代码对应项目路径为：`src/core/commands/gpt/subCommands/chat/ChatBox.vue`

```js
// 引入 useMessagesStore
import { useMessagesStore } from "../../messagesStore"
// 用于将 messages 状态转为 Vue3 的 响应式数据
import { storeToRefs } from "pinia";

// 取出 messages
const messagesStore = useMessagesStore();
// 转化为 messages 响应式数据
const { messages } = storeToRefs(messagesStore);
```

引入之后，我们需要改变原先请求中传入的 `body` 参数，我们需要将 `messages` 历史聊天记录添加到 `body` 中。

```js
const response = await fetch('http://127.0.0.1:7345/api/gpt/get', {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  // 投喂历史消息
  body: JSON.stringify({
    message: [...(messages.value.map(({ role, content }) => ({ role, content }))), {
      role: "user",
      content: message.value
    }],
    role: role.value,
  }),
});
```

原有的后端服务不需要发生变化，其只需接受参数，并请求 `GPT` 服务即可。

请一定要记得，在我们请求结束后，将这次请求的对话记录到 `messages` 状态中！

```js
// 记录历史消息
messagesStore.addMessage({
  name: role.value,
  role: "user",
  content: message.value
})
messagesStore.addMessage({
  name: role.value,
  role: "assistant",
  content: output.value
})
```

通过以上简单的改造，我们便轻松地实现了有状态的 `GPT`！

## 成果

让我们检验一下我们实战的成果吧！

![iShot2023-06-18 16.07.32.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bbca4b54179748ca8833146f08d0c3cd~tplv-k3u1fbpfcp-watermark.image?)

此外，我还引入了查询历史对话记录的功能，即使你清屏或者关闭当前终端，也能够找回最近的对话记录（最多记录 20 条）。这里的方案也是通过 `Pinia` 实现的，我们只需要获取 `messages` 状态即可。下面简单为大家演示一下！具体实现方案，大家可以进入 [GPT Terminal](https://github.com/ltyzzzxxx/gpt-web-terminal) 查看具体代码实现细节哦！

![iShot2023-06-18-16.11.46.gif](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/920baed8a5a64b059a56ae0170435113~tplv-k3u1fbpfcp-watermark.image?)

## 总结

今天给大家展示了我在 `GPT Terminal` 中，是如何实现让 `GPT` 具有上下文的 “记忆” 功能。原理非常简单，只需要在请求接口的参数中传入历史聊天记录即可。

最后再小小地提一下，`GPT Terminal` 目前已经基本实现了主体功能啦，还有一些 Bug 需要修改，如果大家想要了解 [GPT Terminal](https://github.com/ltyzzzxxx/gpt-web-terminal) 项目的更多细节与解锁更多玩法的话，请到其主页查看哦。对了，如果各位小伙伴关于文章或项目有什么不懂的地方，直接提出 `Issue`，我会在 24 小时内回复！

看在我这么认真的份上，大家点个 Star、点个赞不过分吧（磕头！）下期再见！










