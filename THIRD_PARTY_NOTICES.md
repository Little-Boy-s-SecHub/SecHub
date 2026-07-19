# Third-Party Notices

This document identifies the principal third-party software, services, content,
fonts, and hosted resources used by SecHub Academy. It is an attribution and
compliance aid, not a replacement for the license text or terms that apply to
each component.

The exact JavaScript dependency graph is recorded in
`frontend/package-lock.json`. The exact Java dependency graph is resolved from
`backend/pom.xml`. Transitive dependencies remain subject to their respective
licenses even when they are not individually listed below.

## Frontend Runtime Dependencies

| Component | Version in repository | License | Project |
|---|---:|---|---|
| Next.js | 16.2.9 | MIT | <https://github.com/vercel/next.js> |
| React | 19.2.4 | MIT | <https://github.com/facebook/react> |
| React DOM | 19.2.4 | MIT | <https://github.com/facebook/react> |
| Lucide React | 1.21.0 | ISC | <https://github.com/lucide-icons/lucide> |
| marked | 18.0.5 | MIT | <https://github.com/markedjs/marked> |

Frontend development dependencies include Testing Library, Vitest, ESLint,
jsdom, cross-env, and DefinitelyTyped packages under MIT licenses, plus
TypeScript under Apache License 2.0. Their resolved versions and dependency
trees are recorded in `frontend/package-lock.json`.

## Backend Runtime Dependencies

| Component | Version in repository | License | Project |
|---|---:|---|---|
| Spring Boot and Spring Framework modules | 3.4.4 / 6.2.5 | Apache License 2.0 | <https://github.com/spring-projects/spring-boot> |
| Spring Security | 6.4.4 | Apache License 2.0 | <https://github.com/spring-projects/spring-security> |
| Spring Data JPA | 3.4.4 | Apache License 2.0 | <https://github.com/spring-projects/spring-data-jpa> |
| PostgreSQL JDBC Driver | 42.7.5 | BSD 2-Clause | <https://github.com/pgjdbc/pgjdbc> |
| JJWT | 0.12.6 | Apache License 2.0 | <https://github.com/jwtk/jjwt> |
| Project Lombok | 1.18.38 | MIT | <https://github.com/projectlombok/lombok> |
| Hibernate ORM | 6.6.11.Final | GNU LGPL 2.1 or later | <https://github.com/hibernate/hibernate-orm> |

The Spring Boot runtime also resolves Jackson, Tomcat, Micrometer, HikariCP,
SnakeYAML, SLF4J, Logback, Byte Buddy, Jakarta APIs, and other transitive
components. Those components are used under the licenses published in their
Maven POMs and source repositories.

Backend test and build tooling includes Maven and Maven plugins under Apache
License 2.0 and JaCoCo under Eclipse Public License 2.0.

## Fonts and Avatars

| Resource | Use | License or terms | Source |
|---|---|---|---|
| JetBrains Mono | Loaded by the frontend through Google Fonts | SIL Open Font License 1.1 | <https://github.com/JetBrains/JetBrainsMono> |
| Google Fonts service | Delivers the JetBrains Mono stylesheet and font files | Google APIs Terms and Google Fonts terms | <https://developers.google.com/fonts> |
| DiceBear API | Produces seeded demonstration avatars | DiceBear terms; DiceBear code is MIT licensed | <https://www.dicebear.com/legal/> |
| Avataaars style | Style used by the seeded DiceBear URLs | Free for personal and commercial use; creator Pablo Stanley | <https://www.dicebear.com/licenses/> |

The three DiceBear URLs in `backend/src/main/java/com/sechub/seed/DataSeeder.java`
are demonstration data. They do not transfer ownership of the Avataaars style
to SecHub.

## External APIs and Hosted Services

| Service | SecHub use | Applicable terms or source |
|---|---|---|
| OpenAI | Codex-assisted development and GPT-5.6 Terra generation through the Responses API | <https://openai.com/policies/row-terms-of-use/>, <https://openai.com/policies/services-agreement/>, and <https://openai.com/policies/usage-policies/> |
| GitHub | Source hosting, Actions, and lesson-content synchronization through GitHub API and raw content endpoints | <https://docs.github.com/en/site-policy/github-terms/github-terms-of-service> |
| Vercel | Production hosting for the Next.js frontend | <https://vercel.com/legal/terms> |
| Docker | Backend image build and per-attempt lab containers | <https://www.docker.com/legal/> |
| PostgreSQL | Production database | <https://www.postgresql.org/about/licence/> |
| Nginx | Production TLS reverse proxy | <https://nginx.org/LICENSE> |
| Let's Encrypt and Certbot | TLS certificate issuance and automation | <https://letsencrypt.org/repository/> and <https://github.com/certbot/certbot> |
| Grafana k6 | Optional smoke, load, and stress tests | AGPL-3.0 for current open-source k6 releases; <https://github.com/grafana/k6> |

The production backend container is built from Maven and Eclipse Temurin Alpine
base images. Generated lab containers are built from `python:3.13-alpine`.
Software contained in those images remains subject to the licenses and notices
published by the image maintainers and upstream projects.

## Learning Content Repository

SecHub synchronizes English and Vietnamese lesson material from
<https://github.com/Little-Boy-s-SecHub/Data>. The content repository is a
separate dependency and must have an explicit license or a written authorization
from its legal owner before the SecHub submission is finalized. No root license
was visible in that public repository during the audit on July 20, 2026.

## Project Images and Trademarks

The source repository contains project-specific logo, game, and architecture
images. Their provenance and clearance status are tracked in
`docs/IP_AND_ASSET_PROVENANCE.md`.

Product names and marks mentioned in documentation remain the property of their
respective owners. Their inclusion identifies interoperability or deployment
technology and does not imply endorsement. The OpenAI Build Week demonstration
video has a stricter rule: do not show third-party marks or copyrighted material
unless the entrant has permission to do so.

## Project License Status

An authorized entrant must select and add the SecHub project license before
submitting a public repository. Until a root `LICENSE` file is added, this
repository does not grant a general license to copy, modify, or redistribute the
entrant-owned portions of SecHub. Third-party components remain governed by
their own licenses regardless of the project-license choice.

