const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Database = require('../database/db');

const router = express.Router();
const db = new Database();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'دسترسی غیرمجاز - توکن مورد نیاز است'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'توکن نامعتبر است'
            });
        }
        req.user = user;
        next();
    });
};

// Login validation
const loginValidation = [
    body('username')
        .notEmpty()
        .withMessage('نام کاربری الزامی است')
        .trim()
        .escape(),
    
    body('password')
        .notEmpty()
        .withMessage('رمز عبور الزامی است')
        .isLength({ min: 6 })
        .withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد')
];

// Admin login
router.post('/login', loginValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورود معتبر نیست',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // Get admin from database
        const admin = await db.getAdminByUsername(username);
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }

        // Update last login
        await db.updateAdminLastLogin(admin.id);

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: admin.id, 
                username: admin.username,
                email: admin.email 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'ورود موفقیت‌آمیز',
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                last_login: admin.last_login
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در ورود به سیستم'
        });
    }
});

// Verify token (check if user is still authenticated)
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const admin = await db.getAdminByUsername(req.user.username);
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'کاربر یافت نشد'
            });
        }

        res.json({
            success: true,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                last_login: admin.last_login
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در تأیید هویت'
        });
    }
});

// Get all contacts with filtering
router.get('/contacts', authenticateToken, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            service,
            from_date,
            to_date,
            search
        } = req.query;

        const filters = {};
        
        if (status) filters.status = status;
        if (service) filters.service = service;
        if (from_date) filters.from_date = from_date;
        if (to_date) filters.to_date = to_date;

        // Calculate offset for pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        filters.limit = parseInt(limit);
        filters.offset = offset;

        const contacts = await db.getContacts(filters);

        // If search is provided, filter by name or email
        let filteredContacts = contacts;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredContacts = contacts.filter(contact => 
                contact.name.toLowerCase().includes(searchLower) ||
                contact.email.toLowerCase().includes(searchLower) ||
                contact.message.toLowerCase().includes(searchLower)
            );
        }

        res.json({
            success: true,
            data: {
                contacts: filteredContacts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: filteredContacts.length
                }
            }
        });

    } catch (error) {
        console.error('Error getting contacts:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت لیست تماس‌ها'
        });
    }
});

// Get single contact
router.get('/contacts/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await db.getContactById(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'تماس یافت نشد'
            });
        }

        res.json({
            success: true,
            data: contact
        });

    } catch (error) {
        console.error('Error getting contact:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت اطلاعات تماس'
        });
    }
});

// Update contact status
router.patch('/contacts/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['new', 'in_progress', 'resolved', 'spam'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'وضعیت معتبر نیست'
            });
        }

        const result = await db.updateContactStatus(id, status);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'تماس یافت نشد'
            });
        }

        res.json({
            success: true,
            message: 'وضعیت تماس به‌روزرسانی شد'
        });

    } catch (error) {
        console.error('Error updating contact status:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در به‌روزرسانی وضعیت'
        });
    }
});

// Delete contact
router.delete('/contacts/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.deleteContact(id);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'تماس یافت نشد'
            });
        }

        res.json({
            success: true,
            message: 'تماس حذف شد'
        });

    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در حذف تماس'
        });
    }
});

// Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await db.getContactStats();

        // Calculate additional stats
        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

        const thisMonthContacts = await db.getContacts({
            from_date: thisMonth.toISOString()
        });

        const lastMonthContacts = await db.getContacts({
            from_date: lastMonth.toISOString(),
            to_date: thisMonth.toISOString()
        });

        // Calculate growth rate
        const growthRate = lastMonthContacts.length > 0 
            ? ((thisMonthContacts.length - lastMonthContacts.length) / lastMonthContacts.length * 100).toFixed(1)
            : thisMonthContacts.length > 0 ? 100 : 0;

        res.json({
            success: true,
            data: {
                ...stats,
                thisMonth: thisMonthContacts.length,
                lastMonth: lastMonthContacts.length,
                growthRate: parseFloat(growthRate),
                recentContacts: await db.getContacts({ limit: 5 })
            }
        });

    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت آمار داشبورد'
        });
    }
});

// Export contacts to CSV
router.get('/contacts/export/csv', authenticateToken, async (req, res) => {
    try {
        const contacts = await db.getContacts({});
        
        // Create CSV content
        let csv = 'ID,Name,Email,Phone,Service,Message,Status,Created At\n';
        
        contacts.forEach(contact => {
            const row = [
                contact.id,
                `"${contact.name}"`,
                contact.email,
                contact.phone || '',
                contact.service,
                `"${contact.message.replace(/"/g, '""')}"`, // Escape quotes
                contact.status,
                contact.created_at
            ].join(',');
            csv += row + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
        res.send(csv);

    } catch (error) {
        console.error('Error exporting contacts:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در صادرات اطلاعات'
        });
    }
});

module.exports = router;