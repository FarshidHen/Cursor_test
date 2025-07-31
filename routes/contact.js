const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('../database/db');
const nodemailer = require('nodemailer');

const router = express.Router();
const db = new Database();

// Email transporter setup (configure with your email service)
const createEmailTransporter = () => {
    if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    } else if (process.env.SMTP_HOST) {
        return nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    return null;
};

// Validation rules
const contactValidation = [
    body('name')
        .notEmpty()
        .withMessage('نام و نام خانوادگی الزامی است')
        .isLength({ min: 2, max: 100 })
        .withMessage('نام باید بین ۲ تا ۱۰۰ کاراکتر باشد')
        .trim(),
    
    body('email')
        .isEmail()
        .withMessage('ایمیل معتبر وارد کنید')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('ایمیل خیلی طولانی است'),
    
    body('phone')
        .optional()
        .matches(/^[0-9\+\-\s\(\)]{7,20}$/)
        .withMessage('شماره تلفن معتبر وارد کنید')
        .isLength({ max: 20 })
        .withMessage('شماره تلفن خیلی طولانی است'),
    
    body('service')
        .notEmpty()
        .withMessage('نوع خدمات را انتخاب کنید')
        .isIn(['app-development', 'theme-customization', 'store-setup', 'consultation'])
        .withMessage('نوع خدمات معتبر نیست'),
    
    body('message')
        .notEmpty()
        .withMessage('پیام الزامی است')
        .isLength({ min: 10, max: 1000 })
        .withMessage('پیام باید بین ۱۰ تا ۱۰۰۰ کاراکتر باشد')
        .trim()
];

// Submit contact form
router.post('/submit', contactValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            console.log('Request body:', req.body);
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ارسالی معتبر نیست',
                errors: errors.array().map(error => ({
                    field: error.param,
                    message: error.msg
                }))
            });
        }

        const { name, email, phone, service, message } = req.body;

        // Get client info
        const clientInfo = {
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent')
        };

        // Save to database
        const contact = await db.createContact({
            name,
            email,
            phone,
            service,
            message,
            ...clientInfo
        });

        // Send notification email to admin (if configured)
        await sendNotificationEmail({
            name,
            email,
            phone,
            service,
            message,
            submittedAt: new Date().toLocaleString('fa-IR')
        });

        // Send confirmation email to user (if configured)
        await sendConfirmationEmail(email, name);

        res.json({
            success: true,
            message: 'پیام شما با موفقیت ارسال شد. در اسرع وقت با شما تماس خواهیم گرفت.',
            contactId: contact.id
        });

    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.'
        });
    }
});

// Send notification email to admin
async function sendNotificationEmail(contactData) {
    const transporter = createEmailTransporter();
    if (!transporter) return;

    const serviceNames = {
        'app-development': 'توسعه برنامه شاپیفای',
        'theme-customization': 'سفارشی‌سازی قالب',
        'store-setup': 'راه‌اندازی فروشگاه',
        'consultation': 'مشاوره'
    };

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@shopifystudio.ir',
        to: process.env.ADMIN_EMAIL || 'admin@shopifystudio.ir',
        subject: '🔔 پیام جدید از فرم تماس با ما',
        html: `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <h2 style="color: #1e3a8a;">پیام جدید از وبسایت</h2>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #dc2626; margin-top: 0;">اطلاعات تماس:</h3>
                    <p><strong>نام:</strong> ${contactData.name}</p>
                    <p><strong>ایمیل:</strong> ${contactData.email}</p>
                    ${contactData.phone ? `<p><strong>تلفن:</strong> ${contactData.phone}</p>` : ''}
                    <p><strong>نوع خدمات:</strong> ${serviceNames[contactData.service] || contactData.service}</p>
                    <p><strong>زمان ارسال:</strong> ${contactData.submittedAt}</p>
                </div>
                
                <div style="background: #dbeafe; padding: 20px; border-radius: 10px;">
                    <h3 style="color: #1e3a8a; margin-top: 0;">پیام:</h3>
                    <p style="line-height: 1.6;">${contactData.message}</p>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 10px;">
                    <p style="margin: 0; color: #92400e;">
                        <strong>یادآوری:</strong> لطفاً در اسرع وقت به این پیام پاسخ دهید.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Notification email sent to admin');
    } catch (error) {
        console.error('❌ Error sending notification email:', error);
    }
}

// Send confirmation email to user
async function sendConfirmationEmail(email, name) {
    const transporter = createEmailTransporter();
    if (!transporter) return;

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@shopifystudio.ir',
        to: email,
        subject: '✅ تأیید دریافت پیام شما - شاپیفای استودیو',
        html: `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
                <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">🛍️ شاپیفای استودیو</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">توسعه‌دهنده حرفه‌ای برنامه‌های شاپیفای</p>
                </div>
                
                <div style="padding: 30px; background: white; border: 1px solid #e5e7eb;">
                    <h2 style="color: #1e3a8a; margin-top: 0;">سلام ${name} عزیز!</h2>
                    
                    <p style="line-height: 1.6; color: #4b5563;">
                        از اینکه با ما تماس گرفتید متشکریم. پیام شما با موفقیت دریافت شده و تیم ما در اسرع وقت 
                        بررسی خواهد کرد و با شما تماس خواهد گرفت.
                    </p>
                    
                    <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #3b82f6;">
                        <h3 style="color: #1e40af; margin-top: 0;">چرا ما؟</h3>
                        <ul style="color: #374151; line-height: 1.6;">
                            <li>بیش از ۵ سال تجربه در توسعه برنامه‌های شاپیفای</li>
                            <li>تیم حرفه‌ای و متخصص</li>
                            <li>پشتیبانی ۲۴/۷</li>
                            <li>تحویل در موعد مقرر</li>
                        </ul>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        در صورت داشتن سوال یا نیاز به اطلاعات بیشتر، می‌توانید با ما تماس بگیرید:
                    </p>
                    
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        <p style="margin: 5px 0; color: #374151;">📞 تلفن: ۰۲۱-۱۲۳۴۵۶۷۸</p>
                        <p style="margin: 5px 0; color: #374151;">📧 ایمیل: info@shopifystudio.ir</p>
                    </div>
                </div>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">
                        © ۲۰۲۴ شاپیفای استودیو - تمامی حقوق محفوظ است
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Confirmation email sent to user');
    } catch (error) {
        console.error('❌ Error sending confirmation email:', error);
    }
}

// Get contact statistics (for admin dashboard)
router.get('/stats', async (req, res) => {
    try {
        const stats = await db.getContactStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting contact stats:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت آمار'
        });
    }
});

module.exports = router;