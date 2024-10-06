---
authors:
  - asafkorem
tags: [minor-release, detox-copilot, ai-integration]
---

# Introducing Detox Copilot: Natural Language Testing for Detox

We're excited to announce **Detox Copilot**, a groundbreaking feature that brings natural language testing to Detox. With Detox Copilot, you can now write end-to-end tests using plain textual commands, making test creation more intuitive and accessible than ever.

## Revolutionizing Testing with Natural Language

Detox Copilot leverages advanced Large Language Models (LLMs) to interpret natural language instructions and translate them into Detox actions and assertions. This means you can describe your test scenarios in everyday language, aligning perfectly with **Behavior-Driven Development (BDD)** principles.

### Why Natural Language Testing?

- **Improved Collaboration**: Teams can collaborate more effectively, as tests are written in plain language understandable by developers, QA engineers, and non-technical stakeholders alike.
- **Faster Test Creation**: Reduce the time spent writing and maintaining complex test scripts.
- **Enhanced Test Coverage**: Lower the barrier to writing tests, encouraging more comprehensive testing.
- **Reduced Maintenance Costs**: Thanks to the decoupling from specific matchers (e.g., avoiding brittle XPath selectors or relying on `testID` attributes commonly used in React Native apps), tests are less prone to breaking when the UI changes, leading to lower maintenance overhead.

![Detox Copilot in action GIF](/img/blog/copilot-demo.gif)

## Key Features of Detox Copilot

### Write Tests in Plain Text

Detox Copilot allows you to write tests using natural language commands. Each step corresponds to a specific action or assertion within your app.

**Example:**

```javascript
it('should navigate and add a product to the cart', async () => {
  await copilot.perform(
    'Navigate to the "Products" page',
    'Tap on the "Add to Cart" button for the first product',
    'Verify that the "Added to Cart" pop-up is displayed'
  );
});
```

### Seamless Integration with Detox

Detox Copilot is built into Detox and requires no additional installation. Simply initialize it in your test setup, and you're ready to start writing natural language tests.

### LLM-Agnostic Design

Detox Copilot uses LLMs to interpret instructions but is designed to be LLM-agnostic. This means you can connect it to your preferred language model service, offering flexibility and future-proofing your testing strategy.

## Getting Started with Detox Copilot

### Initialize Detox Copilot

Initialize Detox Copilot in your test setup by implementing a `PromptHandler` that connects to your LLM service. This abstraction allows Detox Copilot to communicate with any LLM you choose, promoting versatility across different testing frameworks.

For more details, check our [Testing with Copilot guide].

### Write Tests Using Natural Language

Start writing your tests using the `copilot.perform` method with natural language steps.

**Example:**

```javascript
it('should verify element sizes and button states', async () => {
  await copilot.perform(
    'Launch the app with notification permissions enabled',
    'Navigate to the "Settings" page',
    'Verify that the "Save" button is disabled',
    'Locate the profile picture element',
    'Verify that the profile picture size is 100 x 100 pixels and that the image is available and rendered',
    'Tap on the "Edit Profile" button',
    'Verify that the "Save" button is now enabled',
    'Verify that the "Username" field text is bold'
  );
});
```

In the example above, Copilot can perform checks that go beyond traditional UI testing, such as verifying element sizes, button states (enabled/disabled), or text styles (e.g., bold). This is thanks to the combination of Detox code-generation and multimodal LLMs that can analyze the snapshots.

You can also combine Copilot commands with traditional Detox APIs for more control.

**Hybrid Example:**

```javascript
it('should add an item to the cart', async () => {
  await copilot.perform(
    'Launch the app',
    'Navigate to the "Products" page',
    'Tap on the "Add to Cart" button for the first product'
  );

  const cartBadge = element(by.id('cart-badge'));
  await expect(cartBadge).toHaveText('1');

  await copilot.perform(
    'Navigate to the "Cart" page',
    'Verify that the product is listed in the cart'
  );
});
```

You can also use Copilot to retrieve values, locate elements, or perform advanced checks such as verifying element sizes or button states.

**Locating Elements Example:**

```javascript
it('should display the correct page title', async () => {
  const pageTitleElement = await copilot.perform(
    'Launch the app',
    'Navigate to the "Profile" page',
    'Locate the page title element'
  );

  await expect(pageTitleElement).toHaveText('Profile');
});
```

## Best Practices for Natural Language Testing

- **Be Clear and Specific**: Provide precise instructions to ensure accurate interpretation.
- **One Action per Step**: Keep each step focused on a single action or assertion.
- **Use Exact Labels**: Reference UI elements using their exact text or identifiers.
- **Experiment and Learn**: Explore different approaches to see what works best for your application.

## Technical Overview

Detox Copilot integrates seamlessly with your testing environment by combining natural language processing with Detox's robust testing capabilities.

### How Detox Copilot Works

To enable Detox Copilot to work harmoniously with Detox and your app, it relies on several key components:

- **Dynamic Code Generation**: Copilot generates Detox code on-the-fly to perform actions or assertions based on your instructions.
- **Visual Analysis**: Copilot can analyze the app's screen to verify the presence of specific elements or text, enabling assertions beyond standard UI checks.
- **App View Hierarchy**: Detox generates an XML representation of the app's view hierarchy, helping Copilot interact with all UI elements, even those not directly visible.
- **Snapshot Images**: Optional snapshot images provide Copilot with visual context for more precise understanding and analysis.
- **Injected Test IDs**: When necessary, Detox injects unique test IDs to ensure reliable access to UI elements.
- **Caching Mechanism**: Copilot caches execution results to optimize performance and reduce unnecessary LLM calls.
- **Test Context Awareness**: Copilot maintains awareness of previously executed steps, ensuring continuity and readability in the test flow.

### Copilot's Execution Flow

![Detox Copilot Execution Flow](/img/blog/copilot-overview.svg)

1. **Gather Context**: Collect relevant app state, view hierarchy, and previous step results.
2. **Interpret Intent**: Use the LLM to interpret the natural language instruction.
3. **Generate Code**: Create the appropriate Detox commands.
4. **Execute Action**: Run the generated Detox code.
5. **Cache Results**: Store execution results to optimize future runs.
6. **Provide Feedback**: Return values or confirm actions for subsequent steps.

By combining these steps, Detox Copilot effectively bridges the gap between natural language instructions and concrete test actions.

## Extending Beyond Detox

Detox Copilot is built on a standalone core library called [detox-copilot] designed to interpret natural language testing instructions and generate test code. Though initially developed for Detox, it can be extended to work with other testing frameworks.

## Learn More

For detailed guidance, check out our [Testing with Copilot guide] and the [Detox Copilot API Documentation].

## Join the Future of Testing

Detox Copilot represents a major step forward in making end-to-end testing more accessible and efficient. By embracing natural language testing, you can enhance collaboration, speed up test creation, and improve overall test coverage.

We're **excited** to see how you'll leverage Detox Copilot in your tests! Share your experiences, feedback, and suggestions with us as we continue to refine and expand this groundbreaking feature.

[Testing with Copilot guide]: /docs/guide/testing-with-copilot
[Detox Copilot API Documentation]: /docs/api/copilot
[detox-copilot]: https://github.com/wix-incubator/detox-copilot
