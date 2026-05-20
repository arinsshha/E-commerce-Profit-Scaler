# Deploy ProfitLens to Vercel

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial ProfitLens SaaS"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## 2. Create PostgreSQL database

Use Neon, Supabase, Railway, or Render PostgreSQL.

Copy the connection string into:

```env
DATABASE_URL=
```

## 3. Configure Clerk

Create a Clerk app and add:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

Set allowed redirect URLs to your Vercel domain.

## 4. Configure Stripe

Create products/prices in Stripe and add:

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER=
```

Webhook endpoint:

```text
https://your-domain.com/api/stripe/webhook
```

## 5. Configure Razorpay

Add:

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Webhook endpoint:

```text
https://your-domain.com/api/razorpay/webhook
```

## 6. Configure AI

For OpenAI:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=
```

## 7. Deploy

On Vercel:
- Import GitHub repository
- Add all environment variables
- Deploy
- Run Prisma DB push locally or from Vercel build command if configured

```bash
npx prisma db push
```
