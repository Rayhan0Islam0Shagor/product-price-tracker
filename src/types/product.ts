/**
 * Product type representing a tracked product in the database
 */
export interface Product {
  id: string;
  user_id: string;
  url: string;
  name: string;
  current_price: number;
  currency: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Scraped product details from Firecrawl
 * This represents the raw data extracted from a product URL
 */
export interface ScrapedProductDetails {
  productName: string;
  currentPrice: number;
  currencyCode?: string;
  productImageUrl?: string;
}
