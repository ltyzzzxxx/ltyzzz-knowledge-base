---
title: MySQL 日志
---

## 问题清单

::: tip Questions
1.   **MySQL 中有哪些日志？**

2.   **为什么需要 undo log ？**

3.   **为什么需要 Buffer Pool ？**

4.   **为什么需要 redo log？**

5.   **什么是 redo log？**

6.   **undo 页面被修改，需要记录对应的 redo log 吗？**

7.   **redo log 要写到磁盘，数据也要写磁盘，为什么要多此一举？**

8.   **产生的 redo log 是直接写入磁盘吗？**

9.   **redo log 什么时候刷盘？**

10.   **redo log 文件写满该怎么办？**

11.   **为什么需要 bin log？**

12.   **redo log 和 bin log区别？**

13.   **主从复制如何实现？**

14.   **主从复制模型有哪些？**

15.   **为什么需要两阶段提交？**

16.   **两阶段提交过程是什么样的？**
::: 

## 问题回答

1.   **MySQL 中有哪些日志？**
::: info Answer
  -   **undo log（回滚日志）**：是 `Innodb` 存储引擎层生成的日志，实现了事务中的**原子性**，主要**用于事务回滚和 MVCC**。

  -   **redo log（重做日志）**：是 `Innodb` 存储引擎层生成的日志，实现了事务中的**持久性**，主要**用于掉电等故障恢复**；
  
  -   **binlog （归档日志）**：是 `Server` 层生成的日志，主要**用于数据备份和主从复制**；
:::

2.   **为什么需要 undo log ？**
::: info Answer
  每次执行增删改语句的时候，都会隐式的开启事务（默认自动提交）

  若在没有提交事务之前，`MySQL` 崩溃，通过 `undo log` 进行回滚

  -   插入一条记录时，记录这条记录对应的主键

  -   删除一条记录时，记录这条记录对应的全部内容

  -   修改一条记录时，记录更新列的旧值

  在发生回滚时，读取 `undo log` 里的数据，然后做相反的操作即可

  每条记录进行更新时产生的 `undo log` 格式都有一个 `roll_pointer` 指针和 `trx_id` 事务id

  `undo log` 两大作用：

  -   **实现事务回滚，保障事务的原子性**。事务处理过程中，如果出现了错误或者用户执行了 `ROLLBACK` 语句，`MySQL` 可以利用 `undo log` 中的历史数据将数据恢复到事务开始之前的状态。
  
  -   **实现 MVCC（多版本并发控制）关键因素之一**。`MVCC` 是通过 `ReadView` + `undo log` 实现的。`undo log` 为每条记录保存多份历史数据，`MySQL` 在执行快照读（普通 `select` 语句）的时候，会根据事务的 `Read View` 里的信息，顺着 `undo log` 的版本链找到满足其可见性的记录。
:::

3.   **为什么需要 Buffer Pool ？**
::: info Answer
  `Buffer Pool` 是存在于 `InnoDB` 引擎中，用于缓存数据，与 `Server` 层的查询缓存不同。

  -   当读取数据时，如果数据存在于 `Buffer Pool` 中，直接读取 `Buffer Pool`，否则读取磁盘

  -   当修改数据时，如果数据存在于 `Buffer Pool` 中，直接修改 `Buffer Pool` 数据所在页，并将其置为脏页

      为了减少磁盘 `IO`，不会立刻将脏页写入磁盘中，由后台线程选择一个合适的时机进行刷盘

  `InnoDB` 会将存储的数据划分为若干个页，以页作为与磁盘和内存交互的基本单位，一个页默认大小为 16KB

  `Buffer Pool` 也是按页进行划分

  `Buffer Pool` 除了缓存「索引页」和「数据页」，还包括了 `Undo` 页，插入缓存、自适应哈希索引、锁信息等等。

  查询记录时，`InnoDB` 会将整个页数据加载到 `Buffer Pool` 中，然后通过页目录去定位到某条具体记录
:::

4.   **为什么需要 redo log？**
::: info Answer
  `Buffer Pool` 是基于内存的，一旦发生断电故障，还没来得及落盘的脏数据就会丢失

  为了防止断电故障带来的问题，每次执行更新语句时，`InnoDB` 会先更新 `Buffer Pool`，然后将对当前页的修改以 `redo log` 形式记录

  `WAL Write-Ahead-Logging` 技术：`MySQL` 写操作并不是立马写到磁盘上，而是先更新 `Buffer Pool`、写日志，合适时间再刷盘
:::

5.   **什么是 redo log？**
::: info Answer
  `redo log` 是物理日志，记录了某个数据页做了什么修改，比如**对 XXX 表空间中的 YYY 数据页 ZZZ 偏移量的地方做了AAA 更新**，每当执行一个事务就会产生这样的一条或者多条物理日志。

  在提交事务时，只需要先将 `redo log` 持久化到磁盘，不需要等待 `Buffer Pool` 的脏页数据持久化

  当系统崩溃后，虽然脏页数据没有持久化，但是 `redo log` 已经持久化，根据 `redo log` 进行数据恢复即可
:::

6.   **undo 页面被修改，需要记录对应的 redo log 吗？**
::: info Answer
  需要。执行更新操作时，`undo log` 也会写入到 `Buffer Pool` 的 `Undo` 页面。因此可能存在断电丢失的风险，需要通过 `redo log` 记录。

  当 `Undo` 页面被修改时，则需要记录到 `redo log` 中。
:::

7.   **redo log 要写到磁盘，数据也要写磁盘，为什么要多此一举？**
::: info Answer
  -   写入 `redo log` 使用了追加操作，磁盘操作为顺序写

  -   写入数据则需要先找到写入位置，磁盘操作为随机写

  -   磁盘的顺序写比随机写更加高效
:::

8.   **产生的 redo log 是直接写入磁盘吗？**
::: info Answer
  不是。`redo log` 也有自己的缓存 - `redo log buffer`，每产生一条 `redo log` 时，会先写入到 `redo log buffer` 中，然后再持久化到磁盘。
:::

9.   **redo log 什么时候刷盘？**
::: info Answer
  -   `MySQL` 正常关闭时

  -   `redo log buffer` 中内容大于其内存空间一半时

  -   `InnoDB` 后台线程每隔 1 s，将 `redo log buffer` 持久化到磁盘

  -   每次事务提交时，直接持久化到磁盘（根据 `innodb_flush_log_at_trx_commit` 参数进行控制）

      -   当设置该**参数为 0 时**，表示每次事务提交时 ，还是**将 `redo log` 留在 `redo log buffer` 中** ，该模式下在事务提交时不会主动触发写入磁盘的操作。

      -   当设置该**参数为 1 时**，表示每次事务提交时，都**将缓存在 `redo log buffer` 里的 `redo log` 直接持久化到磁盘**，这样可以保证 `MySQL` 异常重启之后数据不会丢失。

      -   当设置该**参数为 2 时**，表示每次事务提交时，都只是缓存在 `redo log buffer` 里的 `redo log` **写到 `redo log` 文件，注意写入到「 `redo log` 文件」并不意味着写入到了磁盘**，因为操作系统的文件系统中有个 `Page Cache`，`Page Cache` 是专门用来缓存文件数据的，所以写入「 `redo log` 文件」意味着写入到了操作系统的文件缓存。

      -   针对参数 0 / 2，`InnoDB` 后台线程每隔1s，将 `redo log` 持久化到磁盘

      -   数据安全性：1 > 2 > 0
      
      -   性能：0 > 2 > 1
:::

10.   **redo log 文件写满该怎么办？**
::: info Answer
  默认情况下，`InnoDB` 有一个重做日志文件组，由两个 `redo log` 文件组成

  重做日志文件组是以**循环写**的方式工作的，从头开始写，写到末尾就又回到开头，相当于一个环形。

  如果 `write pos` 追上了 `checkpoint`，就意味着 **redo log 文件满了，这时 MySQL 不能再执行新的更新操作，也就是说 MySQL 会被阻塞**（*因此所以针对并发量大的系统，适当设置 redo log 的文件大小非常重要*），此时**会停下来将 Buffer Pool 中的脏页刷新到磁盘中，然后标记 redo log 哪些记录可以被擦除，接着对旧的 redo log 记录进行擦除，等擦除完旧记录腾出了空间，checkpoint 就会往后移动（图中顺时针）**，然后 `MySQL` 恢复正常运行，继续执行新的更新操作。
:::

11.   **为什么需要 bin log？**
::: info Answer
  `MySQL` 在完成一条更新操作后，`Server` 层还会生成一条 `binlog`，等之后事务提交的时候，会将该事物执行过程中产生的所有 `binlog` 统一写入 `binlog` 文件。

  `binlog` 文件是记录了所有数据库表结构变更和表数据修改的日志，不会记录查询类的操作，比如 `SELECT` 和 `SHOW` 操作。
:::

12.   **redo log 和 bin log区别？**
::: info Answer
  -   适用对象不同

      -   `bin log` 是 `Server` 层实现的日志，所有存储引擎均可以使用

      -   `redo log` 是 `InnoDB` 引擎实现的日志

  -   文件格式不同
  
      -   `bin log` 有 3 种文件格式

          -   `STATEMENT`：每一条修改数据的 `SQL` 语句会被记录到 `bin log` 中，类似于 `Redis` 的 `AOF` - 逻辑日志

          -   `ROW`：记录每行数据最终状态，类似于 `Redis` 的 `RDB` - 物理日志

          -   `MIXED`：混合模式，根据不同情况自动使用 `STATEMENT` 和 `ROW`

      -   `redo log` 是物理日志，记录的是在某个数据页做了什么修改，比如对 `XXX` 表空间中的 `YYY` 数据页 `ZZZ` 偏移量的地方做了 `AAA` 更新

  -   写入方式不同

      -   `bin log` 是追加写，写满一个文件就创建一个新的文件继续写，不会覆盖之前的日志，保存的是全量的日志

      -   `redo log` 是循环写，日志空间大小是固定的，全部写满就从头开始

  -   用途不同

      -   `bin log` 主要用于备份恢复、主从复制

      -   `redo log` 主要用于断电故障恢复
:::

13.   **主从复制如何实现？**
::: info Answer
  1.   主库接收到客户端提交事务的请求后，会先写入 `bin log`，再提交事务，更新存储引擎中的数据

  2.   从库会创建一个专门的 `IO` 线程，连接主库的 `log dump` 线程，接收主库的 `bin log` 日志，再将 `bin log` 信息写入到 `relay log` 的中继日志里，返回给主库复制成功的响应

  3.   从库会创建一个用于回放 `bin log` 的线程，去读 `relay log`，然后回放 `bin log`，更新存储引擎数据
:::

14.   **主从复制模型有哪些？**
::: info Answer
  -   同步复制：性能差，基本没人用。

  -   异步复制：直接给客户端返回结果，不会等待 `bin log` 同步到从库。

  -   半同步复制：介于二者之间，只要一部分复制成功响应回来就行，比如一主二从的集群，只要数据成功复制到任意一个从库上，主库的事务线程就可以返回给客户端。
::: 

15.   **为什么需要两阶段提交？**
::: info Answer
  在持久化 `redo log` 和 `bin log` 两个日志过程中，可能出现半成功状态

  -   将 `redo log` 刷盘后，`MySQL` 宕机，`bin log` 没来得及写入。传递到从库的是旧数据，主库宕机恢复后是新数据

  -   将 `bin log` 刷盘后，`MySQL` 宕机，`redo log` 没来得及写入。传递到从库的是新数据，主库宕机恢复后是旧数据
:::

16.   **两阶段提交过程是什么样的？**
::: info Answer
  当客户端执行 `commit` 语句或者在自动提交的情况下，`MySQL` 内部开启一个 `XA` 事务，**分两阶段来完成 XA 事务的提交**

  两个阶段：`prepare` 阶段和 `commit` 阶段，中间穿插写入 `bin log`

  -   `prepare` 阶段：将 `XID` 写入到 `redo log`，同时将 `redo log` 对应的事务状态设置为 `prepare`，将 `redo log` 持久化到磁盘

  -   `commit` 阶段：
  
      -   将 `XID` 写入到 `bin log`，然后将 `bin log` 持久化到磁盘

      -   接着调用引擎的提交事务接口，将 `redo log` 状态设置为 `commit`
:::