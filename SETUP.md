# Job Planner - Google Sheets 集成

这是一个使用 Next.js 构建的工作计划管理系统，数据存储在 Google Sheets 中。

## 功能

- ✅ 查看所有工作
- ✅ 添加新工作
- ✅ 编辑现有工作
- ✅ 删除工作
- ✅ 实时数据同步到 Google Sheets

## Vercel 部署

### 1. 导入项目

1. 访问 [Vercel](https://vercel.com)
2. 点击 "Add New" -> "Project"
3. 导入你的 GitHub 仓库 `ning3739/jobplanner`

### 2. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 值 |
|--------|-----|
| `GOOGLE_SPREADSHEET_ID` | 你的 Google Sheets ID |
| `GOOGLE_SHEET_NAME` | Job |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | 整个 JSON 凭证内容（见下方说明） |

**获取 GOOGLE_SERVICE_ACCOUNT_KEY：**

1. 打开你的 `credentials/google-service-account.json` 文件
2. 复制整个 JSON 内容（包括大括号）
3. 粘贴到 Vercel 环境变量的值中

### 3. 部署

点击 "Deploy" 按钮，Vercel 会自动构建和部署你的应用。

---

## 本地开发设置

## 重要设置步骤

### 1. 启用 Google Sheets API

在使用之前，你需要为你的 Google Cloud 项目启用 Google Sheets API：

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目（项目 ID: weblog-1713665206258）
3. 访问这个链接直接启用 API：
   https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=810584280922
4. 点击"启用"按钮

### 2. 共享 Google Sheets

确保你的 Google Sheets 已经与 Service Account 共享：

1. 打开你的 Google Sheets
2. 点击"共享"按钮
3. 添加这个邮箱：`jobplanner@weblog-1713665206258.iam.gserviceaccount.com`
4. 授予"编辑者"权限

### 3. 配置 Google Sheets 表头

确保你的 Google Sheets 第一行包含以下列名（顺序必须一致）：

```
job_id | service_type | customer_name | address | phone | job_status | scheduled_at | price | payment_status
```

## 安装和运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

然后在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
├── app/
│   ├── api/
│   │   └── jobs/
│   │       ├── route.ts          # GET /api/jobs, POST /api/jobs
│   │       └── [id]/
│   │           └── route.ts      # GET/PUT/DELETE /api/jobs/:id
│   └── page.tsx                  # 主页面 - 工作列表和管理界面
├── lib/
│   └── googleSheets.ts           # Google Sheets 连接和 CRUD 操作
├── credentials/
│   └── google-service-account.json  # Google Service Account 凭证
└── .env.local                    # 环境变量配置
```

## API 端点

### GET /api/jobs

获取所有工作

### POST /api/jobs

添加新工作

```json
{
  "service_type": "清洁服务",
  "customer_name": "张三",
  "address": "北京市朝阳区xxx",
  "phone": "13800138000",
  "job_status": "pending",
  "scheduled_at": "2026-02-15T10:00",
  "price": "500",
  "payment_status": "unpaid"
}
```

### GET /api/jobs/:id

获取单个工作

### PUT /api/jobs/:id

更新工作

### DELETE /api/jobs/:id

删除工作

## 数据字段说明

- `job_id`: 工作 ID（自动生成）
- `service_type`: 服务类型
- `customer_name`: 客户姓名
- `address`: 地址
- `phone`: 电话号码
- `job_status`: 工作状态
  - `pending`: 待处理
  - `in_progress`: 进行中
  - `completed`: 已完成
  - `cancelled`: 已取消
- `scheduled_at`: 计划时间
- `price`: 价格
- `payment_status`: 付款状态
  - `unpaid`: 未支付
  - `partial`: 部分支付
  - `paid`: 已支付

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Google Sheets API (googleapis)

## 常见问题

### Q: 为什么看到 "Google Sheets API has not been used" 错误？

A: 你需要在 Google Cloud Console 中启用 Google Sheets API。参见上面的"启用 Google Sheets API"部分。

### Q: 为什么无法访问 Google Sheets 数据？

A: 确保你的 Google Sheets 已经与 Service Account Email 共享，并且授予了编辑权限。

### Q: 如何更改 Google Sheets 或 Sheet 名称？

A: 编辑 `.env.local` 文件中的 `GOOGLE_SPREADSHEET_ID` 和 `GOOGLE_SHEET_NAME`。
