# OpenAI Build Week Submission Compliance Checklist

This checklist maps the current SecHub Academy repository to the official OpenAI
Build Week requirements. The Official Rules and Devpost website remain the
source of truth: <https://openai.devpost.com/rules> and
<https://openai.devpost.com/>.

Audit date: July 20, 2026

Status meanings:

- `Complete`: supported by the current repository or production deployment.
- `Owner action`: only the entrant or authorized representative can complete it.
- `Submission action`: must be entered or uploaded on Devpost.

## Eligibility and Representation

| Requirement | Status | Evidence or next action |
|---|---|---|
| Eligible entrant and supported country or territory | Owner action | Confirm age of majority or valid organization status and supported location |
| Entrant type selected | Submission action | Select Individual, Team, or Organization in Devpost |
| Authorized representative for Team or Organization | Owner action | Record the appointment and complete the declaration template |
| Contributor rights and representative authority | Owner action | Complete one `docs/CONTRIBUTOR_AUTHORIZATION_TEMPLATE.md` copy per contributor and retain signed copies privately |
| No prohibited conflict or disqualifying support | Owner action | Review eligibility and financial-support sections of the rules |

## Project Requirements

| Requirement | Status | Evidence or next action |
|---|---|---|
| Project uses Codex and GPT-5.6 | Complete | README documents Codex with GPT-5.6 Sol and runtime GPT-5.6 Terra |
| Working project in the Education category | Complete | Production application and API URLs are documented in README |
| Pre-existing work distinguished from new work | Complete | `docs/HACKATHON_SUBMISSION_RECORD.md` identifies baseline commit and qualifying extensions |
| Third-party integrations authorized | Owner action | Complete `docs/IP_AND_ASSET_PROVENANCE.md`; resolve the `Data` license, custom images, and project license |
| Project runs as depicted | Complete, recheck before submit | Run the judge flow and production checks in `docs/JUDGE_TESTING_INSTRUCTIONS.md` |

## Repository and README

| Requirement | Status | Evidence or next action |
|---|---|---|
| Repository URL provided | Submission action | Use `https://github.com/Little-Boy-s-SecHub/SecHub` |
| Public repository has relevant licensing | Owner action | Select a license and add a root `LICENSE` file before submission |
| README explains features and setup | Complete | Local WSL/Docker and production deployment instructions are present |
| README explains Codex acceleration and key decisions | Complete | See `How We Used Codex and GPT-5.6`, acceleration table, and decision table |
| README accurately explains GPT-5.6 use | Complete | Sol is documented for development; Terra is documented for runtime generation |
| Third-party notices available | Complete, pending owner clearance | See `THIRD_PARTY_NOTICES.md` |

## Devpost Fields and Media

| Requirement | Status | Evidence or next action |
|---|---|---|
| English project description | Submission action | Use the English README and Devpost description |
| Category | Submission action | Select Education |
| Public demo video | Submission action | Upload an English, public YouTube video shorter than three minutes |
| Video explains project, Codex, and GPT-5.6 with audio | Submission action | Narrate the learner flow, Sol engineering workflow, and Terra runtime generation |
| Video media and marks are cleared | Owner action | Use original narration and logo-free slides; complete the media review in the provenance register |
| Primary `/feedback` Codex Session ID | Submission action | Generate `/feedback` from the primary Codex task and paste the ID into Devpost |
| Test URL and private instructions | Submission action | Use the production URL and the text prepared in `docs/JUDGE_TESTING_INSTRUCTIONS.md` |
| Optional upload | Optional | No ZIP or README PDF is required when the public repository and live demo are provided |

## Judging Access

| Requirement | Status | Evidence or next action |
|---|---|---|
| Working project available free of charge | Complete, monitor | Keep frontend, API, database, and lab runtime online through August 5, 2026 at 5:00 PM Pacific Time |
| Test account available if registration is unsuitable | Owner action | Create a clean judge account and place credentials only in Devpost's private testing field |
| No rebuild required to test | Complete | Judges can use the hosted frontend |
| Production health verified | Complete, recheck before submit | Follow the health and smoke checks in the testing guide |

## Intellectual Property and Safety

| Requirement | Status | Evidence or next action |
|---|---|---|
| Entrant owns original submission components | Owner action | Review evidence and sign the entrant declaration |
| Open-source licenses are followed | Complete for inventory; owner review required | Dependency manifests and third-party notices record applicable licenses |
| `Data` content is licensed or authorized | Owner action | Add a license to the content repository or retain written owner authorization |
| Logo and favicon are cleared | Owner action | Record original source, AI generation record, or license |
| Game PNG files are cleared or removed | Owner action | They are currently unused but remain in the public repository |
| No malicious payload or hidden harmful behavior | Complete, recheck | The repository contains intentionally vulnerable training apps, not malware; preserve sandbox restrictions and disclosure |
| No secrets or private data in repository or media | Complete, recheck | Run secret scanning and manually inspect screenshots before submission |

## Final Submission Gate

Do not submit until every item below is checked by the entrant:

- [ ] Legal entrant name, type, country, members, and representative are correct.
- [ ] Each contributor has documented the applicable ownership basis and authorization.
- [ ] A root project `LICENSE` has been selected and added.
- [ ] The `Data` repository has an explicit license or written authorization.
- [ ] Logo, favicon, game PNG, seeded content, and diagram provenance are cleared.
- [ ] The entrant declaration has been reviewed and signed privately.
- [ ] Production has passed the judge testing flow using a clean account.
- [ ] Judge credentials are in the private Devpost field and not in Git.
- [ ] The public YouTube video is under three minutes and has cleared media.
- [ ] The `/feedback` Codex Session ID has been added.
- [ ] Repository, demo, video, and all required English text are linked in Devpost.
- [ ] The application will remain available through the end of judging.
