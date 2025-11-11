// src/utils/ArticleScraper.ts

import axios from "axios";
import * as cheerio from "cheerio";
import { IArticleMetadata } from "./types";

export class ArticleScraper {
  /**
   * Scrape article from URL
   */
  async scrapeArticle(
    url: string
  ): Promise<{ text: string; metadata: IArticleMetadata }> {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      // Remove script and style elements
      $("script, style, nav, footer, aside").remove();

      // Try to extract metadata
      const metadata: IArticleMetadata = {
        title:
          $('meta[property="og:title"]').attr("content") ||
          $("title").text() ||
          $("h1").first().text(),
        author:
          $('meta[name="author"]').attr("content") ||
          $('[rel="author"]').text() ||
          $(".author").text(),
        source: new URL(url).hostname,
        publishDate:
          $('meta[property="article:published_time"]').attr("content") ||
          $("time").attr("datetime"),
        url: url,
      };

      // Extract main content (prioritize article tags)
      let text = "";
      if ($("article").length > 0) {
        text = $("article").text();
      } else if ($("main").length > 0) {
        text = $("main").text();
      } else {
        // Fallback: get all paragraphs
        text = $("p")
          .map((_, el) => $(el).text())
          .get()
          .join("\n\n");
      }

      // Clean up the text
      text = text
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();

      return { text, metadata };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to scrape article: ${errorMessage}`);
    }
  }

  /**
   * Extract text from uploaded file
   */
  async extractFromFile(file: Buffer, fileType: string): Promise<string> {
    if (fileType === "application/pdf") {
      // Use pdf-parse library
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(file);
      return data.text;
    } else if (fileType === "text/plain") {
      return file.toString("utf-8");
    } else {
      throw new Error("Unsupported file type");
    }
  }
}
