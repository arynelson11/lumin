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

async function testInsert() {
    const payload = {
        name: 'Bitcoin Final Test',
        type: 'crypto',
        current_value: 5000,
        invested_amount: 4000,
        institution: 'Não informada',
        start_date: new Date().toISOString().split('T')[0],
        quantity: 0.05
    };

    console.log("Sending payload:", payload);
    const { data, error } = await supabase
        .from('investments')
        .insert([payload])
        .select();

    if (error) {
        console.error("Result Error:", error);
    } else {
        console.log("Result Data:", data);
        console.log("SUCCESS! The table and columns are correct.");
    }
}

testInsert();
