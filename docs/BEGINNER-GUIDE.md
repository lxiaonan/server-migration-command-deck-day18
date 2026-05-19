# Beginner Guide / 小白使用文档

## 中文

### 这个工具解决什么问题

迁移服务器时，最容易出问题的不是某一条命令，而是漏步骤：忘记备份数据库、忘记上传目录、DNS TTL 太高、没有回滚方案、目标机没验证就切流量。这个工具用来把这些步骤变成一份能复制、能导出、能逐项勾选的迁移作战计划。

### 第一次怎么用

1. 打开网页。
2. 在左侧填写源服务器，例如 `old.example.com`。
3. 填写目标服务器，例如 `new.example.com`。
4. 填写域名、应用目录、备份目录和 SSH 用户。
5. 勾选你的服务组件，例如 Docker、Nginx、Redis、上传目录。
6. 选择数据库类型。如果没有数据库，选择“无数据库”。
7. 查看中间的风险分和风险原因。
8. 按阶段勾选：盘点、备份、传输、恢复、切换、验证。
9. 在右侧复制命令，或导出 Bash / Markdown。

### 重要安全提醒

- 这个工具不会自动删除、覆盖或登录你的服务器。
- 导出的 Bash 脚本不是让你闭眼执行的，它是迁移草案。
- 真正执行前，必须把 `TARGET_SERVER_IP` 等占位符换成真实值。
- 正式迁移前，建议先在测试服务器跑一遍。
- 如果有云厂商快照功能，先创建快照，再迁移。
- 迁移完成后，旧服务器至少保留 24 小时，方便回滚。

### 适合谁

- 有一台旧 VPS，想迁移到新 VPS 的个人站长。
- 有 Docker Compose 项目，需要换服务器的开发者。
- 需要迁移 Nginx、数据库、上传文件目录的小团队。

### 不适合什么场景

- 不适合完全不会 SSH 和 Linux 命令的人直接执行生产迁移。
- 不适合需要自动登录服务器并实际执行迁移的场景。
- 不适合复杂 Kubernetes、多节点数据库集群、跨云专线迁移。

## English

### What Problem It Solves

Server migration usually fails because of missing steps: no database backup, forgotten upload folders, high DNS TTL, no rollback plan, or cutting traffic before target verification. This tool turns those steps into a copyable, exportable, checkable migration command plan.

### First Use

1. Open the website.
2. Enter the source server, such as `old.example.com`.
3. Enter the target server, such as `new.example.com`.
4. Enter domain, app path, backup path, and SSH user.
5. Select your components, such as Docker, Nginx, Redis, and uploads.
6. Choose the database type. If there is no database, choose "No database".
7. Review the risk score and risk reasons.
8. Check phases: inventory, backup, transfer, restore, cutover, verify.
9. Copy commands or export Bash / Markdown.

### Safety Notes

- This tool does not automatically delete, overwrite, or log in to your server.
- The exported Bash script is a migration draft, not a blind-run script.
- Replace placeholders such as `TARGET_SERVER_IP` before running commands.
- Test on a staging server before production migration.
- Create a cloud snapshot first if your provider supports it.
- Keep the old server for at least 24 hours after migration for rollback.

### Good Fit

- Personal site owners moving one VPS to another.
- Developers moving a Docker Compose app to a new server.
- Small teams migrating Nginx, database, and uploads.

### Not A Good Fit

- Users who cannot use SSH or Linux commands at all.
- Fully automated server login and migration execution.
- Complex Kubernetes, multi-node database clusters, or enterprise network migrations.
