# Scripts

Every script lives in `package.json`. Run them with `npm run <script>`.

| Script | What it does |
| --- | --- |
| `new` | Scaffolds a new function: `npm run new -- <category> <name>`. Writes the three files, then runs `barrels`. With the category `type`, scaffolds a standalone type instead: `npm run new -- type <name>` writes two files in `src/types/<name>/`. |
| `barrels` | Writes `src/index.ts`, every `src/<category>/index.ts`, and `src/types/index.ts`. Never edit these files by hand. |
| `barrels:check` | Compares the barrels on disk against what `barrels` would write. Fails if they differ. This is what CI runs. |
| `exports` | Writes `exports`, `typesVersions` and `files` in `package.json`, and the build output block in `.gitignore`, from the folders in `src`. Never edit these by hand. |
| `exports:check` | Compares those fields and that block against what `exports` would write. Fails if they differ. |
| `clean` | Deletes the build output from the package root. It deletes only the paths that `build` writes, and an old `dist/` folder if one exists. |
| `build` | Runs `clean`, then builds with tsdown from the glob of category and function files. The output goes into the package root (for example `number/clamp.js`), not into `dist/`. Editors that make import paths from file locations then suggest paths that work. |
| `test` | Runs the Vitest suite once. |
| `test:watch` | Runs Vitest in watch mode, for use while developing. |
| `typecheck` | Runs `tsc --noEmit` over `src` and `scripts`. |
| `lint` | Checks formatting and lint rules with Biome. |
| `lint:fix` | Same as `lint`, but applies the safe fixes. |
| `docs` | Runs TypeDoc and writes Markdown into `docs/api`, for the VitePress site. Then `scripts/inline-types.ts` moves each type and interface onto the page of the function it belongs to. Standalone types from `src/types` keep their own pages. |
| `docs:check` | Runs TypeDoc in validation mode only. Fails if an export has no TSDoc block or a doc link is broken. |
| `docs:dev` | Generates the API docs, then starts the VitePress dev server for this site. |
| `docs:build` | Generates the API docs, then builds the static site into `docs/.vitepress/dist`. |
| `docs:preview` | Serves the built static site, for a local check before it is deployed. |
| `check` | The one quality gate. Runs `lint`, `typecheck`, `barrels:check`, `test` (with coverage), `docs:check`, `build`, `publint`, and `attw`, in that order. |

## Order of operations

For everyday work:

1. `npm run new -- <category> <name>` to scaffold a function, or `npm run new -- type <name>` to
   scaffold a standalone type.
2. Write the function or type, its tests, and its types.
3. `npm run test:watch` while you work.
4. `npm run check` before you open a pull request.

`check` is the single command CI runs on every pull request and on every push to `main`, on
Node 22 and Node 24. A stale barrel, a missing TSDoc tag, a failing test, or a broken build all
fail this one command. There is nothing else to run by hand.
