# Testing with Detox Copilot

In this tutorial, we'll explore how to use **Detox Copilot** to write end-to-end tests using natural language commands. Detox Copilot leverages large language models (LLMs) to translate human-readable instructions into Detox actions and assertions, making test writing more intuitive and accessible.

:::note

Detox Copilot is integrated into Detox and requires no additional installation. For complete API details, refer to our [Detox Copilot API documentation](docs/api/copilot.md).

:::

:::caution Work in Progress

**Note**: Detox Copilot is in active development. APIs are subject to change in future releases.

:::

## Introduction

Detox Copilot simplifies the process of writing tests by allowing you to describe test steps in natural language.
It interprets these instructions and translates them into Detox commands. This guide will help you integrate Detox Copilot into your testing workflow and provide best practices for writing effective intents.

![Demo](../img/copilot/copilot-demo.gif)

## Step 0: Setting Up Detox

Before you begin, ensure that your Detox environment is properly set up.
If you need assistance with the setup, refer to the [Detox Getting Started Guide](docs/introduction/getting-started/).

## Step 1: Implementing a PromptHandler

The `PromptHandler` is a crucial component that interfaces with your LLM service.
Below is an example of how to implement a `PromptHandler` using OpenAI's GPT-4 API.

You can adapt this code to work with other LLMs or services as needed.

### Implementing OpenAIPromptHandler

```javascript
const { Configuration, OpenAIApi } = require('openai');
const path = require('path');

class OpenAIPromptHandler {
  constructor(apiKey) {
    const configuration = new Configuration({ apiKey });
    this.openai = new OpenAIApi(configuration);
  }

  async runPrompt(prompt, imagePath) {
    const messages = [
      { role: 'system', content: 'You are a test automation assistant.' },
      { role: 'user', content: prompt },
    ];

    // If an image is provided, "upload" it and include the URL in the prompt
    if (imagePath && this.isSnapshotImageSupported()) {
      try {
        const imageUrl = await this.uploadImage(imagePath);
        messages.push({
          role: 'user',
          content: `Here is an image for reference: ${imageUrl}`,
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Failed to upload image');
      }
    }

    const response = await this.openai.createChatCompletion({
      model: 'gpt-4',
      messages,
    });

    return response.data.choices[0].message.content;
  }

  async uploadImage(imagePath) {
    // Uploads the image and returns the URL
  }

  isSnapshotImageSupported() {
    return true; // Set to true to handle image uploads
  }
}

module.exports = OpenAIPromptHandler;
```

**Explanation**:

- **`runPrompt`**: Sends the prompt to the LLM and returns the response.
- **`isSnapshotImageSupported`**: Indicates whether the LLM can handle snapshot images. If set to `true`, the handler will include image URLs in the prompt and will include them when instructing Detox Copilot.

## Step 2: Initializing Detox Copilot

Initialize Detox Copilot with your `PromptHandler` before running any tests.
This is typically done in the `beforeAll` hook or a setup file.

**Example**:

```javascript
const { copilot } = require('detox');
const OpenAIPromptHandler = require('./OpenAIPromptHandler');

beforeAll(() => {
  const promptHandler = new OpenAIPromptHandler('YOUR_OPENAI_API_KEY');
  copilot.init(promptHandler);
});
```

## Step 3: Writing Tests with Detox Copilot

With Detox Copilot initialized, you can now write tests using the `copilot.perform` method.

### Writing Step-by-Step Tests

Detox Copilot allows you to write tests by providing a sequence of natural language instructions. Each instruction corresponds to a single action or assertion.

**Example**:

```javascript
it('should log in successfully', async () => {
  await copilot.perform(
    'Launch the app',
    'Tap on the "Login" button',
    'Enter "user@example.com" into the "Email" field',
    'Enter "password123" into the "Password" field',
    'Tap on the "Submit" button',
    'Verify that the "Welcome" message is displayed'
  );
});
```

**Explanation**:

- **Step-by-Step Instructions**: Each step is a separate string, representing a single action or assertion.
- **Sequential Execution**: Steps are executed in order, allowing you to describe complex interactions intuitively.

## Best Practices for Writing Intents

To make the most out of Detox Copilot, consider the following best practices when writing your intents:

### Be Specific and Clear

- **Provide Clear Instructions**: The clearer your instructions, the better Copilot can interpret them.
- **Example**:
  - **Good**: `'Tap on the "Login" button'`
  - **Better**: `'Tap on the "Login" button located at the top right corner'`

### One Action per Step

- **Avoid Combining Multiple Actions**: Keep each step focused on a single action or assertion.
- **Example**:
  - **Avoid**: `'Tap on the "Login" button and enter credentials'`
  - **Prefer**:

  ```javascript
  'Tap on the "Login" button',
  'Enter "user@example.com" into the "Email" field'
  ```

### Use Exact Labels

- **Refer to UI Elements Precisely**: Use the exact text or identifiers as they appear in the app.
- **Example**:
  - **Good**: `'Enter "password123" into the "Password" field'`
  - **Avoid**: `'Enter password into its field'`

### Keep Assertions Simple

- **Focus on Specific Outcomes**: Make assertions straightforward and specific.
- **Example**:
  - **Good**: `'Verify that the "Welcome" message is displayed'`
  - **Avoid**: `'Check if the welcome message appears correctly on the screen'`

### Leverage Visual Context

- **Utilize Visual Descriptions**: If your LLM supports image snapshots, include visual context in your intents.
- **Example**: `'Ensure the profile picture is visible at the top of the screen'`

### Avoid Ambiguity

- **Specify Elements Precisely**: If multiple elements could match, provide additional details.
- **Example**:
  - **Ambiguous**: `'Tap on the "Submit" button'`
  - **Specific**: `'Tap on the "Submit" button in the registration form'`

### General Recommendations

- **Flexibility**: While it's best to provide clear instructions, Copilot is designed to interpret a variety of phrasing. Different approaches can work, and you are encouraged to experiment.
- **Feedback Loop**: Observe how Copilot interprets your instructions and adjust accordingly.

## FAQs

**Q**: Do I need to install Detox Copilot separately?

**A**: No, Detox Copilot is integrated into Detox and requires no additional installation.

---

**Q**: Which LLMs are recommended for use with Detox Copilot?

**A**: We recommend using advanced models like **Sonnet 3.5** or **GPT-4o** for better performance and understanding of complex instructions.

---

**Q**: How can I provide feedback or contribute to Detox Copilot?

**A**: Contributions are welcome! Visit the [Detox Copilot GitHub Repository](https://github.com/wix-incubator/detox-copilot) to open issues or pull requests if they are relevant to the core-library functionality or open a it under [Detox repository](https://github.com/wix/Detox) if it is related to Detox-Copilot integration or if you are not sure where the issue should be opened.

---

**Q**: These are heavy operations for a test (uploading images, calling an LLM). Do you optimize it in any way?

**A**: Detox Copilot is designed to avoid unnecessary calls to the LLM service and optimize performance using static cache that is based on the current state of the app.
This minimizes the number of calls to the LLM service and reduces latency.
However, you can optimize your `PromptHandler` implementation to reduce latency and improve response times (e.g., by reducing the image size or implementing a server-side cache).
We have plans to optimize even further by introducing more advanced caching mechanisms for better performance.
