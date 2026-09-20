This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Referral database update

The referral feature adds nullable order fields and four new tables. Apply the additive migration in `prisma/migrations/20260920_referrals` to the existing PostgreSQL database before starting the updated app:

```bash
npx prisma migrate deploy
npx prisma generate
```

Referral permissions are configured in Master Roles: `referrals.view` opens performance data, `referrals.manage` creates partners/codes and changes code status, and `referrals.settle` records cash payouts and shirt deliveries. Owner keeps access for existing roles until an action is explicitly disabled; Super Admin always has full access. Running the seed again preserves existing role permission choices.

Existing orders remain unattributed and keep a zero discount. Run the migration once per database; do not use `prisma db push` in place of the migration on production.
