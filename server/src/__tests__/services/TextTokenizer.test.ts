import { TextTokenizer } from '../../services/TextTokenizer';
import * as compromise from "compromise";

describe("TextTokenizer", () => {
  let tokenizer: TextTokenizer;

  beforeEach(() => {
    tokenizer = new TextTokenizer();
  });

  test("should initialize with default options", () => {
    expect(tokenizer).toBeInstanceOf(TextTokenizer);
  });

  test("should split text into sentences", () => {
    const text =
      "This is the first sentence. This is the second sentence! Is this the third sentence?";
    const sentences = tokenizer.splitIntoSentences(text);

    expect(sentences).toHaveLength(3);
    expect(sentences[0]).toContain("first sentence");
    expect(sentences[1]).toContain("second sentence");
    expect(sentences[2]).toContain("third sentence");
  });

  test("should handle empty input for sentence splitting", () => {
    expect(tokenizer.splitIntoSentences("")).toEqual([]);
    expect(tokenizer.splitIntoSentences(null as unknown as string)).toEqual([]);
    expect(
      tokenizer.splitIntoSentences(undefined as unknown as string)
    ).toEqual([]);
  });

  test("should split text into paragraphs", () => {
    const text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
    const paragraphs = tokenizer.splitIntoParagraphs(text);

    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toBe("First paragraph.");
    expect(paragraphs[1]).toBe("Second paragraph.");
    expect(paragraphs[2]).toBe("Third paragraph.");
  });

  test("should handle empty input for paragraph splitting", () => {
    expect(tokenizer.splitIntoParagraphs("")).toEqual([]);
    expect(tokenizer.splitIntoParagraphs(null as unknown as string)).toEqual(
      []
    );
    expect(
      tokenizer.splitIntoParagraphs(undefined as unknown as string)
    ).toEqual([]);
  });

  test("should tokenize a sentence into words", () => {
    const sentence = "This is a test sentence.";
    const words = tokenizer.tokenizeSentence(sentence);

    expect(words).toHaveLength(5);
    expect(words).toEqual(["This", "is", "a", "test", "sentence."]);
  });

  test("should handle empty input for word tokenization", () => {
    expect(tokenizer.tokenizeSentence("")).toEqual([]);
    expect(tokenizer.tokenizeSentence(null as unknown as string)).toEqual([]);
    expect(tokenizer.tokenizeSentence(undefined as unknown as string)).toEqual(
      []
    );
  });

  test("should tokenize text into sentences and words", () => {
    const text = "This is sentence one. This is sentence two.";
    const tokenizedText = tokenizer.tokenizeText(text);

    expect(tokenizedText).toHaveLength(2);
    expect(tokenizedText[0]).toEqual(["This", "is", "sentence", "one."]);
    expect(tokenizedText[1]).toEqual(["This", "is", "sentence", "two."]);
  });
});
