# Claude Platform Boundary — DIRECTIVE-ONLY

Access mode: `read-only-audit`.  
Product-code writer: `human-developer-only`.

Do not modify the platform workspace.

Do not write code, tests, migrations, Storybook/config, generated files or patches. Do
not create a branch, commit, push or pull request. Read the platform only to prepare a
directive for the human developer. Write that directive in actionplan, including target
paths, red tests for the human, acceptance criteria, security negatives, rollback,
evidence requirements and stop conditions.

If the request requires platform writes, stop with a `DIRECTIVE-ONLY` handoff.
