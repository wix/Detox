# Detox Copilot

## Work in Progress

Detox Copilot is a testing frameworks plugin that leverages large language models (LLM) to seamlessly invoke the framework's actions.
Detox Copilot originally designed for Detox, but it can be extended to other testing frameworks.

It provides APIs to perform actions and assertions within your tests while interfacing with an LLM service to enhance the testing process.

## API Overview

We will provide a high-level overview of the API that Detox Copilot will expose, this is a work in progress and the final API may differ. 
We will also provide a more extensive documentation once the API is finalized.

- `init(config)`: Initializes the Copilot with the provided configuration, must be called before using Copilot, e.g. `copilot.init(...)`
- `reset()`: Resets the Copilot by clearing the previous steps, e.g. `copilot.reset()`
- `perform(intent)`: Performs an operation with semantic intent, e.g. `copilot.perform('tap on the button')` 
