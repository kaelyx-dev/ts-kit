# Contributing to @kaelyx/ts-kit

Thank you for your interest in this package. This guide covers the steps to set up the
repository, make a change, and open a pull request (PR).

Read [AI-POLICY.md](./AI-POLICY.md) before you open a PR or an issue. It applies to every
contribution, whether or not you used an AI assistant.

## Set up the repository

```bash
git clone https://github.com/kaelyx-dev/ts-kit.git
cd ts-kit
npm install
```

Node.js 22 or later is required.

## Find or open an issue

- For a bug fix, open an issue first if one does not already exist, unless the fix is small and
  obvious.
- For a new function, check [Adding a function](./docs/guide/adding-a-function.md) for the rules
  on categories and naming before you write any code.
- For a bulk change (a rename, a mass dependency upgrade, a repository-wide reformat), open an
  issue first and wait for a maintainer to agree. See the "Bulk changes" section of
  [AI-POLICY.md](./AI-POLICY.md).

## Make your change

1. Create a branch.
2. If you are adding a function, run `npm run new -- <category> <name>` and follow
   [Adding a function](./docs/guide/adding-a-function.md).
3. Write the code, the tests, and the TSDoc block together. A test that always passes has no
   value. See Rule 3 of [AI-POLICY.md](./AI-POLICY.md).
4. Run `npm run test:watch` while you work.

## Check your work before you open a PR

```bash
npm run check
```

This is the same command CI runs: lint, typecheck, barrel check, tests with coverage, docs check,
build, `publint`, and `attw`. If it passes locally, it passes in CI.

## Add a changeset

If your change should be released, add a changeset:

```bash
npx changeset
```

See [Changesets and releases](./docs/guide/changesets-and-releases.md) for details. Commit the
changeset file with your PR.

## Open the pull request

- Describe what the change does and why.
- If an AI assistant wrote a large part of the change, say so in one line, per Rule 5 of
  [AI-POLICY.md](./AI-POLICY.md).
- Link the issue the PR resolves, if there is one.

A maintainer reviews the PR against [AI-POLICY.md](./AI-POLICY.md), whether or not you used an AI
assistant.
