# AI policy for contributions

This policy is about the use of an artificial intelligence (AI) assistant in a
contribution to this repository. It applies to every pull request (PR) and to
every issue.

## Summary

- You can use an AI assistant. We do not restrict which one.
- You own the result. You must be able to explain every line that you submit.
- You must supply tests. A change without good test coverage is not ready.
- Keep the code simple. A person must understand the code on the first read.
- Do not open an issue or a PR that you did not read first.

## Rule 1. You can use an AI assistant

You can use an AI assistant for any part of a contribution. This includes the
code, the tests, the documentation, and the commit messages.

The tool does not change the standard. We review your PR against the same
rules as a PR that a person wrote alone.

## Rule 2. You own what you submit

You are the author of the PR. The AI assistant is not.

Before you open a PR, do these checks:

1. Read every line of the change.
2. Remove the code that the task does not need.
3. Run the tests on your machine.
4. Check that you can explain each decision to a reviewer.

If you cannot explain a part of the change, do not submit it. Learn what the
code does first, or replace it with code that you understand.

## Rule 3. You must supply tests

Test coverage is the main control in this policy. An AI assistant writes code
faster than a person reads it. Tests give us a check that does not depend on
the reader.

Each PR must meet these conditions:

| Condition | What it means |
| --- | --- |
| The new behaviour has tests | Each new function, branch, and error path has at least one test |
| The tests fail without the change | If you delete the new code, a test must fail. A test that always passes has no value |
| The failure cases have tests | Test the error paths, not only the success path |
| Coverage does not fall | The change does not leave less of the code under test than before |
| The tests read as a specification | A person reads the test names and learns what the code does |

We set no percentage target for coverage. A percentage rewards a test that runs
the code without a check of the result. The reviewer judges whether the tests
cover the change. If the reviewer asks for more tests, the reviewer states
which behaviour needs a test.

Do not use an AI assistant to write a test that repeats the shape of the
implementation. A test of that type passes for the wrong reason. Write the test
from the behaviour that the user needs.

## Rule 4. Keep the code simple

A reviewer reads the code more times than the author writes it. Simple code is
therefore the cheaper code. This is true even when the simple code is longer.

Follow these rules:

- Write short functions. One function does one thing.
- Use names that state what the code does.
- Do not add an abstraction for one caller.
- Do not add a dependency without a reason in the PR description.
- Write a comment for the reason, not for the mechanism.
- Delete the code that no caller uses.

An AI assistant often produces more structure than the task needs. Examples are
a configuration option that nobody sets, a class with one method, and an error
type that no caller catches. Remove these before you submit the PR.

## Rule 5. Tell us where the AI assistant helped

If an AI assistant wrote a large part of the change, write one line about it in
the PR description.

Example: `An AI assistant wrote the first draft of the parser. I rewrote the
error paths and the tests.`

We ask for this for one reason only. It helps the reviewer to choose where to
look first. It is not a mark against your PR.

## Rule 6. Do not open a machine-generated issue or a bulk change

A maintainer reads every issue and every PR. An issue that nobody read before
they opened it moves that cost onto a volunteer.

### Issues

- Write the issue in your own words.
- State what you did, what you expected, and what happened.
- State the version and the environment.
- Do not paste the output of a code scan as an issue. Open an issue for a fault
  that you reproduced.
- Do not report a security fault without a proof of concept that we can run.

We close an issue that shows no evidence that a person read the repository.

### Bulk changes

A bulk change is a PR that touches many files for a reason that no issue
states. Examples are a repository-wide rename, a change to the format
configuration, a large set of corrections to comments, and a mass upgrade of
dependencies.

If you want to make a bulk change, open an issue first. Wait for a maintainer
to agree. We close a bulk change that arrives without this agreement, and we do
not review it.

## Caution: credentials

Do not commit a credential. An AI assistant can copy a real value from your
local environment into an example configuration file. A credential in the Git
history stays in the Git history after you delete the line.

Check every configuration file before you commit it. This includes a file with
`prod`, `live`, `staging`, `preprod`, or `uat` in the name.

## What we do not accept

- A change that the author cannot explain.
- A change without tests.
- A test that passes when the new code is absent.
- A large refactor that nobody asked for.
- A new dependency without a stated reason.
- Code that comes from a source with an unknown licence.
- A credential, an API key, or an access token in the code.
- A credential, an API key, or an access token in a configuration file.

## What the reviewer checks

| The reviewer asks | The evidence |
| --- | --- |
| Does the change do the thing that the issue asks for? | The PR description and the tests |
| Can I read this in one pass? | The code |
| Do the tests fail if the change is absent? | The continuous integration (CI) report |
| Is each new dependency necessary? | The PR description |
| Is the documentation correct after this change? | The changed files |

The reviewer does not ask which tool you used.

## For maintainers: AI assistance in a review

A maintainer can use an AI assistant to help with a review. The same rules
apply, with these additions:

- You own every comment that you post. Check each point before you post it. A
  wrong review comment costs the contributor time and trust.
- Do not paste the output of an AI assistant into a review as though you wrote
  it. Write the point in your own words, or mark the text as machine output.
- An AI assistant can find a fault. It cannot approve a PR. Only a person
  approves a PR and merges it.
- Do not reject a PR because a detector states that an AI assistant wrote it.
  These detectors are not reliable. Judge the code and the tests.
- Use an AI assistant to help you read a large change. Do not use it as a
  replacement for the read.

## AI assistance in this repository

We used an AI assistant to build parts of this repository. The work covers the
developer experience (DX) features:

- The CI workflows.
- The lint and format configuration.
- The pre-commit hooks.
- The test harness and the coverage report.
- The editor and container configuration.
- Parts of this documentation.

A maintainer read each of these files, ran them, and changed them before we
merged them. The rules in this policy applied to that work.

We state this for two reasons. The first reason is that you can see how the
tools in this repository came to exist. The second reason is that this policy
asks you to declare AI assistance, so we declare ours.

## Questions

If this policy blocks a contribution that you believe is good, open an issue.
If the evidence shows that a rule is wrong, we change the rule.
