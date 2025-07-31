# 🚀 راهنمای Deploy در DigitalOcean

این راهنمای کاملی است برای deploy کردن پروژه شاپیفای استودیو در DigitalOcean.

## 📋 آماده‌سازی پروژه

### 1. آپلود کردن کد به GitHub

```bash
# ایجاد repository جدید در GitHub
# سپس:

git init
git add .
git commit -m "Initial commit: Shopify Studio landing page with admin panel"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2. تنظیم فایل‌های محیطی

قبل از deploy، فایل `.env` را با مقادیر امن تنظیم کنید:

```env
NODE_ENV=production
PORT=8080
JWT_SECRET=your-very-secure-random-secret-key-at-least-32-characters
ADMIN_EMAIL=your-email@domain.com
ADMIN_PASSWORD=your-very-secure-password
EMAIL_FROM=noreply@yourdomain.com
```

## 🌊 روش 1: DigitalOcean App Platform (ساده‌ترین روش)

### مزایا:
- ✅ مدیریت خودکار
- ✅ Auto-scaling
- ✅ SSL رایگان
- ✅ CDN داخلی
- ✅ پشتیبانی از Git deployment
- ✅ مانیتورینگ داخلی

### مراحل Deploy:

#### 1. ایجاد App در DigitalOcean

1. وارد [DigitalOcean Control Panel](https://cloud.digitalocean.com/) شوید
2. روی **"Apps"** کلیک کنید
3. **"Create App"** را انتخاب کنید
4. **GitHub** را به عنوان source انتخاب کنید
5. Repository پروژه خود را انتخاب کنید
6. Branch: `main`

#### 2. تنظیم Build Settings

```yaml
Build Command: npm install
Run Command: npm start
Environment: Node.js
```

#### 3. تنظیم Environment Variables

در بخش Environment Variables این مقادیر را اضافه کنید:

| Key | Value | Type |
|-----|-------|------|
| `NODE_ENV` | `production` | Plain Text |
| `PORT` | `8080` | Plain Text |
| `JWT_SECRET` | `your-secure-secret-key` | **Secret** |
| `ADMIN_EMAIL` | `admin@yourdomain.com` | Plain Text |
| `ADMIN_PASSWORD` | `your-secure-password` | **Secret** |
| `EMAIL_FROM` | `noreply@yourdomain.com` | Plain Text |

#### 4. تنظیم Domain (اختیاری)

- در بخش Domains، domain سفارشی خود را اضافه کنید
- SSL خودکار تنظیم می‌شود

#### 5. Deploy

- روی **"Create Resources"** کلیک کنید
- منتظر بمانید تا deploy تکمیل شود (معمولاً ۵-۱۰ دقیقه)

### 6. دسترسی به برنامه

پس از deploy موفق:
- صفحه اصلی: `https://your-app-name.ondigitalocean.app`
- پنل مدیریت: `https://your-app-name.ondigitalocean.app/admin`

## 🖥️ روش 2: DigitalOcean Droplet (کنترل کامل)

### مزایا:
- ✅ کنترل کامل سرور
- ✅ هزینه کمتر
- ✅ قابلیت نصب نرم‌افزار اضافی
- ✅ دسترسی SSH کامل

### مراحل Deploy:

#### 1. ایجاد Droplet

1. **Create Droplet** در DigitalOcean
2. **Image**: Ubuntu 22.04 LTS
3. **Size**: Basic - $6/month (1GB RAM)
4. **Region**: انتخاب نزدیک‌ترین منطقه
5. **SSH Key**: اضافه کردن کلید SSH شما

#### 2. اتصال به سرور

```bash
ssh root@YOUR_DROPLET_IP
```

#### 3. نصب Node.js

```bash
# به‌روزرسانی سیستم
apt update && apt upgrade -y

# نصب Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# تأیید نصب
node --version
npm --version
```

#### 4. کلون پروژه

```bash
# نصب Git
apt install git -y

# کلون repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# نصب dependencies
npm install
```

#### 5. تنظیم Environment Variables

```bash
# ایجاد فایل .env
nano .env
```

محتوای فایل:
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-very-secure-secret-key
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-password
EMAIL_FROM=noreply@yourdomain.com
```

#### 6. نصب و تنظیم PM2

```bash
# نصب PM2 به صورت global
npm install -g pm2

# اجرای برنامه با PM2
pm2 start server.js --name "shopify-studio"

# تنظیم startup
pm2 startup
pm2 save

# مشاهده وضعیت
pm2 status
```

#### 7. تنظیم Nginx (اختیاری اما توصیه شده)

```bash
# نصب Nginx
apt install nginx -y

# تنظیم فایل کانفیگ
nano /etc/nginx/sites-available/shopify-studio
```

محتوای فایل کانفیگ:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# فعال کردن سایت
ln -s /etc/nginx/sites-available/shopify-studio /etc/nginx/sites-enabled/

# تست کانفیگ
nginx -t

# restart nginx
systemctl restart nginx
```

#### 8. تنظیم SSL با Let's Encrypt

```bash
# نصب Certbot
apt install certbot python3-certbot-nginx -y

# دریافت SSL certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# تست auto-renewal
certbot renew --dry-run
```

#### 9. تنظیم Firewall

```bash
# فعال کردن UFW
ufw enable

# اجازه SSH
ufw allow ssh

# اجازه HTTP و HTTPS
ufw allow 'Nginx Full'

# مشاهده وضعیت
ufw status
```

## 🐳 روش 3: Docker Deployment

### استفاده از Docker Compose

```bash
# کلون repository
git clone YOUR_REPO_URL
cd YOUR_REPO_NAME

# ایجاد فایل .env
cp .env.example .env
# ویرایش .env با مقادیر مناسب

# اجرای با Docker Compose
docker-compose up -d

# مشاهده logs
docker-compose logs -f
```

### Deploy مستقیم Docker

```bash
# Build image
docker build -t shopify-studio .

# اجرای container
docker run -d \
  --name shopify-studio \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  -e ADMIN_PASSWORD=your-password \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  shopify-studio
```

## 📊 مانیتورینگ و نگهداری

### 1. مانیتورینگ PM2

```bash
# مشاهده وضعیت
pm2 status

# مشاهده logs
pm2 logs shopify-studio

# restart
pm2 restart shopify-studio

# مانیتورینگ real-time
pm2 monit
```

### 2. مانیتورینگ سیستم

```bash
# استفاده از htop
apt install htop -y
htop

# مشاهده disk usage
df -h

# مشاهده memory usage
free -h
```

### 3. پشتیبان‌گیری

```bash
# پشتیبان‌گیری از دیتابیس
cp /path/to/your/app/data/shopify_studio.db /backups/db_$(date +%Y%m%d).db

# پشتیبان‌گیری خودکار با cron
crontab -e
# اضافه کردن خط:
# 0 2 * * * cp /path/to/your/app/data/shopify_studio.db /backups/db_$(date +%Y%m%d).db
```

## 🔧 عیب‌یابی

### مشکلات رایج:

#### 1. پورت در حال استفاده
```bash
# پیدا کردن پروسه
lsof -i :3000
# کشتن پروسه
kill -9 PID
```

#### 2. مشکل permissions
```bash
# تنظیم ownership
chown -R $USER:$USER /path/to/app
```

#### 3. خطای memory
```bash
# افزایش swap space
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

## 📈 بهینه‌سازی Performance

### 1. تنظیم Nginx Caching

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. تنظیم Compression

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### 3. استفاده از Redis (اختیاری)

```bash
# نصب Redis
apt install redis-server -y

# تنظیم در کد Node.js برای cache کردن
```

## 💰 تخمین هزینه

### App Platform:
- Basic: $5/ماه
- Professional: $12/ماه

### Droplet:
- Basic (1GB): $6/ماه
- Regular (2GB): $12/ماه

### هزینه‌های اضافی:
- Domain: $12/سال
- Load Balancer: $12/ماه (در صورت نیاز)
- Database: $15/ماه (در صورت استفاده از Managed Database)

---

## 🔒 نکات امنیتی

1. همیشه passwords قوی استفاده کنید
2. JWT_SECRET را تصادفی و طولانی انتخاب کنید
3. SSL را فعال کنید
4. Firewall را تنظیم کنید
5. به‌روزرسانی‌های امنیتی را نصب کنید
6. از 2FA برای DigitalOcean استفاده کنید

---

## 📞 پشتیبانی

در صورت بروز مشکل:
1. ابتدا logs را چک کنید
2. مستندات DigitalOcean را مطالعه کنید
3. از DigitalOcean Community کمک بگیرید

**موفق باشید! 🚀**