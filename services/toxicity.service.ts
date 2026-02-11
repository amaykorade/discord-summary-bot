import { logger } from '../utils/logger';

/**
 * Result of a toxicity check.
 * Kept minimal for easy swap to AI-based detection (OpenAI Moderation, Perspective API).
 */
export interface ToxicityResult {
  isToxic: boolean;
  confidence: number;
  /** Optional: for debugging or AI responses */
  matchedPattern?: string;
}

/**
 * Detector interface - implement this to swap detection strategies.
 * Example: WordListDetector (current) | OpenAIDetector | PerspectiveAPIDetector
 */
export interface IToxicityDetector {
  check(content: string): Promise<ToxicityResult>;
}

/**
 * Simple word-list based detector.
 * Bad words and insults - easy to extend or replace with AI.
 */
const BAD_WORDS: string[] = [
  // Severe insults / slurs (leetspeak variants)
  'kys', 'kms', 'retard', 'retarded', 'r3tard', 'r3tarded',
  'nigger', 'nigga', 'faggot', 'fag', 'f4ggot', 'f4g',
  // Aggressive / hate
  'kill yourself', 'kill urself', 'go die', 'drop dead',
  'fuck you', 'fuck off', 'screw you', 'piece of shit',
  'worthless', 'stupid idiot', 'dumbass', 'shithead',
  // Common insults
  'idiot', 'moron', 'stupid', 'dumb', 'trash', 'pathetic',
  'loser', 'sucker', 'screw you', 'shut up', 'stfu',
];

/** Normalized (lowercase, no spaces) for fast lookup */
const BAD_WORDS_SET = new Set(BAD_WORDS.map((w) => w.toLowerCase().replace(/\s/g, '')));

/** Single-word variants for partial matching */
const BAD_WORD_PARTS = BAD_WORDS.flatMap((w) => {
  const parts = w.toLowerCase().split(/\s+/);
  return parts.filter((p) => p.length >= 3);
});
const BAD_WORD_PARTS_SET = new Set(BAD_WORD_PARTS);

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractWords(text: string): string[] {
  return normalizeForMatch(text).split(/\s+/).filter(Boolean);
}

export class WordListToxicityDetector implements IToxicityDetector {
  async check(content: string): Promise<ToxicityResult> {
    const normalized = normalizeForMatch(content);
    const words = extractWords(content);

    // Exact phrase match
    for (const phrase of BAD_WORDS) {
      if (phrase.includes(' ')) {
        if (normalized.includes(phrase.toLowerCase())) {
          return { isToxic: true, confidence: 0.9, matchedPattern: phrase };
        }
      }
    }

    // Single word match
    for (const word of words) {
      const clean = word.replace(/[0-9]/g, (d) => ({ '1': 'i', '3': 'e', '4': 'a', '0': 'o' }[d] ?? d));
      if (BAD_WORDS_SET.has(word) || BAD_WORDS_SET.has(clean) || BAD_WORD_PARTS_SET.has(word)) {
        return { isToxic: true, confidence: 0.85, matchedPattern: word };
      }
    }

    return { isToxic: false, confidence: 0 };
  }
}

/**
 * Toxicity service - uses pluggable detector for easy AI upgrade.
 *
 * To switch to AI-based detection:
 *   1. Create OpenAIDetector implements IToxicityDetector (OpenAI Moderation API)
 *   2. toxicityService.setDetector(new OpenAIDetector(apiKey))
 *   Or pass detector in constructor: new ToxicityService(new OpenAIDetector())
 */
export class ToxicityService {
  private detector: IToxicityDetector;

  constructor(detector: IToxicityDetector = new WordListToxicityDetector()) {
    this.detector = detector;
  }

  /** Set a different detector (e.g. AI-based) without changing callers */
  setDetector(detector: IToxicityDetector): void {
    this.detector = detector;
  }

  /**
   * Check if content is toxic. Returns result with isToxic for DB storage.
   */
  async checkToxicity(content: string): Promise<ToxicityResult> {
    return this.detector.check(content.trim());
  }

  async filterToxicMessages(
    messages: { content: string; username: string; createdAt: Date }[]
  ): Promise<{ content: string; username: string; createdAt: Date }[]> {
    const results: { content: string; username: string; createdAt: Date }[] = [];

    for (const msg of messages) {
      const result = await this.checkToxicity(msg.content);
      if (result.isToxic) {
        logger.debug('Toxic message detected', {
          username: msg.username,
          confidence: result.confidence,
        });
        results.push(msg);
      }
    }

    return results;
  }
}

export const toxicityService = new ToxicityService();
