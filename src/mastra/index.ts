import { Mastra } from "@mastra/core";
import { MastraError } from "@mastra/core/error";
import { PinoLogger } from "@mastra/loggers";
import { LogLevel, MastraLogger } from "@mastra/core/logger";
import pino from "pino";
import { MCPServer } from "@mastra/mcp";
import { NonRetriableError } from "inngest";
import { z } from "zod";

import { sharedPostgresStorage } from "./storage";
import { inngest, inngestServe } from "./inngest";
import { affiliateOSAgent } from "./agents/affiliateOSAgent";
import { productDiscoveryTool } from "./tools/productDiscoveryTool";
import { contentGenerationTool } from "./tools/contentGenerationTool";
import { linkManagementTool } from "./tools/linkManagementTool";
import { analyticsSimulationTool } from "./tools/analyticsSimulationTool";
import { alertsTool } from "./tools/alertsTool";
import { telegramChatbotWorkflow } from "./workflows/telegramChatbotWorkflow";
import { registerTelegramTrigger, TriggerInfoTelegramOnNewMessage } from "../triggers/telegramTriggers";

class ProductionPinoLogger extends MastraLogger {
  protected logger: pino.Logger;

  constructor(
    options: {
      name?: string;
      level?: LogLevel;
    } = {},
  ) {
    super(options);

    this.logger = pino({
      name: options.name || "app",
      level: options.level || LogLevel.INFO,
      base: {},
      formatters: {
        level: (label: string, _number: number) => ({
          level: label,
        }),
      },
      timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
    });
  }

  debug(message: string, args: Record<string, any> = {}): void {
    this.logger.debug(args, message);
  }

  info(message: string, args: Record<string, any> = {}): void {
    this.logger.info(args, message);
  }

  warn(message: string, args: Record<string, any> = {}): void {
    this.logger.warn(args, message);
  }

  error(message: string, args: Record<string, any> = {}): void {
    this.logger.error(args, message);
  }
}

export const mastra = new Mastra({
  storage: sharedPostgresStorage,
  agents: { 
    affiliateOSAgent 
  },
  workflows: { 
    telegramChatbotWorkflow 
  },
  mcpServers: {
    allTools: new MCPServer({
      name: "allTools",
      version: "1.0.0",
      tools: {
        productDiscoveryTool,
        contentGenerationTool,
        linkManagementTool,
        analyticsSimulationTool,
        alertsTool,
      },
    }),
  },
  bundler: {
    // A few dependencies are not properly picked up by
    // the bundler if they are not added directly to the
    // entrypoint.
    externals: [
      "@slack/web-api",
      "inngest",
      "inngest/hono",
      "hono",
      "hono/streaming",
    ],
    // sourcemaps are good for debugging.
    sourcemap: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    middleware: [
      async (c, next) => {
        const mastra = c.get("mastra");
        const logger = mastra?.getLogger();
        logger?.debug("[Request]", { method: c.req.method, url: c.req.url });
        try {
          await next();
        } catch (error) {
          logger?.error("[Response]", {
            method: c.req.method,
            url: c.req.url,
            error,
          });
          if (error instanceof MastraError) {
            if (error.id === "AGENT_MEMORY_MISSING_RESOURCE_ID") {
              // This is typically a non-retirable error. It means that the request was not
              // setup correctly to pass in the necessary parameters.
              throw new NonRetriableError(error.message, { cause: error });
            }
          } else if (error instanceof z.ZodError) {
            // Validation errors are never retriable.
            throw new NonRetriableError(error.message, { cause: error });
          }

          throw error;
        }
      },
    ],
    apiRoutes: [
      // This API route is used to register the Mastra workflow (inngest function) on the inngest server
      {
        path: "/api/inngest",
        method: "ALL",
        createHandler: async ({ mastra }) => inngestServe({ mastra, inngest }),
        // The inngestServe function integrates Mastra workflows with Inngest by:
        // 1. Creating Inngest functions for each workflow with unique IDs (workflow.${workflowId})
        // 2. Setting up event handlers that:
        //    - Generate unique run IDs for each workflow execution
        //    - Create an InngestExecutionEngine to manage step execution
        //    - Handle workflow state persistence and real-time updates
        // 3. Establishing a publish-subscribe system for real-time monitoring
        //    through the workflow:${workflowId}:${runId} channel
      },
      // Telegram trigger registration for AffiliateOS bot
      ...registerTelegramTrigger({
        triggerType: "telegram/message",
        handler: async (mastra: Mastra, triggerInfo: TriggerInfoTelegramOnNewMessage) => {
          const logger = mastra.getLogger();
          logger?.info("📱 [Telegram Trigger] Message received", { triggerInfo });

          // React to all messages that are going to be replied to
          const chatId = triggerInfo.payload?.message?.chat?.id;
          const messageId = triggerInfo.payload?.message?.message_id;
          
          if (chatId && messageId) {
            try {
              // React with hourglass emoji to show processing
              await fetch(
                `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendChatAction`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    action: "typing",
                  }),
                }
              );
            } catch (error) {
              logger?.error("📱 [Telegram Trigger] Error setting typing action", { error });
            }
          }

          // Call the Telegram chatbot workflow
          const run = await mastra.getWorkflow("telegramChatbotWorkflow").createRunAsync();
          return await run.start({
            inputData: {
              message: triggerInfo.params.message || "",
              threadId: `telegram/${chatId}`,
              chatId: chatId?.toString() || "",
              messageId: messageId?.toString() || "",
            }
          });
        },
      }),
      // Custom API route for AffiliateOS agent using legacy generate handler
      {
        path: "/api/agents/affiliateOSAgent/generate",
        method: "POST",
        handler: async (c) => {
          const mastra = c.get("mastra");
          const logger = mastra?.getLogger();
          
          try {
            const body = await c.req.json();
            logger?.info('📝 [AffiliateOS Agent] Generate request received', { 
              method: c.req.method, 
              path: c.req.path,
              hasMessages: !!body.messages,
              messagesCount: body.messages?.length || 0,
              hasResourceId: !!body.resourceId,
              hasThreadId: !!body.threadId
            });

            // Use legacy generate handler to avoid deprecation issues
            const response = await affiliateOSAgent.generateLegacy(
              body.messages || [],
              {
                resourceId: body.resourceId || "bot",
                threadId: body.threadId || `telegram/default-${Date.now()}`,
                maxSteps: body.maxSteps || 5,
                ...body.options
              }
            );

            logger?.info('✅ [AffiliateOS Agent] Generate response completed', {
              hasText: !!response.text,
              textLength: response.text?.length || 0
            });

            return c.json({ text: response.text });
          } catch (error) {
            logger?.error('❌ [AffiliateOS Agent] Generate error', { error });
            return c.json({ error: "Failed to generate response" }, 500);
          }
        },
      },
    ],
  },
  logger:
    process.env.NODE_ENV === "production"
      ? new ProductionPinoLogger({
          name: "Mastra",
          level: "info",
        })
      : new PinoLogger({
          name: "Mastra",
          level: "info",
        }),
});

/*  Sanity check 1: Throw an error if there are more than 1 workflows.  */
// !!!!!! Do not remove this check. !!!!!!
if (Object.keys(mastra.getWorkflows()).length > 1) {
  throw new Error(
    "More than 1 workflows found. Currently, more than 1 workflows are not supported in the UI, since doing so will cause app state to be inconsistent.",
  );
}

/*  Sanity check 2: Throw an error if there are more than 1 agents.  */
// !!!!!! Do not remove this check. !!!!!!
if (Object.keys(mastra.getAgents()).length > 1) {
  throw new Error(
    "More than 1 agents found. Currently, more than 1 agents are not supported in the UI, since doing so will cause app state to be inconsistent.",
  );
}
