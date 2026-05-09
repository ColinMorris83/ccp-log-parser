import { getLocalStorage, removeLocalStorage, setLocalStorage } from './localStorage';

describe('localStorage utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('setLocalStorage', () => {
    it('should store a value with the prefixed key', () => {
      setLocalStorage('test-key', { foo: 'bar' });

      expect(localStorage.getItem('ccp-log-parser:test-key')).toBe('{"foo":"bar"}');
    });

    it('should store primitive values', () => {
      setLocalStorage('num', 42);
      setLocalStorage('str', 'hello');
      setLocalStorage('bool', true);

      expect(localStorage.getItem('ccp-log-parser:num')).toBe('42');
      expect(localStorage.getItem('ccp-log-parser:str')).toBe('"hello"');
      expect(localStorage.getItem('ccp-log-parser:bool')).toBe('true');
    });

    it('should store null without throwing', () => {
      setLocalStorage('nullable', null);

      expect(localStorage.getItem('ccp-log-parser:nullable')).toBe('null');
    });

    it('should silently ignore errors', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => setLocalStorage('key', 'value')).not.toThrow();
    });
  });

  describe('getLocalStorage', () => {
    it('should return the parsed value for a stored key', () => {
      localStorage.setItem('ccp-log-parser:test-key', '{"foo":"bar"}');

      expect(getLocalStorage('test-key')).toEqual({ foo: 'bar' });
    });

    it('should return null for a non-existent key', () => {
      expect(getLocalStorage('missing')).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('ccp-log-parser:bad', '{not valid json}');

      expect(getLocalStorage('bad')).toBeNull();
    });

    it('should return primitive values', () => {
      localStorage.setItem('ccp-log-parser:num', '42');
      localStorage.setItem('ccp-log-parser:str', '"hello"');

      expect(getLocalStorage('num')).toBe(42);
      expect(getLocalStorage('str')).toBe('hello');
    });
  });

  describe('removeLocalStorage', () => {
    it('should remove the prefixed key from storage', () => {
      localStorage.setItem('ccp-log-parser:test-key', '"value"');

      removeLocalStorage('test-key');

      expect(localStorage.getItem('ccp-log-parser:test-key')).toBeNull();
    });

    it('should not throw for a non-existent key', () => {
      expect(() => removeLocalStorage('missing')).not.toThrow();
    });

    it('should silently ignore errors', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      expect(() => removeLocalStorage('key')).not.toThrow();
    });
  });
});
