await fetch("https://psmupocmzcvcvfvfoqtp.supabase.co/functions/v1/make-server-c7b4849c/health")
  .then(res => {
    console.log("Status:", res.status);
    return res.text();
  })
  .then(text => console.log("Body:", text))
  .catch(err => console.error("Error:", err));