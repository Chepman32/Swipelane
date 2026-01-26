/**
 * Utility functions for text processing in the Text-to-Slides app
 */

/**
 * Split text into paragraphs
 * @param text The input text to split
 * @returns Array of paragraphs
 */
export const splitIntoParagraphs = (text: string): string[] => {
  return text.split('\n\n').filter(paragraph => paragraph.trim().length > 0);
};

/**
 * Split text into sentences
 * @param text The input text to split
 * @returns Array of sentences
 */
export const splitIntoSentences = (text: string): string[] => {
  // Simple sentence splitting regex
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences: string[] = [];
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = sentenceRegex.exec(text)) !== null) {
    const sentence = match[0].trim();

    if (sentence.length > 0) {
      sentences.push(sentence);
    }

    lastIndex = sentenceRegex.lastIndex;
  }

  // Capture any trailing text without punctuation (e.g., bullet lists)
  if (lastIndex < text.length) {
    const tail = text.slice(lastIndex).trim();

    if (tail.length > 0) {
      sentences.push(tail);
    }
  }

  if (sentences.length > 0) {
    return sentences;
  }
  
  // If no sentences found, return the original text as one item
  return [text.trim()];
};

/**
 * Advanced text processing algorithms for better slide splitting
 */

/**
 * Split text into chunks using advanced algorithms
 * @param text The input text to split
 * @param maxChars Maximum characters per chunk
 * @param options Advanced splitting options
 * @returns Array of text chunks
 */
export const splitIntoAdvancedChunks = (
  text: string, 
  maxChars: number = 200,
  options: {
    preserveParagraphs?: boolean;
    respectSentences?: boolean;
    respectWords?: boolean;
    minChunkSize?: number;
    maxChunkSize?: number;
  } = {}
): string[] => {
  const {
    preserveParagraphs = true,
    respectSentences = true,
    respectWords = true,
    minChunkSize = 50,
    maxChunkSize = maxChars,
  } = options;

  // Clean and normalize text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  if (cleanText.length <= maxChunkSize) {
    return [cleanText];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  let currentLength = 0;

  // Split by paragraphs first if preserveParagraphs is true
  const paragraphs = preserveParagraphs 
    ? cleanText.split('\n\n').filter(p => p.trim().length > 0)
    : [cleanText];

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    
    // If paragraph fits in current chunk, add it
    if (currentLength + trimmedParagraph.length <= maxChunkSize) {
      if (currentChunk) {
        currentChunk += '\n\n';
      }
      currentChunk += trimmedParagraph;
      currentLength += trimmedParagraph.length;
    } else {
      // Paragraph doesn't fit, need to split it
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentLength = 0;
      }

      // Split paragraph into sentences or words
      if (respectSentences && trimmedParagraph.length > maxChunkSize) {
        const sentenceChunks = splitBySentences(trimmedParagraph, maxChunkSize, minChunkSize);
        chunks.push(...sentenceChunks);
      } else if (respectWords && trimmedParagraph.length > maxChunkSize) {
        const wordChunks = splitByWords(trimmedParagraph, maxChunkSize, minChunkSize);
        chunks.push(...wordChunks);
      } else {
        chunks.push(trimmedParagraph);
      }
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length >= minChunkSize);
};

/**
 * Split text by sentences while respecting chunk size limits
 */
const splitBySentences = (text: string, maxSize: number, minSize: number): string[] => {
  const sentences = splitIntoSentences(text);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    if (currentChunk.length + trimmedSentence.length <= maxSize) {
      if (currentChunk) {
        currentChunk += ' ';
      }
      currentChunk += trimmedSentence;
    } else {
      if (currentChunk && currentChunk.length >= minSize) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = trimmedSentence;
    }
  }

  if (currentChunk && currentChunk.length >= minSize) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

/**
 * Split text by words while respecting chunk size limits
 */
const splitByWords = (text: string, maxSize: number, minSize: number): string[] => {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const word of words) {
    if (currentChunk.length + word.length + 1 <= maxSize) {
      if (currentChunk) {
        currentChunk += ' ';
      }
      currentChunk += word;
    } else {
      if (currentChunk && currentChunk.length >= minSize) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = word;
    }
  }

  if (currentChunk && currentChunk.length >= minSize) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

/**
 * Basic chunking helper used by legacy screens.
 * Falls back to the advanced splitter but keeps the simpler signature that
 * other parts of the app expect.
 */
export const splitIntoChunks = (text: string, maxChars: number = 200): string[] => {
  return splitIntoAdvancedChunks(text, maxChars, {
    preserveParagraphs: true,
    respectSentences: true,
    respectWords: true,
    minChunkSize: Math.max(50, Math.floor(maxChars * 0.5)),
    maxChunkSize: maxChars,
  });
};

/**
 * Fallback splitter that enforces a target number of slides by length.
 */
const forceSplitByLength = (text: string, targetSlides: number): string[] => {
  const trimmed = text.trim();

  if (!trimmed) {
    return [];
  }

  const slides = Math.max(1, targetSlides);
  const idealSize = Math.max(1, Math.ceil(trimmed.length / slides));
  const result: string[] = [];
  let start = 0;

  while (start < trimmed.length) {
    let end = Math.min(start + idealSize, trimmed.length);

    if (end < trimmed.length) {
      let breakPoint = end;

      for (let i = end - 1; i >= Math.max(start, end - 40); i--) {
        const char = trimmed[i];

        if (
          char === ' ' ||
          char === '.' ||
          char === ',' ||
          char === ';' ||
          char === ':' ||
          char === '\n'
        ) {
          breakPoint = i + 1;
          break;
        }
      }

      end = Math.max(breakPoint, start + 1);
    }

    const chunk = trimmed.slice(start, end).trim();

    if (chunk.length > 0) {
      result.push(chunk);
    }

    start = end;
  }

  return result.length > 0 ? result : [trimmed];
};

/**
 * Smart text splitting that adapts to content type
 */
export const smartSplit = (text: string, targetSlides: number = 3): string[] => {
  // Handle empty or very short text
  if (!text || text.trim().length === 0) {
    return ['No content provided'];
  }

  const trimmedText = text.trim();
  const textLength = trimmedText.length;

  // For very short text, just return it as a single slide
  if (textLength < 20) {
    return [trimmedText];
  }

  // If text is short but we want multiple slides, duplicate or split artificially
  if (textLength < 50 && targetSlides > 1) {
    // For very short text, just use one slide
    targetSlides = 1;
  }

  const idealChunkSize = Math.ceil(textLength / targetSlides);

  // Detect content type
  const contentType = detectContentType(trimmedText);

  let options = {
    preserveParagraphs: true,
    respectSentences: true,
    respectWords: true,
    minChunkSize: Math.min(10, idealChunkSize * 0.3), // Lower minimum for short texts
    maxChunkSize: Math.min(idealChunkSize * 1.5, textLength),
  };

  // Adjust options based on content type
  switch (contentType) {
    case 'list':
      options.preserveParagraphs = true;
      options.respectSentences = false;
      break;
    case 'story':
      options.respectSentences = true;
      options.respectWords = false;
      break;
    case 'technical':
      options.respectWords = true;
      options.minChunkSize = Math.max(50, idealChunkSize * 0.4);
      break;
    case 'quote':
      options.preserveParagraphs = true;
      options.respectSentences = true;
      options.maxChunkSize = idealChunkSize * 1.2;
      break;
  }

  const chunks = splitIntoAdvancedChunks(trimmedText, idealChunkSize, options);

  // Ensure we have at least the target number of slides
  if (chunks.length < targetSlides) {
    const desiredChunkSize = Math.max(1, Math.ceil(textLength / targetSlides));
    const sourceChunks = chunks.length > 0 ? chunks : [trimmedText];
    const forced: string[] = [];

    for (const chunk of sourceChunks) {
      const projectedSlides = Math.max(
        1,
        Math.ceil(chunk.length / desiredChunkSize)
      );
      forced.push(...forceSplitByLength(chunk, projectedSlides));
    }

    return forced.filter(chunk => chunk.length > 0);
  }

  return chunks;
};

/**
 * Detect the type of content for better splitting
 */
const detectContentType = (text: string): 'list' | 'story' | 'technical' | 'quote' | 'general' => {
  const lines = text.split('\n');
  const sentences = splitIntoSentences(text);
  
  // Check for list format
  if (lines.some(line => /^[\s]*[-*•]\s/.test(line)) || 
      lines.some(line => /^\d+\.\s/.test(line))) {
    return 'list';
  }
  
  // Check for quote format
  if (text.includes('"') && sentences.length <= 3) {
    return 'quote';
  }
  
  // Check for technical content
  if (text.includes('function') || text.includes('class') || 
      text.includes('API') || text.includes('code')) {
    return 'technical';
  }
  
  // Check for story format
  if (sentences.length > 5 && text.includes('.')) {
    return 'story';
  }
  
  return 'general';
};

/**
 * Optimize text for slide readability
 */
export const optimizeForSlides = (text: string): string => {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive punctuation
    .replace(/[.]{3,}/g, '...')
    // Normalize quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Remove excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Get reading time estimate for text
 */
export const getReadingTime = (text: string, wordsPerMinute: number = 200): number => {
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

const estimateSlideCountBase = (text: string, charsPerSlide: number): number => {
  const cleanText = text.replace(/\s+/g, ' ').trim();

  if (!cleanText) {
    return 1;
  }

  const wordCount = cleanText.split(' ').filter(Boolean).length;
  const listItemCount = text
    .split('\n')
    .filter(line => /^\s*(?:[-*•]|\d+\.)\s+/.test(line)).length;
  const paragraphCount = text
    .split(/\n{2,}/)
    .filter(p => p.trim().length > 0).length;

  // Keep very short inputs stable unless structure suggests multiple slides.
  if (wordCount <= 12 && listItemCount <= 1 && paragraphCount <= 1) {
    return 1;
  }

  const sentenceCount = splitIntoSentences(cleanText).length;

  const wordsPerSlide = Math.max(20, Math.floor(charsPerSlide / 10));
  const wordBased = Math.ceil(wordCount / wordsPerSlide);
  const listBased = listItemCount > 0 ? Math.ceil(listItemCount / 4) : 0;
  const paragraphBased = paragraphCount > 1 ? paragraphCount : 0;
  const sentenceBased = sentenceCount > 4 ? Math.ceil(sentenceCount / 3) : 1;

  const estimate = Math.max(1, wordBased, listBased, paragraphBased, sentenceBased);

  return Math.min(estimate, 12);
};

/**
 * Get optimal slide count based on text characteristics
 */
export const getOptimalSlideCount = (text: string): number => {
  return estimateSlideCountBase(text, 200);
};

/**
 * Estimate the number of slides needed for a given text
 * @param text The input text
 * @param charsPerSlide Average characters per slide
 * @returns Estimated number of slides
 */
export const estimateSlideCount = (text: string, charsPerSlide: number = 200): number => {
  return estimateSlideCountBase(text, charsPerSlide);
};

/**
 * Truncate text to a maximum length
 * @param text The text to truncate
 * @param maxLength Maximum length
 * @param suffix Suffix to append if truncated
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};

export default {
  splitIntoParagraphs,
  splitIntoSentences,
  splitIntoChunks,
  splitIntoAdvancedChunks,
  smartSplit,
  estimateSlideCount,
  truncateText,
};
