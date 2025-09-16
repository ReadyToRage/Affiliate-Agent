import { createWorkflow, createStep } from "../inngest";
import { z } from "zod";
import { affiliateOSAgent } from "../agents/affiliateOSAgent";

// Step 1: Use Agent - ONLY call agent.generate(), NO other logic
const useAgentStep = createStep({
  id: "use-agent",
  description: "Process user message through AffiliateOS agent",
  inputSchema: z.object({
    message: z.string().describe("User message from Telegram"),
    threadId: z.string().describe("Thread ID for conversation continuity"),
  }),
  outputSchema: z.object({
    response: z.string().describe("Agent response text"),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🤖 [Telegram Workflow - Step 1] Processing user message through agent");
    
    // ONLY call the agent - NO other tools or logic
    const { text } = await affiliateOSAgent.generate([
      { role: "user", content: inputData.message }
    ], {
      resourceId: "bot",
      threadId: inputData.threadId,
      maxSteps: 5, // Allow multi-step tool usage
    });

    logger?.info("✅ [Telegram Workflow - Step 1] Agent response generated", { 
      responseLength: text.length 
    });

    return { response: text };
  }
});

// Step 2: Send Reply - ONLY send message to Telegram, NO other logic
const sendReplyStep = createStep({
  id: "send-reply",
  description: "Send agent response back to Telegram",
  inputSchema: z.object({
    response: z.string().describe("Agent response to send"),
    chatId: z.string().describe("Telegram chat ID"),
    messageId: z.string().optional().describe("Original message ID for replies"),
  }),
  outputSchema: z.object({
    sent: z.boolean().describe("Whether message was sent successfully"),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📱 [Telegram Workflow - Step 2] Sending response to Telegram");

    try {
      // Send message via Telegram HTTP API
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: inputData.chatId,
            text: inputData.response,
            reply_to_message_id: inputData.messageId ? parseInt(inputData.messageId) : undefined,
            parse_mode: "Markdown",
          }),
        }
      );

      if (!telegramResponse.ok) {
        const error = await telegramResponse.text();
        logger?.error("❌ [Telegram Workflow - Step 2] Failed to send message", { error });
        return { sent: false };
      }

      logger?.info("✅ [Telegram Workflow - Step 2] Message sent successfully");
      return { sent: true };

    } catch (error) {
      logger?.error("❌ [Telegram Workflow - Step 2] Error sending message", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return { sent: false };
    }
  }
});

// Create the workflow with exactly 2 steps
export const telegramChatbotWorkflow = createWorkflow({
  id: "telegram-chatbot-workflow",
  description: "AffiliateOS Telegram chatbot workflow with agent processing and message sending",
  inputSchema: z.object({
    message: z.string().describe("User message from Telegram"),
    threadId: z.string().describe("Thread ID for conversation continuity"),
    chatId: z.string().describe("Telegram chat ID"),
    messageId: z.string().optional().describe("Original message ID for replies"),
  }),
  outputSchema: z.object({
    sent: z.boolean().describe("Whether response was sent successfully"),
  })
})
  .then(useAgentStep)
  .then(sendReplyStep)
  .commit();