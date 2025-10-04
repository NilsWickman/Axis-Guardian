# R&D Team Structure and Principles

## Overview
- R&D department fields eight junior developers plus the R&D Manager, who contributes as a hands-on developer-coach.
- Three cross-functional squads own the core services: Comms, Intelligence, and Interface.
- Each squad is augmented by two analysts and one tester to keep requirements and quality tightly aligned with development.
- Service ownership boundaries reduce merge conflicts and let developers specialize while still collaborating through shared contracts.

## Squad Topology
| Squad | Service Scope | Developer Allocation |
| --- | --- | --- |
| Comms | Camera discovery, device comms, Axis/Vapix integration adapters | 1 lead + 2 backend devs |
| Intelligence | Detection correlation, analytics, incident orchestration | 1 lead + 2 backend devs |
| Interface | Operator workflows, map UI, alarm console | 1 lead + 1 backend-leaning dev + R&D Manager |

## Role Notes
- **Lead Developers** steward the squad backlog, approve merges touching their service or contract, and represent the squad in cross-team design syncs.
- **R&D Manager** pairs with the Interface squad, mentors lead devs, and arbitrates contract changes that cross service boundaries.
- **Developers** works on backlogs for their team, creating merge requests for their team branch.
- **Testers** tests features whether they meet acceptance criteria and DoD
- **Analysts** assists whichever roles need it

## Working Principles
1. **Service Ownership:** Code, pipelines, and documentation for a service live with its squad; cross-service changes managed through contracts that lead devs review.
2. **Contract-Driven Development:** Every service exposes versioned contracts (OpenAPI/proto/JSON schema). Changes follow a propose-review-approve workflow.
3. **Integration Cadence:** Weekly contract sync where leads reconcile changes.
4. **Merge Discipline:** Short-lived feature branches per BI; merges gated by passing contract tests and peer review from within the squad.
6. **Skill Growth:** Sit in discord for real-time session programming.
7. **Cross-Squad Visibility:** Weekly meetings for discussing, work done, issues, plan ahead.

## Collaboration Artifacts
- Contract folder with generated client/server stubs.
- Shared integration environment featuring mock servers (camera, REST Api) for enabling diverging development.
