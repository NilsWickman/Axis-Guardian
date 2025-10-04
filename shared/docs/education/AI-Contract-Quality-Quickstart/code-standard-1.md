# Code Standards & Linting for AXIS Surveillance System

## Overview
This document outlines code quality standards and linting practices for maintaining high-quality, consistent code across all teams in the AXIS project.

## Why Code Standards Matter

### For Team Collaboration
- **Readability**: Consistent formatting makes code review faster
- **Maintainability**: Standard patterns reduce cognitive load
- **Onboarding**: New team members learn conventions quickly
- **Bug Prevention**: Linters catch common mistakes before runtime

### For Professional Development
- **Industry Standards**: Learn practices used in professional software development
- **Tool Mastery**: Experience with industry-standard linting tools
- **Quality Mindset**: Develop habits of writing clean, maintainable code

## Language-Specific Standards

### Python (Communications & Intelligence Services)

#### Tools Used
- **Black**: Code formatting (non-negotiable)
- **Ruff**: Fast linting and import sorting
- **MyPy**: Type checking
- **Pytest**: Unit testing with coverage

#### Setup
```bash
# Install in each Python service
pip install black ruff mypy pytest pytest-cov

# Add to pyproject.toml
[tool.black]
line-length = 88
target-version = ['py312']

[tool.ruff]
line-length = 88
target-version = "py312"
select = ["E", "F", "I", "N", "W", "UP"]

[tool.mypy]
python_version = "3.12"
strict = true
```

#### Daily Workflow
```bash
# Before committing
black .                    # Format code
ruff check .              # Check for issues
ruff check . --fix        # Auto-fix issues
mypy .                    # Type checking
pytest --cov=src/        # Run tests with coverage
```

#### Common Issues & Fixes

**Import Ordering**:
```python
# ❌ Wrong
import sys
from fastapi import FastAPI
import os
from axis_shared.models import Detection

# ✅ Correct (Ruff will auto-fix)
import os
import sys

from fastapi import FastAPI

from axis_shared.models import Detection
```

**Type Hints**:
```python
# ❌ Wrong
def process_detection(data):
    return {"status": "ok"}

# ✅ Correct
def process_detection(data: Detection) -> dict[str, str]:
    return {"status": "ok"}
```

**Line Length**:
```python
# ❌ Wrong (too long)
def very_long_function_name_that_exceeds_line_limit(parameter_one, parameter_two, parameter_three):
    return some_very_long_expression_that_should_be_broken_up

# ✅ Correct
def very_long_function_name_that_exceeds_line_limit(
    parameter_one: str,
    parameter_two: int,
    parameter_three: bool
) -> str:
    return (
        some_very_long_expression_that_should_be_broken_up
        .with_proper_line_breaks()
    )
```

### TypeScript/JavaScript (Frontend Service)

#### Tools Used
- **ESLint**: Code linting and best practices
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Vitest**: Unit testing

#### Setup
```bash
# Install in frontend service
npm install -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin

# .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    'prefer-const': 'error'
  }
}

# .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

#### Daily Workflow
```bash
# Before committing
npm run lint              # Check for issues
npm run lint:fix          # Auto-fix issues
npm run format            # Format with Prettier
npm run type-check        # TypeScript compilation
npm run test              # Run unit tests
```

#### Common Issues & Fixes

**Unused Variables**:
```typescript
// ❌ Wrong
function processData(data: Detection, unused: string) {
  return data.id;
}

// ✅ Correct
function processData(data: Detection) {
  return data.id;
}
```

**Type Safety**:
```typescript
// ❌ Wrong
const camera: any = getCameraData();
console.log(camera.name);

// ✅ Correct
interface Camera {
  id: string;
  name: string;
}

const camera: Camera = getCameraData();
console.log(camera.name);
```

**Consistent Formatting**:
```typescript
// ❌ Wrong
const config={host:"localhost",port:3000,timeout:5000};

// ✅ Correct (Prettier will auto-fix)
const config = {
  host: 'localhost',
  port: 3000,
  timeout: 5000,
};
```

## Pre-commit Hooks

### Setup Git Hooks
```bash
# Install pre-commit
pip install pre-commit

# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.7.0
    hooks:
      - id: black

  - repo: https://github.com/charliermarsh/ruff-pre-commit
    rev: v0.0.284
    hooks:
      - id: ruff

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.5.0
    hooks:
      - id: mypy

# Install hooks
pre-commit install
```

### What Happens on Commit
1. **Black** formats Python code
2. **Ruff** checks and fixes Python issues
3. **MyPy** verifies type annotations
4. **ESLint** checks TypeScript/JavaScript
5. **Prettier** formats frontend code
6. Commit **blocked** if any checks fail

## CI/CD Integration

### GitLab CI Pipeline
```yaml
# .gitlab-ci.yml
lint-python:
  stage: test
  script:
    - pip install black ruff mypy
    - black --check .
    - ruff check .
    - mypy .
  only:
    changes:
      - "**/*.py"

lint-frontend:
  stage: test
  script:
    - npm ci
    - npm run lint
    - npm run type-check
  only:
    changes:
      - "interface/**/*"
```

## Code Review Standards

### What Reviewers Look For

#### Code Quality
- [ ] Consistent formatting (automated by linters)
- [ ] Proper type annotations
- [ ] No unused imports or variables
- [ ] Clear variable and function names
- [ ] Appropriate error handling

#### Best Practices
- [ ] Single responsibility principle
- [ ] DRY (Don't Repeat Yourself)
- [ ] Clear separation of concerns
- [ ] Proper use of generated models from contracts

#### Testing
- [ ] Unit tests for new functions
- [ ] Test coverage > 70%
- [ ] Edge cases covered
- [ ] Integration tests for API endpoints

### Review Comments Examples

**Constructive Feedback**:
```
// Good comment
"Consider extracting this logic into a separate function for better testability"

// Better comment with example
"Consider extracting this logic into a separate function:

```python
def calculate_detection_confidence(detection: Detection) -> float:
    # implementation here
```

This would make the function easier to test and reuse."
```

## Teaching Linting to New Developers

### Learning Path

#### Week 1: Understanding the Why
- Read code without linting vs with linting
- Experience reviewing messy vs clean code
- Understand maintenance burden of inconsistent code

#### Week 2: Tool Setup
- Install linters in IDE
- Set up automatic formatting on save
- Configure pre-commit hooks
- Practice fixing linting errors

#### Week 3: Advanced Rules
- Custom linting rules for project
- Understanding error vs warning levels
- Configuring rules for team preferences

#### Week 4: Code Review Focus
- Practice giving constructive feedback
- Learn to identify code smells
- Understand when to ignore linting rules

### Hands-on Exercises

#### Exercise 1: Fixing Messy Code
```python
# Given this messy code, fix all linting issues:
import sys,os
from fastapi import*
import json

def processData(data):
    if data==None:return None
    result={}
    for item in data:
        if item['type']=='person':
            result[item['id']]=item
    return result
```

#### Exercise 2: Code Review Practice
- Review a PR with intentional linting violations
- Practice using GitLab's review tools
- Learn to give specific, actionable feedback

### Common Student Mistakes

1. **Ignoring Linting Errors**: "It works, why fix it?"
   - **Teaching Point**: Code is read more than written

2. **Fighting the Formatter**: Manually reformatting after Black
   - **Teaching Point**: Trust the tools, configure once

3. **Skipping Type Hints**: "Python doesn't need types"
   - **Teaching Point**: Types catch bugs at development time

4. **Disabling Rules Instead of Fixing**: `# noqa` everywhere
   - **Teaching Point**: Understand why rules exist first

## IDE Integration

### VS Code Setup
```json
// settings.json
{
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### PyCharm Setup
1. Install Black plugin
2. Configure Ruff as external tool
3. Enable MyPy integration
4. Set up automatic formatting

## Measuring Success

### Team Metrics
- **Linting violations per PR**: Target < 5
- **Pre-commit hook failures**: Target < 10%
- **Code review rounds**: Target < 3 per PR
- **Time spent on formatting in reviews**: Target < 5 minutes

### Learning Metrics
- **Students can set up linting**: 100%
- **Students fix violations without help**: 90%
- **Students give good code review feedback**: 80%

## Resources

### Documentation
- [Black Documentation](https://black.readthedocs.io/)
- [Ruff Rules](https://docs.astral.sh/ruff/rules/)
- [MyPy Documentation](https://mypy.readthedocs.io/)
- [ESLint Rules](https://eslint.org/docs/rules/)

### Learning Materials
- [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Effective Python](https://effectivepython.com/)
- [You Don't Know JS](https://github.com/getify/You-Dont-Know-JS)

### Tools
- [pre-commit](https://pre-commit.com/)
- [GitLab CI/CD](https://docs.gitlab.com/ee/ci/)
- [VS Code Extensions](https://marketplace.visualstudio.com/VSCode)

Remember: **Linting is not about perfection, it's about consistency and catching bugs early. The goal is to make code review focus on logic and design, not formatting and style.**