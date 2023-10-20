import { FAILURE, SUCCESS } from '../../constants';
import type { Rule } from '../../types';
import { RuleHelper } from './RuleHelper';

describe('RuleHelper', () => {
  let rule: Rule & {
    check: jest.Mock;
    fix?: jest.Mock;
  };

  describe('for detailed rules', () => {
    beforeEach(() => {
      rule = {
        id: 'TEST_RULE',
        alias: 'TestRule',
        description: 'A test rule',
        needs: ['ANOTHER_RULE'],
        check: jest.fn(),
        fix: jest.fn(),
      };
    });

    it('should expose their metadata', () => {
      expect(RuleHelper.id(rule)).toBe(rule.id);
      expect(RuleHelper.alias(rule)).toBe(rule.alias);
      expect(RuleHelper.description(rule)).toBe(rule.description);
      expect(RuleHelper.needs(rule)).toEqual(rule.needs);
    });

    it('should call their check() and normalize the original message if it exists', async () => {
      (rule.check as jest.Mock).mockResolvedValue({
        status: SUCCESS,
        message: 'Original message',
      });

      await expect(RuleHelper.check(rule)).resolves.toEqual({
        status: SUCCESS,
        message: ['Original message'],
      });
    });

    it('should call their fix() and normalize the original message if it exists', async () => {
      rule.fix!.mockResolvedValue({
        status: SUCCESS,
        message: 'Original message',
      });

      await expect(RuleHelper.fix(rule)).resolves.toEqual({
        status: SUCCESS,
        message: ['Original message'],
      });
    });

    it('should safeguard their check() against unhandled exceptions', async () => {
      const testError = new Error('Test error');
      rule.check.mockRejectedValue(testError);

      await expect(RuleHelper.check(rule)).resolves.toEqual({
        status: FAILURE,
        message: [expect.stringContaining(`Unhandled exception:\n${testError}`)],
      });
    });

    it('should safeguard their fix() against unhandled exceptions', async () => {
      const testError = new Error('Test error');
      rule.fix!.mockRejectedValue(testError);

      await expect(RuleHelper.fix(rule)).resolves.toEqual({
        status: FAILURE,
        message: [expect.stringContaining(`Unhandled exception:\n${testError}`)],
      });
    });
  });

  describe('for minimal rules', () => {
    beforeEach(() => {
      rule = {
        id: 'TEST_RULE',
        alias: 'TestRule',
        check: jest.fn(),
      };
    });

    it('should safeguard against missing metadata', () => {
      expect(RuleHelper.id(rule)).toBe(rule.id);
      expect(RuleHelper.alias(rule)).toBe(rule.alias);
      expect(RuleHelper.description(rule)).toBe('');
      expect(RuleHelper.needs(rule)).toEqual([]);
    });

    it('should provide a fallback for a missing fix() method', () => {
      expect(RuleHelper.fix(rule)).toBe(undefined);
    });
  });
});
