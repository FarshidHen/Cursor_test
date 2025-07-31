const { Pool } = require('pg');

class PostgresDatabase {
    constructor() {
        // Database connection from environment variable or default SQLite
        this.usePostgres = process.env.DATABASE_URL ? true : false;
        
        if (this.usePostgres) {
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });
            console.log('🐘 Using PostgreSQL database');
        } else {
            // Fallback to SQLite for development
            const SQLiteDB = require('./db');
            this.sqliteDb = new SQLiteDB();
            console.log('📁 Using SQLite database (development)');
        }
        
        this.init();
    }

    async init() {
        if (this.usePostgres) {
            await this.createPostgresTables();
        }
        // SQLite init is handled in its own class
    }

    async createPostgresTables() {
        const contactsTable = `
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                service VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                ip_address INET,
                user_agent TEXT,
                status VARCHAR(20) DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const adminsTable = `
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        `;

        const settingsTable = `
            CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(100) UNIQUE NOT NULL,
                value TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        try {
            await this.pool.query(contactsTable);
            await this.pool.query(adminsTable);
            await this.pool.query(settingsTable);
            
            // Create default admin
            await this.createDefaultAdmin();
            
            console.log('✅ PostgreSQL tables created successfully');
        } catch (error) {
            console.error('Error creating PostgreSQL tables:', error);
        }
    }

    async createDefaultAdmin() {
        const bcrypt = require('bcryptjs');
        const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);

        const insertAdmin = `
            INSERT INTO admins (username, password_hash, email)
            VALUES ($1, $2, $3)
            ON CONFLICT (username) DO NOTHING
        `;

        try {
            const result = await this.pool.query(insertAdmin, [
                'admin',
                hashedPassword,
                process.env.ADMIN_EMAIL || 'admin@shopifystudio.ir'
            ]);
            
            if (result.rowCount > 0) {
                console.log('🔐 Default admin created - Username: admin, Password: ' + defaultPassword);
            }
        } catch (error) {
            console.error('Error creating default admin:', error);
        }
    }

    // Contact Methods
    async createContact(contactData) {
        if (this.usePostgres) {
            const query = `
                INSERT INTO contacts (name, email, phone, service, message, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            
            const result = await this.pool.query(query, [
                contactData.name,
                contactData.email,
                contactData.phone || null,
                contactData.service,
                contactData.message,
                contactData.ip_address || null,
                contactData.user_agent || null
            ]);
            
            return result.rows[0];
        } else {
            return await this.sqliteDb.createContact(contactData);
        }
    }

    async getContacts(filters = {}) {
        if (this.usePostgres) {
            let query = 'SELECT * FROM contacts';
            const params = [];
            const conditions = [];
            let paramCount = 1;

            if (filters.status) {
                conditions.push(`status = $${paramCount++}`);
                params.push(filters.status);
            }

            if (filters.service) {
                conditions.push(`service = $${paramCount++}`);
                params.push(filters.service);
            }

            if (filters.from_date) {
                conditions.push(`created_at >= $${paramCount++}`);
                params.push(filters.from_date);
            }

            if (filters.to_date) {
                conditions.push(`created_at <= $${paramCount++}`);
                params.push(filters.to_date);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY created_at DESC';

            if (filters.limit) {
                query += ` LIMIT $${paramCount++}`;
                params.push(filters.limit);
            }

            const result = await this.pool.query(query, params);
            return result.rows;
        } else {
            return await this.sqliteDb.getContacts(filters);
        }
    }

    async getContactById(id) {
        if (this.usePostgres) {
            const query = 'SELECT * FROM contacts WHERE id = $1';
            const result = await this.pool.query(query, [id]);
            return result.rows[0];
        } else {
            return await this.sqliteDb.getContactById(id);
        }
    }

    async updateContactStatus(id, status) {
        if (this.usePostgres) {
            const query = 'UPDATE contacts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
            const result = await this.pool.query(query, [status, id]);
            return { changes: result.rowCount };
        } else {
            return await this.sqliteDb.updateContactStatus(id, status);
        }
    }

    async deleteContact(id) {
        if (this.usePostgres) {
            const query = 'DELETE FROM contacts WHERE id = $1';
            const result = await this.pool.query(query, [id]);
            return { changes: result.rowCount };
        } else {
            return await this.sqliteDb.deleteContact(id);
        }
    }

    // Admin Methods
    async getAdminByUsername(username) {
        if (this.usePostgres) {
            const query = 'SELECT * FROM admins WHERE username = $1 AND is_active = true';
            const result = await this.pool.query(query, [username]);
            return result.rows[0];
        } else {
            return await this.sqliteDb.getAdminByUsername(username);
        }
    }

    async updateAdminLastLogin(id) {
        if (this.usePostgres) {
            const query = 'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
            const result = await this.pool.query(query, [id]);
            return { changes: result.rowCount };
        } else {
            return await this.sqliteDb.updateAdminLastLogin(id);
        }
    }

    // Statistics Methods
    async getContactStats() {
        if (this.usePostgres) {
            const queries = {
                total: 'SELECT COUNT(*) as count FROM contacts',
                new: 'SELECT COUNT(*) as count FROM contacts WHERE status = \'new\'',
                today: 'SELECT COUNT(*) as count FROM contacts WHERE DATE(created_at) = CURRENT_DATE',
                thisWeek: 'SELECT COUNT(*) as count FROM contacts WHERE created_at >= CURRENT_DATE - INTERVAL \'7 days\'',
                byService: 'SELECT service, COUNT(*) as count FROM contacts GROUP BY service ORDER BY count DESC'
            };

            const results = {};

            for (const [key, query] of Object.entries(queries)) {
                try {
                    const result = await this.pool.query(query);
                    if (key === 'byService') {
                        results[key] = result.rows;
                    } else {
                        results[key] = parseInt(result.rows[0].count);
                    }
                } catch (error) {
                    console.error(`Error getting ${key} stats:`, error);
                    results[key] = 0;
                }
            }

            return results;
        } else {
            return await this.sqliteDb.getContactStats();
        }
    }

    async close() {
        if (this.usePostgres && this.pool) {
            await this.pool.end();
            console.log('🐘 PostgreSQL connection closed');
        } else if (this.sqliteDb) {
            await this.sqliteDb.close();
        }
    }
}

module.exports = PostgresDatabase;