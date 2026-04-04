# Gateway 集成说明

## 概述

回调服务器会自动将所有飞书卡片交互发送到 OpenClaw Gateway，实现 Agent 对用户交互的实时响应。

## 工作原理

```
用户点击卡片按钮
    ↓
飞书服务器（长连接）
    ↓
card-callback-server.js
    ↓
OpenClaw Gateway (/api/callback)
    ↓
Agent 处理回调
    ↓
执行操作 / 更新卡片
```

## 配置

### 1. OpenClaw 配置文件

路径：`~/.openclaw/openclaw.json`

```json
{
  "gateway": {
    "enabled": true,
    "port": 18789,
    "token": "your-gateway-token-here"
  },
  "channels": {
    "feishu": {
      "accounts": {
        "main": {
          "appId": "cli_xxx",
          "appSecret": "xxx"
        }
      }
    }
  }
}
```

### 2. 自动读取配置

回调服务器会自动从配置文件读取：
- Gateway URL（默认 `http://localhost:18789`）
- Gateway Token
- 飞书应用凭证

无需手动设置环境变量。

## 回调数据格式

### 发送到 Gateway 的数据

```json
{
  "type": "feishu_card_callback",
  "timestamp": "2026-02-06T10:30:00.000Z",
  "data": {
    "event_id": "f7984f25108f8137722bb63c...",
    "operator": {
      "tenant_key": "1b99004b5f805740",
      "user_id": "a63db8e1",
      "open_id": "ou_9da8247e845a9c8a29a458787a21725a",
      "union_id": "on_64e9b02ecbb7964d1e6ad7c4cef54434"
    },
    "action": {
      "value": {
        "action": "toggle_todo",
        "todoId": "todo1"
      },
      "tag": "button"
    },
    "context": {
      "open_message_id": "om_x100b5768...",
      "open_chat_id": "oc_f30cdd9dfc556c0399be35eb4a12b2a2"
    },
    "raw_data": { /* 完整的原始回调数据 */ }
  }
}
```

### 字段说明

- `type`: 固定为 `feishu_card_callback`
- `timestamp`: 回调时间（ISO 8601 格式）
- `data.event_id`: 飞书事件 ID（用于去重）
- `data.operator`: 操作用户信息
  - `open_id`: 用户的 Open ID
  - `user_id`: 用户 ID
  - `tenant_key`: 租户 Key
  - `union_id`: Union ID
- `data.action`: 用户执行的操作
  - `value`: 按钮的 value 字段（包含自定义数据）
  - `tag`: 元素类型（button, select, etc.）
- `data.context`: 上下文信息
  - `open_message_id`: 消息 ID（用于更新卡片）
  - `open_chat_id`: 会话 ID
- `data.raw_data`: 完整的原始回调数据

## Agent 处理回调

### 1. 监听回调事件

Agent 可以通过 Gateway 的 webhook 或轮询机制接收回调。

### 2. 解析回调数据

```javascript
// 示例：处理确认操作
const callback = /* 从 Gateway 接收的回调数据 */;

if (callback.type === 'feishu_card_callback') {
  const action = callback.data.action.value.action;
  
  switch (action) {
    case 'confirm':
      // 执行确认操作
      await handleConfirm(callback);
      break;
    
    case 'cancel':
      // 执行取消操作
      await handleCancel(callback);
      break;
    
    case 'toggle_todo':
      // 切换任务状态
      await handleToggleTodo(callback);
      break;
    
    default:
      console.log('未知操作:', action);
  }
}
```

### 3. 更新卡片

使用飞书 API 更新原卡片：

```javascript
async function updateCard(messageId, newCard) {
  const token = await getTenantAccessToken();
  
  await axios.patch(
    `https://open.feishu.cn/open-apis/im/v1/messages/${messageId}`,
    {
      content: JSON.stringify(newCard)
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
}
```

### 4. 发送新消息

也可以发送新消息而不是更新原卡片：

```javascript
async function sendFollowUpMessage(chatId, message) {
  const token = await getTenantAccessToken();
  
  await axios.post(
    'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id',
    {
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text: message })
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
}
```

## 常见回调场景

### 1. 确认操作

**发送卡片：**
```json
{
  "tag": "button",
  "text": { "content": "✅ 确认删除", "tag": "plain_text" },
  "type": "danger",
  "value": {
    "action": "confirm_delete",
    "file_path": "/path/to/file.txt"
  }
}
```

**处理回调：**
```javascript
if (action.value.action === 'confirm_delete') {
  const filePath = action.value.file_path;
  
  // ⚠️ 安全警告：永远不要直接将用户输入传递给 shell 命令！
  // ❌ 错误示例：await exec({ command: `rm "${filePath}"` });
  // 攻击者可以注入："; rm -rf / #" 来执行任意命令
  
  // ✅ 正确做法：使用 Node.js fs API
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // 1. 验证路径（防止目录遍历攻击）
    const safePath = path.resolve(filePath);
    const workspaceRoot = process.cwd();
    
    if (!safePath.startsWith(workspaceRoot)) {
      throw new Error('路径超出工作区范围');
    }
    
    // 2. 检查文件是否存在
    await fs.access(safePath);
    
    // 3. 使用 fs API 删除（安全）
    await fs.unlink(safePath);
    
    // 4. 更新卡片
    await updateCard(messageId, {
      header: { title: "✅ 删除成功", template: "green" },
      elements: [
        { tag: "div", text: { content: `文件 ${path.basename(safePath)} 已删除`, tag: "lark_md" } }
      ]
    });
  } catch (error) {
    // 5. 错误处理
    await updateCard(messageId, {
      header: { title: "❌ 删除失败", template: "red" },
      elements: [
        { tag: "div", text: { content: `错误：${error.message}`, tag: "lark_md" } }
      ]
    });
  }
}
```

### 2. 任务切换

**发送卡片：**
```json
{
  "tag": "button",
  "text": { "content": "⬜ 完成项目报告", "tag": "plain_text" },
  "type": "primary",
  "value": {
    "action": "toggle_todo",
    "todoId": "todo1",
    "currentState": false
  }
}
```

**处理回调：**
```javascript
if (action.value.action === 'toggle_todo') {
  const todoId = action.value.todoId;
  const newState = !action.value.currentState;
  
  // 更新任务状态
  await updateTodoState(todoId, newState);
  
  // 更新卡片（切换按钮状态）
  const buttonText = newState ? "✅ 完成项目报告" : "⬜ 完成项目报告";
  await updateCard(messageId, {
    /* 更新后的卡片 */
  });
}
```

### 3. 表单提交

**发送卡片：**
```json
{
  "tag": "form",
  "name": "user_form",
  "elements": [
    {
      "tag": "input",
      "name": "name",
      "placeholder": { "content": "请输入姓名", "tag": "plain_text" }
    }
  ]
}
```

**处理回调：**
```javascript
if (action.value.action === 'submit_form') {
  const formData = callback.data.action.form_value;
  
  // 处理表单数据
  const name = formData.name;
  const email = formData.email;
  
  // 保存数据
  await saveUserData({ name, email });
  
  // 更新卡片
  await updateCard(messageId, {
    header: { title: "✅ 提交成功", template: "green" },
    elements: [
      { tag: "div", text: { content: "感谢您的提交！", tag: "lark_md" } }
    ]
  });
}
```

### 4. 投票

**发送卡片：**
```json
{
  "tag": "button",
  "text": { "content": "🎳 保龄球", "tag": "plain_text" },
  "type": "default",
  "value": {
    "action": "vote",
    "option": "bowling",
    "pollId": "poll_123"
  }
}
```

**处理回调：**
```javascript
if (action.value.action === 'vote') {
  const option = action.value.option;
  const pollId = action.value.pollId;
  const userId = callback.data.operator.user_id;
  
  // 记录投票
  await recordVote(pollId, userId, option);
  
  // 获取最新投票结果
  const results = await getPollResults(pollId);
  
  // 更新卡片显示结果
  await updateCard(messageId, {
    /* 显示投票结果的卡片 */
  });
}
```

## 错误处理

### 1. Gateway 未运行

回调服务器会静默跳过，不影响卡片功能：

```
⚠️ Gateway 未运行，跳过发送
```

### 2. Token 验证失败

检查配置文件中的 Token 是否正确：

```bash
type %USERPROFILE%\.openclaw\openclaw.json
```

### 3. 超时处理

发送到 Gateway 有 3 秒超时限制，超时会静默失败。

## 调试技巧

### 1. 查看回调日志

回调服务器会打印详细日志：

```
📨 收到卡片回调 | 操作者: ou_xxx | 操作: toggle_todo
✅ 已发送到 Gateway
✅ 响应成功
```

### 2. 测试回调

使用测试脚本模拟回调：

```bash
node scripts/test.js
```

### 3. 检查 Gateway 日志

查看 Gateway 是否收到回调数据。

## 性能优化

### 1. 异步处理

回调处理应该快速响应，耗时操作放到后台：

```javascript
// ❌ 错误：同步等待
await longRunningTask();
await updateCard(messageId, result);

// ✅ 正确：异步处理
updateCard(messageId, { content: "处理中..." });
longRunningTask().then(result => {
  updateCard(messageId, result);
});
```

### 2. 去重机制

回调服务器已内置去重（3 秒内重复请求会被忽略）。

### 3. 批量操作

多个相关操作可以合并处理。

## 安全考虑

### 1. Token 保密

确保 Gateway Token 不要泄露：
- 不要提交到版本控制
- 不要在日志中打印
- 使用环境变量或配置文件

### 2. 验证用户权限

在处理回调时验证用户是否有权限执行操作：

```javascript
if (!hasPermission(callback.data.operator.user_id, action)) {
  await updateCard(messageId, {
    header: { title: "❌ 权限不足", template: "red" },
    elements: [
      { tag: "div", text: { content: "您没有权限执行此操作", tag: "lark_md" } }
    ]
  });
  return;
}
```

### 3. 防止重放攻击

使用 event_id 去重，防止重复处理同一个回调。

## 参考资源

- [OpenClaw Gateway 文档](https://docs.openclaw.ai/gateway)
- [飞书开放平台 - 事件订阅](https://open.feishu.cn/document/ukTMukTMukTM/uUTNz4SN1MjL1UzM)
- [飞书开放平台 - 长连接模式](https://open.feishu.cn/document/ukTMukTMukTM/uYjNwUjL2YDM14iN2ATN)
