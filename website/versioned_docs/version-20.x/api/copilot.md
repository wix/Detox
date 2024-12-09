# Detox Copilot

Detox Copilot is an AI-powered plugin that allows you to write Detox tests using natural language commands, powered by large language models (LLMs). It simplifies the process of writing end-to-end tests by translating human-readable instructions into Detox actions and assertions.

:::note

Detox Copilot is based on a core library called [detox-copilot](https://github.com/wix-incubator/detox-copilot), which is designed for Detox but can be extended to work with other testing frameworks.

:::

:::caution Work in Progress

Detox Copilot is in active development, and APIs are subject to change in future releases.

:::

## Overview

Detox Copilot exposes a simple API that integrates seamlessly with your Detox tests. It requires minimal setup and allows you to perform complex testing operations by simply describing them in natural language.

For a more detailed guide on integrating Detox Copilot in your tests, refer to the [Detox Copilot Guide].

## Methods

- [`copilot.init()`](#copilotinitprompthandler)
- [`copilot.perform()`](#copilotperformsteps)

## `copilot.init(promptHandler)`

Initializes Detox Copilot with the given prompt handler. Must be called before any other Copilot methods.

**Parameters:**

- `promptHandler` (PromptHandler): An object implementing the [`PromptHandler`](#prompthandler-interface) interface.

**Example:**

```javascript
const { copilot } = require('detox');
const OpenAIPromptHandler = require('./OpenAIPromptHandler');

beforeAll(() => {
  const promptHandler = new OpenAIPromptHandler('YOUR_OPENAI_API_KEY');
  copilot.init(promptHandler);
});
```

## `copilot.perform(...steps)`

Performs a testing operation or series of operations based on the given steps.

**Parameters:**

- `steps` (string[]): One or more natural language instructions specifying the actions or assertions to perform.

**Returns:**

- A promise that resolves when all steps have been executed.

**Example:**

```javascript
await copilot.perform(
  'Start the application',
  'Tap on the "Login" button',
  'Enter "user@example.com" into the email field',
  'Enter "password123" into the password field',
  'Press the "Submit" button',
  'The welcome message "Hello, User!" should be displayed'
);
```

## `PromptHandler` Interface

The `PromptHandler` interface defines how Detox Copilot communicates with the LLM service.

```typescript
interface PromptHandler {
  /**
   * Sends a prompt to the LLM service and returns the response.
   * @param prompt The prompt to send.
   * @param image Optional path to an image capturing the current UI state.
   * @returns A promise resolving to the LLM's response.
   */
  runPrompt(prompt: string, image?: string): Promise<string>;

  /**
   * Indicates whether the LLM service supports snapshot images.
   * @returns A boolean value.
   */
  isSnapshotImageSupported(): boolean;
}
```

You can refer to the [Detox Copilot Guide] for an example of implementing a `PromptHandler` for OpenAI's service.

[Detox Copilot Guide]: ../copilot/testing-with-copilot.md
