# Changesets and releases

This package uses [Changesets](https://github.com/changesets/changesets) to version and publish.
Each pull request states its own version bump; nobody edits `package.json` by hand.

## Adding a changeset

After you make a change that should be released, run:

```bash
npx changeset
```

This asks you:

1. Which packages changed (there is only one: `@kaelyx/ts-kit`).
2. Whether the change is a `patch`, `minor`, or `major` bump.
3. A summary of the change, written for the changelog.

It writes a Markdown file into `.changeset/`. Commit this file as part of your pull request.

A pull request that adds a function, fixes a bug, or changes public behaviour needs a changeset.
A pull request that only touches docs, tests, or internal tooling usually does not.

## Choosing a bump

- **patch**: a bug fix, or an internal change with no effect on the public API.
- **minor**: a new function, or a new backwards-compatible option.
- **major**: a change to an existing function's signature or behaviour. Before `1.0.0`, treat any
  breaking change as a **minor** bump instead (see the version policy below).

## What happens after merge

1. Merging a pull request with a changeset to `main` triggers `.github/workflows/release.yml`.
2. The Changesets GitHub Action opens (or updates) a "Version Packages" pull request, with the new
   version number and an updated `CHANGELOG.md`, computed from every pending changeset.
3. Merging that version pull request runs `npm run build` and publishes the package to npm using
   npm trusted publishing (GitHub OIDC, so no npm token is stored in the repository).

You do not run `npm publish` yourself. Publishing only happens through the release workflow.

## Version policy

- Use `0.x` versions until the naming and API rules in this plan are accepted as permanent.
- Move to `1.0.0` once the shape of the API is stable.
- After `1.0.0`, a change to a function's signature is a major version.
