const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        // Create database directory if it doesn't exist
        const dbDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.dbPath = path.join(dbDir, 'shopify_studio.db');
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('📁 Connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        const contactsTable = `
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                service TEXT NOT NULL,
                message TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                status TEXT DEFAULT 'new',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const adminsTable = `
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        `;

        const settingsTable = `
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const socialMediaTable = `
            CREATE TABLE IF NOT EXISTS social_media (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT UNIQUE NOT NULL,
                url TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(contactsTable, (err) => {
                    if (err) {
                        console.error('Error creating contacts table:', err);
                        reject(err);
                        return;
                    }
                });

                this.db.run(adminsTable, (err) => {
                    if (err) {
                        console.error('Error creating admins table:', err);
                        reject(err);
                        return;
                    }
                });

                this.db.run(settingsTable, (err) => {
                    if (err) {
                        console.error('Error creating settings table:', err);
                        reject(err);
                        return;
                    }
                });

                this.db.run(socialMediaTable, (err) => {
                    if (err) {
                        console.error('Error creating social_media table:', err);
                        reject(err);
                        return;
                    }
                    
                    // Insert default admin if not exists
                    this.createDefaultAdmin();
                    // Insert default social media platforms
                    this.createDefaultSocialMedia();
                    
                    console.log('✅ Database tables created successfully');
                    resolve();
                });
            });
        });
    }

    async createDefaultAdmin() {
        const bcrypt = require('bcryptjs');
        const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);

        const insertAdmin = `
            INSERT OR IGNORE INTO admins (username, password_hash, email)
            VALUES (?, ?, ?)
        `;

        this.db.run(insertAdmin, [
            'admin',
            hashedPassword,
            process.env.ADMIN_EMAIL || 'admin@shopifystudio.ir'
        ], function(err) {
            if (err) {
                console.error('Error creating default admin:', err);
            } else if (this.changes > 0) {
                console.log('🔐 Default admin created - Username: admin, Password: ' + defaultPassword);
            }
        });
    }

    async createDefaultSocialMedia() {
        const defaultPlatforms = [
            { platform: 'instagram', url: 'https://instagram.com/shopifystudio', is_active: 1 },
            { platform: 'linkedin', url: 'https://linkedin.com/company/shopifystudio', is_active: 1 },
            { platform: 'github', url: 'https://github.com/shopifystudio', is_active: 1 },
            { platform: 'telegram', url: 'https://t.me/shopifystudio', is_active: 1 }
        ];

        const insertSocial = `
            INSERT OR IGNORE INTO social_media (platform, url, is_active)
            VALUES (?, ?, ?)
        `;

        for (const social of defaultPlatforms) {
            this.db.run(insertSocial, [social.platform, social.url, social.is_active], function(err) {
                if (err) {
                    console.error('Error creating default social media:', err);
                } else if (this.changes > 0) {
                    console.log(`📱 Default ${social.platform} link created`);
                }
            });
        }
    }

    // Social Media Methods
    async getSocialMedia() {
        const query = 'SELECT * FROM social_media WHERE is_active = 1 ORDER BY platform';
        
        return new Promise((resolve, reject) => {
            this.db.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async updateSocialMedia(platform, url, is_active = 1) {
        const query = `
            INSERT OR REPLACE INTO social_media (platform, url, is_active, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        return new Promise((resolve, reject) => {
            this.db.run(query, [platform, url, is_active], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    async deleteSocialMedia(platform) {
        const query = 'UPDATE social_media SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE platform = ?';
        
        return new Promise((resolve, reject) => {
            this.db.run(query, [platform], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Settings Methods
    async getSetting(key) {
        const query = 'SELECT value FROM settings WHERE key = ?';
        
        return new Promise((resolve, reject) => {
            this.db.get(query, [key], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.value : null);
                }
            });
        });
    }

    async setSetting(key, value, description = null) {
        const query = `
            INSERT OR REPLACE INTO settings (key, value, description, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        return new Promise((resolve, reject) => {
            this.db.run(query, [key, value, description], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Contact Methods
    async createContact(contactData) {
        const query = `
            INSERT INTO contacts (name, email, phone, service, message, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        return new Promise((resolve, reject) => {
            this.db.run(query, [
                contactData.name,
                contactData.email,
                contactData.phone || null,
                contactData.service,
                contactData.message,
                contactData.ip_address || null,
                contactData.user_agent || null
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...contactData });
                }
            });
        });
    }

    async getContacts(filters = {}) {
        let query = 'SELECT * FROM contacts';
        const params = [];
        const conditions = [];

        if (filters.status) {
            conditions.push('status = ?');
            params.push(filters.status);
        }

        if (filters.service) {
            conditions.push('service = ?');
            params.push(filters.service);
        }

        if (filters.from_date) {
            conditions.push('created_at >= ?');
            params.push(filters.from_date);
        }

        if (filters.to_date) {
            conditions.push('created_at <= ?');
            params.push(filters.to_date);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);
        }

        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getContactById(id) {
        const query = 'SELECT * FROM contacts WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            this.db.get(query, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async updateContactStatus(id, status) {
        const query = 'UPDATE contacts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            this.db.run(query, [status, id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    async deleteContact(id) {
        const query = 'DELETE FROM contacts WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            this.db.run(query, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Admin Methods
    async getAdminByUsername(username) {
        const query = 'SELECT * FROM admins WHERE username = ? AND is_active = 1';
        
        return new Promise((resolve, reject) => {
            this.db.get(query, [username], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async updateAdminLastLogin(id) {
        const query = 'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            this.db.run(query, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Statistics Methods
    async getContactStats() {
        const queries = {
            total: 'SELECT COUNT(*) as count FROM contacts',
            new: 'SELECT COUNT(*) as count FROM contacts WHERE status = "new"',
            today: 'SELECT COUNT(*) as count FROM contacts WHERE DATE(created_at) = DATE("now")',
            thisWeek: 'SELECT COUNT(*) as count FROM contacts WHERE created_at >= datetime("now", "-7 days")',
            byService: 'SELECT service, COUNT(*) as count FROM contacts GROUP BY service ORDER BY count DESC'
        };

        const results = {};

        for (const [key, query] of Object.entries(queries)) {
            try {
                if (key === 'byService') {
                    results[key] = await new Promise((resolve, reject) => {
                        this.db.all(query, (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows);
                        });
                    });
                } else {
                    results[key] = await new Promise((resolve, reject) => {
                        this.db.get(query, (err, row) => {
                            if (err) reject(err);
                            else resolve(row.count);
                        });
                    });
                }
            } catch (error) {
                console.error(`Error getting ${key} stats:`, error);
                results[key] = 0;
            }
        }

        return results;
    }

    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                    } else {
                        console.log('📁 Database connection closed');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = Database;