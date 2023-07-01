---
title: 耗时一下午，我终于上线了我的 GPT 终端！（内含详细部署方案记录）
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

项目地址：<https://github.com/ltyzzzxxx/gpt-web-terminal>

欢迎大家Star、提出PR，一起快乐地用 GPT Terminal 玩耍吧～

## 前言

大家好，我是「周三不Coding」。

想来 `GPT Terminal` 已经好久没更新新功能啦，想到有些朋友仅是看过 `GPT Terminal` 的演示 `Demo`，但是还没有实际上手用过。为了让大家快速用上 `GPT Terminal` ，我决定将其部署到服务器上，让大家尽情地 “白嫖”，而不用亲力亲为地部署！

说干就干，我用了一下午的时间，终于上线了 `GPT Terminal` ！

线上地址：<https://gpt-web-terminal.vercel.app/#/>

-   不限次数访问。如果额度用完，请提醒我更新 `API Key`！
   
-   出现 Mixed Content 报错，请查看本篇文章对应部分解决！
  
-   如果还遇到其它 Bug，麻烦请留言一下或提一下 Issue，万分感谢！


![iShot2023-07-01-17.30.19.gif](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a14611afb5674dd095003a512a60df68~tplv-k3u1fbpfcp-watermark.image?)


接下来，我给大家分享一下我的部署过程！

## 部署方案

如下是我最终采取的部署方案：

![whiteboard_exported_image (5).png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/43e47d72af314b18a1d8cd04fab308c0~tplv-k3u1fbpfcp-watermark.image?)
-   前端：`Vercel` 网站托管服务，一键部署免运维

    > 这绝对是一个神仙网站，如果小伙伴们不知道怎么用的话，可以去百度搜一搜学一学！超级好用！

-   后端：通过 `Docker` 容器化，部署到国外云服务器，支持访问 `GPT` 服务

其实，一开始我准备通过微信云托管来部署后端。但是，经过了一番折腾并部署成功后，发现后端无法访问到 `OpenAI` 服务。在网上查找了资料后，发现并没有微信云托管相关的解决方案，于是我最后只好放弃啦～

## 部署记录

### 环境变量配置

开发环境与生产环境的后端地址、数据库地址不相同，因此需要进行区分。

-   对于前端而言，通过在 `Vercel` 中配置环境变量，并修改前端代码中访问后端的地址，通过变量名的形式获取环境变量，而非硬编码形式。

    ![image-20230701164712204](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/09bc4a45b2d342b590e8e1a7bd910383~tplv-k3u1fbpfcp-zoom-1.image)

<!---->

-   对于后端而言，通过区分当前环境，得到不同的配置文件

    > 如下代码位于 server/src/config/getConfig.js 文件中

    ```js
    let config;
    const env = process.env.NODE_ENV ?? "local";
    ​
    if (env === "local") {
      config = require("./config");
    } else {
      config = require(`./config.${env}`);
    }
    ```

### 配置 Docker

后端通过 `Docker` 容器化部署，如下为 `Dockerfile` 文件

-   采用 node16 轻量级镜像
-   采用 pm2 进行进程管理、性能监控等

```
# 使用官方 Node.js 轻量级镜像
# https://hub.docker.com/_/node
FROM node:16-slim
​
# 定义工作目录
WORKDIR /usr/src/app
​
# 将本地代码复制到工作目录内
COPY ./ ./
​
RUN npm install
​
# 安装 pm2
RUN npm install pm2 -g
​
# 启动服务
CMD pm2-runtime 'npm start'
```

通过如下命令构建镜像

```
docker build -t gpt-terminal-server
```

### 解决 Mixed Content 报错

前端通过 `Vercel` 部署，采用的是 `https` 协议；而后端是直接通过服务器进行部署，并未做 `SSL` 证书配置，仍为 `http` 协议。当部署后，前端访问后端时，会报错：Mixed Content。

暂时使用如下方案解决：

1.  点击 `Site settings`

    ![image-20230701165359949](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5349b69b70ee499b919287dcf55d0565~tplv-k3u1fbpfcp-zoom-1.image)

<!---->

2.  将 「不安全内容」「Insecure content」从 `Block` 更改为 `Allow`

    ![image-20230701165523301](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2c043b7afd494b72b36a33f315ed2ae1~tplv-k3u1fbpfcp-zoom-1.image)

## 总结

这就是部署的全部记录啦～

其实这个项目还是比较简单的，通过 `Vercel` 与 `Docker` 容器化技术，很快就可以将网站上线。

> 但是为什么我还用了一下午呢？因为我最后想要配置 SSL 证书，用了比较久的时间，还出了点问题，目前还在解决中，但不影响最终使用哈哈哈哈～

这就是今天的全部内容啦～

想要体验的小伙伴，可以点击[这里](https://gpt-web-terminal.vercel.app/#/)访问该 GPT 终端！不限次数使用！