import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrlMatch = envContent.match(/VITE_SUPABASE_URL=(.*?)$/m);
// We need Service Role Key or at least try to run via anon if it's allowed. 
// Wait, DDL operations (CREATE TABLE) cannot be run via standard Supabase REST API (postgrest) or even supabase-js client unless there's an RPC.
// Let's check if there's an existing RPC for executing arbitrary SQL.
const supabaseKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*?)$/m);

if (!supabaseUrlMatch || !supabaseKeyMatch) {
    console.error("Missing env keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

async function runSQL() {
    const sql = fs.readFileSync('./supabase/create_investments.sql', 'utf8');

    // Most users projects have an `exec_sql` RPC or similar if they use direct migrations from Node.
    // Let's just try to call a well-known name or see if we can do it via REST.
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error("RPC exec_sql failed:", error);

        // Let's try another common name
        const { data: d2, error: e2 } = await supabase.rpc('execute_sql', { query: sql });
        if (e2) {
            console.error("RPC execute_sql failed:", e2);
            console.log("We might need to run this manually via Supabase Dashboard if there's no RPC.");
        } else {
            console.log("Success with execute_sql:", d2);
        }
    } else {
        console.log("Success with exec_sql:", data);
    }
}

runSQL();
