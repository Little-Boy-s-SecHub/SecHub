# Intellectual Property and Asset Provenance Register

This register separates facts verified from the repository from declarations
that only the entrant or an authorized representative can make. A Git author,
file timestamp, or AI-generation record helps establish provenance but does not
by itself prove legal ownership.

## Ownership Information Required

Complete these fields before signing or submitting an ownership declaration:

| Field | Required value |
|---|---|
| Entrant type | Individual, Team, or Organization |
| Entrant legal name | `[REQUIRED]` |
| Country or territory | `[REQUIRED]` |
| Authorized representative, if applicable | `[REQUIRED FOR TEAM OR ORGANIZATION]` |
| Team members or contributors | `[REQUIRED]` |
| Project license | `[REQUIRED]` |

## Source Code Register

| Component | Repository evidence | Required owner confirmation |
|---|---|---|
| Next.js frontend | Commit history under `frontend/` | Confirm every contributor assigned or retained rights that permit this submission |
| Spring Boot backend | Commit history under `backend/` | Confirm every contributor assigned or retained rights that permit this submission |
| Lab templates and generated-runtime code | `LabTemplateCatalog`, `LabArtifactService`, `SimulatedLabRuntimeService`, and `DockerService` | Confirm templates and challenge text are original or properly licensed |
| Performance and deployment automation | `performance/`, `.github/workflows/`, and `backend/deploy/` | Confirm original authorship; third-party actions and tools remain under their own licenses |
| Documentation | `README.md` and `docs/` | Confirm the entrant reviewed and adopted all AI-assisted text and diagrams |

Codex and GPT-5.6 were used as tools under human direction. OpenAI's Terms of
Use state that, as between the user and OpenAI and to the extent permitted by
law, the user retains rights in input and owns output; output may not be unique,
and the user remains responsible for reviewing it and having the rights needed
for all input. See <https://openai.com/policies/row-terms-of-use/>. The entrant
must still verify that final source and media do not copy protected third-party
material.

## Repository Image Register

| Files | Repository evidence and use | Clearance status |
|---|---|---|
| `frontend/public/logo.jpg`, `frontend/src/app/icon.jpg` | Custom mascot added in `955fa51` and optimized in `95a8c6`; currently used as the product logo and favicon | Owner must confirm whether it was drawn by the entrant, generated under entrant control, or licensed from a named source |
| Eight PNG files in `frontend/public/game/` | Added in `5e6a2c6` on June 30, 2026; current source search found no runtime references | Owner must document the source or remove them before submission; unused files are still part of a submitted public repository |
| `docs/sechub-system-design.png` | AI-assisted project diagram added during the submission period | Entrant-directed and human-reviewed, but contains third-party names and logo marks; do not show it in the demo video without permission |
| `docs/sechub-system-architecture.png` | AI-assisted project diagram added during the submission period | Entrant-directed and human-reviewed, but contains third-party names and logo marks; do not show it in the demo video without permission |
| `frontend/public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Standard create-next-app assets; current source search found no runtime references | Covered by the upstream template license where applicable, but `next.svg` and `vercel.svg` are marks; remove unused files or exclude them from submission media |

For each retained custom image, preserve private evidence such as the original
source file, prompt/session record, generation receipt, drawing history, license,
purchase record, or written permission. Do not commit private identity documents,
contracts, API keys, or receipts to the public repository.

## External Content and Data Register

| Content or data | Use | Status before submission |
|---|---|---|
| `Little-Boy-s-SecHub/Data` repository | English and Vietnamese security lessons synchronized by the backend | A root license was not visible on July 20, 2026. Add an explicit license or retain written authorization from the legal owner |
| Seeded lesson and lab text in `DataSeeder` | Demonstration content and fallback learning data | Entrant must confirm original authorship or record every external source and license |
| OpenAI Responses API output | Lab specifications and practice cards generated at runtime | Human review and backend validation are required; output may not be unique |
| DiceBear Avataaars output | Seeded demonstration avatars | Permitted under the style terms identified in `THIRD_PARTY_NOTICES.md`; attribution is retained there |
| JetBrains Mono | Frontend font loaded from Google Fonts | SIL Open Font License 1.1; notice retained in `THIRD_PARTY_NOTICES.md` |

## Trademark and Demo-Media Review

The Devpost rules state that the demonstration video must not include
third-party trademarks, copyrighted music, or other copyrighted material unless
the entrant has permission. Before recording the final video:

1. Use a logo-free architecture slide made from plain text and generic shapes.
2. Do not show the current architecture PNGs, README badges, browser extension
   overlays, or third-party logos unless permission has been verified.
3. Use original narration and silence or properly licensed music.
4. Capture only SecHub screens and data that the entrant is authorized to show.
5. Keep written permission and license evidence outside the public repository.

Technology names may still be needed in the written technical description for
accurate identification. Product names and marks remain the property of their
respective owners, and their mention does not imply endorsement.

## Final Clearance Decision

The entrant should mark each item only after reviewing the supporting evidence:

- [ ] All contributors and the authorized representative are identified.
- [ ] Rights to all entrant-owned source code and documentation are confirmed.
- [ ] The logo and favicon provenance is documented.
- [ ] The eight game PNG files are documented or removed.
- [ ] The separate `Data` repository has an explicit license or written owner authorization.
- [ ] Seeded lesson and lab content has been reviewed for copied text.
- [ ] Third-party licenses and service terms are accepted and satisfied.
- [ ] The final video contains no uncleared marks, music, screenshots, or personal data.
- [ ] A project license has been selected and added at repository root.
- [ ] The authorized entrant has signed the declaration template.

