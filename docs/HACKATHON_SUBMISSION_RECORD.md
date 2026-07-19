# OpenAI Build Week Submission Record

This document records the baseline state of the SecHub Academy repository and the extensions implemented during the OpenAI Build Week.

## Hackathon Window
- Submission Period: July 13, 2026 to July 21, 2026.
- All times referenced below are commit dates recorded in the Git history.

## Baseline State
The repository commit immediately before the hackathon period:
- Commit: f6d70c697c3aef7fe1bc983afcc6d54095ce1492
- Date: July 2, 2026
- Details: The repository at this commit contained a Spring Boot and Next.js skeleton including basic authentication, static learning paths, simple vulnerability description pages, and a 2D lab canvas interface.

## Core Extensions Implemented During the Hackathon
The following features were developed and integrated during the hackathon window:
- Dynamic Lab Generation: Integrated OpenAI Responses API to generate tailored lab scenarios, exercises, and metadata dynamically.
- Simulated Lab Runtime: Developed an artifact generation engine, isolated runner proxy, and validation mechanisms to run generated training targets safely.
- PostgreSQL Persistence: Configured production database storage and connection pooling.
- Personalized Practice Workflows: Added growth analysis, review cards, adaptive lesson tracking, and custom practice controllers.
- Localization: Added translation structures and fully supported both English and Vietnamese languages.
- Real-time Notifications: Developed server-sent events (SSE) for notifications with user preference filtering.
- Production Deployment: Built and deployed the production app using automated GitHub workflows, Vercel frontend hosting, and a secured VPS backend.

## AI Toolkit Usage
- OpenAI Sol: Used for code generation, code analysis, debugging, and test writing during development.
- OpenAI Terra: Configured in the production application for runtime generation of practice challenges and lab scenarios.
