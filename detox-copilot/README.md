# Detox Copilot

## Work in Progress

Detox Copilot is a Detox plugin that leverages large language models (LLM) to seamlessly invoke Detox actions.

It provides APIs to perform actions and assertions within your Detox tests while interfacing with an LLM service to enhance the testing process.

## API Overview

We will provide a high-level overview of the API that Detox Copilot will expose, this is a work in progress and the final API may differ. We will also provide a more extensive documentation once the API is finalized.

- `copilot.init(config)`: Initializes the Copilot with the provided configuration, must be called before using Copilot, e.g. `copilot.init(...)`
- `copilot.reset()`: Resets the Copilot by clearing the previous steps, e.g. `copilot.reset()`
- `act(prompt)`: Semantic action invocation, e.g. `copilot.act('tap the sign-in button')`
- `assert(prompt)`: Semantic assertion invocation, e.g. `copilot.assert('the sign-in button is visible')`
