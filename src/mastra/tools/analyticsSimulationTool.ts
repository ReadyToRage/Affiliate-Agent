import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";

export const analyticsSimulationTool = createTool({
  id: "analytics-simulation-tool",
  description: `Simulate and track affiliate marketing analytics including clicks, conversions, ROI, and provide predictive insights. Shows performance metrics and benchmarks.`,
  inputSchema: z.object({
    timeframe: z.enum(["daily", "weekly", "monthly", "yearly"]).default("weekly").describe("Time period for analytics"),
    campaignName: z.string().optional().describe("Specific campaign to analyze"),
    platform: z.string().optional().describe("Platform to focus analytics on"),
    metricType: z.enum(["overview", "detailed", "predictive", "comparison"]).default("overview").describe("Type of analytics report"),
  }),
  outputSchema: z.object({
    analytics: z.array(z.object({
      metric_name: z.string(),
      current_value: z.string(),
      previous_value: z.string().optional(),
      trend: z.string(),
      benchmark: z.string().optional(),
      insights: z.string(),
    })),
  }),
  execute: async ({ context: { timeframe, campaignName, platform, metricType }, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🔧 [AnalyticsSimulation] Starting analytics generation with params:', { timeframe, campaignName, platform, metricType });

    logger?.info('📝 [AnalyticsSimulation] Generating performance metrics...');

    const analytics = [];

    // Base metrics that vary by timeframe
    const multipliers = {
      daily: { clicks: 50, conversions: 2, revenue: 25 },
      weekly: { clicks: 350, conversions: 14, revenue: 175 },
      monthly: { clicks: 1500, conversions: 60, revenue: 750 },
      yearly: { clicks: 18000, conversions: 720, revenue: 9000 }
    };

    const baseMetrics = multipliers[timeframe];
    
    // Add some realistic variance
    const variance = () => 0.8 + Math.random() * 0.4; // 80-120% variance
    
    const clicks = Math.round(baseMetrics.clicks * variance());
    const conversions = Math.round(baseMetrics.conversions * variance());
    const revenue = Math.round(baseMetrics.revenue * variance());
    const conversionRate = ((conversions / clicks) * 100).toFixed(2);
    const avgOrderValue = (revenue / conversions).toFixed(2);
    const roi = (((revenue - (revenue * 0.3)) / (revenue * 0.3)) * 100).toFixed(1);

    if (metricType === "overview" || metricType === "detailed") {
      analytics.push(
        {
          metric_name: "Total Clicks",
          current_value: clicks.toString(),
          previous_value: Math.round(clicks * 0.85).toString(),
          trend: "↗️ +15% increase",
          benchmark: "Industry average: 200-400 clicks/week",
          insights: `Your click-through rate is performing ${clicks > baseMetrics.clicks ? 'above' : 'at'} expected levels for ${timeframe} campaigns.`
        },
        {
          metric_name: "Conversions",
          current_value: conversions.toString(),
          previous_value: Math.round(conversions * 0.9).toString(),
          trend: "↗️ +10% increase",
          benchmark: "Industry average: 2-4% conversion rate",
          insights: `Conversion rate of ${conversionRate}% shows ${parseFloat(conversionRate) > 3 ? 'excellent' : 'good'} campaign performance.`
        },
        {
          metric_name: "Revenue Generated",
          current_value: `$${revenue}`,
          previous_value: `$${Math.round(revenue * 0.88)}`,
          trend: "↗️ +12% increase",
          benchmark: "Average revenue: $300-600/month",
          insights: `Revenue growth indicates successful product selection and content strategy.`
        },
        {
          metric_name: "Conversion Rate",
          current_value: `${conversionRate}%`,
          previous_value: `${(parseFloat(conversionRate) * 0.92).toFixed(2)}%`,
          trend: "↗️ +8% improvement",
          benchmark: "Industry benchmark: 2-4%",
          insights: `Your conversion rate is ${parseFloat(conversionRate) > 3 ? 'significantly above' : 'within'} industry standards.`
        },
        {
          metric_name: "Average Order Value",
          current_value: `$${avgOrderValue}`,
          previous_value: `$${(parseFloat(avgOrderValue) * 0.95).toFixed(2)}`,
          trend: "↗️ +5% increase",
          benchmark: "Typical AOV: $25-50",
          insights: `Higher AOV suggests effective promotion of quality products.`
        },
        {
          metric_name: "ROI",
          current_value: `${roi}%`,
          previous_value: `${(parseFloat(roi) * 0.9).toFixed(1)}%`,
          trend: "↗️ +10% improvement",
          benchmark: "Target ROI: 200-400%",
          insights: `Strong ROI indicates efficient campaign spending and good product selection.`
        }
      );
    }

    if (metricType === "predictive") {
      logger?.info('📝 [AnalyticsSimulation] Generating predictive analytics...');
      
      analytics.push(
        {
          metric_name: "Projected Monthly Revenue",
          current_value: `$${Math.round(revenue * 4.3)}`,
          trend: "📈 +25% growth predicted",
          insights: "Based on current trends, expect continued growth with seasonal peak in Q4."
        },
        {
          metric_name: "Trending Products Alert",
          current_value: "3 products gaining momentum",
          trend: "🔥 Hot trending items",
          insights: "Electronics and health products showing 40% increase in engagement this month."
        },
        {
          metric_name: "Market Opportunity",
          current_value: "High potential detected",
          trend: "📊 Emerging niche identified",
          insights: "Smart home devices category showing untapped potential with low competition."
        }
      );
    }

    if (metricType === "comparison") {
      logger?.info('📝 [AnalyticsSimulation] Generating comparison metrics...');
      
      analytics.push(
        {
          metric_name: "Performance vs Competitors",
          current_value: "Above average",
          benchmark: "Top 25% of affiliates",
          trend: "🏆 Outperforming peers",
          insights: "Your campaigns are performing better than 75% of similar affiliates in your niche."
        },
        {
          metric_name: "Platform Performance Ranking",
          current_value: platform ? `${platform}: #2 performer` : "Amazon: #1, eBay: #2, Flipkart: #3",
          trend: "📈 Consistent improvement",
          insights: platform ? `${platform} is your second-best performing platform` : "Diversified platform strategy showing balanced performance."
        }
      );
    }

    logger?.info('✅ [AnalyticsSimulation] Analytics generated successfully');
    
    return { analytics };
  },
});