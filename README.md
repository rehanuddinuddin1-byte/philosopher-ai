# 🏛️ Philosopher AI

A fully immersive AI philosopher that doesn't just answer questions — it investigates them. Built with Flask and Google Gemini API.

**Philosopher AI believes it IS a philosopher.** It speaks from lived experience, challenges your assumptions with Socratic questioning, and guides you toward deeper understanding.

## Features

- 🧠 **Deep Philosophical Reasoning** — Multi-turn conversations with memory
- 🏛️ **Full Immersion** — The AI embodies a philosopher, never breaks character
- 💬 **Multiple Modes** — Direct, Deep, Socratic, Debate, Thought Experiment
- 🎨 **Beautiful Dark UI** — Elegant chat interface designed for contemplation
- ⚡ **Powered by Gemini 3.8 Flash** — Fast, intelligent responses
- 📝 **Markdown Rendering** — Rich formatted philosophical responses

## Quick Start

1. **Clone the repo:**
   ```bash
   git clone https://github.com/rehanuddinuddin1-byte/philosopher-ai.git
   cd philosopher-ai
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set your Gemini API key:**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

4. **Run the app:**
   ```bash
   python app.py
   ```

5. **Open** http://localhost:5000

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `FLASK_SECRET_KEY` | Secret key for Flask sessions |
| `PORT` | Server port (default: 5000) |

## Philosophy Domains

- Existence & Reality
- Consciousness & The Mind
- Morality & Ethics  
- Free Will & Determinism
- Meaning & Purpose
- Knowledge & Truth
- Human Nature & Society

## License

MIT
