# ProfitLens Launch Checklist

## Accounts needed

- [ ] GitHub
- [ ] Vercel
- [ ] Neon PostgreSQL
- [ ] Clerk
- [ ] Razorpay
- [ ] Stripe
- [ ] Gemini API key
- [ ] OpenAI API key, optional

## Environment variables

Copy `.env.example` into `.env` locally and into Vercel Environment Variables.

## Neon

- [ ] Create Neon project
- [ ] Copy pooled DATABASE_URL
- [ ] Run `npx prisma db push`

## Clerk

- [ ] Create Clerk project
- [ ] Add publishable key
- [ ] Add secret key
- [ ] Add Vercel URL to allowed origins

## Gemini

- [ ] Create Gemini API key
- [ ] Add `AI_PROVIDER=gemini`
- [ ] Add `GEMINI_API_KEY`

## Payments

### Razorpay
- [ ] Add key ID
- [ ] Add key secret
- [ ] Add webhook secret
- [ ] Set webhook URL: `/api/razorpay/webhook`

### Stripe
- [ ] Create Starter INR/USD prices
- [ ] Create Growth INR/USD prices
- [ ] Create Pro INR/USD prices
- [ ] Add price IDs to env
- [ ] Set webhook URL: `/api/stripe/webhook`

## Test before launch

- [ ] User signup works
- [ ] CSV upload works
- [ ] Report save works
- [ ] Free plan limit works
- [ ] Free plan export blocked
- [ ] Paid plan export allowed
- [ ] Gemini AI suggestions work
- [ ] Admin dashboard works for arinsha666@gmail.com
- [ ] Privacy page opens
- [ ] Terms page opens
- [ ] Refund page opens
- [ ] Contact page opens
