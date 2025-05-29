# 项目进度

- [x] 确认用户需求
- [x] 初始化 Next.js + Supabase + Tailwind CSS 项目
- [x] 实现图片上传与缩略图显示页面
- [x] 实现后端存储和数据库保存功能
- [x] 实现图库页面（列表、下载、删除功能）
- [x] 验证所有功能并清理代码
- [ ] 向用户报告并发送项目

```bash
$ npm run supabase login

$ npm run supabase link --project-ref saamqzojqivrumnnnyrf
```

```text
[auth]
 enabled = true
-site_url = "http://127.0.0.1:3000"
-additional_redirect_urls = ["https://127.0.0.1:3000"]
+site_url = "http://localhost:3000"
+additional_redirect_urls = []
 jwt_expiry = 3600
 enable_refresh_token_rotation = true
 refresh_token_reuse_interval = 10
[auth.email]
 enable_signup = true
 double_confirm_changes = true
-enable_confirmations = false
+enable_confirmations = true
 secure_password_change = false
-max_frequency = "1s"
+max_frequency = "1m0s"
 otp_length = 6
 otp_expiry = 3600
 [auth.email.template]
```

```bash
$ npm run db:push
```

### Database Tables Created

- `images` table with user authentication and RLS policies
- `Storage bucket images` with upload/access policies
- Proper indexes and triggers for performance

- Store image metadata in the images table
- Upload actual files to the images storage bucket
- Enforce user-level security for both data and files
- Support the gallery features in your Next.js app

- https://supabase.com/dashboard/project/saamqzojqivrumnnnyrf/storage/buckets
- https://supabase.com/docs/guides/database/prisma