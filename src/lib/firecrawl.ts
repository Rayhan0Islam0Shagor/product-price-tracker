import Firecrawl from '@mendable/firecrawl-js';
import type { ScrapedProductDetails } from '@/types/product';

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

const schema = {
  type: 'object',
  properties: {
    productName: { type: 'string' },
    currentPrice: { type: 'number' },
    currencyCode: { type: 'string' },
    productImageUrl: { type: 'string' },
  },
  required: ['productName', 'currentPrice'],
};

export async function scrapeProductDetails(
  url: string,
): Promise<ScrapedProductDetails> {
  try {
    const result = await firecrawl.extract([url], {
      prompt:
        "Extract the product name as 'productName', current price as a number as 'currentPrice', currency code (USD, EUR, etc) as 'currencyCode', and product image URL as 'productImageUrl' if available, Make sure the currency code is in USD, BDT or INR like format. not any symbol or code.",
      schema,
    });

    if (!result.success) {
      throw new Error('Failed to extract product details from URL');
    }

    if (!result?.data || !result?.data?.productName) {
      throw new Error('No data extracted from URL');
    }

    return result.data;
  } catch (error) {
    console.error('Firecrawl scrape error:', error);
    throw new Error(
      `Failed to scrape product: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}
