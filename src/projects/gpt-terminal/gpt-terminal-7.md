---
title: 如何借助于 OpenAI 以命令的方式在 GPT 终端上画一只 “坤”？
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

欢迎大家Star、提出PR，一起快乐地用 GPT Terminal 玩耍吧～

## 前言

大家好，端午节安康！另外一件事情就是，`GPT Terminal` 功能又上新啦！所以今天来带大家看看新功能！

既然今天是节假日，那么我想着文章风格得是偏轻松一些的，让大家能够 **躺着** 学会！主要带大家学习和使用 `OpenAI` 提供的 `AI` 图片生成接口，并且我会结合 `GPT Terminal` 项目，在实战中讲解如何使用该接口画一只 "坤"！

话不多说，咱们迅速进入正题！

## OpenAI 图片生成接口

如果大家想要做一个自己的 `ChatGPT` 应用，除了到网上查询现成的解决方案，一定还离不开 `OpenAI` 官方 `API` 文档，其中包含了会话补全、图像生成、微调 Fine-tuning、语音转文本等多个接口。

> 如果大家看英文不习惯的话，可以去看看 [中文文档](https://openai.xiniushu.com/)

会话补全功能咱们在之前的文章中已经多次提到了，其实就是常规意义上的聊天功能。而使用图片生成功能则要更加简单一些，如下即为接口内容。大家可以在自己的终端中直接执行，执行之前记得配置好 `API Key` 哦！

```
curl https://api.openai.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "prompt": "A cute baby sea otter",
    "n": 2,
    "size": "1024x1024"
  }'
```

这其实就是一个很常规的接口调用，接口参数有：

- `prompt` - 所要生成图片的提示内容，比如：一只 🐔
- `n` - 生成图片的数量，经过测试后我发现免费用户的 `API Key` 一次最多 5 张
- `size` - 图片的尺寸大小，可供选择有：`256x256` / `512x512` / `1024x1024`

其中，`prompt` 是必填参数，`n` 与 `size` 是可选参数，`n` 默认为 1，`size` 默认为 `1024x1024`（可恶，默认大图好赚钱是吧！）

接口的返回内容也是很简洁的，包含了创建时间与图片 `url` 数组，咱们通过访问该 `url` 地址，便可获取到图片啦！

```json
{
  "created": 1589478378,
  "data": [
    {
      "url": "https://..."
    },
    {
      "url": "https://..."
    }
  ]
}
```

## GPT Terminal 项目实战

相信大家看了接口之后，会觉得竟然如此简单。没错，就是这么简单！咱们火速进入实战环节！

首先，咱们需要在 `GPT Terminal` 的前端中请求后端服务，其中定义了图片生成接口。在该后端接口中，去请求 `OpenAI` 服务。如果大家看了之前的系列文章，一定会对这个流程十分熟悉。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f2ce84a7296f4e8fbdb458b94483768b~tplv-k3u1fbpfcp-watermark.image?)

### 后端实战

后端服务中，我集成了 `OpenAI` 提供的 `SDK` 包，咱们可以通过简单的方法直接调用 `OpenAI` 提供的服务。

> 如下代码位于项目 server/src/thirdpart/gptApi/gptApi.js 文件
```js
// 配置 API Key，得到操作 OpenAI 接口的对象
const configuration = new Configuration({
  apiKey: gptConfig.key,
});
const openai = new OpenAIApi(configuration);

// 生成图片的方法
async function createImage(prompt, number = 1, size = "256x256") {
  const res = await openai.createImage({
    prompt: prompt,
    n: number,
    size: size,
  });
  console.log(res.data.data);
  if (res?.data?.data && res?.data?.data?.length) {
    return res.data.data;
  }
  throw new Error("Failed to get response from OpenAI service.");
}
```

这段代码很简单，相信聪明的大家一看就懂！

首先我们需要配置 `OpenAI`，以便于操作接口。之后通过 `OpenAI SDK` 中提供的 `createImage` 方法得到响应结果。在进行基本的判断后，将结果返回。

- 其中，我们需要注意的是 `n` 和 `size` 并非必填参数。虽然 `OpenAI` 接口中有默认参数，但默认尺寸是最大的，花钱也最多，所以我们将 `size` 默认值设置为 `256x256`（绝不能让它薅我们羊毛！）

在写好 `OpenAI` 第三方服务的代码后，我们还需要写一个后端接口，并暴露给前端，使前端能够进行调用。

> 如下代码位于项目 server/src/controller/gptController.js 文件
```js
async function getGptImage(event, req, res) {
  try {
    let authResp = await openaiAuth();
  } catch (e) {
    throw new MyError(NO_AUTH_ERROR_CODE, "API Key 配置不正确");
  }
  console.log("event -", event);
  if (event.prompt === "") {
    throw new MyError(REQUEST_PARAMS_ERROR_CODE, "生成图像提示不能为空");
  }

  if (event.number && (event.number > 5 || event.number < 1)) {
    throw new MyError(REQUEST_PARAMS_ERROR_CODE, "图片数量必须为1～5之间的整数");
  }
  if (
    event.size &&
    event.size != "256x256" &&
    event.size != "512x512" &&
    event.size != "1024x1024"
  ) {
    throw new MyError(REQUEST_PARAMS_ERROR_CODE, "生成图像尺寸格式错误");
  }
  return await createImage(
    event.prompt,
    event.number || 1,
    event.size || "256x256"
  );
}
```

在如上代码中，我们需要对前端传入的参数进行额外的校验。此外，我们还看到方法一开始调用了 openaiAuth 方法，对 `API Key` 进行了校验。这个方法其实是我调用了 `OpenAI` 提供的 `listModels` 方法，其主要目的就是为了判断你能否正常请求到它的服务。

>前端校验往往是不可靠的，后端的这层校验是必须的

> 如下代码位于项目 server/src/thirdpart/gptApi/gptApi.js 文件
```js
// API Key 验证
async function openaiAuth() {
  return await openai.listModels();
}
```

### 前端实战

> 前端流程其实相对比较复杂，因为其中涉及到了 `命令读取`、`命令解析` 流程，但是这部分并不是我们今天重点关注的，暂时跳过。如果大家对其感兴趣，可以看看 [GPT Terminal](https://github.com/ltyzzzxxx/gpt-web-terminal) 项目源码中的 `src/core` 部分。或者你也可以直接问我，我会在 24 小时内解答。

在前端代码中，咱们也需要定义一个调用方法，去请求后端服务。

> 如下代码位于项目 src/core/commands/gpt/subCommands/image/imageApi.ts 文件
```js
import myAxios from "../../../../../plugins/myAxios";

export const getImage = async (
  prompt: string,
  number: number,
  size: string
) => {
  return await myAxios.post("/gpt/getImage", {
    prompt,
    number,
    size,
  });
};
```

之后，咱们通过在 `ImageBox.vue` 组件中调用此方法，获取返回的响应结果，并将其渲染到页面中即可！

在 `onMounted` 方法中，即组件加载时，咱们去调用后端接口，并处理响应结果
> 如下代码位于项目 src/core/commands/gpt/subCommands/image/ImageBox.vue 文件
```js
const res: any = await getImage(prompt.value, number.value, size.value)
if (res?.code !== 0) {
    // 服务端异常处理
    return;
}
imageUrlList.value = res.data
```

最后，咱们将 `mageUrlList`渲染到组件中。

在这里，我使用了 [Ant-Design-Vue](https://antdv.com/components/overview) 提供的 `Grid` 与 `Image` 组件。

```html
<a-row :gutter="[0, 40]">
    <a-col :span="4" v-for="(item, index) in imageUrlList" :key="index">
        <a-image :src="item.url" />
    </a-col>
</a-row>
```

> 如果大家去看 [GPT Terminal](https://github.com/ltyzzzxxx/gpt-web-terminal) 代码的话，会发现 `onMounted` 方法中除了请求后端接口，还包含了其它操作，如定时器控制 `Loading`、向父组件发送事件等。
> 
> 这些代码讲解位于 [上一篇文章](https://juejin.cn/post/7246917539766091837) 中。

### 结果展示

代码已经完工！咱们就来测试一下看看，在 `GPT Terminal` 中画一只 “坤” 是什么样的体验！


![iShot2023-06-22-12.44.32_1.gif](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f7c26e206fc249a28c5c7fea5531ec59~tplv-k3u1fbpfcp-watermark.image?)

## 总结

今天给大家讲解并展示了如何用 `OpenAI` 提供的 `AI` 图片生成接口，为我们生成 "坤"（小黑子油饼食不食！），咱们在日后做自己的 `ChatGPT` 应用的过程中，也应该多多参考官方提供的文档教程，而且其中还有很多有意思并且值得探索的东西。

## 后记

那么今天就先到这里啦！

最后再小小地提一下，`GPT Terminal` 目前已经基本实现了主体功能啦，还有一些 Bug 需要修改，如果大家想要了解 [GPT Terminal](https://github.com/ltyzzzxxx/gpt-web-terminal) 项目的更多细节与解锁更多玩法的话，请到其主页查看哦。

如果各位小伙伴关于文章或项目有什么不懂的地方，请直接提出 `Issue`，我会在 24 小时内回复！

看在我这么认真的份上，大家点个 Star、点个赞不过分吧（磕头！）下期再见！