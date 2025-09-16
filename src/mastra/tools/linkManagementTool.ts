import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";

export const linkManagementTool = createTool({
  id: "link-management-tool",
  description: `Generate and manage affiliate links for products and campaigns. Creates trackable affiliate links with analytics capabilities.`,
  inputSchema: z.object({
    productName: z.string().describe("Name of the product or service"),
    platform: z.string().describe("Platform/merchant (amazon, flipkart, etc.)"),
    originalUrl: z.string().optional().describe("Original product URL if available"),
    campaignName: z.string().optional().describe("Campaign name for tracking"),
    customAlias: z.string().optional().describe("Custom alias for the link"),
  }),
  outputSchema: z.object({
    links: z.array(z.object({
      affiliate_link: z.string(),
      short_link: z.string(),
      tracking_id: z.string(),
      platform: z.string(),
      status: z.string(),
      created_date: z.string(),
    })),
  }),
  execute: async ({ context: { productName, platform, originalUrl, campaignName, customAlias }, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🔧 [LinkManagement] Starting link generation with params:', { productName, platform, campaignName });

    logger?.info('📝 [LinkManagement] Generating affiliate links...');

    // Generate tracking ID
    const trackingId = `${platform}_${productName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    
    // Generate affiliate link
    const baseAffiliateLink = originalUrl || `https://${platform}.com/product/${productName.toLowerCase().replace(/\s+/g, '-')}`;
    const affiliateLink = `https://aff.link/${trackingId}?ref=${campaignName || 'default'}&utm_source=affiliate&utm_campaign=${campaignName || 'general'}`;
    
    // Generate short link
    const shortLink = `https://aff.link/${customAlias || trackingId.slice(-8)}`;

    const links = [{
      affiliate_link: affiliateLink,
      short_link: shortLink,
      tracking_id: trackingId,
      platform: platform,
      status: "active",
      created_date: new Date().toISOString().split('T')[0],
    }];

    logger?.info('✅ [LinkManagement] Links generated successfully');
    
    return { links };
  },
});