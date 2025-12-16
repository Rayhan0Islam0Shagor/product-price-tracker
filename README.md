# DealDrop - Price Tracking & Alert System

DealDrop is a modern web application that allows users to track product prices from any e-commerce website and receive instant email alerts when prices drop. Built with Next.js, Supabase, and Firecrawl, it provides a seamless experience for monitoring deals and saving money.

## 🎯 Features

- **Universal Product Tracking**: Track products from any e-commerce site (Amazon, Walmart, etc.)
- **Automatic Price Monitoring**: Daily cron job checks prices and updates product information
- **Price History Visualization**: Interactive charts showing price trends over time
- **Email Alerts**: Get notified instantly when prices drop below your tracked price
- **User Authentication**: Secure Google OAuth authentication via Supabase
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS and shadcn/ui components
- **Real-time Updates**: Server-side rendering with automatic revalidation

## 🛠️ Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Recharts** - Chart library for price visualization
- **Sonner** - Toast notifications
- **Lucide React** - Icon library

### Backend & Services

- **Supabase** - Backend-as-a-Service (Authentication, Database)
- **Firecrawl** - Web scraping service for product data extraction
- **Resend** - Email delivery service for price drop alerts
- **Vercel** - Deployment platform (recommended)

### Development Tools

- **Biome** - Fast linter and formatter
- **TypeScript** - Static type checking

## 📁 Project Structure

```
dealdrop/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── actions/           # Server actions
│   │   │   ├── boundary.ts    # Access control utilities
│   │   │   ├── get-me.ts      # Get current user
│   │   │   ├── logout.ts      # User logout
│   │   │   └── products.ts    # Product CRUD operations
│   │   ├── api/               # API routes
│   │   │   └── cron/
│   │   │       └── check-price/
│   │   │           └── route.ts  # Cron job for price checking
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts   # OAuth callback handler
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── AddProductForm.tsx # Product addition form
│   │   ├── AuthButton.tsx    # Authentication button
│   │   ├── AuthModal.tsx     # Login modal
│   │   ├── PriceChart.tsx    # Price history chart
│   │   └── ProductCard.tsx   # Product display card
│   ├── lib/                   # Utility libraries
│   │   ├── email.ts          # Email sending utilities
│   │   └── firecrawl.ts      # Web scraping utilities
│   ├── types/                 # TypeScript type definitions
│   │   └── product.ts        # Product-related types
│   ├── utils/                 # Helper utilities
│   │   ├── supabase/         # Supabase client utilities
│   │   └── utils.ts          # General utilities
│   └── proxy.ts              # Middleware for session management
├── public/                    # Static assets
├── .gitignore
├── biome.json                 # Biome configuration
├── components.json            # shadcn/ui configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies
├── postcss.config.mjs        # PostCSS configuration
└── tsconfig.json             # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- Firecrawl API key
- Resend API key (for email alerts)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd dealdrop
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Firecrawl API
   FIRECRAWL_API_KEY=your_firecrawl_api_key

   # Resend Email Service
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com

   # Cron Job Security
   CRON_SECRET=your_random_secret_string

   # Application URL (for email links)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase Database**

   Create the following tables in your Supabase project:

   **Products Table:**

   ```sql
   CREATE TABLE products (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     url TEXT NOT NULL,
     name TEXT NOT NULL,
     current_price DECIMAL(10, 2) NOT NULL,
     currency TEXT NOT NULL DEFAULT 'USD',
     image_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id, url)
   );

   CREATE INDEX idx_products_user_id ON products(user_id);
   ```

   **Price History Table:**

   ```sql
   CREATE TABLE price_history (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     price DECIMAL(10, 2) NOT NULL,
     currency TEXT NOT NULL,
     checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE INDEX idx_price_history_product_id ON price_history(product_id);
   CREATE INDEX idx_price_history_checked_at ON price_history(checked_at);
   ```

   **Enable Row Level Security (RLS):**

   ```sql
   -- Enable RLS on products table
   ALTER TABLE products ENABLE ROW LEVEL SECURITY;

   -- Users can only see their own products
   CREATE POLICY "Users can view own products"
     ON products FOR SELECT
     USING (auth.uid() = user_id);

   -- Users can insert their own products
   CREATE POLICY "Users can insert own products"
     ON products FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   -- Users can update their own products
   CREATE POLICY "Users can update own products"
     ON products FOR UPDATE
     USING (auth.uid() = user_id);

   -- Users can delete their own products
   CREATE POLICY "Users can delete own products"
     ON products FOR DELETE
     USING (auth.uid() = user_id);

   -- Enable RLS on price_history table
   ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

   -- Users can view price history for their products
   CREATE POLICY "Users can view own price history"
     ON price_history FOR SELECT
     USING (
       EXISTS (
         SELECT 1 FROM products
         WHERE products.id = price_history.product_id
         AND products.user_id = auth.uid()
       )
     );
   ```

5. **Configure Supabase OAuth**

   - Go to your Supabase project dashboard
   - Navigate to Authentication > Providers
   - Enable Google OAuth
   - Add your OAuth credentials
   - Add `http://localhost:3000/auth/callback` to redirect URLs (for development)
   - Add your production URL to redirect URLs (for production)

6. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

7. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

| Variable                               | Description                               | Required |
| -------------------------------------- | ----------------------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Your Supabase project URL                 | Yes      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key                  | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY`            | Supabase service role key (for cron jobs) | Yes      |
| `FIRECRAWL_API_KEY`                    | Firecrawl API key for web scraping        | Yes      |
| `RESEND_API_KEY`                       | Resend API key for sending emails         | Yes      |
| `RESEND_FROM_EMAIL`                    | Email address to send alerts from         | Yes      |
| `CRON_SECRET`                          | Secret token for securing cron endpoint   | Yes      |
| `NEXT_PUBLIC_APP_URL`                  | Your application URL (for email links)    | Yes      |

## 📊 Database Schema

### Products Table

Stores tracked products for each user.

| Column          | Type      | Description                         |
| --------------- | --------- | ----------------------------------- |
| `id`            | UUID      | Primary key                         |
| `user_id`       | UUID      | Foreign key to auth.users           |
| `url`           | TEXT      | Product URL                         |
| `name`          | TEXT      | Product name                        |
| `current_price` | DECIMAL   | Current price                       |
| `currency`      | TEXT      | Currency code (USD, BDT, INR, etc.) |
| `image_url`     | TEXT      | Product image URL                   |
| `created_at`    | TIMESTAMP | Creation timestamp                  |
| `updated_at`    | TIMESTAMP | Last update timestamp               |

### Price History Table

Stores historical price data for chart visualization.

| Column       | Type      | Description             |
| ------------ | --------- | ----------------------- |
| `id`         | UUID      | Primary key             |
| `product_id` | UUID      | Foreign key to products |
| `price`      | DECIMAL   | Price at check time     |
| `currency`   | TEXT      | Currency code           |
| `checked_at` | TIMESTAMP | When price was checked  |

## 🔑 Key Functionality

### Adding Products

- Users can paste any product URL from supported e-commerce sites
- Firecrawl extracts product name, price, currency, and image
- Product is added to user's tracking list
- Initial price is recorded in price history

### Price Monitoring

- Cron job runs daily (configure via Vercel Cron or external service)
- Checks all products in the database
- Updates current prices
- Records price changes in history
- Sends email alerts when prices drop

### Price Alerts

- Email alerts are sent automatically when a price drops
- Alert includes:
  - Product name and image
  - Previous and current price
  - Price drop percentage
  - Amount saved
  - Direct link to product

### Price Charts

- Interactive line charts showing price trends
- Accessible via drawer component on product cards
- Displays historical price data over time

## 🔌 API Routes

### `/api/cron/check-price` (POST)

Automated price checking endpoint for cron jobs.

**Authentication:** Bearer token via `Authorization` header

```bash
curl -X POST https://your-domain.com/api/cron/check-price \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Response:**

```json
{
  "success": true,
  "message": "Price check completed. X products updated, Y price changes, Z alerts sent",
  "results": {
    "total": 10,
    "updated": 9,
    "failed": 1,
    "priceChanges": 3,
    "alertsSent": 2
  }
}
```

### `/auth/callback` (GET)

OAuth callback handler for Supabase authentication.

## 🚢 Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

2. **Import project to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure environment variables**

   - Add all environment variables from `.env.local`
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL

4. **Set up Cron Job**

   Create `vercel.json` in the root directory:

   ```json
   {
     "crons": [
       {
         "path": "/api/cron/check-price",
         "schedule": "0 9 * * *"
       }
     ]
   }
   ```

   Or use Vercel Cron Jobs dashboard to configure:

   - Schedule: Daily at 9 AM UTC (or your preferred time)
   - Endpoint: `/api/cron/check-price`
   - Authorization: Bearer token with your `CRON_SECRET`

5. **Deploy**
   - Vercel will automatically deploy on every push to main branch

### Alternative: External Cron Service

If not using Vercel Cron, you can use external services like:

- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)

Configure them to POST to `/api/cron/check-price` with the Authorization header.

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome

### Code Style

This project uses [Biome](https://biomejs.dev) for linting and formatting. Configuration is in `biome.json`.

## 🔒 Security Considerations

- Row Level Security (RLS) is enabled on all database tables
- Users can only access their own products and price history
- Cron endpoint is protected with bearer token authentication
- Service role key is only used server-side for cron jobs
- OAuth authentication via Supabase

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [Supabase](https://supabase.com) - Backend services
- [Firecrawl](https://firecrawl.dev) - Web scraping
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Resend](https://resend.com) - Email delivery

## 📧 Support

For issues, questions, or contributions, please open an issue on the repository.

---

Built with ❤️ using Next.js and Supabase
