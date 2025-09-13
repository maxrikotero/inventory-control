import { listProducts } from "@/lib/products";
import { listSales } from "@/lib/sales";
import { listCustomers } from "@/lib/customers";

// Types for chatbot
export type ChatMessage = {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: number;
  metadata?: {
    intent?: string;
    confidence?: number;
    actions?: ChatAction[];
  };
};

export type ChatAction = {
  type:
    | "SHOW_PRODUCTS"
    | "SHOW_SALES"
    | "CREATE_ORDER"
    | "CHECK_STOCK"
    | "GET_RECOMMENDATIONS";
  data: any;
  label: string;
};

export type ChatContext = {
  customerId?: string;
  currentProducts?: string[];
  conversationHistory: ChatMessage[];
  userPreferences?: {
    language: string;
    communicationStyle: "formal" | "casual";
  };
};

export type ChatIntent =
  | "GREETING"
  | "PRODUCT_INQUIRY"
  | "PRICE_CHECK"
  | "STOCK_CHECK"
  | "ORDER_STATUS"
  | "RECOMMENDATIONS"
  | "COMPLAINT"
  | "COMPLIMENT"
  | "GOODBYE"
  | "HELP"
  | "UNKNOWN";

// Chatbot engine using rule-based approach with ML enhancements
export class ChatbotEngine {
  private products: any[] = [];
  private sales: any[] = [];
  private customers: any[] = [];
  private isInitialized = false;

  // Intent patterns for natural language understanding
  private intentPatterns = {
    GREETING: [
      /hola|hello|hi|buenos días|buenas tardes|buenas noches/i,
      /¿cómo estás?|how are you/i,
      /saludos/i,
    ],
    PRODUCT_INQUIRY: [
      /producto|productos|artículo|artículos/i,
      /¿qué tienes?|what do you have/i,
      /catálogo|catalog/i,
      /mostrar|show|ver|see/i,
    ],
    PRICE_CHECK: [
      /precio|price|costo|cost|cuánto cuesta|how much/i,
      /valor|value|tarifa|rate/i,
    ],
    STOCK_CHECK: [
      /stock|inventario|inventory|disponible|available/i,
      /¿hay|is there|tienes|do you have/i,
      /cantidad|quantity|unidades|units/i,
    ],
    ORDER_STATUS: [
      /pedido|order|compra|purchase/i,
      /estado|status|dónde está|where is/i,
      /seguimiento|tracking/i,
    ],
    RECOMMENDATIONS: [
      /recomend|recommend|suger|suggest/i,
      /¿qué me recomiendas?|what do you recommend/i,
      /mejor|best|top/i,
    ],
    COMPLAINT: [
      /problema|problem|queja|complaint/i,
      /malo|bad|terrible|awful/i,
      /no funciona|doesn't work/i,
      /error|mistake/i,
    ],
    COMPLIMENT: [
      /excelente|excellent|genial|great/i,
      /bueno|good|perfecto|perfect/i,
      /gracias|thank you|thanks/i,
    ],
    GOODBYE: [/adiós|goodbye|bye|hasta luego|see you/i, /chao|ciao|nos vemos/i],
    HELP: [
      /ayuda|help|socorro|assist/i,
      /¿qué puedes hacer?|what can you do/i,
      /comandos|commands/i,
    ],
  };

  // Response templates
  private responseTemplates = {
    GREETING: [
      "¡Hola! 👋 Soy tu asistente de ventas inteligente. ¿En qué puedo ayudarte hoy?",
      "¡Buenos días! 😊 Estoy aquí para ayudarte con tus consultas de productos y ventas.",
      "¡Hola! 🤖 Soy tu asistente virtual. ¿Qué necesitas saber sobre nuestros productos?",
    ],
    PRODUCT_INQUIRY: [
      "Te muestro nuestros productos disponibles. ¿Hay algo específico que buscas?",
      "Aquí tienes nuestro catálogo de productos. ¿Te interesa algún producto en particular?",
      "Tenemos una gran variedad de productos. ¿Qué tipo de producto necesitas?",
    ],
    PRICE_CHECK: [
      "Te ayudo a verificar los precios. ¿De qué producto necesitas saber el precio?",
      "Puedo consultar los precios de nuestros productos. ¿Cuál te interesa?",
      "Los precios están actualizados. ¿Qué producto quieres consultar?",
    ],
    STOCK_CHECK: [
      "Verifico el stock disponible. ¿De qué producto necesitas saber la disponibilidad?",
      "Puedo consultar nuestro inventario. ¿Qué producto te interesa?",
      "Te ayudo a verificar la disponibilidad. ¿Cuál es el producto?",
    ],
    ORDER_STATUS: [
      "Te ayudo a consultar el estado de tu pedido. ¿Tienes el número de pedido?",
      "Puedo verificar el estado de tu compra. ¿Cuál es tu número de pedido?",
      "Consulto el seguimiento de tu pedido. ¿Me das el número de referencia?",
    ],
    RECOMMENDATIONS: [
      "Te hago recomendaciones personalizadas basadas en tus preferencias. ¿Qué tipo de producto buscas?",
      "Puedo sugerirte productos que podrían interesarte. ¿Cuáles son tus necesidades?",
      "Te recomiendo productos basados en tendencias y tu historial. ¿Qué te interesa?",
    ],
    COMPLAINT: [
      "Lamento mucho el inconveniente. Te ayudo a resolver este problema. ¿Puedes contarme más detalles?",
      "Entiendo tu preocupación. Vamos a solucionarlo juntos. ¿Qué pasó exactamente?",
      "Disculpa por el problema. Te ayudo a encontrar una solución. ¿Cuál es la situación?",
    ],
    COMPLIMENT: [
      "¡Muchas gracias! 😊 Me alegra saber que estás satisfecho con nuestro servicio.",
      "¡Qué bueno! 🎉 Me encanta ayudarte y que tengas una buena experiencia.",
      "¡Gracias por tus palabras! 😄 Siempre estoy aquí para ayudarte.",
    ],
    GOODBYE: [
      "¡Hasta luego! 👋 Fue un placer ayudarte. ¡Que tengas un excelente día!",
      "¡Nos vemos pronto! 😊 Gracias por usar nuestro servicio de atención.",
      "¡Adiós! 🤖 Espero haberte sido útil. ¡Vuelve cuando necesites ayuda!",
    ],
    HELP: [
      "Puedo ayudarte con:\n• Consultar productos y precios\n• Verificar stock disponible\n• Hacer recomendaciones\n• Consultar estado de pedidos\n• Resolver problemas\n\n¿Qué necesitas?",
      "Estoy aquí para asistirte con:\n• Información de productos\n• Consultas de inventario\n• Recomendaciones personalizadas\n• Seguimiento de pedidos\n• Soporte técnico\n\n¿En qué puedo ayudarte?",
      "Mis capacidades incluyen:\n• Búsqueda de productos\n• Consulta de precios y stock\n• Recomendaciones inteligentes\n• Estado de pedidos\n• Atención al cliente\n\n¿Qué te interesa?",
    ],
    UNKNOWN: [
      "No estoy seguro de entenderte completamente. ¿Podrías ser más específico?",
      "Hmm, no estoy seguro de lo que necesitas. ¿Puedes reformular tu pregunta?",
      "No entiendo completamente. ¿Te ayudo con información sobre nuestros productos?",
    ],
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const [products, sales, customers] = await Promise.all([
        listProducts(),
        listSales(100),
        listCustomers(),
      ]);

      this.products = products;
      this.sales = sales;
      this.customers = customers;
      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing chatbot:", error);
    }
  }

  // Main chat processing function
  async processMessage(
    message: string,
    context: ChatContext
  ): Promise<ChatMessage> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const intent = this.detectIntent(message);
    const response = await this.generateResponse(message, intent, context);
    const actions = this.generateActions(intent, message, context);

    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: "assistant",
      content: response,
      timestamp: Date.now(),
      metadata: {
        intent,
        confidence: this.calculateConfidence(message, intent),
        actions,
      },
    };
  }

  // Detect user intent from message
  private detectIntent(message: string): ChatIntent {
    let bestIntent: ChatIntent = "UNKNOWN";
    let maxMatches = 0;

    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      let matches = 0;
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestIntent = intent as ChatIntent;
      }
    }

    return bestIntent;
  }

  // Generate response based on intent and context
  private async generateResponse(
    message: string,
    intent: ChatIntent,
    context: ChatContext
  ): Promise<string> {
    const templates = this.responseTemplates[intent];
    const baseResponse =
      templates[Math.floor(Math.random() * templates.length)];

    // Enhance response based on context and specific queries
    switch (intent) {
      case "PRODUCT_INQUIRY":
        return this.enhanceProductResponse(message, baseResponse);

      case "PRICE_CHECK":
        return this.enhancePriceResponse(message, baseResponse);

      case "STOCK_CHECK":
        return this.enhanceStockResponse(message, baseResponse);

      case "RECOMMENDATIONS":
        return this.enhanceRecommendationResponse(
          message,
          baseResponse,
          context
        );

      case "ORDER_STATUS":
        return this.enhanceOrderResponse(message, baseResponse, context);

      default:
        return baseResponse;
    }
  }

  // Enhance product inquiry responses
  private enhanceProductResponse(
    message: string,
    baseResponse: string
  ): string {
    const productKeywords = this.extractProductKeywords(message);

    if (productKeywords.length > 0) {
      const matchingProducts = this.products.filter((product) =>
        productKeywords.some((keyword) =>
          product.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      if (matchingProducts.length > 0) {
        const productList = matchingProducts
          .slice(0, 3)
          .map(
            (p) => `• ${p.name} - $${p.unitPrice} (Stock: ${p.stockAvailable})`
          )
          .join("\n");

        return `${baseResponse}\n\nEncontré estos productos:\n${productList}`;
      }
    }

    // Show top products if no specific match
    const topProducts = this.products
      .filter((p) => p.stockAvailable > 0)
      .slice(0, 5)
      .map((p) => `• ${p.name} - $${p.unitPrice}`)
      .join("\n");

    return `${baseResponse}\n\nNuestros productos más populares:\n${topProducts}`;
  }

  // Enhance price check responses
  private enhancePriceResponse(message: string, baseResponse: string): string {
    const productKeywords = this.extractProductKeywords(message);

    if (productKeywords.length > 0) {
      const matchingProduct = this.products.find((product) =>
        productKeywords.some((keyword) =>
          product.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      if (matchingProduct) {
        return `El precio de ${matchingProduct.name} es $${matchingProduct.unitPrice}. Stock disponible: ${matchingProduct.stockAvailable} unidades.`;
      }
    }

    return baseResponse;
  }

  // Enhance stock check responses
  private enhanceStockResponse(message: string, baseResponse: string): string {
    const productKeywords = this.extractProductKeywords(message);

    if (productKeywords.length > 0) {
      const matchingProduct = this.products.find((product) =>
        productKeywords.some((keyword) =>
          product.name.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      if (matchingProduct) {
        const stockStatus =
          matchingProduct.stockAvailable > 0
            ? `✅ Disponible (${matchingProduct.stockAvailable} unidades)`
            : "❌ Sin stock";

        return `${matchingProduct.name}: ${stockStatus}`;
      }
    }

    return baseResponse;
  }

  // Enhance recommendation responses
  private enhanceRecommendationResponse(
    message: string,
    baseResponse: string,
    context: ChatContext
  ): string {
    // Get trending products
    const trendingProducts = this.products
      .filter((p) => p.stockAvailable > 0)
      .sort((a, b) => b.stockAvailable - a.stockAvailable)
      .slice(0, 3)
      .map(
        (p) => `• ${p.name} - $${p.unitPrice} (${p.stockAvailable} disponibles)`
      )
      .join("\n");

    return `${baseResponse}\n\nProductos recomendados:\n${trendingProducts}`;
  }

  // Enhance order status responses
  private enhanceOrderResponse(
    message: string,
    baseResponse: string,
    context: ChatContext
  ): string {
    if (context.customerId) {
      const customerSales = this.sales.filter(
        (sale) => sale.customerId === context.customerId
      );

      if (customerSales.length > 0) {
        const recentSale = customerSales[customerSales.length - 1];
        return `${baseResponse}\n\nTu último pedido (${
          recentSale.id
        }):\n• Estado: ${recentSale.status}\n• Total: $${
          recentSale.total
        }\n• Fecha: ${new Date(recentSale.createdAt).toLocaleDateString()}`;
      }
    }

    return baseResponse;
  }

  // Generate actions based on intent
  private generateActions(
    intent: ChatIntent,
    message: string,
    context: ChatContext
  ): ChatAction[] {
    const actions: ChatAction[] = [];

    switch (intent) {
      case "PRODUCT_INQUIRY":
        actions.push({
          type: "SHOW_PRODUCTS",
          data: { search: this.extractProductKeywords(message) },
          label: "Ver Productos",
        });
        break;

      case "RECOMMENDATIONS":
        actions.push({
          type: "GET_RECOMMENDATIONS",
          data: { customerId: context.customerId },
          label: "Ver Recomendaciones",
        });
        break;

      case "STOCK_CHECK":
        const productKeywords = this.extractProductKeywords(message);
        if (productKeywords.length > 0) {
          actions.push({
            type: "CHECK_STOCK",
            data: { keywords: productKeywords },
            label: "Verificar Stock",
          });
        }
        break;

      case "ORDER_STATUS":
        if (context.customerId) {
          actions.push({
            type: "SHOW_SALES",
            data: { customerId: context.customerId },
            label: "Ver Mis Pedidos",
          });
        }
        break;
    }

    return actions;
  }

  // Extract product keywords from message
  private extractProductKeywords(message: string): string[] {
    const words = message.toLowerCase().split(/\s+/);
    const productKeywords: string[] = [];

    // Simple keyword extraction - in a real system you'd use NLP
    for (const word of words) {
      if (word.length > 3 && !this.isStopWord(word)) {
        productKeywords.push(word);
      }
    }

    return productKeywords;
  }

  // Check if word is a stop word
  private isStopWord(word: string): boolean {
    const stopWords = [
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
      "toda",
      "todas",
      "este",
      "esta",
      "estos",
      "estas",
      "ese",
      "esa",
      "esos",
      "esas",
      "aquel",
      "aquella",
      "aquellos",
      "aquellas",
    ];
    return stopWords.includes(word);
  }

  // Calculate confidence score for intent detection
  private calculateConfidence(message: string, intent: ChatIntent): number {
    if (intent === "UNKNOWN") return 0.1;

    const patterns = this.intentPatterns[intent];
    let matches = 0;
    let totalPatterns = 0;

    for (const pattern of patterns) {
      totalPatterns++;
      if (pattern.test(message)) {
        matches++;
      }
    }

    return Math.min(0.9, matches / totalPatterns + 0.3);
  }

  // Get conversation suggestions
  getConversationSuggestions(context: ChatContext): string[] {
    const suggestions = [
      "¿Qué productos tienes disponibles?",
      "¿Cuál es el precio de...?",
      "¿Tienes stock de...?",
      "¿Qué me recomiendas?",
      "¿Cómo está mi pedido?",
      "Necesito ayuda con...",
    ];

    // Customize suggestions based on context
    if (context.customerId) {
      suggestions.push("¿Cuáles son mis pedidos recientes?");
      suggestions.push("¿Qué productos me recomiendas?");
    }

    return suggestions;
  }

  // Get quick actions for the chat interface
  getQuickActions(context: ChatContext): ChatAction[] {
    return [
      {
        type: "SHOW_PRODUCTS",
        data: {},
        label: "Ver Productos",
      },
      {
        type: "GET_RECOMMENDATIONS",
        data: { customerId: context.customerId },
        label: "Recomendaciones",
      },
      {
        type: "CHECK_STOCK",
        data: {},
        label: "Verificar Stock",
      },
    ];
  }
}

// Singleton instance
export const chatbotEngine = new ChatbotEngine();
