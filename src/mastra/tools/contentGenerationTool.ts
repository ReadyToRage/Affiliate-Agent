import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";

export const contentGenerationTool = createTool({
  id: "content-generation-tool",
  description: `Generate promotional content for affiliate marketing including SEO blogs, product comparisons, social media posts, and email snippets. Always embeds affiliate links naturally within the content.`,
  inputSchema: z.object({
    contentType: z.enum(["blog", "social", "email", "comparison"]).describe("Type of content to generate"),
    product: z.string().describe("Product name or description to create content for"),
    affiliateLink: z.string().describe("Affiliate link to embed in the content"),
    tone: z.string().default("professional").describe("Content tone (professional, casual, enthusiastic, etc.)"),
    targetAudience: z.string().default("general").describe("Target audience (beginners, professionals, parents, students, etc.)"),
    keyFeatures: z.array(z.string()).optional().describe("Key product features to highlight"),
    contentLength: z.enum(["short", "medium", "long"]).default("medium").describe("Desired content length"),
  }),
  outputSchema: z.object({
    content: z.array(z.object({
      type: z.string(),
      text: z.string(),
      seo_keywords: z.array(z.string()).optional(),
      call_to_action: z.string().optional(),
    })),
  }),
  execute: async ({ context: { contentType, product, affiliateLink, tone, targetAudience, keyFeatures, contentLength }, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🔧 [ContentGeneration] Starting content generation with params:', { contentType, product, tone, targetAudience, contentLength });

    const content = [];

    if (contentType === "blog") {
      logger?.info('📝 [ContentGeneration] Generating SEO blog content...');
      
      const blogLength = contentLength === "short" ? 300 : contentLength === "medium" ? 600 : 1000;
      const seoKeywords = [
        product.toLowerCase(),
        `${product.toLowerCase()} review`,
        `best ${product.toLowerCase()}`,
        `${product.toLowerCase()} benefits`,
        "affiliate marketing"
      ];

      const blogContent = `# The Ultimate ${product} Review: Is It Worth Your Investment?

Are you considering purchasing ${product}? You're in the right place! In this comprehensive review, we'll dive deep into everything you need to know about ${product} to help you make an informed decision.

## What Makes ${product} Stand Out?

${keyFeatures ? keyFeatures.map(feature => `- ${feature}`).join('\n') : `- High-quality construction and materials
- User-friendly design
- Excellent value for money
- Positive customer reviews
- Reliable performance`}

## Why We Recommend ${product}

After thorough testing and research, ${product} has proven to be an excellent choice for ${targetAudience}. The combination of quality, functionality, and affordability makes it a standout option in its category.

${contentLength === "long" ? `## Detailed Analysis

Our team spent weeks testing ${product} to bring you this honest review. We evaluated it across multiple criteria including build quality, ease of use, value for money, and customer satisfaction.

### Performance Testing Results
The performance metrics speak for themselves. ${product} consistently delivered results that exceeded our expectations, making it a reliable choice for both beginners and experienced users.

### Customer Feedback Summary
Based on hundreds of customer reviews, ${product} maintains an impressive satisfaction rate, with users particularly praising its reliability and ease of use.` : ""}

## Ready to Get Started?

If you're ready to experience the benefits of ${product} for yourself, you can [get ${product} here](${affiliateLink}) with our special recommendation.

*Note: This post contains affiliate links. If you purchase through our links, we may earn a small commission at no extra cost to you. This helps support our content creation efforts.*`;

      content.push({
        type: "blog",
        text: blogContent,
        seo_keywords: seoKeywords,
        call_to_action: `Get ${product} now with our special link!`
      });

    } else if (contentType === "social") {
      logger?.info('📝 [ContentGeneration] Generating social media content...');

      const socialPosts = [
        {
          type: "social",
          text: `🔥 Just discovered an amazing ${product}! 

${keyFeatures ? `✨ ${keyFeatures.slice(0, 3).join('\n✨ ')}` : '✨ High quality\n✨ Great value\n✨ Highly recommended'}

Perfect for ${targetAudience}! Check it out here: ${affiliateLink}

#affiliate #${product.replace(/\s+/g, '')} #recommendation`,
          call_to_action: "Swipe up to learn more!"
        },
        {
          type: "social", 
          text: `💡 Looking for the perfect ${product}? I've got you covered!

After trying dozens of options, this one stands out for its quality and value. ${targetAudience} love it!

Get yours: ${affiliateLink}

What are you waiting for? 🛒

#productreview #${product.replace(/\s+/g, '')} #mustbuy`,
          call_to_action: "Click the link in our bio!"
        }
      ];

      content.push(...socialPosts);

    } else if (contentType === "email") {
      logger?.info('📝 [ContentGeneration] Generating email content...');

      const emailContent = `Subject: You Asked About ${product} - Here's My Honest Review

Hi there!

You recently asked me about ${product}, and I promised to share my thoughts once I had a chance to try it out.

Well, I've been using it for the past few weeks, and I have to say - I'm impressed!

Here's what I love about it:
${keyFeatures ? keyFeatures.map(feature => `• ${feature}`).join('\n') : `• Excellent build quality
• Easy to use right out of the box  
• Great value for the price
• Reliable performance`}

It's particularly great for ${targetAudience} because it's designed with your needs in mind.

If you're interested in checking it out, you can find it here: ${affiliateLink}

I think you'll love it as much as I do!

Best regards,
[Your Name]

P.S. I only recommend products I genuinely believe in. This link is an affiliate link, which means I may earn a small commission if you decide to purchase. This doesn't affect the price you pay, and it helps me continue providing valuable recommendations.`;

      content.push({
        type: "email",
        text: emailContent,
        call_to_action: "Click here to get your ${product} today!"
      });

    } else if (contentType === "comparison") {
      logger?.info('📝 [ContentGeneration] Generating comparison content...');

      const comparisonContent = `# ${product} vs. The Competition: An Honest Comparison

Choosing the right product can be overwhelming with so many options available. That's why we've put together this comprehensive comparison to help you make the best decision.

## How ${product} Stacks Up

### ✅ Advantages of ${product}
${keyFeatures ? keyFeatures.map(feature => `- ${feature}`).join('\n') : `- Superior quality and durability
- Competitive pricing
- Excellent customer support
- User-friendly design
- Proven track record`}

### 📊 Comparison Summary

| Feature | ${product} | Competitor A | Competitor B |
|---------|------------|--------------|--------------|
| Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Price | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## Our Recommendation

Based on our thorough analysis, ${product} offers the best combination of quality, value, and user experience for ${targetAudience}.

Ready to make your choice? [Get ${product} here](${affiliateLink}) and experience the difference for yourself.

*Disclosure: This comparison includes affiliate links. We may earn a commission from qualifying purchases, which helps support our independent testing and reviews.*`;

      content.push({
        type: "comparison",
        text: comparisonContent,
        seo_keywords: [`${product} comparison`, `${product} vs`, "best choice", "product review"],
        call_to_action: `Choose ${product} - the clear winner!`
      });
    }

    logger?.info('✅ [ContentGeneration] Completed successfully, returning content pieces:', content.length);
    
    return { content };
  },
});