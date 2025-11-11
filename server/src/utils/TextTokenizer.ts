import nlp from 'compromise';

interface ITextTokenizerOptions {
  language?: string;
}

export class TextTokenizer {
  private options: ITextTokenizerOptions;

  constructor(options: ITextTokenizerOptions = {}) {
    this.options = {
      language: 'en',
      ...options,
    };
  }

  /**
   *split text into sentences
   * @param {string} text - the text content to be split.
   * @returns {string[]} The array of sentence strings.
   */

  splitIntoSentences(text: string): string[] {
    if (!text) return [];

    const doc = nlp(text);
    return doc.sentences().out('array');
  }

  /**
   *split text into paragraphs
   * @param {string} text - the text content to be split.
   * @returns {string[]} The array of paragraph strings.
   */
  splitIntoParagraphs(text: string): string[] {
    if (!text) return [];
    // split by douvble newlines or more
    return text.split(/\n\s*\n|\r\n\s*\r\n/);
  }

  /**
   *tokenize sentence into words
   * @param {string} sentence - the sentence content to be split.
   * @returns {string[]} The array of split word strings.
   */

  tokenizeSentence(sentence: string): string[] {
    if (!sentence) return [];

    const doc = nlp(sentence);
    return doc.terms().out('array');
  }

  /**
   * Tokenize text into sentences and then words
   * @param {string}text - text to be split
   * @returns {string[][]} array of sentences of array of words
   */
  tokenizeText(text: string): string[][] {
    const sentences = this.splitIntoSentences(text);
    return sentences.map((sentence) => this.tokenizeSentence(sentence));
  }
}

export default TextTokenizer;
