const url = "https://teuqyveifwuuuzpkitvo.supabase.co/rest/v1/subscriptions?select=*&limit=1";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldXF5dmVpZnd1dXV6cGtpdHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTcyMzUsImV4cCI6MjA4NzYzMzIzNX0.hN5AoVPq_eCs8KI99RLy35qtIMJBqc2XVRsAUD0l68Y";

fetch(url, {
    headers: {
        "apikey": apikey,
        "Authorization": `Bearer ${apikey}`
    }
})
    .then(res => res.json())
    .then(data => {
        if (data.length > 0) {
            console.log("Columns:", Object.keys(data[0]));
        } else {
            console.log("Empty array returned. Going to trigger a bad insert to see schema fields.");
            return fetch("https://teuqyveifwuuuzpkitvo.supabase.co/rest/v1/subscriptions", {
                method: "POST",
                headers: {
                    "apikey": apikey,
                    "Authorization": `Bearer ${apikey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ force_error: "xyz" })
            }).then(res => res.json()).then(err => console.log("Insert Error:", err));
        }
    })
    .catch(err => console.error("ERROR:", err));
