const key = process.env.VITE_GEMINI_API_KEY || "AIzaSyCZtPkJTnfzKUT0pKjPZIUfjhJ2A2x_0IE";
const fs = require('fs');
const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-pro"];
async function test() {
  let output = "";
  for (const model of models) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
    });
    output += `Model ${model}: ${res.status}\n`;
    if (!res.ok) output += (await res.text()) + "\n\n";
  }
  fs.writeFileSync('output-models.txt', output);
}
test();
