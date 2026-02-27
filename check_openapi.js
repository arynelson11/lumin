const url = "https://teuqyveifwuuuzpkitvo.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRldXF5dmVpZnd1dXV6cGtpdHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTcyMzUsImV4cCI6MjA4NzYzMzIzNX0.hN5AoVPq_eCs8KI99RLy35qtIMJBqc2XVRsAUD0l68Y";

fetch(url)
    .then(res => res.json())
    .then(data => {
        const subSchema = data.definitions.subscriptions;
        if (subSchema) {
            console.log("SUBSCRIPTION COLUMNS:");
            console.log(Object.keys(subSchema.properties));
        } else {
            console.log("No subscriptions table found in OpenAPI spec.");
        }
    })
    .catch(err => console.error(err));
