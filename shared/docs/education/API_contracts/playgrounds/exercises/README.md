# OpenAPI Workshop Exercises - Fast Track ⚡

AI-powered hands-on exercises for rapid learning (under 2 hours total).

## 🚀 AI-First Approach

**Philosophy:** Use AI tools (Claude, ChatGPT, Copilot) to move fast. Focus on:
- **Reading** YAML contracts intuitively
- **Understanding** API design patterns
- **Evaluating** AI-generated contracts
- **Validating** with online tools

**Less time typing, more time learning!**

---

## 🎯 Exercise 1: Fix the Broken Contract with AI

**File:** `broken-contract.yaml`
**Time:** 15 minutes
**Tools:** Swagger Editor (online) + AI assistant

### Objective
Learn to read, understand, and fix OpenAPI errors using AI assistance.

### Fast Track Steps

1. **Open in Swagger Editor** (no install needed!)
   - Go to: https://editor.swagger.io/
   - Copy/paste `broken-contract.yaml` contents
   - See errors instantly in the right panel

2. **Use AI to Understand Errors**
   ```
   Prompt to Claude/ChatGPT:
   "I have this OpenAPI error: [paste error message].
   What does it mean and how do I fix it?"
   ```

3. **Fix & Validate in Real-Time**
   - Edit in Swagger Editor (left panel)
   - Watch errors disappear (right panel)
   - See live docs update as you fix!

4. **Verify with Local Spectral** (optional)
   ```bash
   # From exercises directory - specify ruleset path
   spectral lint --ruleset ../../.spectral.yaml broken-contract.yaml

   # Or from project root
   # spectral lint playgrounds/exercises/broken-contract.yaml
   ```

### AI Prompts That Work

**Understanding the Contract:**
```
"Explain what this OpenAPI contract does in simple terms:
[paste YAML]"
```

**Finding Issues:**
```
"Review this OpenAPI spec and identify any issues:
[paste YAML]"
```

**Getting Solutions:**
```
"This endpoint is missing proper error responses.
Add 400, 404, and 500 responses with descriptions."
```

### Learning Goals
- Read YAML intuitively (info, paths, components)
- Understand validation rules through AI explanations
- Use online tools for instant feedback
- Recognize common patterns (schemas, refs, responses)

### Success Criteria
- ✅ All errors resolved in Swagger Editor
- ✅ Can explain what each section does
- ✅ Understand the fixed contract's purpose

---

## 🎯 Exercise 2: AI-Assisted API Extension

**Base:** Camera Surveillance API
**Time:** 25 minutes
**Tools:** AI assistant + Swagger Editor

### Objective
Use AI to rapidly extend an API while maintaining quality.

### Fast Track Steps

1. **Study the Existing API** (5 min)
   - Open `../camera-surveillance-api.yaml` in Swagger Editor
   - Browse the interactive docs
   - Note the patterns: schemas, responses, operationIds

2. **Generate Extensions with AI** (10 min)

   **Prompt Example:**
   ```
   "Extend this OpenAPI camera surveillance API with:

   1. Recording Management:
      - GET /cameras/{cameraId}/recordings - List recordings
      - POST /cameras/{cameraId}/recordings - Start recording
      - DELETE /recordings/{recordingId} - Delete recording
      - Recording model with: id, cameraId, startTime, endTime,
        format (enum: h264, h265, mjpeg), fileSize, url

   2. Include proper:
      - operationIds
      - Request/response schemas
      - Error responses (400, 404, 500)
      - Example values

   Match the style of this existing contract:
   [paste relevant sections]
   "
   ```

3. **Validate & Refine** (10 min)
   - Paste AI output into Swagger Editor
   - Fix any validation errors
   - Test with "Try it out" feature
   - Iterate with AI if needed

### AI Iteration Prompts

**If validation fails:**
```
"This OpenAPI snippet has errors: [paste error].
Fix it while matching this pattern: [paste working example]"
```

**To improve quality:**
```
"Add pagination to this GET endpoint with query parameters:
limit, offset, and return total count in response."
```

**For realistic examples:**
```
"Generate 3 realistic example recordings for a security camera
that recorded motion events today."
```

### Requirements Checklist
- [ ] All endpoints have unique operationIds
- [ ] Schemas use proper types (string, integer, array, object)
- [ ] Enums are defined for fixed value sets
- [ ] Error responses (400, 404, 500) included
- [ ] Request/response examples provided
- [ ] Passes Swagger Editor validation (no errors)

### Learning Goals
- Prompt engineering for API design
- Evaluating AI-generated contracts
- Maintaining consistency across endpoints
- Understanding REST best practices
- Real-time validation workflows

---

## 🛠️ Quick Reference: Essential Commands

### Online Validation (Fastest!)
- **Swagger Editor:** https://editor.swagger.io/
- **Paste → Instant validation → Interactive docs**

### Local Validation
```bash
# From project root (recommended)
spectral lint playgrounds/exercises/your-api.yaml

# Or from exercises directory with explicit ruleset
spectral lint --ruleset ../../.spectral.yaml your-api.yaml        # Find errors
spectral lint --ruleset ../../.spectral.yaml your-api.yaml --verbose  # Detailed
```

### Generate Documentation
```bash
# Swagger UI with Docker
docker run -p 8080:8080 \
  -e SWAGGER_JSON=/api/your-api.yaml \
  -v $(pwd):/api \
  swaggerapi/swagger-ui

# ReDoc (beautiful static docs - modern Redocly CLI)
npx @redocly/cli build-docs your-api.yaml -o docs.html
```

### Generate Code (The Payoff!)
```bash
# Python Pydantic models
datamodel-codegen \
  --input your-api.yaml \
  --output models.py \
  --output-model-type pydantic.BaseModel

# TypeScript types
npx openapi-typescript your-api.yaml --output types.ts
```

---

## 🎓 AI Prompt Library

### Understanding Contracts
```
"Explain this OpenAPI contract like I'm new to APIs"
"What's the difference between these two schema definitions?"
"Why use $ref instead of inline schemas?"
```

### Generating Features
```
"Add [feature] to this API following OpenAPI 3.0 best practices"
"Create a schema for [concept] with validation rules"
"Write example responses for this endpoint"
```

### Debugging
```
"Why is this $ref not resolving?"
"Fix this enum validation error"
"Make this schema match the example response"
```

### Best Practices
```
"Review this API for REST best practices"
"Add proper pagination to this list endpoint"
"Improve the error handling in this contract"
```

---

## 💡 Pro Tips for Fast Learning

1. **Use Swagger Editor First** - Instant feedback, no setup
2. **Let AI Do the Typing** - You focus on understanding
3. **Iterate Quickly** - Small changes, validate often
4. **Copy Good Patterns** - Reuse working examples
5. **Generate Code Early** - See how contracts become types
6. **Read, Don't Write** - Understanding > memorizing syntax

---

## 🏆 Workshop Success Checklist

After 40 minutes of exercises, you should be able to:

- [x] Read OpenAPI YAML and understand structure intuitively
- [x] Use Swagger Editor for instant validation
- [x] Prompt AI to generate/fix API contracts
- [x] Evaluate AI output for quality and correctness
- [x] Understand: paths, schemas, responses, refs
- [x] Know where to look for errors and how to fix them
- [x] Generate client code from contracts
- [x] Explain why contract-first development matters

---

## 🆘 Troubleshooting

**Swagger Editor Issues:**
- Clear browser cache if editor acts weird
- Use Chrome/Firefox for best compatibility
- Copy your work before refreshing!

**AI Generating Invalid YAML:**
- Provide working examples in your prompt
- Ask it to "match the existing style"
- Validate small sections at a time

**Validation Errors:**
- Read the error message carefully (Swagger Editor is clear!)
- Search for the line number in your YAML
- Use AI: "Explain this error: [paste error]"

**Common Gotchas:**
- Indentation matters in YAML (use 2 spaces)
- All $refs must point to existing schemas
- operationIds must be unique across the whole spec
- Enums need the `enum:` keyword with array of values

---

## 📚 Resources

**Essential Tools:**
- [Swagger Editor](https://editor.swagger.io/) - Online validator & docs
- [OpenAPI 3.0 Spec](https://spec.openapis.org/oas/v3.0.3) - Reference
- [Spectral Docs](https://stoplight.io/open-source/spectral) - Linter rules

**AI Assistants:**
- Claude Code / ChatGPT - Contract generation & debugging
- GitHub Copilot - Inline YAML suggestions
- Cursor - AI-powered editing

**Next Steps:**
- Complete these exercises in main workshop (Part 2)
- Try code generation (Part 3)
- Learn CI/CD automation (Part 5)

---

Happy fast learning! ⚡ Remember: **Understand, don't memorize!**