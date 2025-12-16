'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, TrendingDown } from 'lucide-react';
import { getPriceHistory } from '@/app/actions/products';

export default function PriceChart({ productId }: { productId: string }) {
  const [data, setData] = useState<{ date: string; price: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const history = await getPriceHistory(productId);

      const chartData = (
        history as { checked_at: string; price: number }[]
      ).map((item) => ({
        date: new Date(item.checked_at).toLocaleDateString(),
        price: item.price,
      }));

      setData(chartData);
      setLoading(false);
    }

    loadData();
  }, [productId]);

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 w-full min-h-56 flex flex-col items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading chart...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 w-full min-h-56 flex flex-col items-center justify-center">
        <TrendingDown className="w-5 h-5 mb-2 text-gray-400" />
        <h4 className="text-sm font-semibold mb-4 text-gray-700">
          No price history yet. Check back after the first daily update!
        </h4>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#FA5D19"
            strokeWidth={2}
            dot={{ fill: '#FA5D19', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
