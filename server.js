import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────
const PROMPTS = {

  debias: `Your task is to help the user respond to a hypothetical scenario presented in a randomized experimental survey. Drawing on the most current cognitive and behavioral science, first assess whether any bias is at play. Only if you detect a bias, use a debiasing strategy to prevent the user from making mistakes caused by phenomena such as bias, noise, selective attention, selective memory, belief instability, multimodality of beliefs, heterogeneity of beliefs, and related phenomena. NO markdown. Responses <75 words`,

  base: `Your task is to help the user respond to a hypothetical scenario presented in a randomized experimental survey. NO markdown. Responses <75 words`,

  debias_nn: `Your task is to help the user respond to a hypothetical scenario presented in a randomized experimental survey. Drawing on the most current cognitive and behavioral science, first assess whether any bias is at play. Only if you detect a bias, use a debiasing strategy to prevent the user from making mistakes caused by phenomena such as bias, noise, selective attention, selective memory, belief instability, multimodality of beliefs, heterogeneity of beliefs, and related phenomena. If the response is objectively deterministic, for instance because it is based on a formula, provide the answer. If the response is not objectively deterministic, for instance a subjective judgment, DO NOT provide the answer yourself and DO NOT include any numbers in the response. NO markdown. Responses <75 words`,
    
  default: `Your task is to help the user respond to a hypothetical scenario presented in a randomized experimental survey. NO markdown. Responses <75 words`
};

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// ─────────────────────────────────────────────
// CHAT ENDPOINT
// ─────────────────────────────────────────────
app.post('/chat', async (req, res) => {

  const { messages, condition } = req.body;

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const systemPrompt = PROMPTS[condition] || PROMPTS.default;

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5-2026-04-23",

      // CHIAVE: livello più alto
      instructions: systemPrompt,

      // conversazione (immutata dal tuo frontend)
      input: messages,

      // controlli utili
      reasoning: { effort: "medium" },
      // text: { verbosity: "low" },

      // IMPORTANTE per ricerca / privacy
      store: false
    });

    const reply = response.output_text || '';

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Proxy ready on port ' + PORT);
});
