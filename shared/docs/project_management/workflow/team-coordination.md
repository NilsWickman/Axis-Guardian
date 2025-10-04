# Team Coordination Guide

**Description:** Workflow for project wide workflow between teams.

**Version:** 1.0

## Table of Contents

1. [Product and requirement in Gitlab](#product-and-requirement-in-gitlab)
2. [Contract-First Delivery](#contract-first-delivery)
   1. [Branching](#branching)
3. [Issue Board Coordination](#issue-board-coordination)
   1. [Definitions of Done](#definitions-of-done)
4. [When in Doubt](#when-in-doubt)

## Product and requirement in Gitlab
1. TO-DO

## Contract-First Delivery
1. Sprint Planning marks the handoff of requirements from P&S to R&D for technical breakdown
2. Issues are divided by each team with teams creating granular issues for the sprint backlog
3. PM assist with clarifications and Scrum Master (Configuration Manager) assist the scrum processes
4. Issue 0 for Lead devs is creating an API Contract for next sprint
5. Development Branch is updated with new API Contract marking the go ahead for the rest of the Sprint.

### Branching
1. **Main** Production branch where the application runs. CI/CD setup for customer verification and showcase.
2. **Development** Main branch for development. Teams merge their feature branches directly into development in their day-to-day flow and assign their lead dev as reviewer.
3. **Hotfix branches** (`BugFix/*`) → bypass queue directly to Main. Requires downstream updates.

## Issue Board Coordination
- **Hierarchy**: Epic → Requirements → Team Issues.
- **Columns**: Backlog → Working On → Code Review → Done.
- Tag problematic issues with `blocked:contract`, `blocked:dependency`, or `blocked:integration` so leads can triage quickly.
- Move issues forward only when their DoD bullets and acceptance criteria are met.

### Definitions of Done
- **Contract**: spec approved by all leads, merged to `development`, generated package published.
- **Team Features**: Team branch merged, squad tests green, integration notes captured.
- **Integration**: cross-service tests pass, staging demo completed, documentation updated.
- **Epic**: all child issues closed, product owner sign-off.

## When in Doubt
- Check `daily-basics.md` for individual routines.
- Ping the R&D manager for arbitration on cross-squad priorities.
- Ping the Configuration manager for workflow problems.
