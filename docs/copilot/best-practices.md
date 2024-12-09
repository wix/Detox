# Detox Copilot Best Practices

Detox Copilot allows you to write tests using natural language commands. Each step corresponds to a specific action or assertion within your app. In case you're wondering how to make the most out of this feature, here are some best practices to follow when writing your Copilot intents.

## Step-by-Step Instructions

- **Write Sequential Steps**: Describe your test steps in a clear and sequential manner.
- **Example**:

```javascript
it('should navigate and add a product to the cart', async () => {
  await copilot.perform(
    'Navigate to the "Products" page',
    'Tap on the "Add to Cart" button for the first product',
    'Verify that the "Added to Cart" pop-up is displayed'
  );
});
```

## Be Specific and Clear

- **Provide Clear Instructions**: The clearer your instructions, the better Copilot can interpret them.
- **Example**:
  - **Good**: `'Tap on the "Login" button'`
  - **Better**: `'Tap on the "Login" button located at the top right corner'`

## One Action per Step

- **Avoid Combining Multiple Actions**: Keep each step focused on a single action or assertion.
- **Example**:
  - **Avoid**: `'Tap on the "Login" button and enter credentials'`
  - **Prefer**:

  ```javascript
  'Tap on the "Login" button',
  'Enter "user@example.com" into the "Email" field'
  ```

## Use Exact Labels

- **Refer to UI Elements Precisely**: Use the exact text or identifiers as they appear in the app.
- **Example**:
  - **Good**: `'Enter "password123" into the "Password" field'`
  - **Avoid**: `'Enter password into its field'`

## Keep Assertions Simple

- **Focus on Specific Outcomes**: Make assertions straightforward and specific.
- **Example**:
  - **Good**: `'Verify that the "Welcome" message is displayed'`
  - **Avoid**: `'Check if the welcome message appears correctly on the screen'`

## Leverage Visual Context

- **Utilize Visual Descriptions**: If your LLM supports image snapshots, include visual context in your intents.
- **Example**: `'Ensure the profile picture is visible at the top of the screen'`

## Avoid Ambiguity

- **Specify Elements Precisely**: If multiple elements could match, provide additional details.
- **Example**:
  - **Ambiguous**: `'Tap on the "Submit" button'`
  - **Specific**: `'Tap on the "Submit" button in the registration form'`

## General Recommendations

- **Flexibility**: While it's best to provide clear instructions, Copilot is designed to interpret a variety of phrasing. Different approaches can work, and you are encouraged to experiment.
- **Feedback Loop**: Observe how Copilot interprets your instructions and adjust accordingly.
- **Model Selection**: Choose an LLM model that best suits your application's complexity and language requirements. We recommend advanced models like **Sonnet 3.5** or **GPT-4o** for better performance.
