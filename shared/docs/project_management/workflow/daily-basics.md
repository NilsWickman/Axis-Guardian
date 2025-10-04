# Daily Basics

**Description:** Workflow for working on the course repo for management, development, testing or analysis.

**Version:** 1.0

## Table of Contents

1. [Start of Day](#1-start-of-day)
2. [Pick Up Work](#2-pick-up-work)
3. [While working](#3-while-working)
4. [Before You Request Review](#4-before-you-request-review)
5. [End of Day](#5-end-of-day)
6. [Quick Reference](#quick-reference)

## 1. Start of Day
- Check GitLab notifications for notes on your merge requests.
- Open the issue board for assigned issues.
- Make sure you have your IDE on development branch:
  ```bash
  nilwi971@kogvet:~/projects/company2$ git status
  On branch development
  Your branch is up to date with 'origin/development'.
  ```
  If you are on wrong branch:
  ```bash
  git checkout development
  ```
  If your local branch have fallen behind:
  ```bash
  git pull
  ```

## 2. Pick Up Work
- Branch from dev branch `development`:
  ```bash
  git checkout -b feature/US#XX
  ```
  Use the dedicated make tool for running scripts and starting necessary services.
- Start the dev environment for your team:
  ```bash
  make help
  ```
  Will show something like:
  ```
  AXIS Surveillance System - Initial Setup 
  ========================================

  Available commands: 
    check-system          Check installed dependencies and versions
    clean-install         Clean installation and start fresh
    help                  Show this help message
    update                Update all dependencies to latest versions
    verify-install        Verify that everything is installed correctly

  Quick Start for New Developers: 
    make setup-project    # Install all dependencies
    make dev:intelligence # Starts dev environment for intelligence
    make dev:interface    # Starts dev environment for interface
    make dev:comms        # Starts dev environment for comms
  ```
  Install would for example run `pip install -r requirements` while `make dev:intelligence` starts a "Live server*" for intelligence and dockerized mock servers of the other layers.
  ```
  make setup-project
  ```

## 3. While working
- Use AI to understand and breakdown issues
- Use AI to generate and run necessary changes
- You are responsible for what you want merged

## 4. Before You Request Review
- Run the relevant test/lint your lead dev have provided and ensure no warnings remain (Use AI).
- Self-review the diff; remove noise and dead debugging code (Use AI).
- Push your branch and open a merge request referencing the issue ID `US#XX`.
- Add your lead dev as reviewer; note any worthwile problems/changes.
- Document prominent decisions in the issue or MR notes for the next reviewer.

## 5. End of Day
- Update the issue board column and leave a short status note on the issue if not done (progress, blockers, next step).
- If your branch still needs work, push the latest commits so the team can continue if needed:
  ```bash
  git push -u origin BRANCH_NAME
  ```
- This enables other to continue on your issue.

## Quick Reference
- Contract folder lives in `shared/contracts/`; change proposals always start from there as it's own branch.
- Generated packages sit in `shared/` with helpers in the Makefile; use `make help` if you forget a command.
- See `team-coordination.md` for cross-squad branching rules, ceremony schedules, and escalation paths.
