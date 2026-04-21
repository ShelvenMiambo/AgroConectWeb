const key = "AIzaSyCZtPkJTnfzKUT0pKjPZIUfjhJ2A2x_0IE";
const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest"];
async function test() {
  for (const model of models) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
    });
    console.log(`Model ${model}: ${res.status}`);
    if (!res.ok) console.log(await res.text());
  }
}
test();
