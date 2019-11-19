const {Given, Then} = require('cucumber');

Given('I should have welcome screen', async () => {
    await expect(element(by.text('Welcome'))).toBeVisible();
    await expect(element(by.text('Say Hello'))).toBeVisible();
    await expect(element(by.text('Say World'))).toBeVisible();
  });

Given('I tap say hello', async () => {
  await element(by.text('Say Hello')).tap();
});

Then('I should show hello screen after tap', async () => {
    await expect(element(by.text('Hello!!!'))).toBeVisible();
});

Given('I should show world screen after tap', async () => {
    await element(by.text('Say World')).tap();
    await expect(element(by.text('World!!!'))).toBeVisible();
});