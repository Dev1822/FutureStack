#!/usr/bin/env node
/**
 * Verify opportunity_rounds migration (PR1).
 * Usage: node scripts/verify-rounds-schema.js
 * Requires backend/.env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('FAIL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const REQUIRED_ROUND_COLUMNS = [
    'id',
    'opportunity_id',
    'user_id',
    'round_number',
    'round_type',
    'scheduled_date',
    'result',
    'notes',
    'created_at',
    'updated_at',
];

const REQUIRED_OPPORTUNITY_COLUMNS = ['current_round_number', 'rejected_round_number'];

async function verifyTableReadable(table) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error) {
        throw new Error(`${table}: ${error.message} (${error.code || 'unknown'})`);
    }
    console.log(`OK  Table "${table}" exists and is readable`);
}

async function verifyColumns(table, columns) {
    const { data, error } = await supabase.from(table).select(columns.join(',')).limit(1);
    if (error) {
        throw new Error(`${table} columns [${columns.join(', ')}]: ${error.message}`);
    }
    console.log(`OK  ${table} columns: ${columns.join(', ')}`);
    return data;
}

async function verifyInsertRoundConstraints() {
    const { data: users, error: userError } = await supabase.from('users').select('id').limit(1);
    if (userError) throw userError;
    if (!users?.length) {
        console.log('SKIP Round insert test (no users in database)');
        return;
    }

    const userId = users[0].id;
    const { data: internships, error: oppError } = await supabase
        .from('opportunities')
        .select('id')
        .eq('user_id', userId)
        .eq('category', 'internship')
        .limit(1);

    if (oppError) throw oppError;
    if (!internships?.length) {
        console.log('SKIP Round insert test (no internship opportunities for test user)');
        return;
    }

    const opportunityId = internships[0].id;
    const testRow = {
        opportunity_id: opportunityId,
        user_id: userId,
        round_number: 9999,
        round_type: 'oa',
        result: 'pending',
        notes: 'PR1 schema verification (safe to delete)',
    };

    const { data: inserted, error: insertError } = await supabase
        .from('opportunity_rounds')
        .insert(testRow)
        .select('id, round_type, result')
        .single();

    if (insertError) {
        throw new Error(`Round insert failed: ${insertError.message}`);
    }

    console.log(`OK  Inserted test round ${inserted.id} (type=${inserted.round_type}, result=${inserted.result})`);

    const { error: deleteError } = await supabase
        .from('opportunity_rounds')
        .delete()
        .eq('id', inserted.id);

    if (deleteError) {
        throw new Error(`Round cleanup failed: ${deleteError.message}`);
    }

    console.log('OK  Deleted test round (cleanup)');
}

async function main() {
    console.log('Verifying interview rounds schema (PR1)...\n');

    await verifyTableReadable('opportunity_rounds');
    await verifyColumns('opportunity_rounds', REQUIRED_ROUND_COLUMNS);
    await verifyColumns('opportunities', REQUIRED_OPPORTUNITY_COLUMNS);
    await verifyInsertRoundConstraints();

    console.log('\nAll PR1 schema checks passed.');
}

main().catch((err) => {
    console.error('\nFAIL:', err.message);
    process.exit(1);
});
