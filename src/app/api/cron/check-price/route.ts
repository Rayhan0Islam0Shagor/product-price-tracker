import { sendPriceDropAlert } from '@/lib/email';
import { scrapeProductDetails } from '@/lib/firecrawl';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message:
      'Price checked endpoint is working, User POST to trigger a price check',
  });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role to bypass RLS
    const supabase = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: products = [], error } = await supabase
      .from('products')
      .select('*');

    if (error) error;
    console.error(`Found ${products?.length} products to check`);

    const results = {
      total: products?.length,
      updated: 0,
      failed: 0,
      priceChanges: 0,
      alertsSent: 0,
    };

    for (const product of products || []) {
      try {
        const scrapedProductData = await scrapeProductDetails(product.url);

        if (!scrapedProductData || !scrapedProductData.productName) {
          results.failed++;
          continue;
        }

        const newPrice = Number(scrapedProductData.currentPrice);
        const oldPrice = Number(product.current_price);

        await supabase
          .from('products')
          .update({
            current_price: newPrice,
            currency: scrapedProductData.currencyCode || 'BDT',
            image_url: scrapedProductData.productImageUrl || '',
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id);

        if (newPrice !== oldPrice) {
          await supabase.from('price_history').insert({
            product_id: product.id,
            price: newPrice,
            currency: scrapedProductData.currencyCode || product.currency,
          });
          results.priceChanges++;

          if (newPrice < oldPrice) {
            results.alertsSent++;

            const {
              data: { user },
            } = await supabase.auth.admin.getUserById(product.user_id);

            if (user?.email) {
              // send email alert
              const emailResult = await sendPriceDropAlert(
                user.email,
                product,
                oldPrice,
                newPrice,
              );

              if (emailResult.success) {
                results.alertsSent++;
              }
            }
          }
        }

        results.updated++;
      } catch (error) {
        console.error(
          `Error checking price for product ${product.id}: ${error}`,
        );
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Price check completed. ${results.updated} products updated, ${results.priceChanges} price changes, ${results.alertsSent} alerts sent`,
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Error checking prices',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// curl -X POST https://best-deal-tracker.vercel.app/api/cron/check-price -H "Authorization: Bearer CRON_SECRET"
