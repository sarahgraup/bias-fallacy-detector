import { TextCleaner } from '../../services/TextCleaner';

describe('TextCleaner', () => {
  let cleaner: TextCleaner;

  beforeEach(() => {
    cleaner = new TextCleaner();
  });

  test('should initialize with default options', () => {
    expect(cleaner).toBeInstanceOf(TextCleaner);
  });

  test('should return empty string for empty input', () => {
    expect(cleaner.clean('')).toBe('');
    expect(cleaner.clean(null as unknown as string)).toBe('');
    expect(cleaner.clean(undefined as unknown as string)).toBe('');
  });

  test('should remove urls be default', () => {
    const text = 'check this website https://example.com and continue reading.';
    const cleaned = cleaner.clean(text);
    expect(cleaned).not.toContain('https://');
    expect(cleaned).toContain('check this website');
    expect(cleaned).toContain('and continue reading');
  });

  test('should convert text to lowercase by default', () => {
    const text = 'This TEXT has MIXED Case';
    const cleaned = cleaner.clean(text);
    expect(cleaned).toBe('this text has mixed case');
  });

  test('should not remove punctuation by default', () => {
    const text = 'Hello, world! How are you?';
    const cleaned = cleaner.clean(text);
    expect(cleaned).toContain(',');
    expect(cleaned).toContain('!');
    expect(cleaned).toContain('?');
  });

  test('should remove punctuation when configured', () => {
    const customCleaner = new TextCleaner({ removePunctuation: true });
    const text = 'Hello, world! How are you?';
    const cleaned = customCleaner.clean(text);
    expect(cleaned).not.toContain(',');
    expect(cleaned).not.toContain('!');
    expect(cleaned).not.toContain('?');
  });

  test('should keep URLs when configured', () => {
    const customCleaner = new TextCleaner({ removeUrls: false });
    const text = 'Check this website https://example.com and continue reading.';
    const cleaned = customCleaner.clean(text);
    expect(cleaned).toContain('https://example.com');
  });

  test('should keep original case when configured', () => {
    const customCleaner = new TextCleaner({ lowercase: false });
    const text = 'This TEXT has MIXED case';
    const cleaned = customCleaner.clean(text);
    expect(cleaned).toBe('This TEXT has MIXED case');
  });

  test('should remove extra whitespace', () => {
    const text = '  Too   many    spaces   ';
    const cleaned = cleaner.clean(text);
    expect(cleaned).toBe('too many spaces');
  });
});
