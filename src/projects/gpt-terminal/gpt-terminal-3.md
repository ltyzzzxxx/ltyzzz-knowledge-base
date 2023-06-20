---
title: 如何丝滑实现 ChatGPT 打字机流式回复？Server-Sent Events！
---

## 专栏目录

> [耗时一下午，我实现了 GPT Terminal，真正拥有了专属于我的 GPT 终端！](https://juejin.cn/post/7243252896392151097)
>
> [如何用 GPT 在 5 分钟内 ”调教“ 出一个专属于你的 ”小黑子“？](https://juejin.cn/post/7244174817679573047)
> 
> [如何丝滑实现 GPT 打字机流式回复？Server-Sent Events！](https://juejin.cn/post/7244604894408933432)
> 
> [我是如何让我的 GPT Terminal “长记性” 的？还是老配方！](https://juejin.cn/post/7245812754027823160)

项目地址：[github.com/ltyzzzxxx/g…](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fltyzzzxxx%2Fgpt-web-terminal "https://github.com/ltyzzzxxx/gpt-web-terminal")

欢迎大家Star、提出PR，一起快乐地用 GPT Terminal 玩耍吧～

## 前言

今天来给大家整点 `ChatGPT` 的干货！想必大家用过 ChatGPT 都知道，它是一个练习时长两年半，喜欢唱...（油饼食不食！）

它在响应我们给它发送消息的时候，并不是将一整个消息直接返回给我们，而是流式传输，如同打字机效果一般，逐渐地将整个内容呈现给我们。（市面上的 `GPT` 一般都是如此）


![iShot2023-06-14-23.35.09.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/50e79d59737047459f8a7fd4dafced28~tplv-k3u1fbpfcp-watermark.image?)

这样的好处有两个，一方面是 `GPT` 一边响应一边返回结果，流式输出，响应效率大大提升；另一方面是显著提升了用户体验，给我们的感觉就像是真实的对话一样，`GPT` 似乎在思考问题的答案。

说到这里，不得不佩服 `Open AI` 这家公司。不仅仅实现了人工智能的突破，掀起了第四次科技革命，而且它在做产品方面，也有很多值得我们深入学习与思考的地方。正如陆奇教授在前段时间一次演讲上说的一般：

> **OpenAI 所代表的是全新的组织、全新的能力，他们所做的一切是要既能做科研、又能写代码、又能做产品，这些能力是分不开的。**

希望能给大家在未来的学习与工作中带来一些新的思考维度～

啊似乎又跑题了，话不多说，咱们迅速进入正题！

## Server-Sent Events

要想揭开 ChatGPT 实现流式传输的秘诀，那么一定离不开这个技术 —— `Server-Sent Events`

它是一种服务端主动向客户端推送的技术，这一点是不是与 Websocket 有些类似，但是 SSE 并不支持客户端向服务端发送消息，即 `SSE` 为单工通信。

通俗易懂一些理解就是，服务端与客户端建立了 **长连接**，服务端源源不断地向客户端推送消息。服务端就相当于河流的上游，客户端就相当于河流的下游，水往低处流，这就是 `SSE` 的流式传输。

大家简单了解一下即可，我们还是需要在实战中深刻理解其具体如何使用。

## GPT Terminal 调用流程


![whiteboard_exported_image (2).png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9b0597452539434992c2cd4af6c6e9bf~tplv-k3u1fbpfcp-watermark.image?)
1. 用户输入 `GPT Terminal` 中的 `GPT` 相关命令

```
gpt chat -r ikun 请给我表演一下《只因你太美》！
```

2. 前端得到用户输入的命令并解析，将解析结果作为参数，请求后端。

3. 后端拿到参数后，渲染对应的角色模板（如：ikun），请求 GPT 服务。

4. GPT 服务响应用户传入的消息，并以 `Stream` 流形式返回给后端；后端也以 `Stream` 流形式返回给前端。

咱们关键的点在于拆解 2/3/4 步，看看两次数据传输是如何用 `Server-Sent Events` 实现的！

至于前端是如何解析命令的，请大家移步 [GPT Terminal](https://github.com/ltyzzzxxx/gpt-web-terminal) 项目中寻找答案。

> 至于我为什么不用前端直接去请求 GPT 服务，考虑有一下几点，供大家参考：
> 
> 1. 职责分离。GPT 服务属于第三方库，按照一般设计理念来看，需要交由后端处理，前端只需要负责请求后端。
> 
> 2. 便于扩展。之后在 GPT Terminal 中可能会引入用户服务以及 GPT 图片生成功能，为了避免功能都耦合到前端，导致前端臃肿，因此我选择将 GPT 服务抽取到后端。

#### 前端请求后端

> 如下部分代码对应项目路径为：`src/core/commands/gpt/subCommands/ChatBox.vue`
```js
const response = await fetch('http://127.0.0.1:7345/api/gpt/get', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message.value,
      role: role.value,
    }),
  });

  if (!response.body) return;
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    var { value, done } = await reader.read();
    if (done) break;
    value = value?.replace('undefined', '')
    console.log("received data -", value)
    output.value += value?.replace('undefined', '')
  }
```

前端向后端发起请求，得到请求响应体，然后通过 `pipeThrough()` 方法将其转换为一个文本解码器流（TextDecoderStream），这个流可以将字节流（如网络请求的响应）转换为Unicode字符串，最后调用 `getReader()` 方法返回一个 `reader` 对象，用于读取响应体数据。

读取时循环读取，并对数据做一些处理（数据流开头、结尾为 undefined），然后拼接到 `output.value` 中，渲染到页面中。这样的话 `output.value` 就是动态浮现的，给用户视觉效果即为 **打字机**。

在这里大家很容易发现，后端与 `GPT` 服务的交互对于前端而言就是透明的，前端仅知道其响应是一个流式数据，其它一概不知。

说到这里，大家可能还有些疑惑，`Server-Sent Events` 似乎什么都还没配，前端不就是发了一个常规的 `POST `请求嘛！我知道你很急，但你先别急，跟我慢慢往下看～重头戏是在后端与 `GPT` 服务的交互！

#### 后端请求 GPT 服务

> 如下部分代码对应项目路径为：`server/src/thirdpart/gptApi/gptApi.js`
```js
async function createChatCompletion(messages) {
  // 如下为 流式数据传输 写法
  const res = openai.createChatCompletion(
    {
      model: "gpt-3.5-turbo",
      messages,
      stream: true,
    },
    {
      responseType: "stream",
    }
  );
  return res
}
```

后端拿到前端传递的参数后，对角色进行简单的模板渲染，得到消息数组后，调用 GPT 服务。

其参数如下所示，设置 `GPT` 模型类型，传入消息数组。

关键在于，设置 `stream` 参数为 `true`。这一步就是告诉 GPT 服务，我需要获取流式响应！

而如果你只想要 GPT 给你回复整个消息内容，可以不设置 stream，即为普通响应。

接下来，关键在于后端是如何解析 GPT 返回的响应。

> 如下部分代码对应项目路径为：`server/src/handler/gptStreamHandler.js`
>
>>我将这部分的处理单独抽取到了 `gptStreamHandler.js` 中，将其与其它普通请求的处理区分开，便于之后扩展
```js
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Connection", "keep-alive");
res.flushHeaders();
const response = handlerFunction(req.body, req, res);
response.then((resp) => {
  resp.data.on("data", (data) => {
    console.log("stream data -", data.toString());
    const lines = data
      .toString()
      .split("\n\n")
      .filter((line) => line.trim() !== "");
    for (const line of lines) {
      const message = line.replace("data: ", "");
      if (message === "[DONE]") {
        res.end();
        return;
      }
      const parsed = JSON.parse(message);
      console.log("parsed content -", parsed.choices[0].delta.content);
      res.write(`${parsed.choices[0].delta.content}`);
    }
  });
});
```

该响应是一个流式响应，因此需要用事件回调函数来处理。具体来说，`response.then()` 是一个 `Promise` 对象的方法，用于处理异步操作的结果。其中 `resp.data` 是一个可读流对象，通过订阅 `data` 事件，可以在每次获取到数据时触发回调函数。

回调函数需要做的很简单，先将数据转换为字符串，然后使用 `split()` 和 `filter()` 方法将其分离为一个个独立的消息行。每一行都是以 `data: ` 开头，如下所示：

```json
data: {  
    "id":"chatcmpl-7RNOsBXERLBhETQxgg5RpF2EGDSpi",  
    "object":"chat.completion.chunk",  
    "created":1686759162,  
    "model":"gpt-3.5-turbo-0301",  
    "choices":[  
        {  
            "delta":{  
                "content":"你"  
            },  
            "index":0,  
            "finish_reason":null  
        }  
    ]  
}
```

数据看起来比较复杂，但是咱们重点只需要关注 `choices.delta.content`，这是我们真正需要的数据！

后端需要做的事情就是把这个数据返回给前端即可。当其读到 `message === "[DONE]"`，这也就是 GPT 服务给我们提供的信号，告诉这个时候已经没有内容给你啦，你可以停止接收了。这样就实现了一次消息的回复！

相信细致的大家已经发现了，我还没有提到代码一开始响应的 `header` 设置，这正是 `Server-Sent Events` 的核心配置，是不是很简单？

```js
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Connection", "keep-alive");
```

只需要简单设置一下 `header`，即可实现服务端到客户端的流式传输！

但是很细致的大家又发现了，为什么 GPT服务向后端传输数据的时候，并没有设置 `header` 呢？原因我认为很简单，因为我们调用的是 `Open AI` 提供的 `SDK` 包。其对于响应的封装对于我们而言是透明的，也就是说，我们无需去设置，这些繁琐的操作 `SDK` 都帮我们做好啦！

## 成果

来吧，展示！让我们看看，经过这一系列骚操作之后，GPT Terminal 会为我们呈现什么样的效果？


![iShot2023-06-15-00.31.29.gif](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/13136849552c4b34a0723f1fea8b3672~tplv-k3u1fbpfcp-watermark.image?)

## 总结

今天带着大家通过项目实战的方式，了解了 Server-Sent Events 的基本实现原理。

在此，我也有一点心得想与大家分享，在学习新技术的时候，一定不要畏手畏脚，总想着先把原理看会再去做，这其实是一种 `纸上谈兵`。只有真正地去实践，去动手做，才能更加深刻地理解其原理！在做与踩坑的过程中，去学习与理解，并及时地补充相关知识，这样最后学到的东西才是自己的！

好啦，今天就暂时告一段落啦！如果大家想要了解 [GPT Terminal](https://github.com/ltyzzzxxx/gpt-web-terminal) 项目的更多细节与解锁更多玩法的话，请到其主页查看哦。

看在我这么认真的份上，大家点个Star、点个赞不过分吧（磕头！）下期再见！