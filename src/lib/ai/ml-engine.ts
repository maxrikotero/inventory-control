import * as tf from "@tensorflow/tfjs";
import { Product } from "@/types/product";
import { Sale } from "@/types/sales";
import { listProducts } from "@/lib/products";
import { listSales } from "@/lib/sales";

// Types for ML predictions
export type MLPrediction = {
  productId: string;
  productName: string;
  prediction: number;
  confidence: number;
  model: string;
  features: number[];
  timestamp: Date;
};

export type MLModel = {
  name: string;
  type: "DEMAND" | "PRICE" | "SEASONAL" | "CHURN";
  accuracy: number;
  lastTrained: Date;
  features: string[];
  isTrained: boolean;
};

export type TrainingData = {
  features: number[][];
  labels: number[];
  productIds: string[];
  timestamps: number[];
};

export type MLInsight = {
  type: "ANOMALY" | "TREND" | "PATTERN" | "PREDICTION";
  productId: string;
  productName: string;
  description: string;
  confidence: number;
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendation: string;
  data: any;
};

// Advanced ML Engine using TensorFlow.js
export class MLEngine {
  private models: Map<string, tf.LayersModel> = new Map();
  private modelMetadata: Map<string, MLModel> = new Map();
  private products: Product[] = [];
  private sales: Sale[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const [products, sales] = await Promise.all([
        listProducts(),
        listSales(2000), // Get more data for better ML training
      ]);

      this.products = products;
      this.sales = sales;
      this.isInitialized = true;

      // Initialize models
      await this.initializeModels();
    } catch (error) {
      console.error("Error initializing ML engine:", error);
    }
  }

  private async initializeModels(): Promise<void> {
    // Demand Prediction Model
    const demandModel = this.createDemandModel();
    this.models.set("demand", demandModel);
    this.modelMetadata.set("demand", {
      name: "Demand Prediction",
      type: "DEMAND",
      accuracy: 0,
      lastTrained: new Date(),
      features: ["price", "season", "time", "stock", "trend"],
      isTrained: false,
    });

    // Price Optimization Model
    const priceModel = this.createPriceModel();
    this.models.set("price", priceModel);
    this.modelMetadata.set("price", {
      name: "Price Optimization",
      type: "PRICE",
      accuracy: 0,
      lastTrained: new Date(),
      features: ["demand", "competition", "season", "stock"],
      isTrained: false,
    });

    // Seasonal Pattern Model
    const seasonalModel = this.createSeasonalModel();
    this.models.set("seasonal", seasonalModel);
    this.modelMetadata.set("seasonal", {
      name: "Seasonal Patterns",
      type: "SEASONAL",
      accuracy: 0,
      lastTrained: new Date(),
      features: ["month", "day", "weather", "events"],
      isTrained: false,
    });
  }

  // Create demand prediction model
  private createDemandModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [5], // price, season, time, stock, trend
          units: 64,
          activation: "relu",
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: "relu",
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: "relu",
        }),
        tf.layers.dense({
          units: 1,
          activation: "linear", // For regression
        }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["meanAbsoluteError"],
    });

    return model;
  }

  // Create price optimization model
  private createPriceModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [4], // demand, competition, season, stock
          units: 32,
          activation: "relu",
          kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 16,
          activation: "relu",
        }),
        tf.layers.dense({
          units: 1,
          activation: "sigmoid", // Normalized price recommendation
        }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["meanAbsoluteError"],
    });

    return model;
  }

  // Create seasonal pattern model
  private createSeasonalModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [4], // month, day, weather, events
          units: 16,
          activation: "relu",
        }),
        tf.layers.dense({
          units: 8,
          activation: "relu",
        }),
        tf.layers.dense({
          units: 4, // 4 seasons
          activation: "softmax",
        }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    return model;
  }

  // Train all models
  async trainAllModels(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await Promise.all([
      this.trainDemandModel(),
      this.trainPriceModel(),
      this.trainSeasonalModel(),
    ]);
  }

  // Train demand prediction model
  private async trainDemandModel(): Promise<void> {
    const trainingData = this.prepareDemandTrainingData();
    if (trainingData.features.length < 10) {
      console.warn("Insufficient data for demand model training");
      return;
    }

    const model = this.models.get("demand")!;
    const features = tf.tensor2d(trainingData.features);
    const labels = tf.tensor2d(trainingData.labels.map((l) => [l]));

    try {
      const history = await model.fit(features, labels, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 20 === 0) {
              console.log(
                `Demand model epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}`
              );
            }
          },
        },
      });

      // Calculate accuracy
      const predictions = model.predict(features) as tf.Tensor;
      const actual = labels;
      const mae = tf.losses.meanAbsoluteError(actual, predictions);
      const accuracy =
        1 - (await mae.data())[0] / (await tf.mean(actual).data())[0];

      const metadata = this.modelMetadata.get("demand")!;
      metadata.accuracy = Math.max(0, Math.min(1, accuracy));
      metadata.isTrained = true;
      metadata.lastTrained = new Date();

      // Cleanup tensors
      features.dispose();
      labels.dispose();
      predictions.dispose();
      mae.dispose();
    } catch (error) {
      console.error("Error training demand model:", error);
    }
  }

  // Train price optimization model
  private async trainPriceModel(): Promise<void> {
    const trainingData = this.preparePriceTrainingData();
    if (trainingData.features.length < 10) {
      console.warn("Insufficient data for price model training");
      return;
    }

    const model = this.models.get("price")!;
    const features = tf.tensor2d(trainingData.features);
    const labels = tf.tensor2d(trainingData.labels.map((l) => [l]));

    try {
      const history = await model.fit(features, labels, {
        epochs: 80,
        batchSize: 16,
        validationSplit: 0.2,
        verbose: 0,
      });

      // Calculate accuracy
      const predictions = model.predict(features) as tf.Tensor;
      const actual = labels;
      const mae = tf.losses.meanAbsoluteError(actual, predictions);
      const accuracy =
        1 - (await mae.data())[0] / (await tf.mean(actual).data())[0];

      const metadata = this.modelMetadata.get("price")!;
      metadata.accuracy = Math.max(0, Math.min(1, accuracy));
      metadata.isTrained = true;
      metadata.lastTrained = new Date();

      // Cleanup tensors
      features.dispose();
      labels.dispose();
      predictions.dispose();
      mae.dispose();
    } catch (error) {
      console.error("Error training price model:", error);
    }
  }

  // Train seasonal pattern model
  private async trainSeasonalModel(): Promise<void> {
    const trainingData = this.prepareSeasonalTrainingData();
    if (trainingData.features.length < 10) {
      console.warn("Insufficient data for seasonal model training");
      return;
    }

    const model = this.models.get("seasonal")!;
    const features = tf.tensor2d(trainingData.features);
    const labels = tf.tensor2d(trainingData.labels);

    try {
      const history = await model.fit(features, labels, {
        epochs: 60,
        batchSize: 16,
        validationSplit: 0.2,
        verbose: 0,
      });

      // Calculate accuracy
      const predictions = model.predict(features) as tf.Tensor;
      const accuracy = await this.calculateClassificationAccuracy(
        labels,
        predictions
      );

      const metadata = this.modelMetadata.get("seasonal")!;
      metadata.accuracy = accuracy;
      metadata.isTrained = true;
      metadata.lastTrained = new Date();

      // Cleanup tensors
      features.dispose();
      labels.dispose();
      predictions.dispose();
    } catch (error) {
      console.error("Error training seasonal model:", error);
    }
  }

  // Prepare training data for demand prediction
  private prepareDemandTrainingData(): TrainingData {
    const features: number[][] = [];
    const labels: number[] = [];
    const productIds: string[] = [];
    const timestamps: number[] = [];

    // Group sales by product and time
    const productSales = new Map<string, Sale[]>();
    this.sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales.has(item.productId)) {
          productSales.set(item.productId, []);
        }
        productSales.get(item.productId)!.push(sale);
      });
    });

    productSales.forEach((sales, productId) => {
      const product = this.products.find((p) => p.id === productId);
      if (!product || sales.length < 3) return;

      // Sort sales by date
      sales.sort((a, b) => a.createdAt - b.createdAt);

      for (let i = 1; i < sales.length; i++) {
        const currentSale = sales[i];
        const previousSale = sales[i - 1];

        const daysDiff =
          (currentSale.createdAt - previousSale.createdAt) /
          (1000 * 60 * 60 * 24);
        if (daysDiff > 30) continue; // Skip if too much time between sales

        // Features: [price, season, time, stock, trend]
        const features_array = [
          currentSale.items.find((item) => item.productId === productId)
            ?.unitPrice || product.unitPrice,
          this.getSeasonalFactor(new Date(currentSale.createdAt)),
          this.getTimeFactor(new Date(currentSale.createdAt)),
          product.currentStock,
          this.calculateTrend(sales.slice(0, i), productId),
        ];

        // Label: quantity sold
        const label =
          currentSale.items.find((item) => item.productId === productId)
            ?.quantity || 0;

        features.push(features_array);
        labels.push(label);
        productIds.push(productId);
        timestamps.push(currentSale.createdAt);
      }
    });

    return { features, labels, productIds, timestamps };
  }

  // Prepare training data for price optimization
  private preparePriceTrainingData(): TrainingData {
    const features: number[][] = [];
    const labels: number[] = [];
    const productIds: string[] = [];
    const timestamps: number[] = [];

    this.sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const product = this.products.find((p) => p.id === item.productId);
        if (!product) return;

        // Features: [demand, competition, season, stock]
        const features_array = [
          item.quantity, // demand proxy
          this.getCompetitionFactor(product),
          this.getSeasonalFactor(new Date(sale.createdAt)),
          product.currentStock,
        ];

        // Label: normalized price (0-1)
        const normalizedPrice = item.unitPrice / (product.unitPrice * 2); // Assume max price is 2x base

        features.push(features_array);
        labels.push(Math.min(1, Math.max(0, normalizedPrice)));
        productIds.push(item.productId);
        timestamps.push(sale.createdAt);
      });
    });

    return { features, labels, productIds, timestamps };
  }

  // Prepare training data for seasonal patterns
  private prepareSeasonalTrainingData(): TrainingData {
    const features: number[][] = [];
    const labels: number[][] = [];
    const productIds: string[] = [];
    const timestamps: number[] = [];

    this.sales.forEach((sale) => {
      const date = new Date(sale.createdAt);
      const month = date.getMonth();
      const day = date.getDate();

      // Features: [month, day, weather, events]
      const features_array = [
        month / 11, // Normalize month (0-1)
        day / 30, // Normalize day (0-1)
        this.getWeatherFactor(date), // Simulated weather
        this.getEventFactor(date), // Simulated events
      ];

      // Label: one-hot encoded season
      const season = this.getSeasonFromMonth(month);
      const seasonLabel = [0, 0, 0, 0];
      seasonLabel[season] = 1;

      features.push(features_array);
      labels.push(seasonLabel);
      productIds.push("seasonal");
      timestamps.push(sale.createdAt);
    });

    return { features, labels, productIds, timestamps };
  }

  // Make demand prediction
  async predictDemand(
    productId: string,
    days: number = 7
  ): Promise<MLPrediction> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const model = this.models.get("demand");
    const metadata = this.modelMetadata.get("demand");

    if (!model || !metadata?.isTrained) {
      throw new Error("Demand model not trained");
    }

    const product = this.products.find((p) => p.id === productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Prepare features for prediction
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const features = tf.tensor2d([
      [
        product.unitPrice,
        this.getSeasonalFactor(futureDate),
        this.getTimeFactor(futureDate),
        product.currentStock,
        this.calculateTrend(this.sales, productId),
      ],
    ]);

    const prediction = model.predict(features) as tf.Tensor;
    const predictionValue = (await prediction.data())[0];
    const confidence = metadata.accuracy;

    // Cleanup
    features.dispose();
    prediction.dispose();

    return {
      productId,
      productName: product.name,
      prediction: Math.max(0, predictionValue),
      confidence,
      model: "demand",
      features: [
        product.unitPrice,
        this.getSeasonalFactor(futureDate),
        this.getTimeFactor(futureDate),
        product.currentStock,
        this.calculateTrend(this.sales, productId),
      ],
      timestamp: new Date(),
    };
  }

  // Make price optimization prediction
  async predictOptimalPrice(productId: string): Promise<MLPrediction> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const model = this.models.get("price");
    const metadata = this.modelMetadata.get("price");

    if (!model || !metadata?.isTrained) {
      throw new Error("Price model not trained");
    }

    const product = this.products.find((p) => p.id === productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Prepare features for prediction
    const features = tf.tensor2d([
      [
        this.calculateAverageDemand(productId),
        this.getCompetitionFactor(product),
        this.getSeasonalFactor(new Date()),
        product.currentStock,
      ],
    ]);

    const prediction = model.predict(features) as tf.Tensor;
    const normalizedPrice = (await prediction.data())[0];
    const optimalPrice = normalizedPrice * product.unitPrice * 2; // Denormalize
    const confidence = metadata.accuracy;

    // Cleanup
    features.dispose();
    prediction.dispose();

    return {
      productId,
      productName: product.name,
      prediction: optimalPrice,
      confidence,
      model: "price",
      features: [
        this.calculateAverageDemand(productId),
        this.getCompetitionFactor(product),
        this.getSeasonalFactor(new Date()),
        product.currentStock,
      ],
      timestamp: new Date(),
    };
  }

  // Generate ML insights
  async generateInsights(): Promise<MLInsight[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const insights: MLInsight[] = [];

    // Anomaly detection
    const anomalies = await this.detectAnomalies();
    insights.push(...anomalies);

    // Trend analysis
    const trends = await this.analyzeTrends();
    insights.push(...trends);

    // Pattern recognition
    const patterns = await this.recognizePatterns();
    insights.push(...patterns);

    // Future predictions
    const predictions = await this.generatePredictions();
    insights.push(...predictions);

    return insights.sort((a, b) => {
      const impactOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  // Detect anomalies in sales data
  private async detectAnomalies(): Promise<MLInsight[]> {
    const insights: MLInsight[] = [];

    // Group sales by product
    const productSales = new Map<string, number[]>();
    this.sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales.has(item.productId)) {
          productSales.set(item.productId, []);
        }
        productSales.get(item.productId)!.push(item.quantity);
      });
    });

    productSales.forEach((quantities, productId) => {
      if (quantities.length < 5) return;

      const product = this.products.find((p) => p.id === productId);
      if (!product) return;

      // Calculate statistics
      const mean =
        quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
      const variance =
        quantities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) /
        quantities.length;
      const stdDev = Math.sqrt(variance);

      // Detect outliers (3 standard deviations)
      quantities.forEach((quantity, index) => {
        const zScore = Math.abs(quantity - mean) / stdDev;
        if (zScore > 3) {
          insights.push({
            type: "ANOMALY",
            productId,
            productName: product.name,
            description: `Venta anómala detectada: ${quantity} unidades (promedio: ${mean.toFixed(
              1
            )})`,
            confidence: Math.min(0.95, zScore / 5),
            impact: zScore > 4 ? "HIGH" : "MEDIUM",
            recommendation:
              "Revisar esta venta para detectar errores o oportunidades",
            data: { quantity, mean, stdDev, zScore },
          });
        }
      });
    });

    return insights;
  }

  // Analyze trends
  private async analyzeTrends(): Promise<MLInsight[]> {
    const insights: MLInsight[] = [];

    // Group sales by product and time
    const productSales = new Map<string, Sale[]>();
    this.sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales.has(item.productId)) {
          productSales.set(item.productId, []);
        }
        productSales.get(item.productId)!.push(sale);
      });
    });

    productSales.forEach((sales, productId) => {
      if (sales.length < 10) return;

      const product = this.products.find((p) => p.id === productId);
      if (!product) return;

      // Sort by date
      sales.sort((a, b) => a.createdAt - b.createdAt);

      // Calculate trend (simple linear regression)
      const n = sales.length;
      const x = sales.map((_, i) => i);
      const y = sales.map(
        (sale) =>
          sale.items.find((item) => item.productId === productId)?.quantity || 0
      );

      const sumX = x.reduce((sum, val) => sum + val, 0);
      const sumY = y.reduce((sum, val) => sum + val, 0);
      const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
      const sumXX = x.reduce((sum, val) => sum + val * val, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const trendStrength = Math.abs(slope);

      if (trendStrength > 0.5) {
        const trend = slope > 0 ? "creciente" : "decreciente";
        const impact = trendStrength > 1 ? "HIGH" : "MEDIUM";

        insights.push({
          type: "TREND",
          productId,
          productName: product.name,
          description: `Tendencia ${trend} detectada en las ventas (pendiente: ${slope.toFixed(
            2
          )})`,
          confidence: Math.min(0.9, trendStrength / 2),
          impact,
          recommendation:
            slope > 0
              ? "Considerar aumentar el stock"
              : "Revisar estrategia de ventas",
          data: { slope, trendStrength, trend },
        });
      }
    });

    return insights;
  }

  // Recognize patterns
  private async recognizePatterns(): Promise<MLInsight[]> {
    const insights: MLInsight[] = [];

    // Analyze seasonal patterns
    const seasonalData = new Map<string, Map<number, number>>();

    this.sales.forEach((sale) => {
      const month = new Date(sale.createdAt).getMonth();
      sale.items.forEach((item) => {
        if (!seasonalData.has(item.productId)) {
          seasonalData.set(item.productId, new Map());
        }
        const productData = seasonalData.get(item.productId)!;
        productData.set(month, (productData.get(month) || 0) + item.quantity);
      });
    });

    seasonalData.forEach((monthlyData, productId) => {
      if (monthlyData.size < 6) return;

      const product = this.products.find((p) => p.id === productId);
      if (!product) return;

      // Calculate seasonal variation
      const values = Array.from(monthlyData.values());
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length;
      const coefficientOfVariation = Math.sqrt(variance) / mean;

      if (coefficientOfVariation > 0.3) {
        insights.push({
          type: "PATTERN",
          productId,
          productName: product.name,
          description: `Patrón estacional fuerte detectado (variación: ${(
            coefficientOfVariation * 100
          ).toFixed(1)}%)`,
          confidence: Math.min(0.85, coefficientOfVariation),
          impact: coefficientOfVariation > 0.5 ? "HIGH" : "MEDIUM",
          recommendation: "Ajustar inventario según patrones estacionales",
          data: {
            coefficientOfVariation,
            monthlyData: Object.fromEntries(monthlyData),
          },
        });
      }
    });

    return insights;
  }

  // Generate predictions
  private async generatePredictions(): Promise<MLInsight[]> {
    const insights: MLInsight[] = [];

    // Get top products by sales
    const productSales = new Map<string, number>();
    this.sales.forEach((sale) => {
      sale.items.forEach((item) => {
        productSales.set(
          item.productId,
          (productSales.get(item.productId) || 0) + item.quantity
        );
      });
    });

    const topProducts = Array.from(productSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    for (const [productId, _] of topProducts) {
      try {
        const demandPrediction = await this.predictDemand(productId, 7);
        const pricePrediction = await this.predictOptimalPrice(productId);

        insights.push({
          type: "PREDICTION",
          productId,
          productName: demandPrediction.productName,
          description: `Demanda predicha para 7 días: ${demandPrediction.prediction.toFixed(
            1
          )} unidades`,
          confidence: demandPrediction.confidence,
          impact: demandPrediction.prediction > 10 ? "HIGH" : "MEDIUM",
          recommendation: `Stock recomendado: ${Math.ceil(
            demandPrediction.prediction * 1.2
          )} unidades`,
          data: { demandPrediction, pricePrediction },
        });
      } catch (error) {
        console.warn(
          `Could not generate prediction for product ${productId}:`,
          error
        );
      }
    }

    return insights;
  }

  // Helper methods
  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth();
    // Simple seasonal factors (can be enhanced with real data)
    const factors = [
      0.8, 0.9, 1.1, 1.2, 1.3, 1.1, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2,
    ];
    return factors[month];
  }

  private getTimeFactor(date: Date): number {
    const hour = date.getHours();
    // Business hours factor
    if (hour >= 9 && hour <= 17) return 1.2;
    if (hour >= 18 && hour <= 21) return 1.0;
    return 0.6;
  }

  private getWeatherFactor(date: Date): number {
    // Simulated weather factor (0-1)
    return Math.random() * 0.4 + 0.6; // 0.6-1.0
  }

  private getEventFactor(date: Date): number {
    // Simulated event factor (0-1)
    return Math.random() * 0.3 + 0.7; // 0.7-1.0
  }

  private getSeasonFromMonth(month: number): number {
    if (month >= 2 && month <= 4) return 0; // Spring
    if (month >= 5 && month <= 7) return 1; // Summer
    if (month >= 8 && month <= 10) return 2; // Fall
    return 3; // Winter
  }

  private calculateTrend(sales: Sale[], productId: string): number {
    if (sales.length < 3) return 0;

    const productSales = sales
      .flatMap((sale) => sale.items)
      .filter((item) => item.productId === productId)
      .slice(-10); // Last 10 sales

    if (productSales.length < 3) return 0;

    const quantities = productSales.map((item) => item.quantity);
    const n = quantities.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = quantities.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * quantities[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private getCompetitionFactor(product: Product): number {
    // Simulated competition factor (0-1)
    return Math.random() * 0.5 + 0.5; // 0.5-1.0
  }

  private calculateAverageDemand(productId: string): number {
    const productSales = this.sales
      .flatMap((sale) => sale.items)
      .filter((item) => item.productId === productId);

    if (productSales.length === 0) return 0;

    return (
      productSales.reduce((sum, item) => sum + item.quantity, 0) /
      productSales.length
    );
  }

  private async calculateClassificationAccuracy(
    labels: tf.Tensor,
    predictions: tf.Tensor
  ): Promise<number> {
    const labelsData = await labels.data();
    const predictionsData = await predictions.data();

    let correct = 0;
    const total = labelsData.length / 4; // 4 classes

    for (let i = 0; i < total; i++) {
      const trueClass = labelsData
        .slice(i * 4, (i + 1) * 4)
        .indexOf(Math.max(...labelsData.slice(i * 4, (i + 1) * 4)));
      const predClass = predictionsData
        .slice(i * 4, (i + 1) * 4)
        .indexOf(Math.max(...predictionsData.slice(i * 4, (i + 1) * 4)));

      if (trueClass === predClass) correct++;
    }

    return correct / total;
  }

  // Get model information
  getModelInfo(): MLModel[] {
    return Array.from(this.modelMetadata.values());
  }

  // Get model performance
  async getModelPerformance(): Promise<{
    [modelName: string]: {
      accuracy: number;
      lastTrained: Date;
      isTrained: boolean;
    };
  }> {
    const performance: {
      [modelName: string]: {
        accuracy: number;
        lastTrained: Date;
        isTrained: boolean;
      };
    } = {};

    this.modelMetadata.forEach((metadata, name) => {
      performance[name] = {
        accuracy: metadata.accuracy,
        lastTrained: metadata.lastTrained,
        isTrained: metadata.isTrained,
      };
    });

    return performance;
  }

  // Cleanup resources
  dispose(): void {
    this.models.forEach((model) => model.dispose());
    this.models.clear();
    this.modelMetadata.clear();
  }
}

// Singleton instance
export const mlEngine = new MLEngine();
