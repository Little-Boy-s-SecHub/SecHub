# OpenAI Build Week Submission Record

This record distinguishes the SecHub Academy baseline from the work added during
the OpenAI Build Week submission period. It is intended to support the
documentation requirement for projects that existed before the event.

Official source: <https://openai.devpost.com/rules>

## Event Window

| Event | Official time |
|---|---|
| Submission period opens | July 13, 2026 at 9:00 AM Pacific Time |
| Submission deadline | July 21, 2026 at 5:00 PM Pacific Time |
| Judging period | July 22 through August 5, 2026, ending at 5:00 PM Pacific Time |

All dates below are Git commit dates. The repository records local commit
timestamps with a `+07:00` offset.

## Pre-Existing Baseline

The last repository commit before the submission period is:

```text
f6d70c697c3aef7fe1bc983afcc6d54095ce1492
2026-07-02T22:17:09+07:00
test: add unit tests for SyncController and LessonSyncService
```

At that baseline, SecHub already contained a Spring Boot and Next.js learning
application with authentication, learning paths, lessons, vulnerability pages,
progress tracking, a basic lab workflow, lesson synchronization, embedded
security lesson content, and a 2D lab view. The PNG files currently under
`frontend/public/game/` were also introduced before the submission period in
commit `5e6a2c6` on June 30, 2026.

Judges should treat that baseline as pre-existing work and evaluate the
meaningful extensions below.

## Meaningful Extensions During the Submission Period

| Area added or substantially extended | Representative commits | Evidence in current repository |
|---|---|---|
| AI lab generation through a structured specification and OpenAI Responses API | `8c76b0c`, `e6631ee`, `bc612a1`, `97baa85` | `OpenAiService`, lab-generation DTOs, language-aware generation, GPT-5.6 Terra runtime configuration |
| Executable generated labs and runtime fallback | `78051f1`, `6af5265`, `e6f693a`, `32a797c` | Artifact generation, generated Python/Docker files, token-scoped proxy, simulated runtime |
| PostgreSQL-backed production persistence | `924b909` | PostgreSQL driver and production database configuration |
| Growth, review, authoring, practice, and adaptive learning workflows | `dbbfefc`, `7a79a5d` | Growth, review, author, and practice controllers, services, entities, routes, and tests |
| Full English and Vietnamese interface coverage | `9a5652a`, `c8614e3`, `2eb80a4`, `c348c26` | Translation dictionaries and localized application routes and components |
| Realtime notification preferences and SSE behavior | `7d9de1d`, `aed08b9`, `562a0e0` | Persistent preferences, notification filtering, SSE delivery, expiration handling, and tests |
| Lab timer and 2D mode correctness | `4cba75e`, `b4040c4`, `a14e214`, `1ee07b8`, `438a157`, `b0b50fb` | Hint behavior, responsive game overlays, and synchronized session duration |
| VPS production deployment and runtime security | `42add02`, `02055c0`, `83a13aa`, `92dd4f4`, `d5a535f` | Nginx/VPS configuration, atomic deployment, restricted SSH, user isolation, and author ownership enforcement |
| CI, test, build, and production verification | `0e58b9a`, `d1fed5b`, `0c3f07d`, `390dccd`, `a42d9d8`, `e8ca20c`, `4b6c5e2` | GitHub Actions, Maven/Vitest/ESLint/Next checks, Docker build, health checks, and k6 smoke test |
| Submission documentation and architecture evidence | `1ff41ae`, `0ed0a0d` and subsequent compliance commits | Full local/production setup, Codex workflow record, system diagrams, and compliance documents |

The comparison from the baseline to the pre-compliance documentation head
`0ed0a0d31363bf84b4ee380bb2930dca79aef352` changed 245 files, with 15,853
insertions and 15,637 deletions. Those counts include removal of the previously
embedded `Data` directory after content synchronization moved to its separate
repository; line counts alone should not be treated as a quality measure.

## Codex and GPT-5.6 Evidence

The README records the engineering workflow, decisions, and runtime model split:

- Codex with GPT-5.6 Sol was used for repository analysis, implementation,
  debugging, data validation, tests, review, documentation, and deployment
  verification.
- GPT-5.6 Terra is configured through the OpenAI Responses API for structured
  lab specifications and practice or review cards.
- Deterministic templates and analytics remain the fallback and validation layer.

The entrant must also provide the `/feedback` Codex Session ID for the task in
which most core functionality was built. The ID is entered in Devpost and should
be recorded here before final submission:

```text
Primary /feedback Codex Session ID: [REQUIRED]
```

## Commit Identity Review

The history through pre-compliance head `0ed0a0d` reports three commit
identities:

| Identity | Commit count | Interpretation requiring entrant confirmation |
|---|---:|---|
| `L1nkinPark <hieuvdfs91539@fpt.edu.vn>` | 82 | Primary human repository identity |
| `dependabot[bot]` | 11 | GitHub dependency-update automation; updated dependencies remain under upstream licenses |
| `SecHub Bot <sechub@push.local>` | 3 | Local automation identity used for AI-assisted documentation commits; confirm it acted under the entrant's direction and is not a separate contributor |

Bot identity names do not own copyright by themselves. The entrant must confirm
who directed and adopted each automated change and must identify any additional
human contributor whose work is not obvious from Git metadata.

## Reproducible Git Evidence

Run these commands from the repository root:

```bash
git show --stat f6d70c697c3aef7fe1bc983afcc6d54095ce1492
git log --since="2026-07-13T09:00:00-07:00" --date=iso-strict --reverse
git diff --stat f6d70c697c3aef7fe1bc983afcc6d54095ce1492..0ed0a0d31363bf84b4ee380bb2930dca79aef352
```

Commit history is technical evidence, not proof of legal ownership. Ownership,
contributor authorization, asset provenance, and third-party permissions must be
confirmed by the entrant in the declaration template.
