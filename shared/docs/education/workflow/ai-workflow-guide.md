# AI-Assisted Workflow Guide

**Author:** Nils Wickman
**Date:** October 2, 2025
**Version:** 1.0

## Table of Contents

1. [Introduction](#1-introduction)
2. [Installing AI CLI Tools](#2-installing-ai-cli-tools)
   1. [Gemini CLI (Recommended)](#21-gemini-cli-recommended)
   2. [Codex CLI (For OpenAI Users)](#22-codex-cli-for-openai-users)
3. [Testing Your Setup](#3-testing-your-setup)
4. [Project Management Prompt Example](#4-project-management-prompt-example)
5. [Next Steps](#5-next-steps)

## 1. Introduction

AI tools can significantly enhance your workflow by helping with code generation, documentation review, and project management tasks. This guide will help you set up an AI CLI tool and demonstrate how to use it effectively for project management tasks.

## 2. Installing AI CLI Tools

Choose one of the following based on your preference and available API access:

### 2.1 Gemini CLI (Free)

Gemini CLI provides access to Google's Gemini AI models.

#### Install Gemini CLI

```bash
npm install -g @google/gemini-cli
```

### 2.2 Codex CLI (For OpenAI Users)

If you have an OpenAI account, you can use the Codex CLI.

#### Install Codex CLI

```bash
npm install -g @openai/codex
```

## 3. Launch the AI in your IDE

Test that your AI CLI is working, you will need to login with your google/OpenAI account

**For Gemini:**
```bash
gemini
```

**For Codex:**
```bash
codex
```

## 4. Project Management Prompt Example

Now let's use the AI to help with project management tasks. This example shows how to get feedback on whether the SRS (Software Requirements Specification) is clear by referencing key project documents.


**To your AI chat**
```bash
Look at @shared/docs/project_management/requirements/SRS.md @shared/docs/project_management/project_charter.md @shared/docs/project_management/teams_and_roles/team_structure.md . Do you see any problems or challenges with the @shared/docs/project_management/requirements/SRS.md  
```

### What This Prompt Does

This prompt:
1. **Provides context** by including multiple project documents
2. **Cross-references** different sources of truth (team structure, architecture, charter)
3. **Asks specific questions** about clarity, conflicts, and gaps
4. **Requests actionable feedback** with specific examples

### Result:

Outlines discrepencies between "intruder is human" and "object types". US-09: Operator can configure settings. Object recognition as quality, while listing this as external system. It can also list things that are based on context that is not included.

---

**Tip:** Always reference the most relevant living documents when asking AI for project-specific help. This ensures the AI's suggestions align with your team's current processes and decisions.
