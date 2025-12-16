'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ExternalLink, Trash2, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { deleteProduct } from '@/app/actions/products';
import type { Product } from '@/types/product';
import PriceChart from './PriceChart';

export default function ProductCard({ product }: { product: Product }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    await deleteProduct(product.id);
    setShowDeleteModal(false);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex gap-4">
          {product.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="w-20 h-20 object-cover rounded-md border"
            />
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
              {product.name}
            </h3>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-orange-500">
                {product.currency} {product.current_price}
              </span>
              <Badge variant="secondary" className="gap-1">
                <TrendingDown className="w-3 h-3" />
                Tracking
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                Show Chart
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-2xl">
                <DrawerHeader>
                  <DrawerTitle>Price History</DrawerTitle>
                  <DrawerDescription>
                    Track price changes for {product.name}
                  </DrawerDescription>
                </DrawerHeader>
                <div className="p-4 pb-6">
                  <PriceChart productId={product.id} />
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          <Button variant="outline" size="sm" asChild className="gap-1">
            <Link href={product.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              View Product
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </Button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
        title="Remove Product?"
        description={`Are you sure you want to remove "${product.name}" from tracking? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        confirmIcon={Trash2}
        variant="destructive"
      />
    </Card>
  );
}
