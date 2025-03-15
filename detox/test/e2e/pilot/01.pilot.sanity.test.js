describe.forPilot('Pilot Sanity', () => {
  beforeEach(async () => {
    await pilot.perform(
      'Restart the React Native state',
      'Navigate to the Sanity screen'
    );
  });

  it('should have welcome screen', async () => {
    await pilot.perform(
      'Welcome text is displayed',
      'Say Hello button is visible to the user',
      'Can see a Say World button'
    );
  });

  it('should show hello screen after tap', async () => {
    await pilot.autopilot('tap on the Say Hello button in the sanity screen and expect to see "Hello!!!" text displayed');
  });

  it('should show world screen after tap with Copilot (deprecated API)', async () => {
    await copilot.autopilot('tap on the Say World button in the sanity screen and expect to see "World!!!" text displayed');
  });
});
