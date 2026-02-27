const url = "https://teuqyveifwuuuzpkitvo.supabase.co/rest/v1/";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldXF5dmVpZnd1dXV6cGtpdHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTcyMzUsImV4cCI6MjA4NzYzMzIzNX0.hN5AoVPq_eCs8KI99RLy35qtIMJBqc2XVRsAUD0l68Y";

fetch(url + "rpc/check_constraints_dummy", {
    method: "POST",
    headers: {
        "apikey": apikey,
        "Authorization": `Bearer ${apikey}`,
        "Content-Type": "application/json"
    }
}).catch(() => { });

// Instead of setting up a new RPC, I'll just check the frontend codebase again for "monthly" or "yearly"
