# CMS and catalogue integration

## Database upgrade

Existing databases use `prisma db push` rather than a migration history. **Create and verify a database backup first**, then apply the upgrade before starting the updated application:

```sh
node node_modules/prisma/build/index.js db execute --file prisma/cms-catalogue-upgrade.sql --schema prisma/schema.prisma
node node_modules/prisma/build/index.js generate
```

Stop the local Next.js server before generating Prisma on Windows if its query engine is locked. Restart the server afterward. New databases can use the updated Prisma schema. The SQL migrates valid legacy `Journal.relatedProductSlug` values into `ProductJournal`, then removes the manual Archive table, Product Story fields, legacy journal slug field, and flat shipping setting. Historical Archive and Product Story content are intentionally not converted.

## CAPTCHA

Set `RECAPTCHA_SECRET_KEY` on the server and the matching `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` for the existing reCAPTCHA v2 checkbox. Do not use test keys in production. Restart the server after changing environment variables.

Checkout fails with HTTP 503 if the secret is missing, and HTTP 400 for an invalid or expired token. The widget resets after a failed submission so the customer can retry with a fresh token. Backend verification follows [Google's verification API](https://developers.google.com/recaptcha/docs/verify).

## CMS controls

- Archive is derived from products whose effective status is `SOLD_OUT` or `DISCONTINUED`; there is no separate Historical Archive CMS.
- Products → Jurnal Terkait: select zero or more journal articles. The relationship is displayed on both product and journal detail pages and uses stable IDs.
- Master Data → Ukuran: sizes use the shared data table with search, pagination, status toggles, and soft-delete. Deleted/inactive sizes are unavailable for new products while existing variants remain intact.
- Store Settings → Homepage: edit featured heading and view-all text.
- Store Settings → Archive & About: edit the archive introduction.
- Journal: formatting and inline images are stored in `contentHtml`, sanitized, and rendered publicly. Existing plain-text articles retain their fallback rendering. Formatting lost before this upgrade cannot be reconstructed automatically.
- Orders: selected courier/service, server-checked shipping price and pre-order snapshot are saved. Shipping is calculated from destination, weight, courier, and service; no flat-rate setting is used. `ONCE_PER_USER` checks the customer ID, normalized email, or normalized WhatsApp number. Historical orders without a snapshot fall back to the current product status.
- Product availability is derived from variant quantities using one shared calculation. Explicit statuses such as COMING_SOON, PRE_ORDER and DISCONTINUED are preserved. Unlimited stock still requires a valid size and color.

## Verification

```sh
node --import tsx --test tests/cms-catalogue.test.ts
node --env-file=.env --import tsx scripts/check-cms-database.ts
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build
```

The database check creates temporary product/journal relationship records in a transaction and rolls it back. It does not submit customer orders. Unit tests mock CAPTCHA and database calls. Real CAPTCHA success still requires configured keys and a browser challenge. Checkout retry limiting is per server process; multiple server instances should use a shared limiter at deployment.
