import compose from './compositionRoot';
import type { DetoxDoctorOptions } from './types';
import { ConsoleUI, JSONUI } from './ui';
describe('compositionRoot', () => {
  let options: DetoxDoctorOptions;

  beforeEach(() => {
    options = {
      cwd: process.cwd(),
      fix: true,
      format: 'plain',
      bare: false,
      selectedRuleIds: [],
    };
  });

  it('should be able to create all the dependencies', async () => {
    const dependencies = await compose(options);

    expect(dependencies.ui).toBeInstanceOf(ConsoleUI);
    expect(dependencies.detoxDoctor).toBeDefined();
  });

  it('should create JSONUI when format is json', async () => {
    const dependencies = await compose({
      ...options,
      format: 'json',
    });

    expect(dependencies.ui).toBeInstanceOf(JSONUI);
    expect(dependencies.detoxDoctor).toBeDefined();
  });
});
