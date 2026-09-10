# Adding a function

One function has one directory. One directory has one function. Follow these steps to add one.

## 1. Choose a category

Categories live at the root of `src`. Each one has a narrow scope: `array`, `object`, `string`,
`number`, `function`, `predicate`, `promise`, `date`. Pick the category that matches the type of
the function's **first parameter**, not its return type. See the category table in the project
plan if you are unsure which one applies.

Only add a new category when an existing one truly does not fit, and only add a ninth category
when a function fits none of the eight above.

## 2. Run the scaffold command

```bash
npm run new -- <category> <name>
```

For example:

```bash
npm run new -- string truncate
```

This:

1. Checks that `<name>` is kebab-case and not already used anywhere in the package.
2. Asks you to confirm if `<category>` does not exist yet.
3. Creates `src/<category>/<name>/` with three stub files that all deliberately fail.
4. Runs `scripts/barrels.ts` so the new function is wired into the category and root barrels.

If you omit the arguments, the script asks for them interactively.

## 3. Write the function

Fill in `<name>.ts`. Follow the signature rules:

- Data first: the value being operated on is the first parameter.
- Other required parameters come after the data.
- An optional options object comes last, typed as `<FunctionName>Options`.

Every export needs one TSDoc block with `@param`, `@returns`, an `@example`, and a `@category`
tag. `npm run docs:check` fails the build if a tag is missing.

## 4. Write the types

Fill in `<name>.types.ts`. Every exported type name must start with the PascalCase form of the
function name (for example, `TruncateOptions` for `truncate`). This is required so the
`@kaelyx/ts-kit/types` barrel has no name collisions: `scripts/barrels.ts` checks this and stops
with an error if two functions export a type with the same name.

## 5. Write the tests

Fill in `<name>.test.ts`. At minimum, write:

- One test for the normal case.
- One test for the empty or boundary input.
- One test for each option and each documented error.
- One test that proves the function does not change its input (unless it changes it on purpose,
  in which case document that and test it).

The Vitest coverage threshold is 100% of lines and branches for `src/**`, so an untested branch
fails `npm run check`.

## 6. Check your work

```bash
npm run check
```

Read the TSDoc example you wrote, then actually run it. A generated function can pass a generated
test and still be wrong.

## 7. Add a changeset

```bash
npx changeset
```

See [Changesets and releases](/guide/changesets-and-releases) for what happens next.
