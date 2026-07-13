# Platform AI Boundary — DIRECTIVE-ONLY

AI access: `read-only-audit`  
Product-code writer: `human-developer-only`

Do not modify the platform workspace.

Codex, Claude, Cursor, Aider, Windsurf and sub-agents MUST NOT:

- write product source, tests, migrations, Storybook/config or generated output;
- create or switch branches/worktrees;
- stage, commit, tag, push or open a pull request;
- run generators, migrations, formatters or commands that change tracked files;
- fabricate runtime, test, CI, preview or deployment evidence.

AI MAY read files and produce a complete implementation directive under the actionplan
repository. The human developer is the only actor allowed to implement and evidence the
change. If platform writing is required, stop and return a `DIRECTIVE-ONLY` handoff.
