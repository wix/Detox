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

### Implementing a `PromptHandler`

You need to implement this interface to connect Detox Copilot with your LLM service. Below is an example using OpenAI's GPT-4 API.

**Example:**

```javascript
const { Configuration, OpenAIApi } = require('openai');

class OpenAIPromptHandler {
  constructor(apiKey) {
    const configuration = new Configuration({ apiKey });
    this.openai = new OpenAIApi(configuration);
  }

  async runPrompt(prompt, image) {
    const messages = [
      { role: 'system', content: 'You are a test automation assistant.' },
      { role: 'user', content: prompt },
    ];

    // Handle image if supported
    if (image && this.isSnapshotImageSupported()) {
      // Implement image handling as per LLM requirements
    }

    const response = await this.openai.createChatCompletion({
      model: 'gpt-4',
      messages,
    });

    return response.data.choices[0].message.content;
  }

  isSnapshotImageSupported() {
    return false; // Set to true if your LLM supports images
  }
}

module.exports = OpenAIPromptHandler;
```

## Example Usage

Here is a complete example of how to use Detox Copilot in a test:

```javascript
const { device, copilot } = require('detox');
const OpenAIPromptHandler = require('./OpenAIPromptHandler');

describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    const promptHandler = new OpenAIPromptHandler('YOUR_OPENAI_API_KEY');
    copilot.init(promptHandler);
  });

  it('should log in successfully', async () => {
    await copilot.perform(
      'Start the application',
      'Tap on the "Login" button',
      'Enter "user@example.com" into the email field',
      'Enter "password123" into the password field',
      'Press the "Submit" button',
      'The welcome message "Hello, User!" should be displayed'
    );
  });
});
```

## Additional Notes

- **LLM Compatibility:** Detox Copilot is LLM-agnostic. While it can work with any LLM service, we recommend using advanced models like **Sonnet 3.5** or **GPT-4o** for better performance.

- **Visual Assertions:** Detox Copilot leverages the app's visual context (view hierarchy and snapshots) to enable the LLM to perform visual assertions and understand the UI state.

- **Core Library:** For more advanced configurations and to explore extending Detox Copilot to other testing frameworks, refer to the [detox-copilot core library](https://github.com/wix-incubator/detox-copilot).

- **Guide:** For detailed usage instructions and best practices, refer to the [Detox Copilot Guide]


[Detox Copilot Guide]: /docs/guides/testing-with-copilot
