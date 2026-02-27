const url = "https://teuqyveifwuuuzpkitvo.supabase.co/rest/v1/installments?select=*,installment_fractions(*)";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldXF5dmVpZnd1dXV6cGtpdHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTcyMzUsImV4cCI6MjA4NzYzMzIzNX0.hN5AoVPq_eCs8KI99RLy35qtIMJBqc2XVRsAUD0l68Y";

fetch(url, {
    headers: {
        "apikey": apikey,
        "Authorization": `Bearer ${apikey}`
    }
})
    .then(res => res.text())
    .then(data => console.log("FETCH RESULTS:", data))
    .catch(err => console.error("ERROR:", err));
