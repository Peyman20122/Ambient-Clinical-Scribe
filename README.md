# Ambient-Clinical-Scribe

## Web app

From the repository root, run the development server with Python 3.10 or later:

```bash
python3 web/server.py
```

Open `http://127.0.0.1:8000` in your browser. Select **Load sample** to see a synthetic conversation and its SOAP note without an API key.

For live processing, set `SCRIBE_OPENROUTER_API_KEY` in the environment and restart the server. Set `SCRIBE_JEV_API_KEY` if the review model requires a separate key. The `SCRIBE_CHAT_MODEL`, `SCRIBE_JEV_MODEL`, and `SCRIBE_AUDIO_MODEL` variables select models available to your OpenRouter account.

Live processing sends the transcript or audio to OpenRouter. Use synthetic data for testing. The development server binds to loopback by default and has no user authentication.

### Render environment variables

| Key | OpenRouter value |
| --- | --- |
| `SCRIBE_OPENROUTER_API_KEY` | Your LLM API key |
| `SCRIBE_CHAT_MODEL` | `~z-ai/glm-flash-latest` |
| `SCRIBE_CHAT_BASE_URL` | `https://openrouter.ai/api/v1` |
| `SCRIBE_JEV_API_KEY` | Your Jev API key. If omitted, the app uses the LLM API key. |
| `SCRIBE_JEV_MODEL` | `typesafe/jev-1.14` |
| `SCRIBE_JEV_BASE_URL` | `https://openrouter.ai/api/alpha` |
| `SCRIBE_JEV_ENDPOINT` | Optional full Jev request URL from your provider. Takes precedence over `SCRIBE_JEV_BASE_URL`. |

The listed URLs and model IDs are defaults. Use the base paths only. The app appends `/chat/completions` for the LLM, `/audio/transcriptions` for audio, and `/decisions` for Jev. If you use different providers, use compatible endpoints and configure each provider's own key.

Set `SCRIBE_JEV_ENDPOINT` when your provider documents a complete Jev URL with a different route. The app sends its Jev decision request to that URL as entered. The provider must accept the Jev decision request and return the expected result format.
