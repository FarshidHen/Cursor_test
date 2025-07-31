# 🗄️ راهنمای تنظیم Database

## 📊 **گزینه‌های Database**

### **Development (SQLite)**
- خودکار در `/data/shopify_studio.db`
- نیازی به تنظیم خاص نیست

### **Production (PostgreSQL)**
- داده‌ها حفظ می‌شوند
- Performance بهتر
- Scalable

## 🚀 **تنظیم PostgreSQL در DigitalOcean**

### **مرحله 1: ایجاد Database**

1. **برو به** [DigitalOcean Databases](https://cloud.digitalocean.com/databases)
2. **"Create Database"** کلیک کن
3. **تنظیمات:**
   - **Engine:** PostgreSQL 15
   - **Size:** Basic ($15/month - 1GB RAM)
   - **Region:** همون منطقه App شما
   - **Database Name:** `shopify_studio`
   - **User:** `shopifyapp`

### **مرحله 2: اتصال به App**

پس از ایجاد Database:

1. **Connection Details** رو کپی کن
2. **برو به App Platform** > **Environment Variables**
3. **اضافه کن:**

```
DATABASE_URL = postgresql://username:password@host:port/database?sslmode=require
```

**مثال:**
```
DATABASE_URL = postgresql://shopifyapp:password123@db-postgresql-nyc1-12345-do-user-67890-0.b.db.ondigitalocean.com:25060/shopify_studio?sslmode=require
```

### **مرحله 3: Test Connection**

App خودکار تشخیص می‌دهد:
- **اگر `DATABASE_URL` موجود باشد** ➜ PostgreSQL
- **اگر نباشد** ➜ SQLite (development)

## 💰 **مقایسه هزینه‌ها**

| Database | هزینه ماهانه | مزایا | معایب |
|----------|-------------|-------|-------|
| **SQLite** | رایگان | ساده، سریع | داده‌ها پاک می‌شوند |
| **PostgreSQL Basic** | $15 | Persistent، قابل اعتماد | هزینه اضافی |
| **PostgreSQL Pro** | $35 | High Performance | گران‌تر |

## 🔄 **Migration داده‌ها**

### **انتقال از SQLite به PostgreSQL:**

```bash
# 1. Export از SQLite
sqlite3 data/shopify_studio.db .dump > backup.sql

# 2. تبدیل به PostgreSQL format
# (manual conversion یا tools)

# 3. Import به PostgreSQL
psql $DATABASE_URL < converted_backup.sql
```

## 🛡️ **Backup خودکار**

DigitalOcean خودکار backup می‌گیرد:
- **Daily backups** برای 7 روز
- **Weekly backups** برای 4 هفته
- **Monthly backups** برای 3 ماه

## 🔧 **تنظیمات محیط**

```env
# Development (SQLite)
# DATABASE_URL= (خالی بذارید)

# Production (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
```

## 📊 **مانیتورینگ**

در DigitalOcean Database dashboard:
- **CPU Usage**
- **Memory Usage**
- **Connection Count**
- **Query Performance**

## 🚨 **نکات مهم**

1. **همیشه SSL استفاده کنید** (`?sslmode=require`)
2. **Password های قوی** انتخاب کنید
3. **Firewall تنظیم کنید** (فقط App دسترسی داشته باشد)
4. **منظم backup بگیرید**

## 🆘 **عیب‌یابی**

### **خطای اتصال:**
```bash
# چک کردن environment variable
echo $DATABASE_URL

# تست اتصال
psql $DATABASE_URL -c "SELECT 1;"
```

### **خطای Migration:**
```bash
# Reset tables (خطرناک!)
# فقط در development
npm run migrate:reset
```

## 📞 **پشتیبانی**

اگر مشکل داشتی:
1. **Database logs** رو چک کن
2. **App logs** رو ببین
3. **Connection string** رو تأیید کن