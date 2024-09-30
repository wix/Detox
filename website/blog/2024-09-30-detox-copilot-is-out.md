---
authors:
  - asafkorem
tags: [minor-release, detox-copilot, ai-integration]
---

# Introducing Detox Copilot: Natural Language Testing for Detox

We're excited to announce the release of **Detox Copilot**, a groundbreaking feature that brings natural language testing to Detox. With Detox Copilot, you can now write end-to-end tests using plain English commands, making test creation more intuitive and accessible than ever before.

## Revolutionizing Testing with Natural Language

Detox Copilot leverages advanced Large Language Models (LLMs) to interpret natural language instructions and translate them into Detox actions and assertions. This means you can describe your test scenarios in everyday language, aligning perfectly with **Behavior-Driven Development (BDD)** principles.

### Why Natural Language Testing?

- **Improved Collaboration**: Teams can collaborate more effectively, as tests are written in plain language understandable by developers, QA engineers, and non-technical stakeholders alike.
- **Faster Test Creation**: Reduce the time spent writing and maintaining complex test scripts.
- **Enhanced Test Coverage**: Encourage more comprehensive testing by lowering the barrier to writing tests.

![Detox Copilot in action GIF](/img/blog/copilot-demo.gif)

## Key Features of Detox Copilot

### Write Tests in Plain English

Detox Copilot allows you to write tests using natural language commands. Each step corresponds to a specific action or assertion within your app.

**Example:**

```javascript
describe('User Registration Flow', () => {
  it('should allow a user to register successfully', async () => {
    await copilot.perform(
      'Launch the app',
      'Tap on the "Sign Up" button',
      'Enter "Jane Doe" into the "Name" field',
      'Enter "jane.doe@example.com" into the "Email" field',
      'Enter "password123" into the "Password" field',
      'Tap on the "Register" button',
      'Verify that the "Welcome, Jane!" message is displayed'
    );
  });
});
```

### Seamless Integration with Detox

Detox Copilot is built into Detox and requires no additional installation. Simply initialize it in your test setup, and you're ready to start writing natural language tests.

### LLM-Agnostic Design

While Detox Copilot uses LLMs to interpret instructions, it is designed to be LLM-agnostic. This means you can connect it to your preferred language model service, offering flexibility and future-proofing your testing strategy.

## Getting Started with Detox Copilot

### Step 1: Initialize Detox Copilot

Initialize Detox Copilot in your test setup by implementing a `PromptHandler` that connects to your LLM service. This abstraction allows Detox Copilot to communicate with any LLM you choose, promoting versatility across different testing frameworks.

In our [Testing with Copilot guide](https://wix.github.io/Detox/docs/next/guide/testing-with-copilot), you can find implementation examples and more detailed descriptions for this part.

### Step 2: Write Tests Using Natural Language

Start writing your tests using the `copilot.perform` method with natural language steps.

**Example:**

```javascript
it('should log in successfully', async () => {
  await copilot.perform(
    'Launch the app',
    'Tap on the "Login" button',
    'Enter "user@example.com" into the "Email" field',
    'Enter "securePassword" into the "Password" field',
    'Tap on the "Submit" button',
    'Verify that the "Welcome Back!" message is displayed'
  );
});
```

You can also break Copilot commands into parts and use the traditional Detox APIs in a hybrid way wherever needed.
This allows you to leverage both the simplicity of natural language commands and the control of standard Detox methods.

**Hybrid Example:**

```javascript
it('should add an item to the cart', async () => {
  // Use Copilot for initial steps
  await copilot.perform(
    'Launch the app',
    'Navigate to the "Products" page',
    'Tap on the "Add to Cart" button for the first product'
  );

  // Use traditional Detox APIs for hard-coded assertions
  const cartBadge = element(by.id('cart-badge'));
  await expect(cartBadge).toHaveText('1');
  
  // Continue with Copilot
  await copilot.perform(
    'Navigate to the "Cart" page',
    'Verify that the product is listed in the cart'
  );
});
```

You can also ask Copilot to return values at the end of its execution and use them in your hard-coded assertions.
For example, you might want to retrieve the title text of a page and perform assertions on it.

**Returning Values Example:**

```javascript
it('should display the correct page title', async () => {
  // Use Copilot to navigate and retrieve the page title
  const pageTitle = await copilot.perform(
    'Launch the app',
    'Navigate to the "Profile" page',
    'Return the text of the page title'
  );

  // Use the returned value in a hard-coded assertion
  jestExpect(pageTitle).toBe('Profile');
});
```

In the example above, Copilot executes the steps and returns the text of the page title, which you can then use in your own assertions.

You can also use Copilot for locating the elements and then use them in your hard-coded assertions.

**Locating Elements Example:**

```javascript

it('should display the correct page title', async () => {
  // Use Copilot to locate the page title element
  const pageTitleElement = await copilot.perform(
    'Launch the app',
    'Navigate to the "Profile" page',
    'Locate the page title element'
  );

  // Use the located element in a hard-coded assertion
  await expect(pageTitleElement).toHaveText('Profile');
});
```

In the example above, Copilot locates and returns the page title element, which you can then use in your own Detox assertions.

## Best Practices for Natural Language Testing

- **Be Clear and Specific**: Provide precise instructions to ensure accurate interpretation.
- **One Action per Step**: Keep each step focused on a single action or assertion.
- **Use Exact Labels**: Reference UI elements using their exact text or identifiers.
- **Experiment and Learn**: Different approaches can work; feel free to explore what works best for your application.

## Technical Overview

Detox Copilot integrates seamlessly with your testing environment by combining natural language processing with Detox's robust testing capabilities.
Below is a more technical description of how Detox Copilot operates under the hood.

### The Idea Behind

To enable Detox Copilot to work harmoniously with Detox and your app, it relies on several key components:

- **Dynamic Code Generation**: Copilot generates and evaluates Detox code on-the-fly as needed. For instance, when instructed to tap on elements or type text, it creates the necessary Detox commands to perform those actions. For visual assertions, it uses the app's view hierarchy and snapshot images to analyze the current UI state.

- **Visual Analysis**: Copilot can perform visual analysis on the app's screen to verify the presence of specific elements or text. This capability is especially useful for assertions that rely on the app's visual appearance rather than specific UI elements. Also it makes it possible to verify the correctness of the rendered UI and non-textual elements or attributes (e.g., images, colors, etc.).

- **App View Hierarchy**: Detox generates an XML representation of the app's view hierarchy, encompassing all UI elements, both native and web-based. This detailed structure provides Copilot with the information it needs to interact with different elements on the screen, including those that may not be visible.

- **Snapshot Images**: While optional (depending on your `PromptHandler`), snapshot images of the app provide Copilot with additional context about the current visual state. This enhances its ability to understand the screen more precisely and perform visual analysis when possible.

- **Injected Test IDs**: When test IDs are not available, Detox injects unique test IDs into elements based on the view hierarchy. This allows Copilot to generate Detox code that can reliably access UI elements, ensuring consistent interaction even if the screen doesn't change between test executions.

- **Caching Mechanism**: Copilot caches the results of each execution locally, using a key-value system based on the app's UI state and the current step of execution. If something changes, Copilot uses the prompt service to regenerate the step. This caching provides significant optimization and cost savings, although the mechanism is currently naive and doesn't handle dynamic content well. Improvements are ongoing to make it more flexible for changes that shouldn't affect the current step.

- **Test Context Awareness**: During each step of execution, Copilot is fully aware of previously executed steps and their results. This context allows it to maintain continuity in the test flow, avoiding unnecessary repetition in targeting elements and ensuring a human-readable sequence of actions. For example:

    - "Write 'myUserName' in the 'username' text field in the registration form"
    - "Verify that the written text appears in the input with a green checkmark"

### Copilot's Execution Flow at a High Level

![Detox Copilot Execution Flow](/img/blog/copilot-overview.svg)

For each step, Detox Copilot follows this high-level execution flow:

1. **Gather Context**: Collects all relevant context from the app's current state, including the view hierarchy and snapshot (if available), as well as the current step's intent and previous steps' intents and results.

2. **Interpret Intent**: Uses the LLM to interpret the natural language instruction, considering the gathered context to understand what action or assertion is required.

3. **Generate Code**: Dynamically generates the appropriate Detox commands to perform the action or assertion. This may involve interacting with UI elements, navigating through the app, or performing visual checks. For some assertions, Copilot may not generate any code but instead rely on the LLM visual analysis (in cases where the assertion passes without any need for code execution).

4. **Execute Action**: Runs the generated Detox code using the Detox driver, which interacts with the app accordingly.

5. **Cache Results**: Stores the results of the execution in the cache to optimize future runs and reduce unnecessary calls to the LLM.

6. **Provide Feedback**: Returns any requested values or confirms the completion of the action, allowing you to use these results in subsequent test steps or assertions.

By combining these steps, Detox Copilot effectively bridges the gap between natural language instructions and concrete test actions, all while optimizing for performance and resource usage.

## Extending Beyond Detox

Detox Copilot is built on a standalone core library called [detox-copilot](https://github.com/wix-incubator/detox-copilot) designed to interpret natural language testing instructions and generate the necessary test code. While it was initially developed for Detox, the core library can be extended to work with other testing frameworks, not just Detox.

By abstracting the core functionality, we encourage the community to adopt natural language testing across various platforms.

## Learn More

For detailed guidance on using Detox Copilot, check out our [Testing with Detox Copilot Guide](https://wix.github.io/Detox/docs/next/guides/testing-with-detox-copilot) and the [Detox Copilot API Documentation](https://wix.github.io/Detox/docs/next/api/copilot).

Check [detox-copilot core library](https://github.com/wix-incubator/detox-copilot) for more information on how to extend Detox Copilot to work with other testing frameworks.

## Join the Future of Testing

Detox Copilot represents a significant step forward in making end-to-end testing more accessible and efficient. By embracing natural language testing, you can enhance collaboration within your team, speed up test creation, and improve overall test coverage.

We're **excited** to see how you'll leverage Detox Copilot in your tests! Share your experiences, feedback, and suggestions with us as we continue to refine and expand this groundbreaking feature.
