import { Product } from "@/types/product";
import { Sale, Customer } from "@/types/sales";
import { listProducts } from "@/lib/products";
import { listSales } from "@/lib/sales";
import { listCustomers } from "@/lib/customers";

// Types for automation rules
export type AutomationRule = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  trigger: RuleTrigger;
  metadata: {
    created: number;
    lastExecuted?: number;
    executionCount: number;
    successRate: number;
  };
};

export type RuleCondition = {
  field: string;
  operator:
    | "EQUALS"
    | "NOT_EQUALS"
    | "GREATER_THAN"
    | "LESS_THAN"
    | "CONTAINS"
    | "IN"
    | "NOT_IN";
  value: any;
  logicalOperator?: "AND" | "OR";
};

export type RuleAction = {
  type:
    | "SEND_EMAIL"
    | "SEND_NOTIFICATION"
    | "UPDATE_STOCK"
    | "CREATE_ALERT"
    | "APPLY_DISCOUNT"
    | "CREATE_TASK"
    | "WEBHOOK";
  parameters: { [key: string]: any };
  delay?: number; // Delay in minutes
};

export type RuleTrigger = {
  event:
    | "SALE_CREATED"
    | "SALE_UPDATED"
    | "STOCK_LOW"
    | "STOCK_HIGH"
    | "CUSTOMER_CREATED"
    | "PRODUCT_CREATED"
    | "SCHEDULED";
  schedule?: string; // Cron expression for scheduled rules
};

export type AutomationExecution = {
  id: string;
  ruleId: string;
  ruleName: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  executedAt: number;
  context: any;
  results: any[];
  error?: string;
};

export type AutomationDashboard = {
  totalRules: number;
  activeRules: number;
  executionsToday: number;
  successRate: number;
  recentExecutions: AutomationExecution[];
  topRules: Array<{
    ruleId: string;
    ruleName: string;
    executionCount: number;
    successRate: number;
  }>;
};

// Automation rules engine
export class AutomationRulesEngine {
  private rules: AutomationRule[] = [];
  private executions: AutomationExecution[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeDefaultRules();
  }

  // Initialize with default rules
  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: "low-stock-alert",
        name: "Alerta de Stock Bajo",
        description:
          "Envía alerta cuando el stock de un producto está por debajo del mínimo",
        enabled: true,
        priority: 1,
        conditions: [
          {
            field: "stockAvailable",
            operator: "LESS_THAN",
            value: "minStock",
          },
        ],
        actions: [
          {
            type: "CREATE_ALERT",
            parameters: {
              title: "Stock Bajo",
              message:
                "El producto {productName} tiene stock bajo: {stockAvailable} unidades",
              severity: "HIGH",
            },
          },
          {
            type: "SEND_NOTIFICATION",
            parameters: {
              title: "Alerta de Inventario",
              message: "Stock bajo en {productName}",
              recipients: ["admin", "inventory_manager"],
            },
          },
        ],
        trigger: {
          event: "STOCK_LOW",
        },
        metadata: {
          created: Date.now(),
          executionCount: 0,
          successRate: 0,
        },
      },
      {
        id: "high-value-customer",
        name: "Cliente de Alto Valor",
        description:
          "Identifica y marca clientes de alto valor automáticamente",
        enabled: true,
        priority: 2,
        conditions: [
          {
            field: "totalPurchases",
            operator: "GREATER_THAN",
            value: 5,
            logicalOperator: "AND",
          },
          {
            field: "averageOrderValue",
            operator: "GREATER_THAN",
            value: 100,
          },
        ],
        actions: [
          {
            type: "SEND_NOTIFICATION",
            parameters: {
              title: "Cliente VIP Identificado",
              message:
                "{customerName} ha sido identificado como cliente de alto valor",
              recipients: ["sales_manager"],
            },
          },
        ],
        trigger: {
          event: "SALE_CREATED",
        },
        metadata: {
          created: Date.now(),
          executionCount: 0,
          successRate: 0,
        },
      },
      {
        id: "overstock-management",
        name: "Gestión de Exceso de Stock",
        description:
          "Aplica descuentos automáticos para productos con exceso de stock",
        enabled: true,
        priority: 3,
        conditions: [
          {
            field: "stockAvailable",
            operator: "GREATER_THAN",
            value: 100,
          },
          {
            field: "daysSinceLastSale",
            operator: "GREATER_THAN",
            value: 30,
            logicalOperator: "AND",
          },
        ],
        actions: [
          {
            type: "APPLY_DISCOUNT",
            parameters: {
              discountType: "PERCENTAGE",
              discountValue: 15,
              reason: "Exceso de inventario",
            },
          },
          {
            type: "CREATE_TASK",
            parameters: {
              title: "Revisar exceso de stock",
              description: "El producto {productName} tiene exceso de stock",
              assignee: "inventory_manager",
              priority: "MEDIUM",
            },
          },
        ],
        trigger: {
          event: "SCHEDULED",
          schedule: "0 9 * * 1", // Every Monday at 9 AM
        },
        metadata: {
          created: Date.now(),
          executionCount: 0,
          successRate: 0,
        },
      },
      {
        id: "new-customer-welcome",
        name: "Bienvenida a Nuevos Clientes",
        description: "Envía mensaje de bienvenida a nuevos clientes",
        enabled: true,
        priority: 4,
        conditions: [
          {
            field: "totalPurchases",
            operator: "EQUALS",
            value: 1,
          },
        ],
        actions: [
          {
            type: "SEND_EMAIL",
            parameters: {
              template: "welcome",
              subject: "¡Bienvenido a nuestra tienda!",
              to: "{customerEmail}",
            },
          },
        ],
        trigger: {
          event: "SALE_CREATED",
        },
        metadata: {
          created: Date.now(),
          executionCount: 0,
          successRate: 0,
        },
      },
      {
        id: "inactive-customer-reactivation",
        name: "Reactivación de Clientes Inactivos",
        description: "Identifica clientes inactivos y envía ofertas especiales",
        enabled: true,
        priority: 5,
        conditions: [
          {
            field: "daysSinceLastPurchase",
            operator: "GREATER_THAN",
            value: 90,
          },
          {
            field: "totalPurchases",
            operator: "GREATER_THAN",
            value: 2,
            logicalOperator: "AND",
          },
        ],
        actions: [
          {
            type: "SEND_EMAIL",
            parameters: {
              template: "reactivation",
              subject: "¡Te extrañamos! Oferta especial para ti",
              to: "{customerEmail}",
            },
          },
        ],
        trigger: {
          event: "SCHEDULED",
          schedule: "0 10 * * 1", // Every Monday at 10 AM
        },
        metadata: {
          created: Date.now(),
          executionCount: 0,
          successRate: 0,
        },
      },
    ];
  }

  // Execute rules based on trigger event
  async executeRules(
    trigger: RuleTrigger,
    context: any
  ): Promise<AutomationExecution[]> {
    const applicableRules = this.rules.filter(
      (rule) =>
        rule.enabled &&
        rule.trigger.event === trigger.event &&
        this.evaluateConditions(rule.conditions, context)
    );

    const executions: AutomationExecution[] = [];

    for (const rule of applicableRules) {
      const execution = await this.executeRule(rule, context);
      executions.push(execution);
    }

    return executions;
  }

  // Execute a specific rule
  private async executeRule(
    rule: AutomationRule,
    context: any
  ): Promise<AutomationExecution> {
    const execution: AutomationExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      status: "PENDING",
      executedAt: Date.now(),
      context,
      results: [],
    };

    try {
      // Execute actions with delays
      for (const action of rule.actions) {
        if (action.delay) {
          await this.delay(action.delay * 60 * 1000); // Convert minutes to milliseconds
        }

        const result = await this.executeAction(action, context);
        execution.results.push(result);
      }

      execution.status = "SUCCESS";
      rule.metadata.executionCount++;
      rule.metadata.lastExecuted = Date.now();

      // Update success rate
      const totalExecutions = rule.metadata.executionCount;
      const successfulExecutions = this.executions.filter(
        (e) => e.ruleId === rule.id && e.status === "SUCCESS"
      ).length;
      rule.metadata.successRate = successfulExecutions / totalExecutions;
    } catch (error) {
      execution.status = "FAILED";
      execution.error = error instanceof Error ? error.message : String(error);
      rule.metadata.executionCount++;
    }

    this.executions.push(execution);
    return execution;
  }

  // Evaluate rule conditions
  private evaluateConditions(
    conditions: RuleCondition[],
    context: any
  ): boolean {
    if (conditions.length === 0) return true;

    let result = this.evaluateCondition(conditions[0], context);

    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, context);

      if (condition.logicalOperator === "OR") {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }
    }

    return result;
  }

  // Evaluate a single condition
  private evaluateCondition(condition: RuleCondition, context: any): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    const expectedValue = this.resolveValue(condition.value, context);

    switch (condition.operator) {
      case "EQUALS":
        return fieldValue === expectedValue;
      case "NOT_EQUALS":
        return fieldValue !== expectedValue;
      case "GREATER_THAN":
        return Number(fieldValue) > Number(expectedValue);
      case "LESS_THAN":
        return Number(fieldValue) < Number(expectedValue);
      case "CONTAINS":
        return String(fieldValue)
          .toLowerCase()
          .includes(String(expectedValue).toLowerCase());
      case "IN":
        return (
          Array.isArray(expectedValue) && expectedValue.includes(fieldValue)
        );
      case "NOT_IN":
        return (
          Array.isArray(expectedValue) && !expectedValue.includes(fieldValue)
        );
      default:
        return false;
    }
  }

  // Get field value from context
  private getFieldValue(field: string, context: any): any {
    const fieldParts = field.split(".");
    let value = context;

    for (const part of fieldParts) {
      if (value && typeof value === "object") {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  // Resolve dynamic values
  private resolveValue(value: any, context: any): any {
    if (
      typeof value === "string" &&
      value.startsWith("{") &&
      value.endsWith("}")
    ) {
      const fieldName = value.slice(1, -1);
      return this.getFieldValue(fieldName, context);
    }
    return value;
  }

  // Execute a rule action
  private async executeAction(action: RuleAction, context: any): Promise<any> {
    const resolvedParams = this.resolveParameters(action.parameters, context);

    switch (action.type) {
      case "SEND_EMAIL":
        return await this.sendEmail(resolvedParams);
      case "SEND_NOTIFICATION":
        return await this.sendNotification(resolvedParams);
      case "UPDATE_STOCK":
        return await this.updateStock(resolvedParams);
      case "CREATE_ALERT":
        return await this.createAlert(resolvedParams);
      case "APPLY_DISCOUNT":
        return await this.applyDiscount(resolvedParams);
      case "CREATE_TASK":
        return await this.createTask(resolvedParams);
      case "WEBHOOK":
        return await this.callWebhook(resolvedParams);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Resolve parameters with context variables
  private resolveParameters(
    parameters: { [key: string]: any },
    context: any
  ): { [key: string]: any } {
    const resolved: { [key: string]: any } = {};

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === "string") {
        resolved[key] = this.interpolateString(value, context);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  // Interpolate string with context variables
  private interpolateString(template: string, context: any): string {
    return template.replace(/\{(\w+(?:\.\w+)*)\}/g, (match, fieldName) => {
      const value = this.getFieldValue(fieldName, context);
      return value !== undefined ? String(value) : match;
    });
  }

  // Action implementations
  private async sendEmail(params: any): Promise<any> {
    // In a real implementation, this would integrate with an email service
    console.log("Sending email:", params);
    return { success: true, messageId: `email-${Date.now()}` };
  }

  private async sendNotification(params: any): Promise<any> {
    // In a real implementation, this would integrate with a notification service
    console.log("Sending notification:", params);
    return { success: true, notificationId: `notif-${Date.now()}` };
  }

  private async updateStock(params: any): Promise<any> {
    // In a real implementation, this would update the database
    console.log("Updating stock:", params);
    return { success: true, updated: true };
  }

  private async createAlert(params: any): Promise<any> {
    // In a real implementation, this would create an alert in the system
    console.log("Creating alert:", params);
    return { success: true, alertId: `alert-${Date.now()}` };
  }

  private async applyDiscount(params: any): Promise<any> {
    // In a real implementation, this would apply a discount to products
    console.log("Applying discount:", params);
    return { success: true, discountId: `discount-${Date.now()}` };
  }

  private async createTask(params: any): Promise<any> {
    // In a real implementation, this would create a task in a task management system
    console.log("Creating task:", params);
    return { success: true, taskId: `task-${Date.now()}` };
  }

  private async callWebhook(params: any): Promise<any> {
    // In a real implementation, this would make an HTTP request to the webhook URL
    console.log("Calling webhook:", params);
    return { success: true, response: "OK" };
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Rule management
  addRule(rule: AutomationRule): void {
    this.rules.push(rule);
  }

  updateRule(ruleId: string, updates: Partial<AutomationRule>): boolean {
    const ruleIndex = this.rules.findIndex((rule) => rule.id === ruleId);
    if (ruleIndex === -1) return false;

    this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates };
    return true;
  }

  deleteRule(ruleId: string): boolean {
    const ruleIndex = this.rules.findIndex((rule) => rule.id === ruleId);
    if (ruleIndex === -1) return false;

    this.rules.splice(ruleIndex, 1);
    return true;
  }

  getRule(ruleId: string): AutomationRule | undefined {
    return this.rules.find((rule) => rule.id === ruleId);
  }

  getAllRules(): AutomationRule[] {
    return [...this.rules];
  }

  // Dashboard data
  getDashboard(): AutomationDashboard {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const executionsToday = this.executions.filter(
      (execution) => execution.executedAt >= today.getTime()
    ).length;

    const successfulExecutions = this.executions.filter(
      (execution) => execution.status === "SUCCESS"
    ).length;

    const successRate =
      this.executions.length > 0
        ? successfulExecutions / this.executions.length
        : 0;

    const recentExecutions = this.executions
      .sort((a, b) => b.executedAt - a.executedAt)
      .slice(0, 10);

    const topRules = this.rules
      .map((rule) => ({
        ruleId: rule.id,
        ruleName: rule.name,
        executionCount: rule.metadata.executionCount,
        successRate: rule.metadata.successRate,
      }))
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 5);

    return {
      totalRules: this.rules.length,
      activeRules: this.rules.filter((rule) => rule.enabled).length,
      executionsToday,
      successRate,
      recentExecutions,
      topRules,
    };
  }

  // Get execution history
  getExecutions(limit: number = 50): AutomationExecution[] {
    return this.executions
      .sort((a, b) => b.executedAt - a.executedAt)
      .slice(0, limit);
  }
}

// Singleton instance
export const automationRulesEngine = new AutomationRulesEngine();
