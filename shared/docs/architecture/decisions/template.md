# [ADR-XXXX] Title

**Date:** YYYY-MM-DD
**Status:** [Proposed | Accepted | Rejected | Deprecated | Superseded by ADR-YYYY]
**Deciders:** [Team/Role responsible for decision]
**Technical Story:** [Link to ticket/issue if applicable]

## Context and Problem Statement

Describe the context and problem statement in 2-3 sentences. What is the issue or challenge that necessitates this architectural decision?

Example: "We need to choose a message queue technology for real-time event distribution between microservices. The system requires high throughput, low latency, and reliable delivery for surveillance data."

## Decision Drivers

List the key factors that influence this decision:

- Performance requirements
- Team expertise and learning curve
- Operational complexity
- Cost considerations
- Integration requirements
- Future flexibility

## Considered Options

List 3-5 realistic options that were evaluated:

1. **Option A** - Brief description
2. **Option B** - Brief description
3. **Option C** - Brief description

## Decision Outcome

**Chosen option:** Option X

**Justification:** Explain why this option was selected in 2-3 sentences.

### Positive Consequences

- Expected benefit 1
- Expected benefit 2
- Expected benefit 3

### Negative Consequences

- Expected drawback 1
- Expected drawback 2
- Mitigation strategies

## Detailed Analysis

### Option A: [Name]

**Description:** Detailed explanation of this option

**Pros:**
- Specific advantage 1
- Specific advantage 2

**Cons:**
- Specific disadvantage 1
- Specific disadvantage 2

**Effort:** [Low/Medium/High] - Brief explanation

**Risk:** [Low/Medium/High] - Brief explanation

### Option B: [Name]

[Same structure as Option A]

### Option C: [Name]

[Same structure as Option A]

## Implementation

### Action Items
- [ ] Task 1 - Owner, Timeline
- [ ] Task 2 - Owner, Timeline
- [ ] Task 3 - Owner, Timeline

### Validation Criteria
- Success metric 1
- Success metric 2
- Performance benchmark

### Migration Plan
If replacing existing solution:
1. Step 1
2. Step 2
3. Step 3

## Compliance and Constraints

- **Security:** Any security implications
- **Performance:** Performance requirements and impact
- **Regulatory:** Compliance considerations
- **Budget:** Cost implications

## Related Decisions

- [ADR-YYYY] - Related decision
- [Architecture Notebook Section] - Related documentation

## Notes

Any additional context, assumptions, or future considerations.

---

## ADR Creation Guidelines

### When to Create an ADR
- Technology choice affecting multiple teams
- Architectural pattern adoption
- Infrastructure decisions
- Database schema changes
- Integration approach decisions
- Security model changes

### ADR Numbering
- Use sequential 4-digit numbers: 0001, 0002, etc.
- Never reuse numbers, even for rejected ADRs
- Include number in filename: `0001-contract-first-api.md`

### Review Process
1. Author creates ADR in "Proposed" status
2. Share with relevant teams for feedback
3. Architecture review meeting for significant decisions
4. Update status to "Accepted" after approval
5. Link from relevant notebook sections

### Status Transitions
- **Proposed → Accepted:** Decision approved and implementation begins
- **Proposed → Rejected:** Decision not approved with rationale
- **Accepted → Deprecated:** Solution no longer recommended
- **Accepted → Superseded:** Replaced by newer ADR