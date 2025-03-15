# Wix Pilot

Wix Pilot is an AI-powered plugin that allows you to write tests using natural language commands, powered by large language models (LLMs). It simplifies the process of writing end-to-end tests by translating human-readable instructions into actions and assertions.

:::caution Work in Progress

Wix Pilot is in active development, and APIs are subject to change in future releases.

:::

:::note Migration Notice

With the introduction of **Wix Pilot**, the `copilot` API is now deprecated.

- **Wix Pilot** is a standalone plugin that enables natural language-based testing and can work across different testing frameworks.
- **Detox Pilot** is a built-in facade within Detox that leverages Wix Pilot for Detox-specific testing.

From now on, use the `pilot` API. The `copilot` API will remain temporarily supported for backward compatibility but will be removed in future releases.

:::

## Overview

Detox Pilot exposes a simple API that integrates seamlessly with your Detox tests. It requires minimal setup and allows you to perform complex testing operations by simply describing them in natural language.

For a more detailed guide on integrating Wix Pilot in your tests, refer to the \[Detox Pilot Guide].

## Methods

- [`pilot.init()`](#pilotinitprompthandler-detox)
- [`pilot.perform()`](#pilotperformsteps)
- [`pilot.autopilot()`](#pilotautopilotgoal)

## `pilot.init(promptHandler, detox)`

Initializes Pilot with the given prompt handler. Must be called before any other Pilot methods.

**Parameters:**

- `promptHandler` (PromptHandler): An object implementing the [`PromptHandler`](#prompthandler-interface) interface.
- `detox` (DetoxInstance): The Detox instance to integrate with Wix Pilot.

**Example:**

```javascript
const { pilot } = require('detox');
const OpenAIPromptHandler = require('./OpenAIPromptHandler');

beforeAll(() => {
  const promptHandler = new OpenAIPromptHandler('YOUR_OPENAI_API_KEY');
  pilot.init(promptHandler, detox);
});
```

## `pilot.perform(...steps)`

Performs a testing operation or series of operations based on the given steps.

**Parameters:**

- `steps` (string\[]): One or more natural language instructions specifying the actions or assertions to perform.

**Returns:**

- A promise that resolves when all steps have been executed.

**Example:**

```javascript
await pilot.perform(
  'Start the application',
  'Tap on the "Login" button',
  'Enter "user@example.com" into the email field',
  'Enter "password123" into the password field',
  'Press the "Submit" button',
  'The welcome message "Hello, User!" should be displayed'
);
```

## `pilot.autopilot(goal)`

Automatically generates a series of steps to achieve the given goal.

**Parameters:**

- `goal` (string): A natural language description of the desired outcome.

**Example:**

```javascript
await pilot.autoPilot('Log in and navigate to the profile page');
```

## `PromptHandler` Interface

The `PromptHandler` interface defines how Pilot communicates with the LLM service.

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

You can refer to the [Pilot Guide] for an example of implementing a `PromptHandler` for OpenAI's service.

[Detox Pilot Guide]: ../pilot/testing-with-pilot
