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

async function run() {
    console.log("Fetching investments with join...");
    const { data, error } = await supabase
        .from('investments')
        .select(`*, investment_transactions (*)`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("ERROR from supabase:");
        console.error(error);
    } else {
        console.log("Success! Data preview:", data.length > 0 ? data[0] : "[]");
    }

    console.log("\nAttempting fetch without join...");
    const { data: noJoinData, error: noJoinErr } = await supabase
        .from('investments')
        .select('*');

    if (noJoinErr) {
        console.error("ERROR without join:", noJoinErr);
    } else {
        console.log(`Success no join! Rows found: ${noJoinData.length}`);
    }
}

run();
