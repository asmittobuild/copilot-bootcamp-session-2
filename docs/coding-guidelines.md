# Coding Guidelines

Our coding style emphasizes readability, consistency, and long-term maintainability. Code should use clear formatting so that intent is obvious at a glance: consistent indentation, meaningful spacing, descriptive names, and small, focused blocks of logic are preferred over dense or clever one-liners.

Functions should include quick summaries that explain purpose and behavior in one or two short lines. These summaries help reviewers and future contributors understand why a function exists, what it expects, and what it returns without needing to reverse-engineer implementation details first.

For linting, this project standardizes on ESLint to enforce consistent style and catch common quality issues early. Linting should run regularly during development and in CI so problems are identified before code review or deployment.

This project also follows the DRY principle ("Don't Repeat Yourself"): avoid duplicating logic, constants, and patterns across files. Repetition makes code harder to maintain because a single behavior change must be made in multiple places, increasing the risk of bugs and inconsistent outcomes. Instead, extract shared logic into reusable functions, modules, or components with clear names and narrow responsibilities.

Another key best practice is writing small, focused commits with clear commit messages. Each commit should represent one logical change so it is easier to review, test, and revert if necessary. Clear commit history improves team collaboration and makes long-term maintenance and debugging significantly easier.
