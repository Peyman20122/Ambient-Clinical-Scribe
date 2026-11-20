# Ambient-Clinical-Scribe

## Web app

From the repository root, run the development server with Python 3.10 or later:

```bash
python3 web/server.py
```

Open `http://127.0.0.1:8000` in your browser. Select **Load sample** to see a synthetic conversation and its SOAP note without an API key.

For live processing, set `SCRIBE_OPENROUTER_API_KEY` in the environment and restart the server. Set `SCRIBE_JEV_API_KEY` if the review model requires a separate key. The `SCRIBE_CHAT_MODEL`, `SCRIBE_JEV_MODEL`, and `SCRIBE_AUDIO_MODEL` variables select models available to your OpenRouter account.

Live processing sends the transcript or audio to OpenRouter. Use synthetic data for testing. The development server binds to loopback by default and has no user authentication.
