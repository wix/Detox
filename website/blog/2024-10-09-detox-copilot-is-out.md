---
authors:
  - asafkorem
tags: [minor-release, detox-copilot, ai-integration]
---

# Introducing Detox Copilot

## Detox Copilot: Write Tests in Natural Language

We're excited to announce **Detox Copilot**, a groundbreaking feature that brings natural language testing to Detox. With Detox Copilot, you can now write end-to-end tests using plain textual commands, making test creation more intuitive and accessible than ever.

![Detox Copilot in action GIF](/img/blog/copilot-demo.gif)

Detox Copilot leverages advanced Large Language Models (LLMs) to interpret natural language instructions and translate them into Detox actions and assertions. This means you can describe your test scenarios in everyday language, aligning perfectly with **Behavior-Driven Development (BDD)** principles.

### Why Natural Language Testing?

- **Improved Collaboration**: Teams can collaborate more effectively, as tests are written in plain language understandable by developers, QA engineers, and non-technical stakeholders alike.
- **Faster Test Creation**: Reduce the time spent writing and maintaining complex test scripts.
- **Enhanced Test Coverage**: Lower the barrier to writing tests, encouraging more comprehensive testing.
- **Reduced Maintenance Costs**: Thanks to the decoupling from specific matchers (e.g., avoiding brittle XPath selectors or relying on `testID` attributes commonly used in React Native apps), tests are less prone to breaking when the UI changes, leading to lower maintenance overhead.

## Key Features of Detox Copilot

### Write Tests in Plain Text

Detox Copilot allows you to write tests using natural language commands. Each step corresponds to a specific action or assertion within your app.

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

## How Detox Copilot Works

Once you've written your tests using natural language instructions, Detox Copilot takes care of the rest.
Here is a high-level overview of the execution flow:

1. **Gather Context**: Collect relevant app state, view hierarchy, and previous step results.
2. **Interpret Intent**: Use the LLM to interpret the natural language instruction.
3. **Generate Code**: Create the appropriate Detox commands.
4. **Execute Action**: Run the generated Detox code.
5. **Cache Results**: Store execution results to optimize future runs.
6. **Provide Feedback**: Return values or confirm actions for subsequent steps.

By combining these steps, Detox Copilot effectively bridges the gap between natural language instructions and concrete test actions.

:::info

Check Detox Copilot **[Technical Overview]** for a detailed explanation of the building blocks and the execution flow.

:::

## Getting Started with Detox Copilot

Getting started with Detox Copilot is easy. Simply initialize Copilot in your test setup and start writing tests using natural language instructions.

Check our [Testing with Copilot guide] for detailed instructions on setting up and writing tests with Detox Copilot.


## Extending Beyond Detox

Detox Copilot is built on a standalone core library called [detox-copilot] designed to interpret natural language testing instructions and generate test code. Though initially developed for Detox, it can be extended to work with other testing frameworks.

## Learn More

For detailed guidance, check out our [Testing with Copilot guide] and the [Detox Copilot API Documentation].

## Join the Future of Testing

Detox Copilot represents a major step forward in making end-to-end testing more accessible and efficient. By embracing natural language testing, you can enhance collaboration, speed up test creation, and improve overall test coverage.

We're **excited** to see how you'll leverage Detox Copilot in your tests! Share your experiences, feedback, and suggestions with us as we continue to refine and expand this groundbreaking feature.

[Testing with Copilot guide]: /docs/copilot/testing-with-copilot
[Detox Copilot API Documentation]: https://wix-incubator.github.io/detox-copilot
[detox-copilot]: https://github.com/wix-incubator/detox-copilot
[Technical Overview]: https://wix-incubator.github.io/detox-copilot/docs/guides/technical-overview
