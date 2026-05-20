# ProfitLens SaaS — Launch Ready Starter

ProfitLens tagline:

> Find profit leaks in your e-commerce store

## Your confirmed setup

- Tool name: ProfitLens
- Target users: All e-commerce businesses
- Country focus: India + global
- Currency: INR + USD
- Auth: Clerk
- Database: Neon PostgreSQL
- Payments: Razorpay + Stripe
- AI: Gemini default, OpenAI also supported
- Free AI: simple English
- Paid AI: advanced English + Hinglish
- Admin email: arinsha666@gmail.com
- Temporary support email: arinsha666@gmail.com
- Vercel project name suggestion: profitlens-ai

## Pricing

| Plan | INR | USD | Reports/month | Max CSV rows | Export | AI |
|---|---:|---:|---:|---:|---|---|
| Free | ₹0 | $0 | 1 | 500 | No | Simple |
| Starter | ₹799/mo | $19/mo | 10 | 5,000 | Yes | Advanced |
| Growth | ₹1,999/mo | $49/mo | 50 | 25,000 | Yes | Advanced |
| Pro | ₹4,999/mo | $99/mo | Unlimited | 100,000 | Yes | Advanced |

Trial: 7 days.

## CSV files

### orders.csv
```csv
orderId,date,product,sku,quantity,sellingPrice,discount,paymentFee
```

### product_cost.csv
```csv
sku,product,productCost,packagingCost
```

### ad_spend.csv
```csv
sku,adSpend
```

### shipping.csv
```csv
sku,shippingCost
```

### returns.csv
```csv
sku,returnedUnits
```

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

Open:

```bash
http://localhost:3000
```

## Deploy to Vercel

1. Push this folder to GitHub.
2. Create Neon PostgreSQL database.
3. Add all `.env.example` variables in Vercel.
4. Deploy with project name: `profitlens-ai`.
5. Add Clerk redirect URLs.
6. Add Stripe/Razorpay webhook URLs.
7. Test signup, report save, AI, and payment.

## Important before launch

- Buy a domain later, for example `profitlens.ai`, `getprofitlens.com`, or another available domain.
- Until you buy a domain, `support@profitlens.com` will not work.
- Use `arinsha666@gmail.com` as temporary support/business email.
- Add real Privacy Policy, Terms, and Refund Policy review before accepting payments.
