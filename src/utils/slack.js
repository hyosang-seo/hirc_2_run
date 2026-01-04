export async function sendSlackMessage(text) {
  const url = process.env.REACT_APP_SUPABASE_SLACK_FUNCTION_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(anonKey ? { "Authorization": `Bearer ${anonKey}` } : {}),
    },
    body: JSON.stringify({ text }),
  });
}