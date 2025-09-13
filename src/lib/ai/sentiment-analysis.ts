// Sentiment analysis engine using rule-based approach with ML enhancements
export type SentimentResult = {
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  confidence: number;
  emotions: Emotion[];
  keywords: string[];
  summary: string;
};

export type Emotion = {
  name: string;
  intensity: number; // 0-1
  keywords: string[];
};

export type SentimentAnalysis = {
  id: string;
  text: string;
  result: SentimentResult;
  timestamp: number;
  source: "COMMENT" | "REVIEW" | "FEEDBACK" | "CHAT" | "EMAIL";
  metadata?: {
    customerId?: string;
    productId?: string;
    saleId?: string;
  };
};

// Sentiment analysis engine
export class SentimentAnalysisEngine {
  private positiveWords!: Set<string>;
  private negativeWords!: Set<string>;
  private emotionKeywords!: Map<string, string[]>;

  constructor() {
    this.initializeWordLists();
  }

  // Initialize word lists for sentiment analysis
  private initializeWordLists(): void {
    // Positive words
    this.positiveWords = new Set([
      // Spanish positive words
      "excelente",
      "genial",
      "fantástico",
      "maravilloso",
      "perfecto",
      "increíble",
      "bueno",
      "buena",
      "buenos",
      "buenas",
      "mejor",
      "mejores",
      "súper",
      "súper",
      "genial",
      "estupendo",
      "magnífico",
      "extraordinario",
      "sobresaliente",
      "satisfecho",
      "contento",
      "feliz",
      "alegre",
      "encantado",
      "impresionado",
      "recomiendo",
      "recomendable",
      "recomendado",
      "recomendada",
      "recomendados",
      "amazing",
      "awesome",
      "great",
      "good",
      "excellent",
      "perfect",
      "wonderful",
      "fantastic",
      "brilliant",
      "outstanding",
      "superb",
      "terrific",
      "fabulous",
      "love",
      "loved",
      "liked",
      "enjoyed",
      "pleased",
      "satisfied",
      "happy",
      "recommend",
      "recommended",
      "best",
      "better",
      "amazing",
      "incredible",
    ]);

    // Negative words
    this.negativeWords = new Set([
      // Spanish negative words
      "malo",
      "mala",
      "malos",
      "malas",
      "terrible",
      "horrible",
      "pésimo",
      "pésima",
      "decepcionante",
      "frustrante",
      "molesto",
      "molesta",
      "enojado",
      "enojada",
      "furioso",
      "furiosa",
      "indignado",
      "indignada",
      "descontento",
      "descontenta",
      "insatisfecho",
      "insatisfecha",
      "desilusionado",
      "desilusionada",
      "triste",
      "deprimido",
      "deprimida",
      "preocupado",
      "preocupada",
      "nervioso",
      "nerviosa",
      "estresado",
      "estresada",
      "cansado",
      "cansada",
      "agotado",
      "agotada",
      "odio",
      "odiar",
      "detesto",
      "detestar",
      "aburrido",
      "aburrida",
      "monótono",
      "monótona",
      "lento",
      "lenta",
      "lentos",
      "lentas",
      "difícil",
      "complicado",
      "complicada",
      "confuso",
      "confusa",
      "confundido",
      "confundida",
      "perdido",
      "perdida",
      "desorientado",
      "desorientada",
      "desesperado",
      "desesperada",
      "bad",
      "terrible",
      "awful",
      "horrible",
      "disappointing",
      "frustrating",
      "annoying",
      "angry",
      "mad",
      "furious",
      "upset",
      "disappointed",
      "sad",
      "depressed",
      "worried",
      "nervous",
      "stressed",
      "tired",
      "exhausted",
      "hate",
      "hated",
      "boring",
      "slow",
      "difficult",
      "confusing",
      "lost",
      "desperate",
      "hopeless",
      "useless",
      "worthless",
      "waste",
      "wasted",
    ]);

    // Emotion keywords
    this.emotionKeywords = new Map([
      [
        "joy",
        [
          "alegre",
          "feliz",
          "contento",
          "satisfecho",
          "encantado",
          "happy",
          "joyful",
          "pleased",
          "delighted",
        ],
      ],
      [
        "anger",
        [
          "enojado",
          "furioso",
          "molesto",
          "indignado",
          "angry",
          "mad",
          "furious",
          "upset",
          "irritated",
        ],
      ],
      [
        "sadness",
        [
          "triste",
          "deprimido",
          "melancólico",
          "sad",
          "depressed",
          "sorrowful",
          "gloomy",
          "down",
        ],
      ],
      [
        "fear",
        [
          "miedo",
          "asustado",
          "preocupado",
          "nervioso",
          "fear",
          "afraid",
          "worried",
          "nervous",
          "anxious",
        ],
      ],
      [
        "surprise",
        [
          "sorprendido",
          "asombrado",
          "impresionado",
          "surprised",
          "amazed",
          "astonished",
          "shocked",
        ],
      ],
      [
        "disgust",
        [
          "asco",
          "repugnante",
          "asqueroso",
          "disgusting",
          "revolting",
          "repulsive",
          "nasty",
        ],
      ],
      [
        "trust",
        [
          "confianza",
          "confiado",
          "seguro",
          "trust",
          "confident",
          "secure",
          "reliable",
          "dependable",
        ],
      ],
      [
        "anticipation",
        [
          "esperando",
          "ansioso",
          "emocionado",
          "anticipating",
          "excited",
          "eager",
          "looking forward",
        ],
      ],
    ]);
  }

  // Analyze sentiment of text
  analyzeSentiment(text: string): SentimentResult {
    const words = this.tokenize(text);
    const sentimentScore = this.calculateSentimentScore(words);
    const emotions = this.detectEmotions(words);
    const keywords = this.extractKeywords(words);
    const summary = this.generateSummary(sentimentScore, emotions);

    return {
      sentiment: this.determineSentiment(sentimentScore),
      confidence: Math.abs(sentimentScore),
      emotions,
      keywords,
      summary,
    };
  }

  // Tokenize text into words
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2);
  }

  // Calculate sentiment score
  private calculateSentimentScore(words: string[]): number {
    let score = 0;
    let totalWords = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      totalWords++;

      // Check for positive words
      if (this.positiveWords.has(word)) {
        score += 1;
      }
      // Check for negative words
      else if (this.negativeWords.has(word)) {
        score -= 1;
      }

      // Check for negations (not, no, etc.)
      if (i > 0 && this.isNegation(words[i - 1])) {
        if (this.positiveWords.has(word)) {
          score -= 0.5; // Reduce positive impact
        } else if (this.negativeWords.has(word)) {
          score += 0.5; // Reduce negative impact
        }
      }

      // Check for intensifiers (very, really, etc.)
      if (i > 0 && this.isIntensifier(words[i - 1])) {
        if (this.positiveWords.has(word)) {
          score += 0.3; // Increase positive impact
        } else if (this.negativeWords.has(word)) {
          score -= 0.3; // Increase negative impact
        }
      }
    }

    // Normalize score
    return totalWords > 0 ? score / totalWords : 0;
  }

  // Detect emotions in text
  private detectEmotions(words: string[]): Emotion[] {
    const emotions: Emotion[] = [];

    for (const [emotionName, keywords] of this.emotionKeywords.entries()) {
      let intensity = 0;
      const foundKeywords: string[] = [];

      for (const word of words) {
        for (const keyword of keywords) {
          if (word.includes(keyword) || keyword.includes(word)) {
            intensity += 0.2;
            foundKeywords.push(keyword);
          }
        }
      }

      if (intensity > 0) {
        emotions.push({
          name: emotionName,
          intensity: Math.min(1, intensity),
          keywords: [...new Set(foundKeywords)],
        });
      }
    }

    return emotions.sort((a, b) => b.intensity - a.intensity);
  }

  // Extract keywords from text
  private extractKeywords(words: string[]): string[] {
    const keywords: string[] = [];
    const stopWords = new Set([
      "que",
      "de",
      "la",
      "el",
      "en",
      "y",
      "a",
      "es",
      "se",
      "no",
      "te",
      "lo",
      "le",
      "da",
      "su",
      "por",
      "son",
      "con",
      "para",
      "al",
      "del",
      "los",
      "las",
      "un",
      "una",
      "me",
      "mi",
      "tu",
      "si",
      "como",
      "pero",
      "muy",
      "más",
      "todo",
      "todos",
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "this",
      "that",
      "these",
      "those",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
    ]);

    for (const word of words) {
      if (!stopWords.has(word) && word.length > 3) {
        keywords.push(word);
      }
    }

    return [...new Set(keywords)].slice(0, 10);
  }

  // Determine sentiment from score
  private determineSentiment(
    score: number
  ): "POSITIVE" | "NEGATIVE" | "NEUTRAL" {
    if (score > 0.1) return "POSITIVE";
    if (score < -0.1) return "NEGATIVE";
    return "NEUTRAL";
  }

  // Generate summary of sentiment analysis
  private generateSummary(score: number, emotions: Emotion[]): string {
    const sentiment = this.determineSentiment(score);
    const topEmotion = emotions[0];

    let summary = `Sentimiento ${sentiment.toLowerCase()}`;

    if (topEmotion && topEmotion.intensity > 0.3) {
      summary += ` con ${topEmotion.name}`;
    }

    if (Math.abs(score) > 0.5) {
      summary += ` (${
        Math.abs(score) > 0.7 ? "muy" : "moderadamente"
      } ${sentiment.toLowerCase()})`;
    }

    return summary;
  }

  // Check if word is a negation
  private isNegation(word: string): boolean {
    const negations = [
      "no",
      "not",
      "nunca",
      "jamás",
      "nada",
      "nadie",
      "ningún",
      "ninguna",
    ];
    return negations.includes(word);
  }

  // Check if word is an intensifier
  private isIntensifier(word: string): boolean {
    const intensifiers = [
      "muy",
      "mucho",
      "muchísimo",
      "extremadamente",
      "súper",
      "super",
      "very",
      "really",
      "extremely",
      "incredibly",
    ];
    return intensifiers.includes(word);
  }

  // Analyze multiple texts and get aggregated results
  analyzeMultipleTexts(texts: string[]): {
    overallSentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    averageConfidence: number;
    sentimentDistribution: { [key: string]: number };
    topEmotions: Emotion[];
    commonKeywords: string[];
  } {
    const results = texts.map((text) => this.analyzeSentiment(text));

    // Calculate overall sentiment
    const totalScore = results.reduce((sum, result) => {
      const score =
        result.sentiment === "POSITIVE"
          ? 1
          : result.sentiment === "NEGATIVE"
          ? -1
          : 0;
      return sum + score * result.confidence;
    }, 0);

    const overallSentiment =
      totalScore > 0.1
        ? "POSITIVE"
        : totalScore < -0.1
        ? "NEGATIVE"
        : "NEUTRAL";

    // Calculate average confidence
    const averageConfidence =
      results.reduce((sum, result) => sum + result.confidence, 0) /
      results.length;

    // Calculate sentiment distribution
    const sentimentDistribution = results.reduce((dist, result) => {
      dist[result.sentiment] = (dist[result.sentiment] || 0) + 1;
      return dist;
    }, {} as { [key: string]: number });

    // Get top emotions
    const allEmotions = results.flatMap((result) => result.emotions);
    const emotionMap = new Map<string, number>();

    allEmotions.forEach((emotion) => {
      const current = emotionMap.get(emotion.name) || 0;
      emotionMap.set(emotion.name, current + emotion.intensity);
    });

    const topEmotions = Array.from(emotionMap.entries())
      .map(([name, intensity]) => ({
        name,
        intensity: intensity / results.length,
        keywords: [],
      }))
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 5);

    // Get common keywords
    const allKeywords = results.flatMap((result) => result.keywords);
    const keywordCount = new Map<string, number>();

    allKeywords.forEach((keyword) => {
      keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
    });

    const commonKeywords = Array.from(keywordCount.entries())
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([keyword]) => keyword)
      .slice(0, 10);

    return {
      overallSentiment,
      averageConfidence,
      sentimentDistribution,
      topEmotions,
      commonKeywords,
    };
  }

  // Get sentiment trends over time
  analyzeSentimentTrends(analyses: SentimentAnalysis[]): {
    trend: "IMPROVING" | "DECLINING" | "STABLE";
    averageSentiment: number;
    recentSentiment: number;
    changePercentage: number;
  } {
    if (analyses.length < 2) {
      return {
        trend: "STABLE",
        averageSentiment: 0,
        recentSentiment: 0,
        changePercentage: 0,
      };
    }

    // Sort by timestamp
    const sortedAnalyses = analyses.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate sentiment scores
    const scores = sortedAnalyses.map((analysis) => {
      const score =
        analysis.result.sentiment === "POSITIVE"
          ? 1
          : analysis.result.sentiment === "NEGATIVE"
          ? -1
          : 0;
      return score * analysis.result.confidence;
    });

    const averageSentiment =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // Calculate recent sentiment (last 30% of data)
    const recentCount = Math.max(1, Math.floor(scores.length * 0.3));
    const recentScores = scores.slice(-recentCount);
    const recentSentiment =
      recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;

    // Calculate trend
    const changePercentage =
      ((recentSentiment - averageSentiment) / Math.abs(averageSentiment)) * 100;

    let trend: "IMPROVING" | "DECLINING" | "STABLE";
    if (changePercentage > 10) {
      trend = "IMPROVING";
    } else if (changePercentage < -10) {
      trend = "DECLINING";
    } else {
      trend = "STABLE";
    }

    return {
      trend,
      averageSentiment,
      recentSentiment,
      changePercentage,
    };
  }
}

// Singleton instance
export const sentimentAnalysisEngine = new SentimentAnalysisEngine();
