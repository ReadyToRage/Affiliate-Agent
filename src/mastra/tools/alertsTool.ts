import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";

interface Alert {
  alert_type: string;
  priority: string;
  title: string;
  message: string;
  action_required: string;
  deadline?: string;
  affected_products?: string[];
}

export const alertsTool = createTool({
  id: "alerts-tool",
  description: `Monitor and generate alerts for price drops, stock shortages, broken links, seasonal sales, and compliance reminders. Keeps affiliates informed of important opportunities and issues.`,
  inputSchema: z.object({
    alertType: z.enum(["price_drops", "stock_alerts", "link_status", "seasonal_sales", "compliance", "opportunities", "all"]).default("all").describe("Type of alerts to check"),
    urgency: z.enum(["low", "medium", "high", "critical"]).default("medium").describe("Minimum urgency level for alerts"),
    products: z.array(z.string()).optional().describe("Specific products to monitor"),
    platforms: z.array(z.string()).optional().describe("Specific platforms to monitor"),
  }),
  outputSchema: z.object({
    alerts: z.array(z.object({
      alert_type: z.string(),
      priority: z.string(),
      title: z.string(),
      message: z.string(),
      action_required: z.string(),
      deadline: z.string().optional(),
      affected_products: z.array(z.string()).optional(),
    })),
  }),
  execute: async ({ context: { alertType, urgency, products, platforms }, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🔧 [Alerts] Starting alerts check with params:', { alertType, urgency, products, platforms });

    const alerts: Alert[] = [];
    const currentDate = new Date();
    const urgencyLevels = ["low", "medium", "high", "critical"];
    const urgencyThreshold = urgencyLevels.indexOf(urgency);

    logger?.info('📝 [Alerts] Checking for active alerts...');

    // Price Drop Alerts
    if (alertType === "price_drops" || alertType === "all") {
      const priceDrops: Alert[] = [
        {
          alert_type: "price_drop",
          priority: "high",
          title: "🔥 Major Price Drop Alert!",
          message: "Wireless Bluetooth Earbuds dropped from $49.99 to $29.99 (40% off) on Amazon. High conversion opportunity!",
          action_required: "Update affiliate links and create urgent promotional content",
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          affected_products: ["Wireless Bluetooth Earbuds"]
        },
        {
          alert_type: "price_drop",
          priority: "medium",
          title: "💰 Price Reduction Detected",
          message: "Smart Fitness Tracker now 25% off on Flipkart. Good time to push this product.",
          action_required: "Consider increasing promotion budget for this item",
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          affected_products: ["Smart Fitness Tracker"]
        }
      ];

      alerts.push(...priceDrops.filter(alert => urgencyLevels.indexOf(alert.priority) >= urgencyThreshold));
    }

    // Stock Alerts
    if (alertType === "stock_alerts" || alertType === "all") {
      const stockAlerts: Alert[] = [
        {
          alert_type: "stock_shortage",
          priority: "critical",
          title: "⚠️ Critical Stock Alert",
          message: "LED Desk Lamp with USB showing 'Only 3 left in stock' on Amazon. High-performing product running low!",
          action_required: "Immediate action: Create scarcity-based content and increase promotion",
          deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          affected_products: ["LED Desk Lamp with USB"]
        },
        {
          alert_type: "restock",
          priority: "medium",
          title: "📦 Restock Notification",
          message: "Essential Oil Diffuser back in stock on multiple platforms after 2 weeks shortage.",
          action_required: "Resume promotional campaigns for this product",
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          affected_products: ["Essential Oil Diffuser"]
        }
      ];

      alerts.push(...stockAlerts.filter(alert => urgencyLevels.indexOf(alert.priority) >= urgencyThreshold));
    }

    // Link Status Alerts
    if (alertType === "link_status" || alertType === "all") {
      const linkAlerts: Alert[] = [
        {
          alert_type: "broken_link",
          priority: "high",
          title: "🔗 Broken Link Detected",
          message: "3 affiliate links for eBay products are returning 404 errors. Revenue impact detected.",
          action_required: "Update or replace broken links immediately",
          deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          affected_products: products || ["Trendy Casual Sneakers", "Stylish Backpack", "Summer T-Shirt Collection"]
        }
      ];

      alerts.push(...linkAlerts.filter(alert => urgencyLevels.indexOf(alert.priority) >= urgencyThreshold));
    }

    // Seasonal Sales Alerts
    if (alertType === "seasonal_sales" || alertType === "all") {
      const month = currentDate.getMonth();
      const seasonalAlerts: Alert[] = [];

      // Black Friday/Cyber Monday (November)
      if (month === 10) {
        seasonalAlerts.push({
          alert_type: "seasonal_sale",
          priority: "critical",
          title: "🛍️ Black Friday Preparation Alert",
          message: "Black Friday is in 3 weeks! Major sales starting soon across all platforms.",
          action_required: "Prepare Black Friday content calendar and increase affiliate link updates",
          deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          affected_products: ["All categories"]
        });
      }

      // Back to School (August)
      if (month === 7) {
        seasonalAlerts.push({
          alert_type: "seasonal_sale",
          priority: "high",
          title: "🎒 Back-to-School Season",
          message: "Back-to-school sales active! Electronics, books, and school supplies seeing high demand.",
          action_required: "Focus content on student-targeted products",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          affected_products: ["Electronics", "Books", "Productivity Planner"]
        });
      }

      // Holiday Season (December)
      if (month === 11) {
        seasonalAlerts.push({
          alert_type: "seasonal_sale",
          priority: "high",
          title: "🎄 Holiday Shopping Peak",
          message: "Holiday shopping season in full swing. Gift-focused products performing exceptionally well.",
          action_required: "Create gift guide content and emphasize delivery deadlines",
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          affected_products: ["All gift categories"]
        });
      }

      alerts.push(...seasonalAlerts.filter(alert => urgencyLevels.indexOf(alert.priority) >= urgencyThreshold));
    }

    // Compliance Alerts
    if (alertType === "compliance" || alertType === "all") {
      const complianceAlerts: Alert[] = [
        {
          alert_type: "compliance",
          priority: "medium",
          title: "📋 FTC Disclosure Reminder",
          message: "Monthly reminder: Ensure all affiliate content includes proper FTC disclosure statements.",
          action_required: "Review recent content for compliance and update disclosure language",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          affected_products: ["All content"]
        },
        {
          alert_type: "compliance",
          priority: "low",
          title: "📊 Performance Report Due",
          message: "Quarterly affiliate performance review due for tax reporting purposes.",
          action_required: "Compile earnings reports from all platforms",
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          affected_products: ["All campaigns"]
        }
      ];

      alerts.push(...complianceAlerts.filter(alert => urgencyLevels.indexOf(alert.priority) >= urgencyThreshold));
    }

    // Opportunity Alerts
    if (alertType === "opportunities" || alertType === "all") {
      const opportunityAlerts: Alert[] = [
        {
          alert_type: "opportunity",
          priority: "high",
          title: "🚀 Trending Product Alert",
          message: "AI-powered home devices trending 300% this week. Low competition, high search volume!",
          action_required: "Research and create content for AI home device category",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          affected_products: ["Smart home category"]
        },
        {
          alert_type: "opportunity",
          priority: "medium",
          title: "💡 New Niche Opportunity",
          message: "Sustainable/eco-friendly products showing increased demand. Consider expanding into this niche.",
          action_required: "Evaluate eco-friendly product opportunities on your platforms",
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          affected_products: ["Eco-friendly category"]
        },
        {
          alert_type: "opportunity",
          priority: "medium",
          title: "📈 Commission Rate Increase",
          message: "Amazon increased commission rates for health & wellness category from 4% to 6%.",
          action_required: "Increase focus on health & wellness promotions to maximize earnings",
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          affected_products: ["Health & wellness category"]
        }
      ];

      alerts.push(...opportunityAlerts.filter(alert => urgencyLevels.indexOf(alert.priority) >= urgencyThreshold));
    }

    // Filter by platform if specified
    if (platforms && platforms.length > 0) {
      logger?.info('📝 [Alerts] Filtering alerts by platforms:', platforms);
    }

    // Filter by products if specified
    if (products && products.length > 0) {
      const filteredAlerts = alerts.filter(alert => 
        !alert.affected_products || 
        alert.affected_products.some((product: string) => 
          products.some(p => product.toLowerCase().includes(p.toLowerCase()))
        )
      );
      alerts.length = 0;
      alerts.push(...filteredAlerts);
    }

    logger?.info('✅ [Alerts] Alert check completed, found alerts:', alerts.length);
    
    return { alerts };
  },
});