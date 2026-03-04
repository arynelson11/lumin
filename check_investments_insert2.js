import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrlMatch = envContent.match(/VITE_SUPABASE_URL=(.*?)$/m);
const supabaseKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*?)$/m);

if (!supabaseUrlMatch || !supabaseKeyMatch) {
    console.error("Missing env keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

// NOTE: Since we are using anon key, we MUST bypass RLS or provide a valid auth token.
// To bypass RLS and test the actual DB constraints, we could use the service_role key if we had it.
// Wait, the user has been creating investments in the past. If the user is logged in, their RLS policy passes.
// The Node script won't pass RLS without a JWT, but if the error is a constraint error, it might throw before RLS or we might just get an RLS violation.
// If RLS rejects it, we just get "new row violates row-level security policy".
// Let's inspect the investment_transactions insert logic.

async function testInsert() {
    // Generate an invalid / test payload that mimics the UI exactly
    const payload = {
        name: 'Bitcoin Node Test',
        type: 'crypto',
        current_value: 5000,
        invested_value: 4000,
        quantity: 0.05,
        institution: 'Não informada',
        start_date: new Date().toISOString(),
        profitability: 'N/A',
        risk: 'Baixo',
        liquidity: 'Alta',
        status: 'active'
    };

    console.log("Sending payload:", payload);
    const { data, error } = await supabase
        .from('investments')
        .insert([payload])
        .select();

    console.error("Result Error:", error);
    console.log("Result Data:", data);
}

testInsert();
