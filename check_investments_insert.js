import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrlMatch = envContent.match(/VITE_SUPABASE_URL=(.*?)$/m);
// We need Service Role Key to bypass RLS for inserting a test row, but let's just see if Anon Key throws a NOT NULL constraint error before RLS checks!
// Actually, RLS blocks inserts before constraint checks usually.
const supabaseKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*?)$/m);

if (!supabaseUrlMatch || !supabaseKeyMatch) {
    console.error("Missing env keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

async function run() {
    console.log("Attempting insert...");

    // Simulating exactly what InvestmentsPage.tsx does:
    const payload = {
        name: 'Teste Node',
        type: 'other',
        current_value: 0,
        invested_value: 0,
        profitability: 'N/A',
        risk: 'Baixo',
        liquidity: 'Alta',
        status: 'active'
    };

    const { data, error } = await supabase
        .from('investments')
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error("ERROR inserting:", error);
    } else {
        console.log("Success inserting!", data);
    }
}

run();
