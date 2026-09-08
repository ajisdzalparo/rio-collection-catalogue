# CMS and catalogue integration

## Database upgrade

Existing databases use `prisma db push` rather than a migration history. Apply the additive, idempotent upgrade before starting the updated application:

```sh
node node_modules/prisma/build/index.js db execute --file prisma/cms-catalogue-upgrade.sql --schema prisma/schema.prisma
node node_modules/prisma/build/index.js generate
```

Stop the local Next.js server before generating Prisma on Windows if its query engine is locked. Restart the server afterward. New databases can use the updated Prisma schema. The SQL adds nullable fields only, and does not delete existing records.

## CAPTCHA

Set `RECAPTCHA_SECRET_KEY` on the server and the matching `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` for the existing reCAPTCHA v2 checkbox. Do not use test keys in production. Restart the server after changing environment variables.

Checkout fails with HTTP 503 if the secret is missing, and HTTP 400 for an invalid or expired token. The widget resets after a failed submission so the customer can retry with a fresh token. Backend verification follows [Google's verification API](https://developers.google.com/recaptcha/docs/verify).

## CMS controls

- Master Data → Historical Archive: create, edit, delete collections and select a journal article. Relationships use journal IDs so changing a journal slug does not break an archive link. Deleting a journal clears the relationship; unlinked archives open the journal listing.
- Store Settings → Homepage: edit featured heading and view-all text.
- Store Settings → Archive & About: edit the archive introduction.
- Journal: formatting and inline images are stored in `contentHtml`, sanitized, and rendered publicly. Existing plain-text articles retain their fallback rendering. Formatting lost before this upgrade cannot be reconstructed automatically.
- Orders: selected courier/service, server-checked shipping price and pre-order snapshot are saved. Historical orders without a snapshot fall back to the current product status. The confirmation page reads the latest database status on each request; nonexistent order numbers render the not-found page with noindex (Next.js streamed responses may already have HTTP 200 headers).
- Product availability is derived from variant quantities using one shared calculation. Explicit statuses such as COMING_SOON, PRE_ORDER and DISCONTINUED are preserved. Unlimited stock still requires a valid size and color.

## Verification

```sh
node --import tsx --test tests/cms-catalogue.test.ts
node --env-file=.env --import tsx scripts/check-cms-database.ts
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
```

The database check creates temporary journal/archive records in a transaction and rolls it back. It does not submit customer orders. Unit tests mock CAPTCHA and database calls. Real CAPTCHA success still requires configured keys and a browser challenge. Checkout retry limiting is per server process; multiple server instances should use a shared limiter at deployment.
