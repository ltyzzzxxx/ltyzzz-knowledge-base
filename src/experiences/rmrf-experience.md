---
title: 深夜，我被自己 "rm -rf" 删库了...
---

## 前言

大家好，我是「周三不Coding」，想必大家看到标题已经开始笑了吧，说实话我看了我也想笑。

大家从学编程开始，应该都听过「删库跑路」这种程序员段子。我也听过，但我以为它仅是段子，现实中怎么可能会发生这种事情呢？没想到，我这么快就遇到了，而且我还不能 “跑路”，因为是我自己的代码 😭

![shanku](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/179f13822c33499da772eaacb0ecfc7d~tplv-k3u1fbpfcp-zoom-1.image)

接下来，我给大家分享一下我这段 “逆天” 经历，最后给大家说说如何解决与后续预防措施～

## “案发” 经过

昨天请假在家，写了一个新项目。很巧的是，这个项目比较简单，所以我直接在 VSCode 上开整，并且没有事先创建 Github 仓库。

> 其实我个人是有创建仓库、同步远程这一习惯的，但就是这么巧，昨天没有预先做这件事 😭

接着，我就开始开心地敲代码啦～

就这样一直开心地持续到了晚上 11 点多，这个时候我在一边收尾最后的代码，一边看直播，心情十分愉悦。

收尾完毕后，我就准备开始最后的环节：创建 Github 仓库并将代码上传

很巧的是，这个时候我突然想换个项目名字

这个时候，大家可能想到的操作是这样的：

![im](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/192dc6260833480593cd21351a5e6f58~tplv-k3u1fbpfcp-zoom-1.image)

但我想到的操作是这样的，我想用 Linux 命令来改名

```
mv xiaoheizi/ ji-ni-tai-mei
```

更巧的是，我命令输错了，这个命令实际是将文件夹移入另一个文件夹

![qiao](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d79570f510ff40599d3b8cd773b7944a~tplv-k3u1fbpfcp-zoom-1.image)

此时我的文件夹结构变成了如下所示：

![image-20230628130026962_副本](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f9fba46b54d7435a86dc65cd606daf42~tplv-k3u1fbpfcp-zoom-1.image)

最巧的来了，我这个时候执行了最逆天的一步操作：`rm -rf`

```
cd ji-ni-tai-mei
rm -rf xiaoheizi
```

![tianna](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/88b5ae16f76240ef8c4adf3a28a4e943~tplv-k3u1fbpfcp-zoom-1.image)

这个时候，我还没反应过来，还是心情愉悦地一边看直播，一边办着逆天的事儿。

我尝试去 `cd` 到原来的文件夹中，发现提示无此文件夹。这个时候，我还是没反应过来，我又 `cd` 到新的文件夹，执行 `ls` 命令，发现空空如也。

终于，我反应过来了，内心 OS：卧槽！我删库了！内心一万头🦙奔腾而过

![bbq](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/21eef6fdcda844a1852fd1c2119d9586~tplv-k3u1fbpfcp-zoom-1.image)

但是，我立马冷静了下来，之前网上看过那么多 「删库」误操作的解决方案，我去查查不就行了，难道它还着能给我删喽？只要不重启电脑，一定是有缓存的！（我内心这么安慰自己，实际慌的一匹）

![biehuang](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b0173bcb83514c64b81cb2b89d55ea53~tplv-k3u1fbpfcp-zoom-1.image)

## 解决方案

首先，我直接去百度寻找解决方案。普遍搜寻到的结果都是 MySQL 删库跑路案例，对我来说作用不大。

不过还是有 Mac 永久删除文件恢复相关的解决方案

-   需要下载一个 Mac 版的数据恢复软件，扫面整个硬盘，检索之前被永久删除的文件

看到这里，我觉得有救了，好起来了！

![shenqi](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/965df76a00e4428ba5cfabaebe2ca53a~tplv-k3u1fbpfcp-zoom-1.image)

于是，我火速下载了软件，扫描了整个 Mac，并搜索到了我之前删除的文件。

![nice](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/41c16ea861ac448da37581679b53b18f~tplv-k3u1fbpfcp-zoom-1.image)

正当我准备将其恢复时，猝不及防的收费，让我瞬间呆了，90 刀，接近 700 软妹币！此时，我已经蚌埠住了，嘴上已经不听使唤了，说起了赛博坦语（大家自行脑补）

![image-20230628132925779](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f306f58e3ef647a59201384b322f4dc8~tplv-k3u1fbpfcp-zoom-1.image)

当时，已经到凌晨一点左右，早晨还得去上班，我此时不得不放弃寻找数据恢复的方案，只能靠短期记忆将代码复原啦～

说干就干，幸亏代码量比较少，我用了一个多小时，迅速地还原了 “现场”

> 内心OS：代码量多的话，我一定会老老实实建仓库（下次一定！

此时已经凌晨两点多，苦逼的我，饿着肚子，睡了觉。

![tainanle](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e37d19be2a674e39b445c4a77a6a4965~tplv-k3u1fbpfcp-zoom-1.image)

## 经验教训与后续预防措施

经过这一事件，我总结的最大经验有如下两条：

1.  写代码的时候千万不要三心二意，一边看着直播，一边敲着代码。如果说我全神贯注地写代码，这种事件发生的概率会不会低很多呢？毕竟我觉得这次犯的错误实在太低级了，但凡用点心，一定不会出现这种 “事故”。
1.  执行某些类似于 `rm -rf` 危险命令之前，一定要备份文件！否则，一旦在公司线上生产环境中出现这种问题，后果将会十分严重。

对于此，我也想到了如下几种预防措施：

1.  通过 Google Drive、百度网盘等，同步上传我的重要文档、文件夹等。

    在我的 Mac 上，有很多之前学习过程中收集的资料、总结的笔记、画过的流程图等，这些都是一步步积攒的宝贵财富。万一哪一天我又犯了类似的错误或我的 Mac 泡水里彻底不能用了，我又该如何应对呢？

    所以，经历这次 “删库” 事件后，我必须做好万全的防护措施。

1.  写代码之前，先创建本地仓库，并同步代码到远程仓库，确保可回滚、可追溯，有效预防将整个文件夹删除的情况

1.  设置 `rm -rf` 命令为移入回收站

    在 Mac 上，可以通过设置别名，实现此效果。搭配一个 npm 包，即可快速实现。

    > 大家也可以直接设置 rm 命令为 mv ~/.Trash

    1.  通过 `npm` 全局安装 `saft-rm`

        ```
        npm i -g safe-rm
        ```

    1.  `vim` 编辑 `.bash_profile` ，设置别名

        ```
        alias rm='safe-rm'
        source ~/.bash_profile
        ```

## 总结

回想起这一晚的经历，还是感觉有点梦幻。

我万万没想到我会犯下这种错误，这也给我敲了一次警钟，学编程做技术千万不能马虎大意、三心二用，否则即使是再离谱的错误，也可能会发生。

今天就到这里啦，希望这篇文章也能给大家提个醒，带来一些收获～