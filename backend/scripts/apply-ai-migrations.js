#!/usr/bin/env node
'use strict';

/**
 * Applies AI Resume Checker + BYOK migrations directly to Postgres.
 *
 * Requires SUPABASE_DB_PASSWORD in backend/.env (Supabase Dashboard →
 * Project Settings → Database → Database password).
 *
 * Usage: npm run db:migrate:ai
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function projectRefFromUrl(url) {
    if (!url) return null;
    const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
    return match ? match[1] : null;
}

async function main() {
    const ref = projectRefFromUrl(process.env.SUPABASE_URL);
    const password = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_URL;

    if (!ref) {
        console.error('SUPABASE_URL is missing or invalid in backend/.env');
        process.exit(1);
    }

    let connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        if (!process.env.SUPABASE_DB_PASSWORD) {
            console.error(
                'Add SUPABASE_DB_PASSWORD to backend/.env (Supabase → Settings → Database → password),\n' +
                'or set DATABASE_URL to the full Postgres connection string.\n' +
                'Alternatively, paste docs/ai-tables-setup.sql into the Supabase SQL Editor.'
            );
            process.exit(1);
        }
        connectionString = `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.${ref}.supabase.co:5432/postgres`;
    }

    const sqlPath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '20260624210000_ai_resume_checker_and_byok.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
    });

    console.log(`Connecting to Supabase project ${ref}…`);
    await client.connect();
    try {
        await client.query(sql);
        console.log('AI migrations applied successfully (resume_ai_checks, user_ai_settings).');
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
