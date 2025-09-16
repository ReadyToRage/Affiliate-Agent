import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";

export const productDiscoveryTool = createTool({
  id: "product-discovery-tool",
  description: `Discover trending and high-converting affiliate products from major e-commerce platforms. Use this when users ask for product recommendations, want to find profitable products to promote, or need ideas for their affiliate marketing campaigns.`,
  inputSchema: z.object({
    category: z.string().describe("Product category (e.g., electronics, fashion, home, health, books, etc.)"),
    platform: z.string().optional().describe("Specific platform to search (amazon, flipkart, aliexpress, ebay, walmart, myntra, ajio, nykaa, snapdeal, firstcry, meesho) - leave empty to search all platforms"),
    priceRange: z.string().optional().describe("Price range preference (budget, mid-range, premium)"),
    region: z.string().default("global").describe("Target region for products (us, india, global, etc.)"),
  }),
  outputSchema: z.object({
    products: z.array(z.object({
      name: z.string(),
      category: z.string(),
      price: z.string(),
      commission_estimate: z.string(),
      reason_for_recommendation: z.string(),
      platform: z.string(),
      affiliate_link: z.string(),
    })),
  }),
  execute: async ({ context: { category, platform, priceRange, region }, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🔧 [ProductDiscovery] Starting product discovery with params:', { category, platform, priceRange, region });

    // Simulate product discovery from various platforms
    // In a real implementation, this would integrate with actual APIs
    const platforms = platform ? [platform] : [
      'amazon', 'flipkart', 'aliexpress', 'ebay', 'walmart', 
      'myntra', 'ajio', 'nykaa', 'snapdeal', 'firstcry', 'meesho'
    ];

    const products = [];
    const productTemplates = {
      electronics: [
        { name: "Wireless Bluetooth Earbuds", basePrice: 25, commission: "8-12%" },
        { name: "Smart Fitness Tracker", basePrice: 45, commission: "6-10%" },
        { name: "Portable Phone Charger", basePrice: 20, commission: "10-15%" },
        { name: "LED Desk Lamp with USB", basePrice: 30, commission: "12-18%" },
        { name: "Bluetooth Speaker", basePrice: 35, commission: "8-14%" },
      ],
      fashion: [
        { name: "Trendy Casual Sneakers", basePrice: 40, commission: "5-8%" },
        { name: "Stylish Backpack", basePrice: 25, commission: "10-15%" },
        { name: "Summer T-Shirt Collection", basePrice: 15, commission: "15-20%" },
        { name: "Denim Jacket", basePrice: 50, commission: "8-12%" },
        { name: "Athletic Wear Set", basePrice: 35, commission: "12-18%" },
      ],
      home: [
        { name: "Essential Oil Diffuser", basePrice: 30, commission: "15-25%" },
        { name: "Non-Stick Cookware Set", basePrice: 60, commission: "8-12%" },
        { name: "Cozy Throw Blanket", basePrice: 25, commission: "20-30%" },
        { name: "Smart LED Light Bulbs", basePrice: 20, commission: "10-15%" },
        { name: "Bamboo Kitchen Utensils", basePrice: 18, commission: "25-35%" },
      ],
      health: [
        { name: "Vitamin D3 Supplements", basePrice: 15, commission: "20-30%" },
        { name: "Yoga Mat with Carrying Strap", basePrice: 25, commission: "15-25%" },
        { name: "Resistance Bands Set", basePrice: 12, commission: "25-40%" },
        { name: "Protein Powder", basePrice: 35, commission: "10-15%" },
        { name: "Meditation Cushion", basePrice: 28, commission: "20-30%" },
      ],
      books: [
        { name: "Self-Help Bestseller", basePrice: 12, commission: "4-8%" },
        { name: "Digital Marketing Guide", basePrice: 20, commission: "6-10%" },
        { name: "Cookbook Collection", basePrice: 18, commission: "8-12%" },
        { name: "Personal Finance Book", basePrice: 15, commission: "5-9%" },
        { name: "Productivity Planner", basePrice: 10, commission: "15-25%" },
      ],
    };

    const categoryKey = category.toLowerCase() as keyof typeof productTemplates;
    const categoryProducts = productTemplates[categoryKey] || productTemplates.electronics;
    
    logger?.info('📝 [ProductDiscovery] Processing products for category:', category);

    // Generate 3-5 products from selected platforms
    const selectedProducts = categoryProducts.slice(0, Math.min(5, Math.max(3, categoryProducts.length)));
    
    for (let i = 0; i < selectedProducts.length; i++) {
      const template = selectedProducts[i];
      const selectedPlatform = platforms[i % platforms.length];
      
      // Adjust pricing based on region and platform
      let price = template.basePrice;
      if (region === 'india') {
        price = Math.round(price * 75); // Convert to INR approximate
      }
      if (priceRange === 'budget') {
        price = Math.round(price * 0.7);
      } else if (priceRange === 'premium') {
        price = Math.round(price * 1.5);
      }

      const product = {
        name: template.name,
        category: category,
        price: region === 'india' ? `₹${price}` : `$${price}`,
        commission_estimate: template.commission,
        reason_for_recommendation: `High conversion rate on ${selectedPlatform}, trending in ${category} category with good profit margins`,
        platform: selectedPlatform,
        affiliate_link: `https://aff.link/${selectedPlatform}_${template.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      };

      products.push(product);
    }

    logger?.info('✅ [ProductDiscovery] Completed successfully, returning products:', products.length);
    
    return { products };
  },
});