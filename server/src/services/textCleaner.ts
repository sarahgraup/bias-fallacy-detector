interface ITextCleanerOptions {
    removeUrls?: boolean;
    removePunctuation?: boolean;
    lowercase?: boolean;
}
export class TextCleaner {
  private options: ITextCleanerOptions;
  private urlPattern: RegExp;

  constructor(options: ITextCleanerOptions = {}) {
    this.options = {
      removeUrls: true,
      removePunctuation: false,
      lowercase: true,
      ...options,
    };
    this.urlPattern = /https?:\/\/[^\s]+/g;
  }

  /**
   * Cleans and returns urls, punctuation, whitespace, and lowercase options. 
   * @param {string} text - the text content to be cleaned.
   * @returns {string} The cleaned string.
   */
    clean(text: string): string {
      
        if (!text) return '';

        let cleanedText = text;

        //remove urls if configured
        if (this.options.removeUrls) {
            cleanedText = cleanedText.replace(this.urlPattern, '');
        }

        //convert to lowercase if configured
        if (this.options.lowercase) {
            cleanedText = cleanedText.toLowerCase();
        }

        //remove punctuation if configured
        if (this.options.removePunctuation) {
            cleanedText = cleanedText.replace(/[^\w\s]/g, '');
        }

        //remove extra whitespace
        cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

        return cleanedText;

  }
}