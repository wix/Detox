![detox-doctor](https://user-images.githubusercontent.com/1962469/275855765-e539b0be-996b-4b09-8b84-ec4da740ddb7.png)

🚑  **Detect and `--fix` common configuration issues in Detox test projects** 

[📖  **Propose or contribute a new rule ➡**](#contribution-guide)

Usage
-----

Use `npx detox-doctor` to launch the CLI tool and select either manual or automatic mode.
Manual mode allows you to select a specific configuration issue to check, while automatic mode checks them all:

```
Usage: detox-doctor [options] [rule ...]

Options:
      --version      Show version number                               [boolean]
  -f, --format       Choose output format
                                   [choices: "plain", "json"] [default: "plain"]
      --bare         Disable rules that require a full project setup
                                                      [boolean] [default: false]
  -y, --fix          Enable automatic fixing of issues
                            [choices: "true", "false"]
      --list-rules   Display a list of available rules                 [boolean]
      --help         Show help                                         [boolean]
```

* **Bare mode** does not require `node_modules/` installed (some rules will be skipped).
* **Fix mode** is interactive by default, unless you explicitly set `--fix` or `--no-fix`.

## Rules

To list all available rules, run `npx detox-doctor --list-rules`:

| Rule                                 | Description                                                                                                             | Fixable |
|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------|---------|
| `no-explicit-jest-circus-dependency` | This rule ensures jest-circus is not declared as a dependency, because it is brought by Jest 27.x and later by default. | 🔧      |

## Contribution Guide

To add your own rules to Detox Doctor, follow these steps:

1. Under `src/results`, create a new folder for your rule, e.g. `your-new-rule` and inside that folder, create a new file named `index.ts`, where you will define your rule class implementing the `RuleConstructor` interface.
2. If you prefer:
    * to use functions:
        ```typescript
        import { Rule, RuleConstructor, RuleDependencies } from '../../types';

        export const yourFnRule: RuleConstructor = (deps: RuleDependencies): Rule => ({
          id: 'YOUR_RULE_ID',
          alias: 'your-new-rule',
          description: 'Description of your new rule',
          check: () => ({status: 'skipped', message: 'Not implemented yet'}),
        });
        ```
    * to use classes:
        ```typescript
        import { Rule, RuleResult, RuleResultStatus, RuleDependencies } from '../../types';

        export class YourClassRule implements Rule {
          readonly id = 'YOUR_RULE_ID';
          readonly alias = 'your-new-rule';
          readonly description = 'Description of your new rule';
          readonly needs = []; // Optional: rules sensitive to the execution order might specify which rules have to run before them.

          // Optional constructor, if your rule needs to receive dependencies.
          constructor(deps: RuleDependencies) {}

          async check(): Promise<RuleResult> {
            // Mandatory method, where you should implement the logic to detect the issue.
            return {
              status: 'skipped',
              message: 'Not implemented yet',
            }
          }

          async fix(): Promise<RuleResult> {
            // Optional method, if your rule can provide an automatic fix for the issue detected.
          }
        }
        ```
    Either way, you have to define the `check()` method, and optionally the `fix()` method if you want to provide an automatic fix for the issue detected.
3. To test the changes locally, build the project by running `npm run build`.
Use `npm link` to make the detox-doctor command available for testing, and remember to run `npm unlink` afterwards.
By following these steps, you can easily add new rules to the Detox Doctor CLI tool.
