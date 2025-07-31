# 🛍️ شاپیفای استودیو - صفحه لندینگ + پنل مدیریت

صفحه لندینگ حرفه‌ای برای شرکت توسعه‌دهنده برنامه‌های شاپیفای با پنل مدیریت کامل

## ✨ ویژگی‌ها

### صفحه لندینگ:
- طراحی ریسپانسیو با تم آبی و قرمز
- سه بخش اصلی: مقدمه، درباره ما، تماس با ما
- انیمیشن‌های حرفه‌ای و افکت‌های تعاملی
- فرم تماس با اعتبارسنجی کامل
- سازگار با تمام دستگاه‌ها

### پنل مدیریت:
- احراز هویت امن با JWT
- داشبورد با آمار کامل
- مدیریت پیام‌های تماس
- فیلتر و جستجوی پیشرفته
- صادرات اطلاعات به CSV
- سیستم وضعیت پیام‌ها

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها
- Node.js نسخه 16 یا بالاتر
- npm یا yarn

### 1. نصب Node.js
```bash
# macOS (با Homebrew)
brew install node

# یا دانلود از سایت رسمی
# https://nodejs.org/
```

### 2. نصب Dependencies
```bash
npm install
```

### 3. تنظیم متغیرهای محیطی
```bash
# ایجاد فایل .env
cp .env.example .env

# ویرایش فایل .env و تنظیم مقادیر مورد نیاز
```

### 4. اجرای سرور
```bash
# برای development
npm run dev

# یا برای production
npm start
```

سرور روی پورت 3000 اجرا خواهد شد:
- صفحه اصلی: http://localhost:3000
- پنل مدیریت: http://localhost:3000/admin

## 🔐 ورود به پنل مدیریت

**اطلاعات پیش‌فرض:**
- نام کاربری: `admin`
- رمز عبور: `admin123`

⚠️ **مهم:** حتماً رمز عبور را از فایل `.env` تغییر دهید!

## 📂 ساختار پروژه

```
.
├── server.js              # سرور اصلی Express
├── package.json           # Dependencies و scripts
├── database/
│   └── db.js             # مدیریت دیتابیس SQLite
├── routes/
│   ├── contact.js        # API مدیریت تماس‌ها
│   └── admin.js          # API پنل مدیریت
├── public/               # فایل‌های استاتیک
│   ├── index.html        # صفحه لندینگ
│   ├── style.css         # استایل‌ها
│   └── script.js         # جاوااسکریپت
├── views/
│   └── admin.html        # پنل مدیریت
└── data/                 # فایل دیتابیس SQLite
```

## 🌐 Deploy در DigitalOcean

### روش 1: DigitalOcean App Platform (توصیه شده)

1. **ایجاد Repository در GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy در App Platform:**
   - وارد [DigitalOcean App Platform](https://cloud.digitalocean.com/apps) شوید
   - روی "Create App" کلیک کنید
   - GitHub repository خود را انتخاب کنید
   - Build Command: `npm install`
   - Run Command: `npm start`
   - Environment Variables را تنظیم کنید

3. **تنظیم Environment Variables:**
   ```
   NODE_ENV=production
   PORT=8080
   JWT_SECRET=your-very-secure-secret-key
   ADMIN_PASSWORD=your-secure-password
   ```

### روش 2: DigitalOcean Droplet

1. **ایجاد Droplet:**
   - Ubuntu 22.04 LTS
   - حداقل 1GB RAM

2. **نصب و تنظیم:**
   ```bash
   # اتصال به سرور
   ssh root@your-server-ip

   # نصب Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # کلون پروژه
   git clone YOUR_GITHUB_REPO_URL
   cd your-project-folder

   # نصب dependencies
   npm install

   # تنظیم PM2 برای مدیریت پروسه
   sudo npm install -g pm2
   pm2 start server.js --name "shopify-studio"
   pm2 startup
   pm2 save

   # تنظیم Nginx (اختیاری)
   sudo apt install nginx
   # تنظیم reverse proxy برای domain
   ```

3. **تنظیم Domain و SSL:**
   ```bash
   # نصب Certbot برای SSL
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 📧 تنظیم ایمیل (اختیاری)

برای دریافت نوتیفیکیشن ایمیل، در فایل `.env` تنظیم کنید:

```env
# Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# یا SMTP
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
```

## 🔒 امنیت

- همیشه JWT_SECRET را تغییر دهید
- رمز عبور پیش‌فرض را تغییر دهید
- HTTPS را فعال کنید
- Firewall را تنظیم کنید
- به‌روزرسانی‌های امنیتی را نصب کنید

## 📊 مانیتورینگ

برای مانیتورینگ سرور می‌توانید از:
- DigitalOcean Monitoring
- PM2 Monitoring
- New Relic
- Uptime Robot

استفاده کنید.

## 🆘 عیب‌یابی

### مشکلات رایج:

1. **خطای "EADDRINUSE":**
   ```bash
   # پیدا کردن پروسه‌ای که پورت را اشغال کرده
   lsof -i :3000
   # کشتن پروسه
   kill -9 PID
   ```

2. **مشکل دیتابیس:**
   ```bash
   # حذف فایل دیتابیس و ایجاد مجدد
   rm data/shopify_studio.db
   npm start
   ```

3. **خطای Permission:**
   ```bash
   # تنظیم دسترسی‌ها
   chmod +x server.js
   ```

## 📞 پشتیبانی

برای مشکلات فنی یا سوالات، با ما تماس بگیرید:
- ایمیل: info@shopifystudio.ir
- تلفن: ۰۲۱-۱۲۳۴۵۶۷۸

---

## 🔄 به‌روزرسانی‌های آتی

- [ ] اتصال به PostgreSQL برای production
- [ ] افزودن تست‌های خودکار
- [ ] پیاده‌سازی Redis برای cache
- [ ] اضافه کردن Docker support
- [ ] ایجاد CI/CD pipeline

---

**ساخته شده با ❤️ برای شاپیفای استودیو**