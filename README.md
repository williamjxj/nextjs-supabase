# Next.js + Supabase 图片库应用

这是一个使用 Next.js 15 和 Supabase 构建的图片上传和管理应用，具有以下功能：

1. 图片上传页面：上传图片到 Supabase 存储，成功后显示缩略图
2. 图片存储：将图片保存到 Supabase 存储和数据库表中
3. 图库页面：列出所有上传的图片，提供下载和删除选项

## 技术栈

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (存储和数据库)
- Context7 MCP (AI Development Assistant)

## 开发工具

### Context7 MCP

本项目已集成 Context7 MCP 服务器，为 AI 代码助手提供最新的文档和代码示例。

- 配置文件：`.vscode/mcp.json`
- 使用方式：在与 AI 助手对话时添加 "use @context7" 获得更好的代码建议
- 详细说明：查看 `docs/context7-setup.md`

## 项目设置

### 1. 克隆项目

```bash
git clone <repository-url>
cd nextjs-supabase-gallery
```

### 2. 安装依赖

```bash
$ npm install
```

### 3. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建一个新项目
2. 获取项目 URL 和匿名密钥
3. 在项目根目录创建 `.env.local` 文件并添加以下内容：

```yml
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. 运行开发服务器

```bash
# If local Supabase:
$ docker-compose up -d
$ npx supabase start
$ npm run dev
$ open http://127.0.0.1:54323/
```

应用将在 [http://localhost:3000](http://localhost:3000) 运行。

### 5. 🚀 Deploymnet:

```bash
# NEXTAUTH_SECRET (.env):
$ openssl rand -base64 32

NEXTAUTH_URL=https://nextjs-supabase-flame.vercel.app
APP_URL=https://nextjs-supabase-flame.vercel.app
```

## 项目结构

```
/src
  /app
    /api
      /init        - 初始化 Supabase 存储桶和数据库表
      /supabase    - Supabase 客户端配置
    /gallery       - 图库页面
    layout.tsx     - 应用布局和 Supabase 初始化
    page.tsx       - 主页/上传页面
  /components
    ImageUploader.tsx - 图片上传组件
```

## 功能说明

### 📝 项目进度

- [x] 确认用户需求
- [x] 初始化 Next.js + Supabase + Tailwind CSS 项目
- [x] 实现图片上传与缩略图显示页面
- [x] 实现后端存储和数据库保存功能
- [x] 实现图库页面（列表、下载、删除功能）
- [x] 验证所有功能并清理代码
- [ ] 向用户报告并发送项目

### 图片上传页面

- 选择图片文件（支持 JPG、PNG、GIF、WebP）
- 验证文件类型和大小
- 上传到 Supabase 存储
- 保存元数据到数据库
- 上传成功后显示缩略图

### 图库页面

- 显示所有上传的图片列表
- 提供下载功能
- 提供删除功能（同时从存储和数据库中删除）
- 显示图片信息（文件名、大小、上传日期）

## 数据库结构

`images` 表包含以下字段：

- `id`: UUID (主键)
- `file_name`: 文件名
- `file_path`: 存储路径
- `file_size`: 文件大小 (字节)
- `file_type`: 文件类型 (MIME)
- `url`: 公共访问 URL
- `created_at`: 创建时间

## 存储结构

所有图片存储在 `images` 存储桶中，路径格式为：`uploads/{随机ID}_{时间戳}.{扩展名}`

## 项目部署

## Paypal

### https://developer.paypal.com/

### https://sandbox.paypal.com

- sb-xe2gm43302125@personal.example.com / ed$@Vu1+
- sb-myfyp43311448@business.example.com / &W$^6ILb

### http://127.0.0.1:54323/project/default/sql/1

select * from auth.users;
select * from images;
select * from purchases;
sleect * from storage.buckets;