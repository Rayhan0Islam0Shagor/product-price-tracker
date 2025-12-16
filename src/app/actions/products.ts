'use server';

import { scrapeProductDetails } from '@/lib/firecrawl';
import { createClient } from '@/utils/supabase/server';
import { getMe } from './get-me';
import { revalidatePath } from 'next/cache';
import { accessCheck } from './boundary';
import type { Product } from '@/types/product';

export async function addProduct(formData: FormData) {
  const url = formData.get('url') as string;

  if (!url) {
    return { error: 'URL is required' };
  }
  try {
    const supabase = await createClient();
    const user = await getMe();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const product = await scrapeProductDetails(url);

    if (!product || !product.productName) {
      return { error: 'Could not extract product details from URL' };
    }

    const newPrice = Number(product.currentPrice);
    const currency = product.currencyCode || 'BDT';

    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, current_price')
      .eq('user_id', user.id)
      .eq('url', url)
      .single();

    const isUpdate = !!existingProduct;

    // upsert product
    const { data: newProduct, error } = await supabase
      .from('products')
      .upsert(
        {
          user_id: user.id,
          url,
          name: product.productName,
          current_price: newPrice,
          currency,
          image_url: product.productImageUrl || '',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,url', // unique constraint on user_id and url
          ignoreDuplicates: false, // merge duplicates, always update if exists
        },
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Add to price history if it's a new product or price changed
    const shouldAddToHistory =
      !isUpdate || newPrice !== existingProduct?.current_price;

    if (shouldAddToHistory) {
      await supabase
        .from('price_history')
        .insert({
          product_id: newProduct.id,
          price: newPrice,
          currency,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
    }

    revalidatePath('/');

    return {
      success: true,
      product: newProduct,
      message: isUpdate
        ? 'Product updated with latest price!'
        : 'Product added successfully!',
    };
  } catch (error) {
    console.error('Error adding product:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to add product',
    };
  }
}

export async function deleteProduct(productId: string) {
  try {
    const supabase = await createClient();

    if (!(await accessCheck())) {
      return { error: 'Unauthorized' };
    }

    await supabase.from('products').delete().eq('id', productId);

    return { success: true, message: 'Product deleted successfully!' };
  } catch (error) {
    console.error('Error deleting product:', error);
    return {
      error:
        error instanceof Error ? error.message : 'Failed to delete product',
    };
  } finally {
    revalidatePath('/');
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const user = await getMe();

    if (!user) {
      return [];
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (products as Product[]) || [];
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
}

export async function getPriceHistory(productId: string) {
  try {
    const supabase = await createClient();
    if (!(await accessCheck())) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('product_id', productId)
      .order('checked_at', { ascending: true });

    if (error) throw error;

    return (data as { checked_at: string; price: number }[]) || [];
  } catch (error) {
    console.error('Get price history error:', error);
    return [];
  }
}
