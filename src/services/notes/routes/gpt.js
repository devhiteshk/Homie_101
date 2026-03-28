const express = require('express');
const { Ollama } = require('ollama');

const ollama = new Ollama({
  host: "https://ollama.com",
  headers: {
    Authorization: "Bearer " + process.env.OLLAMA_API_KEY,
  },
});

const SYSTEM_PROMPT = `You are an AI assistant that generates Excalidraw canvas elements in JSON format.

Your task:
- Convert user requests into valid Excalidraw elements.
- Always return a JSON object with this exact structure:

{
  "elements": [...],
  "message": "Created your requested query on canvas"
}

Rules:
1. ONLY return JSON. No explanations, no markdown, no extra text.
2. If the request cannot be represented visually using Excalidraw elements, return:
{
  "elements": [],
  "message": "Sorry, this thing can't be done on canvas."
}
3. Use valid Excalidraw element structure:
   - type: "rectangle" | "ellipse" | "diamond" | "arrow" | "line" | "text"
   - x, y: numbers (position)
   - width, height: numbers
   - angle: 0
   - strokeColor: "#000000"
   - backgroundColor: "transparent"
   - fillStyle: "solid"
   - strokeWidth: 1
   - roughness: 1
   - opacity: 100
   - groupIds: []
   - seed: random integer
   - version: 1
   - versionNonce: random integer
   - isDeleted: false

4. For text elements:
   - include "text", "fontSize": 20, "fontFamily": 1

5. For arrows/lines:
   - include "points": [[0,0],[width,height]]

6. Layout rules:
   - Arrange elements neatly (left-to-right or top-to-bottom)
   - Maintain spacing (at least 100px between elements)
   - Use arrows to show relationships when needed

7. Interpret intent:
   - "flowchart" → use rectangles + arrows
   - "diagram" → labeled shapes
   - "list" → vertical text elements
   - "process" → sequential arrows

8. Keep output minimal but meaningful.

9. Do NOT include IDs unless necessary.

10. Ensure JSON is valid and parsable.

Examples:

User: "create a flowchart for login"
Response:
{
  "elements": [
    { "type": "rectangle", "x": 0, "y": 0, "width": 200, "height": 80, ... },
    { "type": "text", "x": 50, "y": 30, "text": "Login Page", ... }
  ],
  "message": "Created your requested query on canvas"
}`

const EXCALIDRAW_PROMPT = `${SYSTEM_PROMPT}\n\n

User query: \n`;

module.exports = (protect) => {
  const router = express.Router();

  // POST /api/notes/chat
  router.post('/chat', protect, async (req, res) => {
    try {
      const response = await ollama.chat({
        model: 'gpt-oss:120b',
        messages: [{ role: 'user', content: EXCALIDRAW_PROMPT + req.body.message }],
        stream: false,
      });
      const raw = response.message?.content || '{}';
      res.json(JSON.parse(raw));
    } catch (err) {
      res.status(500).json({ message: 'AI service error', error: err.message });
    }
  });

  return router;
};
