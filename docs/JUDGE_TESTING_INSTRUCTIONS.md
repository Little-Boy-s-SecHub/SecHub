# Judge Testing Instructions

This document provides a short production test path for SecHub Academy. Put any
private credentials in Devpost's private testing-instructions field, never in
this public repository.

## Access

```text
Application: https://sechub-academy.vercel.app/
API health: https://api.littleboys.biz/actuator/health
Category: Education
Supported browser: Current Chrome, Edge, Firefox, or Safari desktop browser
Judge username or email: [PUT ONLY IN DEVPOST PRIVATE FIELD]
Judge password: [PUT ONLY IN DEVPOST PRIVATE FIELD]
```

No local installation or rebuild is required for judging. The local WSL 2 and
Docker setup remains documented in the root README for reproducibility.

## Recommended Eight-Minute Test

1. Open the application and sign in with the private judge account, or register
   a new learner account.
2. Open a learning path and select a security lesson.
3. Read the lesson, then request a related practical lab.
4. Confirm that the generated lab title, scenario, hints, estimated duration,
   and points match the lesson topic and selected language.
5. Start the lab and switch between Standard UI and 2D Game Mode.
6. Unlock a hint, interact with the vulnerable training target, and submit the
   generated flag.
7. Open Growth and Review to inspect skill progress, strengths, weak-topic
   recommendations, and review cards.
8. Open notification settings, disable notifications, and confirm that new
   notifications are neither created nor streamed for that user. Re-enable the
   preference for normal realtime SSE behavior.

## Expected Results

- The frontend sends API traffic only to `https://api.littleboys.biz/api`.
- The health endpoint returns a JSON response containing `"status":"UP"`.
- Authentication, lessons, labs, growth, review, and notification routes load
  without Railway URLs or browser CORS errors.
- The lab timer matches the duration shown on the lab card.
- Each attempt receives a scoped runtime token, generated flag, expiry time, and
  isolated Docker or simulated runtime.
- AI output is validated. If the OpenAI request is unavailable or invalid, a
  deterministic topic-aware fallback keeps the lab workflow usable.

## Safety Boundary

SecHub is a defensive-security education platform. Its lab targets are
intentionally vulnerable and contain fictional users, generated flags, and safe
training scenarios. Test only inside the SecHub lab flow. Do not apply example
payloads to systems without explicit authorization.

## Production Verification

The project owner should run these checks immediately before submission and
periodically through the judging period:

```bash
curl --fail https://api.littleboys.biz/actuator/health
curl --fail --head https://sechub-academy.vercel.app/
```

The owner should also complete one full learner flow with a clean account,
confirm the configured backend model is `gpt-5.6-terra`, and monitor the GitHub
Actions deployment result. Do not place API keys, deployment secrets, or private
judge credentials in screenshots, logs, source control, or the public demo video.

