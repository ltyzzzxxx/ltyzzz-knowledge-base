---
title: 开发一个 ChatGPT 真的只是当 "接口侠" 吗？GPT Terminal 细节分享！
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

项目地址：[github.com/ltyzzzxxx/g…](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fltyzzzxxx%2Fgpt-web-terminal "https://github.com/ltyzzzxxx/gpt-web-terminal")

欢迎大家Star、提出PR，一起快乐地用 GPT Terminal 玩耍吧～

## 前言

相信大家在看了[上一篇](https://juejin.cn/post/7246435689419604026)的分享后，一定对于如何实现一个类 `GPT` 应用，做到了心中有数。当你自己去动手实现的时候，只需要依照之前列出的功能点，去寻找相应的解决方案即可。

在这篇文章，我想给大家分享一下我在面对这些问题时，是如何解决的。我会就上一篇文章提到的 `用户体验支撑功能`，逐一进行讲解。

> 对于 `基础功能` 部分的实现，大家可以参考专栏之前发布的文章，基本都会对应的讲解与实现方案

大家是不是看的有点困了？没关系，在这篇文章中，我会贴一些代码片段，给大家醒醒瞌睡！如果大家不满足于此的话，可以进入 [GPT Terminal](https://github.com/ltyzzzxxx/gpt-web-terminal) 的项目中，深入了解一下实现细节！

## 用户体验支撑功能

在开始正式讲解功能方案之前，先给大家展示一下 `GPT Terminal` 的 `Demo`，相信大家看了 `Demo` 之后再看文章讲解，一定会有更加形象深刻的印象与理解！


![iShot2023-06-20-22.40.50_2.gif](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e560fe144d1f4da799d5abdd3693a798~tplv-k3u1fbpfcp-watermark.image?)

### GPT 响应状态下，禁止用户输入

在[上一篇](https://juejin.cn/post/7246435689419604026)文章中，我们提到为了避免 `GPT` 上下文混乱，因此在 `GPT` 响应状态下，应禁止用户输入。在 `GPT Terminal` 中，我也同样实现了这一点。

我使用的是 `Vue3` 框架。在设计上，用户与 `GPT` 的聊天记录展示，我将其放置于 `ChatBox` 组件中。而用户在终端上的输入框是放置于外层的父组件 `GptTerminal` 组件中。

> 至于为什么要这样设计，是因为组件分工不同。`GptTerminal` 是负责整体终端，包括命令输入、命令执行发起、展示结果；而对应到命令输出的结果，是动态的，根据输入命令的不同，输出展示不同的组件。

为了实现响应状态下禁止用户输入这一功能，我采用了 `Vue` 的 `emit` 事件机制，通过此特性完成父子组件之间的通信。如果大家对这一特性不熟悉，可以先去简单了解一下官方的[示例](https://vuejs.org/guide/components/events.html)。

父组件 `GptTerminal.vue` 部分代码如下所示：
> 对应于项目中 src/components/gpt-terminal/GptTerminal.vue 文件

```js
// 处理 GPT 请求开始时的操作
const handleStart = () => {
  console.log("开始")
  isRunning.value = true
}

// 处理 GPT 请求结束后的操作
const handleFinish = () => {
  console.log("结束")
  isRunning.value = false
}
```
子组件 `ChatBox.vue` 部分代码如下所示：
> 对应于项目中 src/core/commands/gpt/subCommands/chat/ChatBox.vue 文件

```js
// 定义 emit 事件
const emit = defineEmits(['start', 'finish']);

// 发出请求前，子组件向父组件发送 `start` 事件
emit('start')
// 执行发送请求方法
getGptOutput()
// 请求响应结束后，子组件向父组件发送 `finish` 事件
emit('finish')
```

在这部分代码中，`isRunning` 主要是为了控制输入框是否可写，将其绑定到 `ant-design-vue` 中 `a-input` 组件的 `disabled` 属性。

- 在调用 GPT 接口之前，子组件向父组件发送 `start` 事件，父组件禁止用户输入
- 在结束 GPT 借口调用后，子组件向父组件发送 `finish` 事件，解除输入限制

### Loading 状态提示

在请求发送到 `GPT` 服务之后，`GPT` 服务响应之前，会有一定时间的停顿，以及国内用户访问 OpenAI 可能存在较高的网络延时，因此在这里是有必要设置 `Loading` 状态的。

为了在终端界面实现这一点，我想到了比较朴素的做法 - **定时器**。当用户发出命令的瞬间，即组件进入初始化状态，定时器便开始工作。

> 对应于项目中 src/core/commands/gpt/subCommands/chat/ChatBox.vue 文件

```js
// 如下代码位于 onMounted 初始化方法中
let count = 0;
let loadingInterval = setInterval(() => {
count++;
if (count > 3) {
  count = 0;
}
switch (count) {
  case 0:
    output.value = "正在加载内容中";
    break;
  case 1:
    output.value = "正在加载内容中.";
    break;
  case 2:
    output.value = "正在加载内容中..";
    break;
  case 3:
    output.value = "正在加载内容中...";
    break;
}
}, 500)
```

相信聪明的大家一看就懂，这不就是三个 `.` 符号无限循环，直至 `GPT` 开始响应回复。对的，就是这么简单！因为在终端界面，不需要有什么花里胡哨的组件，只需要简单地表明 `Loading` 即可。

但是，还有一个细节需要注意，当 `GPT` 开始响应后，一定要清空定时器与输出内容呀！

```js
// 清空定时器与输出
clearInterval(loadingInterval)
output.value = ""
```

### 网络超时提示

当用户使用我们的 `GPT Terminal` 时，可能会出现 `API Key` 配置错误或者根本无法访问 `OpenAI` 的网络问题。因此，我们不仅需要为用户显示 `Loading` 提示，还需要处理这些网络异常情况。

对于网络超时问题，我采用了 **延时器** 做法。当超过一段时间之后，若 `GPT` 仍然无法响应并回复，则需要为用户做出相应的超时提醒。

想必很聪明的大家应该已经想到了，我们这个三个功能有着紧密的关联。当延时器到达指定时间时，需要做一些 `收尾工作`：

- 关闭定时器，即关闭 `Loading` 提示
- 关闭延时器
- 判断 `GPT` 是否已经成功响应
    - 若未响应，则向父组件发送结束事件，并提示用户网络超时

> 对应于项目中 src/core/commands/gpt/subCommands/chat/ChatBox.vue 文件

```js
// 延时器
let timeoutTimer = setTimeout(() => {
    clearInterval(loadingInterval)
    clearTimeout(timeoutTimer)
    if (!flag.value) {
      emit('finish')
      output.value = "请求超时，请检查您的网络环境是否配置正确 或 后端是否启动～"
    }
}, 35000)
```

可以看到，这里 `flag` 的作用是判断 `GPT` 响应是否成功，若成功的话，在 `getGptOutput` 方法中，会将 `flag` 的值设置为 `true`，并发送 `finish` 事件。若很遗憾没有成功的话，这部分操作就需要等到延时器触发时执行啦。

## 总结

看完之后，其实大家会发现，在开发过程中，我们很容易注意到这些用户体验细节。但是它们又是一些比较零碎的点，很容易让大家失去做的兴趣。从我角度来看，为了让产品更加完整、让用户体验更好，这些还是必须得实现呀！毕竟有一句话是，**细节决定成败**。

为了防止大家对 `用户体验支撑功能` 的设计不太清楚，我给大家画了 `GPT` 请求与响应的流程图，相信大家看了图之后，不仅能够清楚地知道如上 3 个功能的设计，而且能够对 `GPT Terminal` 三方（前端、后端、第三方 `Open AI`）交互有着更加深刻的理解。


![whiteboard_exported_image (3).png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c0148a5066e64619bf0c6675b4b99d09~tplv-k3u1fbpfcp-watermark.image?)

## 后记

今天给大家展示了我在 `GPT Terminal` 中，对于用户体验相关的细节功能是如何实现的。

其实本来还要为大家展示一下我在 `GPT Terminal` 中 `拓展功能` 的实现方案，但是用户体验相关的细节功能又写了好多字，再写下去字数就太多啦～

为了防止大家看得疲惫，所以我决定将这部分放到下一篇中（内心OS：下次再也不拖了！）

最后再小小地提一下，`GPT Terminal` 目前已经基本实现了主体功能啦，还有一些 Bug 需要修改，如果大家想要了解 [GPT Terminal](https://github.com/ltyzzzxxx/gpt-web-terminal) 项目的更多细节与解锁更多玩法的话，请到其主页查看哦。

如果各位小伙伴关于文章或项目有什么不懂的地方，请直接提出 `Issue`，我会在 24 小时内回复！

看在我这么认真的份上，大家点个 Star、点个赞不过分吧（磕头！）下期再见！