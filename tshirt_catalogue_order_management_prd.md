# PRD — Limited T-Shirt Catalogue & Order Management

> **Document Status:** Draft / Flexible Requirements  
> **Important:** This PRD is a working baseline. Requirements may be adjusted after discussion with the business owner. Any owner-requested change should be reviewed for scope, business impact, technical impact, and consistency with the core ordering/inventory model before implementation.

---

## 1. Executive Summary

This product is a catalogue and order-management website for a limited T-shirt business.

Customers can browse current and historical T-shirt designs, select available variants such as size and potentially color, and submit a purchase request without an online payment gateway.

Payment is handled manually through bank transfer or another agreed manual method, with confirmation handled through WhatsApp.

The system is **not intended to be a full e-commerce platform** in the MVP.

The primary system responsibilities are:

- Display the T-shirt catalogue professionally.
- Display currently available and historical/out-of-stock designs.
- Collect structured customer order information.
- Allow guest customers to submit purchase requests.
- Allow the owner/admin to review and maintain orders.
- Maintain customer information through order history rather than customer accounts.
- Track inventory by product/variant where applicable.
- Reduce stock only after payment has been confirmed.
- Reduce fake/spam/duplicate order attempts.
- Preserve order history for customer and business management.

---

# 2. Product Vision

Create a lightweight ordering system for a limited T-shirt brand where:

1. Customers can discover the brand's products and history.
2. Customers can request an order without creating an account.
3. The owner retains control over order approval and payment confirmation.
4. Inventory is only permanently reduced after payment confirmation.
5. The owner can maintain customer information through historical orders.
6. The system can evolve when the business owner provides additional requirements.

### Core Principle

> **Order request ≠ completed sale.**

A customer submitting an order only creates a purchase request.

The product becomes **SOLD** only after the business confirms the customer's payment.

---

# 3. Current Confirmed Business Rules

| Area | Current Decision |
|---|---|
| Product designs | Multiple designs |
| Historical products | Out-of-stock designs remain visible in catalogue/history |
| Size | Products can have different sizes |
| Color | Products may have different colors |
| Stock granularity | **TBD — owner must confirm whether stock is tracked per size/color** |
| Customer account | Guest-only |
| Customer management | Through order history |
| Payment gateway | Not required |
| Payment | Manual transfer |
| Payment confirmation | Manual confirmation through WhatsApp |
| WhatsApp OTP | Not required |
| Stock deduction | Only after payment confirmation |
| Pending purchase request | Potentially retained for up to 1 month |
| Order verification | Manual by owner/admin |
| Requirements | Flexible and subject to owner review |

---

# 4. Goals & Success Metrics

## Business Goals

1. Create a professional digital catalogue for the T-shirt brand.
2. Preserve the history of previous designs.
3. Make limited products easy to discover.
4. Collect structured purchase requests.
5. Reduce dependency on unstructured chat-based ordering.
6. Give the owner centralized order/customer history.
7. Prevent fake orders from unnecessarily reducing inventory.
8. Keep the purchasing workflow simple without requiring a payment gateway.

## MVP Success Metrics

- Customer can browse current and historical products.
- Customer can submit an order as a guest.
- Owner can see submitted orders.
- Owner can see customer order history.
- Owner can update order/payment status.
- Stock is not permanently reduced before payment confirmation.
- Spam and duplicate submissions are reasonably mitigated.
- Owner can manually confirm payment through WhatsApp.
- Historical/out-of-stock products remain available as catalogue records.

---

# 5. Target Users & Personas

## 5.1 Customer

A visitor who wants to discover or purchase a limited T-shirt.

### Needs

- View products.
- View product history.
- See available variants.
- See price.
- Submit an order quickly.
- Know what happens after submitting an order.
- Receive clear instructions about manual payment.

### Does Not Need in MVP

- Account registration.
- Customer dashboard.
- Password.
- Online payment gateway.
- Complex checkout.

---

## 5.2 Owner / Admin

The business owner or authorized administrator.

### Needs

- Create and maintain T-shirt products.
- Manage product variants.
- Manage inventory.
- View orders.
- Review customer data.
- See customer order history.
- Confirm/reject purchase requests.
- Track payment status.
- Track stock.
- Contact customers through WhatsApp.
- Preserve historical products.

---

# 6. Product Lifecycle

Products should have a lifecycle that allows historical designs to remain visible.

Example:

```text
DRAFT
  ↓
AVAILABLE
  ↓
OUT OF STOCK
  ↓
ARCHIVED
```

### AVAILABLE

Product is currently offered for purchase.

### OUT OF STOCK

Product has no available stock but remains visible in the catalogue.

The product should clearly communicate that it cannot currently be ordered.

### ARCHIVED

Optional future state for products the owner no longer wants prominently displayed.

> Exact product lifecycle rules remain adjustable based on owner requirements.

---

# 7. Order Lifecycle

Recommended order states:

```text
PENDING
   ↓
CONFIRMED
   ↓
WAITING_PAYMENT
   ↓
PAID
   ↓
FULFILLED
```

Alternative terminal states:

```text
REJECTED
CANCELLED
EXPIRED
```

### PENDING

Customer submitted a purchase request.

No permanent stock deduction occurs.

### CONFIRMED

Owner has accepted the request and is proceeding with the customer.

### WAITING_PAYMENT

Customer has been instructed to make manual payment.

### PAID

Owner has confirmed payment.

**Stock is reduced at this stage.**

### FULFILLED

Product/order has been delivered or otherwise completed.

### REJECTED

Owner rejects the purchase request.

### CANCELLED

Order is cancelled by the owner/customer.

### EXPIRED

Order has remained unresolved beyond the business-defined period.

---

# 8. Customer User Journey

```text
Visit Website
      ↓
Browse Catalogue
      ↓
Select Product
      ↓
View Product Details
      ↓
Select Size / Color / Quantity
      ↓
Fill Customer Data
      ↓
Submit Purchase Request
      ↓
Anti-Spam Validation
      ↓
Server-Side Validation
      ↓
Stock Availability Check
      ↓
Duplicate Order Check
      ↓
Create PENDING Order
      ↓
Show Order Confirmation
      ↓
Owner Reviews Request
      ↓
Owner Contacts Customer via WhatsApp
      ↓
Customer Makes Manual Transfer
      ↓
Owner Confirms Payment
      ↓
Order = PAID
      ↓
Stock Reduced
```

---

# 9. Customer-Facing Features

## 9.1 Homepage

### Purpose

Introduce the brand and guide customers to the catalogue.

### Possible sections

- Brand introduction.
- Featured/latest drop.
- Featured T-shirts.
- Brand story.
- Selected previous designs.
- **Testimony Section** (WhatsApp Chat Style): Visual testimonial section rendering customer chats styled as WhatsApp screenshot chat bubbles to emphasize authentic, manual order interaction.
- Call-to-action to catalogue.
- Social media links.

Exact sections remain subject to owner approval.

---

## 9.2 Product Catalogue

### Requirements

- Display multiple T-shirt designs.
- Display available products.
- Display out-of-stock/historical products.
- Filter or categorize products where useful.
- Search may be added if catalogue size justifies it.

### Product card should show

- Product image.
- Product name.
- Price.
- Availability.
- Optional release/drop information.

---

## 9.3 Blog / Journal

### Purpose

Provide a dedicated editorial space for the brand to publish stories, announcements, behind-the-scenes content, product stories, and other brand content.

The Blog / Journal is a **separate content module from the product catalogue**.

### Public Features

- Blog / Journal listing page.
- Blog detail page.
- Featured/latest posts.
- Post title.
- Cover image.
- Short excerpt.
- Publication date.
- Author or brand attribution if applicable.
- Category/tag if required.
- Related posts where useful.
- Related products where relevant.

### Blog Status

```text
DRAFT
  ↓
PUBLISHED
  ↓
ARCHIVED
```

### Admin Features

Admin can:

- Create a post.
- Edit a post.
- Save a draft.
- Publish a post.
- Unpublish/archive a post.
- Upload a cover image.
- Manage post content.
- Set publication date.
- Manage categories/tags if enabled.
- Associate posts with products if enabled.

### MVP Scope

The basic Blog / Journal module can be included in MVP if the owner intends to actively use the website as a brand/content channel.

Advanced editorial features such as scheduled publishing, multiple authors, comments, newsletter integration, and complex editorial workflows remain outside MVP unless requested.

---

## 9.4 Product Detail

### Requirements

- Product images.
- Product name.
- Description.
- Price.
- Available sizes.
- Available colors where applicable.
- Availability status.
- Product history/drop information if provided.
- Order CTA for available products.

### Out-of-stock behavior

If product is out of stock:

```text
[OUT OF STOCK]
```

The customer should still be able to view the product.

The order CTA should be disabled or replaced with an informational action.

---

## 9.5 Testimony Section (WhatsApp Chat Style)

### Purpose
To increase trust and social proof by displaying authentic customer feedback, styled like a WhatsApp chat screenshot. This highlights the WhatsApp-based manual ordering workflow.

### Design Requirements
- **WhatsApp UI Simulation**: Testimonials should render as WhatsApp chat bubble elements:
  - Left-aligned bubbles for customer messages (light gray/white or light off-white background).
  - Right-aligned bubbles for business/admin responses (light green or warm tone matching the brand palette).
  - Bubble details: Small tail, message status ticks (double blue checkmark for read receipt), timestamp.
  - Header avatar: Clean user avatars or stylized customer initials.
- **Responsiveness**: Renders cleanly on mobile and desktop as a grid, carousel, or cascading chat thread.
- **Minimalist Aesthetic**: The overall wrapper should align with the off-white editorial theme of the catalogue, avoiding overly bright default WhatsApp greens unless styled inside cohesive bubble frames.

### Mock Testimonials
1. **Garment Review**:
   - Customer: *"T-shirt heavy weight-nya mantap banget bro, tebel dan fit-nya boxy presisi! Bakal nunggu drop edisi berikutnya."*
   - Status: Read (Double blue checks)
2. **Design Print Review**:
   - Customer: *"Graphic Edition-nya unik banget, art-print rapi dan bahannya halus ga gampang panas pas dipake di luar."*
   - Status: Read (Double blue checks)
3. **Ordering Flow Review**:
   - Customer: *"Awalnya ragu pesan manual via WA, tapi admin ramah & proses konfirmasi cepat. Kaos sampe dalam 2 hari."*
   - Status: Read (Double blue checks)

---

# 10. Guest Order Form

Customers do not need an account.

### Required information

Recommended initial fields:

- Full name.
- WhatsApp/phone number.
- Address.
- Product.
- Variant.
- Quantity.

### Optional

- Email.
- Additional notes.

Exact customer data requirements must be confirmed with the owner before implementation.

---

# 11. Order Submission

When the customer submits the form:

### Client-side validation

Validate:

- Required fields.
- Valid quantity.
- Valid variant.
- Valid phone format.
- Reasonable text lengths.

### Server-side validation

The backend must independently validate:

- Product exists.
- Product is orderable.
- Variant exists.
- Quantity is valid.
- Current price is retrieved from database.
- Current stock is valid.
- Customer information is valid.
- Anti-spam validation passes.
- Duplicate order rules pass.

The frontend must never be trusted for:

- Price.
- Stock.
- Product availability.
- Order status.

---

# 12. Anti-Spam & Fake Order Protection

The business specifically needs protection against users submitting information without genuinely intending to purchase.

The recommended MVP uses multiple lightweight protections.

## 12.1 Rate Limiting

Limit repeated order attempts.

Example baseline:

```text
Maximum X order submissions
per IP / time window
```

The exact threshold should be configurable.

IP should not be the only identification mechanism because multiple legitimate users may share an IP.

---

## 12.2 Honeypot

Include an invisible form field intended to catch simple bots.

If the field is populated, the request can be rejected or flagged.

---

## 12.3 CAPTCHA / Bot Protection

Use a privacy-conscious CAPTCHA/bot protection mechanism such as Cloudflare Turnstile or equivalent.

The exact provider can be selected during implementation.

---

## 12.4 Duplicate Detection

The backend should detect suspicious duplicate orders.

Potential matching signals:

- Normalized phone number.
- Same product.
- Same variant.
- Existing pending order.
- Similar order timestamp.

Example:

```text
Customer:
628123456789

Existing:
Black T-Shirt / L / Quantity 1
Status: PENDING
```

A second identical submission should either be blocked or flagged.

---

## 12.5 Manual Verification

Anti-spam mechanisms do not need to guarantee that every order is genuine.

The owner remains the final verification layer.

Recommended model:

```text
Technical spam protection
        +
Duplicate detection
        +
Manual WhatsApp confirmation
        =
Reasonable MVP protection
```

---

# 13. Payment Flow

There is no payment gateway in the MVP.

### Flow

```text
Customer submits order
        ↓
Owner reviews order
        ↓
Owner contacts customer via WhatsApp
        ↓
Customer receives manual payment instructions
        ↓
Customer performs bank/manual transfer
        ↓
Owner verifies payment
        ↓
Admin marks order as PAID
        ↓
System reduces stock
```

### Important rule

The customer cannot mark an order as PAID themselves.

Payment status is controlled by the owner/admin.

---

# 14. Inventory Management

## Current Rule

Stock is reduced **only after payment confirmation**.

Example:

```text
Initial stock = 10

Customer submits:
Quantity = 2

Stock remains:
10

Payment confirmed:

Stock becomes:
8
```

### Important unresolved question

The owner must confirm whether stock is tracked independently by:

```text
Product
```

or:

```text
Product + Size
```

or:

```text
Product + Size + Color
```

Recommended model if applicable:

```text
Black T-Shirt
├── S
├── M
├── L
└── XL
```

and potentially:

```text
Black T-Shirt
├── S / Black
├── M / Black
├── L / Black
├── S / White
├── M / White
└── L / White
```

The final database model depends on this answer.

---

# 15. One-Month Purchase Request Rule

The current business assumption is that an unresolved purchase request may remain active for approximately **1 month**.

This needs clarification before implementation.

Recommended model:

```text
PENDING
   ↓
Waiting for owner/customer confirmation
   ↓
Expiration date
   ↓
EXPIRED
```

However, a one-month pending period is unusually long for inventory reservation.

Therefore:

> **A pending order should not automatically consume or permanently reserve stock for one month unless the owner explicitly requires this.**

Because stock is only reduced after payment, the system can preserve the request for history while keeping the stock available.

The final behavior must be confirmed with the owner.

---

# 16. Customer Management Through Order History

No customer account system is required.

The system can identify customers using their submitted contact information.

Example:

```text
Customer
Name: John Doe
WhatsApp: 628123456789

Order History
-----------------------------
#TSH-001
Black Tee
L
PAID

#TSH-017
White Tee
M
FULFILLED

#TSH-032
Black Tee
XL
REJECTED
```

This gives the owner customer context without requiring login/registration.

---

# 17. Admin Panel

## 17.1 Dashboard

Display:

- Total orders.
- Pending orders.
- Confirmed orders.
- Waiting payment.
- Paid orders.
- Fulfilled orders.
- Rejected/cancelled orders.
- Products out of stock.
- Recent orders.

---

## 17.2 Order Management

Admin can:

- View orders.
- Filter orders by status.
- Search order number.
- Search customer name.
- Search phone number.
- View order details.
- Change order status.
- Confirm payment.
- Reject/cancel order.
- Add internal notes.
- Open WhatsApp contact link.

---

## 17.3 Customer View

Admin can see:

- Customer name.
- WhatsApp/phone.
- Address.
- Total orders.
- Order history.
- Current order status.
- Previous purchases.

---

## 17.5 Blog / Content Management

Admin can:

- View posts.
- Create posts.
- Edit posts.
- Save posts as drafts.
- Publish posts.
- Unpublish/archive posts.
- Upload cover images.
- Manage publication metadata.
- Manage categories/tags if enabled.
- Associate posts with products if enabled.

---

## 17.4 Product Management

Admin can:

- Create product.
- Edit product.
- Upload product images.
- Add description.
- Set price.
- Configure variants.
- Configure stock.
- Mark product as available.
- Mark product as out of stock.
- Preserve historical products.

---

# 18. Database Design Recommendation

Initial schema:

```text
admins
------
id
name
email
password_hash
created_at
updated_at
```

```text
customers
---------
id
name
phone
email
address
created_at
updated_at
```

```text
blog_posts
----------
id
title
slug
excerpt
content
cover_image_url
status
published_at
created_at
updated_at
author_id

blog_categories
---------------
id
name
slug
created_at
updated_at

products
--------
id
name
slug
description
price
status
release_date
created_at
updated_at
```

```text
product_images
--------------
id
product_id
url
sort_order
created_at
```

```text
product_variants
----------------
id
product_id
size
color
sku
stock
created_at
updated_at
```

```text
orders
------
id
order_number
customer_id
status
total_amount
expires_at
notes
created_at
updated_at
```

```text
order_items
-----------
id
order_id
product_variant_id
quantity
unit_price
subtotal
created_at
```

```text
order_status_history
--------------------
id
order_id
old_status
new_status
changed_by
created_at
```

The exact variant structure should be adjusted after the owner confirms whether inventory is tracked by size, color, or size + color.

---

# 19. REST API Recommendation

## Public

```http
GET /api/products
GET /api/products/:slug
GET /api/blog
GET /api/blog/:slug
POST /api/orders
```

## Admin

```http
POST /api/admin/login

GET /api/admin/orders
GET /api/admin/orders/:id
PATCH /api/admin/orders/:id/status

GET /api/admin/customers
GET /api/admin/customers/:id

POST /api/admin/products
GET /api/admin/products
GET /api/admin/products/:id
PATCH /api/admin/products/:id
DELETE /api/admin/products/:id

GET /api/admin/dashboard

GET /api/admin/blog
POST /api/admin/blog
GET /api/admin/blog/:id
PATCH /api/admin/blog/:id
DELETE /api/admin/blog/:id
```

The exact endpoint naming can change with the selected framework.

---

# 20. UI Component Breakdown

## Public

```text
Navbar
Hero
FeaturedProducts
ProductCard
ProductGrid
ProductFilters
ProductDetail
VariantSelector
QuantitySelector
BlogCard
BlogGrid
BlogDetail
OrderForm
OrderSummary
OrderConfirmation
Footer
```

## Admin

```text
AdminSidebar
DashboardCards
OrderTable
OrderFilters
OrderDetail
CustomerProfile
CustomerOrderHistory
ProductTable
ProductForm
VariantManager
InventoryManager
StatusBadge
ConfirmationModal
```

---

# 21. UX Requirements

## Customer

The order process should be short.

Recommended:

```text
Product
→ Variant
→ Quantity
→ Customer Data
→ Review
→ Submit
```

After submission:

> **Pesanan berhasil dikirim.**

Then clearly explain:

> Pesanan kamu sedang diproses. Admin akan menghubungi kamu melalui WhatsApp untuk konfirmasi dan instruksi pembayaran.

Do not imply that payment has occurred.

---

# 22. Order Confirmation

Generate a unique order number.

Example:

```text
TSH-2026-000123
```

Customer confirmation should include:

- Order number.
- Product.
- Variant.
- Quantity.
- Customer name.
- Current status.
- Next step.
- WhatsApp contact information if applicable.

---

# 23. Edge Cases

The system should handle at least:

### Product

- Product becomes out of stock while customer is viewing it.
- Product is deleted/archived after being ordered.
- Product price changes after an order is submitted.
- Variant becomes unavailable.
- Product has no active variants.

### Blog

- Draft post is accidentally published.
- Published post is unpublished.
- Blog post slug changes after publication.
- Cover image is missing.
- Post contains unsafe rich text.
- Post has a future publication date.
- Related product becomes out of stock.
- Deleted/archived product is referenced by a post.

### Orders

- Customer submits the same order twice.
- Customer refreshes after submission.
- Network fails after customer clicks submit.
- Customer submits invalid quantity.
- Customer submits unavailable variant.
- Customer submits an order for an out-of-stock product.
- Owner rejects an order.
- Owner cancels an order.
- Order expires.
- Payment is confirmed after expiration.
- Payment is received but admin has not updated status.
- Multiple admin actions occur simultaneously.

### Inventory

- Two customers submit requests for the final available item.
- Stock reaches zero.
- Stock is manually adjusted by admin.
- Payment is confirmed twice.
- Admin accidentally changes status backward.

### Security

- Bot submits thousands of requests.
- User modifies price in frontend request.
- User modifies product ID.
- User attempts to manipulate quantity.
- Unauthorized user accesses admin endpoints.
- User attempts to access another order by changing an ID.
- Sensitive customer information is exposed publicly.

---

# 24. Security Review

Minimum requirements:

- Passwords must be securely hashed.
- Admin endpoints require authentication.
- Authorization must be enforced server-side.
- Customer data must not be publicly searchable.
- API input must be validated server-side.
- Rate limiting on order submission.
- CAPTCHA/bot verification.
- CSRF protection where applicable.
- Secure cookies/session handling.
- HTTPS in production.
- Avoid exposing internal database IDs where unnecessary.
- Audit important order status changes.
- Never trust frontend price/stock/status values.
- Sanitize rich-text blog content to prevent XSS.
- Validate uploaded blog images and file types.
- Protect blog publishing/admin operations with authorization.

---

# 25. Performance & Scalability

This project does not initially require complex infrastructure.

Recommended:

```text
Next.js
+
PostgreSQL
+
Object/image storage
```

For a small limited T-shirt brand, a monolithic application is preferred.

Avoid initially:

- Microservices.
- Kubernetes.
- Event-driven architecture.
- Separate order service.
- Separate inventory service.
- Complex message queues.

The system should be designed so those can be introduced later only if actual scale requires them.

---

# 26. Accessibility

Minimum:

- Semantic HTML.
- Keyboard navigation.
- Visible focus states.
- Proper form labels.
- Accessible error messages.
- Sufficient text contrast.
- Alt text for product images.
- Buttons should have clear labels.
- Avoid relying only on color for stock/status indicators.

---

# 27. SEO

SEO is relevant because the catalogue may also serve as a public brand/product archive.

Recommended:

- SEO-friendly product URLs.
- Product titles and descriptions.
- Metadata.
- Open Graph metadata.
- Sitemap.
- Robots configuration.
- Proper heading structure.
- Optimized product images.
- Structured data where appropriate.
- Article metadata and structured data for blog posts where applicable.
- SEO-friendly blog URLs.

Out-of-stock historical products can remain indexable if the owner wants the catalogue to function as a brand archive.

---

# 28. Analytics & Monitoring

Recommended MVP analytics:

- Page views.
- Product views.
- Order form starts.
- Order submissions.
- Order submission failures.
- Orders by product.
- Orders by variant.
- Conversion from product view → order request.
- Blog post views.
- Blog → product click-through where relevant.

Admin monitoring:

- Failed order requests.
- Spam/rejected requests.
- Server errors.
- Payment/status updates.

---

# 29. Testing Strategy

## Unit Tests

Test:

- Price calculation.
- Quantity validation.
- Stock validation.
- Duplicate detection.
- Order status transitions.
- Expiration logic.

## Blog Tests

Test:

- Draft posts are not publicly visible.
- Published posts are publicly accessible.
- Archived post behavior is correct.
- Slug routing works.
- Rich-text content is sanitized.
- Cover image upload validation works.
- Related product links handle out-of-stock/archived products.

## Integration Tests

Test:

```text
Product
→ Order
→ Admin
→ Payment confirmation
→ Stock deduction
```

## Security Tests

Test:

- Unauthorized admin access.
- Manipulated price.
- Manipulated quantity.
- Invalid product ID.
- Bot/spam submission.
- Duplicate requests.

## E2E Test

Main successful flow:

```text
Customer opens product
→ selects variant
→ submits order
→ admin sees order
→ admin confirms
→ customer pays manually
→ admin marks PAID
→ stock decreases
```

---

# 30. MoSCoW Prioritization

## Must Have

- Product catalogue.
- Product detail page.
- Multiple products/designs.
- Historical/out-of-stock products.
- Size selection.
- Color support if applicable.
- Guest ordering.
- Customer data collection.
- Order creation.
- Admin authentication.
- Admin order management.
- Order status.
- Manual payment status.
- Stock management.
- Stock reduction after payment confirmation.
- Order history.
- Rate limiting.
- Duplicate detection.
- Bot protection.
- Server-side validation.

## Should Have

- Blog / Journal listing and detail pages if the owner intends to actively publish brand content.
- Basic blog admin CRUD and publishing workflow.
- WhatsApp contact shortcut.
- Customer search.
- Order filters.
- Product search.
- Dashboard statistics.
- Order status history.
- Product release/drop information.
- Image optimization.
- Basic analytics.

## Could Have

- Customer notifications.
- Email notifications.
- Wishlist.
- Product waitlist.
- Restock notification.
- Advanced analytics.
- Discount codes.
- Promotional landing pages.

## Won't Have in MVP

- Payment gateway.
- Customer account system.
- Customer login.
- Customer dashboard.
- Wallet.
- Loyalty points.
- Marketplace features.
- Complex cart system.
- Mobile application.

These can be reconsidered if the owner requests them.

---

# 31. Competitor Analysis

The relevant alternatives are not necessarily direct software competitors.

## Current Alternatives

### Instagram / TikTok + WhatsApp

Advantages:

- Already used by many brands.
- No development cost.
- Direct communication.

Problems:

- Order data becomes scattered.
- Difficult to manage inventory.
- Difficult to maintain historical product catalogue.
- Difficult to search customer history.
- Manual order processing becomes increasingly difficult.

### Marketplace

Advantages:

- Built-in payment.
- Existing customer traffic.
- Established checkout.

Problems:

- Less control over brand experience.
- Platform fees.
- Limited custom catalogue/history experience.
- May not fit the brand's limited-drop presentation.

### Custom Catalogue + Order System

Advantages:

- Full brand control.
- Structured order data.
- Custom product history.
- Owner controls payment process.
- Can be intentionally simple.

Disadvantages:

- Requires development and maintenance.
- Does not automatically generate traffic.
- Owner still needs to manually verify/payment-process orders.

### Conclusion

The website should primarily solve **organization, presentation, and order management**, not attempt to compete with large e-commerce platforms.

---

# 32. Feature Gap Analysis

Potential future gaps:

| Gap | MVP? | Future |
|---|---:|---:|
| Online payment | No | Optional |
| Customer account | No | Optional |
| WhatsApp automation | No | Optional |
| Email notification | No | Optional |
| Restock notification | No | Possible |
| Waitlist | No | Possible |
| Discount code | No | Possible |
| Shipping integration | No | Possible |
| Analytics dashboard | Basic | Advanced |
| Inventory reservation | Basic | Advanced |
| Multi-admin roles | No | Possible |

---

# 33. Engineering Complexity Estimate

Assuming a single developer and standard web stack:

| Module | Complexity |
|---|---|
| Public catalogue | Low |
| Product detail | Low |
| Guest order form | Low |
| Admin authentication | Low |
| Order management | Medium |
| Inventory | Medium |
| Variant management | Medium |
| Anti-spam | Medium |
| Customer history | Low |
| Manual payment status | Low |
| Analytics | Low |
| Historical catalogue | Low |
| Blog / Journal | Low–Medium |
| Blog CMS / publishing | Medium |
| Deployment | Low–Medium |

### Overall MVP

**Medium complexity.**

The technically risky part is not the catalogue. It is the combination of:

```text
Order lifecycle
+
Inventory consistency
+
Duplicate/spam prevention
+
Payment confirmation
```

---

# 34. Business Risks

## Risk 1 — Fake Orders

Mitigation:

- Rate limiting.
- CAPTCHA/bot protection.
- Honeypot.
- Duplicate detection.
- Manual WhatsApp confirmation.

## Risk 2 — Inventory Conflicts

Mitigation:

- Server-side stock validation.
- Do not permanently reduce stock before payment.
- Database transaction when payment confirmation reduces stock.

## Risk 3 — Scope Creep

The owner may later request:

- Payment gateway.
- Customer accounts.
- Shipping automation.
- Promotions.
- Notifications.
- Advanced reporting.

Mitigation:

> Treat this PRD as a baseline. Owner-requested changes must be classified as MVP, Phase 2, or Phase 3 before development.

## Risk 4 — One-Month Pending Orders

A one-month request period could create operational confusion.

Mitigation:

- Preserve order history.
- Define expiration rules.
- Do not permanently deduct stock until payment.
- Confirm the owner's exact policy before implementation.

---

# 35. Solo Founder Optimization

The system should be intentionally simple to build and maintain.

Recommended:

```text
One application
+
One database
+
One admin panel
+
Simple REST API
```

Avoid premature architecture.

The developer should prioritize:

1. Customer ordering works.
2. Owner can manage orders.
3. Inventory remains correct.
4. Spam is reasonably controlled.
5. Payment confirmation is simple.
6. Historical catalogue works.

Do not spend MVP effort on features that do not improve those outcomes.

---

# 36. Recommended Technical Stack

The final stack can be adjusted based on the developer's environment.

Suggested:

### Frontend / Full-stack

- Next.js
- TypeScript
- Tailwind CSS

### Database

- PostgreSQL

### ORM

- Prisma or equivalent

### Authentication

- Secure admin authentication.

### Image Storage

- S3-compatible object storage or equivalent.

### Bot Protection

- Cloudflare Turnstile or equivalent.

### Hosting

- VPS / managed hosting appropriate for expected traffic.

The project does not require microservices for the expected MVP scope.

---

# 37. Roadmap

## Phase 1 — MVP

### Customer

- Homepage.
- Catalogue.
- Product detail.
- Blog / Journal listing.
- Blog / Journal detail.
- Variant selection.
- Guest order form.
- Order confirmation.

### Admin

- Login.
- Dashboard.
- Product management.
- Variant/stock management.
- Order management.
- Customer order history.
- Payment confirmation.

### Protection

- Rate limiting.
- Honeypot.
- CAPTCHA/bot protection.
- Duplicate detection.
- Server-side validation.

---

## Phase 2

Possible:

- Automated WhatsApp notifications.
- Email notifications.
- Restock notifications.
- Waitlist.
- Advanced analytics.
- Better inventory reservation.
- Shipping management.
- Multiple admin roles.

---

## Phase 3

Only if business demand justifies it:

- Payment gateway.
- Customer accounts.
- Automated fulfilment.
- Loyalty system.
- Advanced CRM.
- Multi-channel inventory.
- Mobile application.

---

# 38. Release Checklist

## Product

- [ ] All products configured.
- [ ] Historical products configured.
- [ ] Product images uploaded.
- [ ] Sizes configured.
- [ ] Colors configured.
- [ ] Stock rules confirmed.
- [ ] Pricing confirmed.

## Ordering

- [ ] Guest order works.
- [ ] Validation works.
- [ ] Duplicate detection works.
- [ ] Spam protection works.
- [ ] Order number generated.
- [ ] Confirmation page works.

## Admin

- [ ] Admin login works.
- [ ] Orders visible.
- [ ] Customer history visible.
- [ ] Product management works.
- [ ] Stock management works.
- [ ] Payment status can be updated.
- [ ] Order status history works.

## Inventory

- [ ] Stock cannot become negative.
- [ ] Stock is reduced only after payment confirmation.
- [ ] Concurrent order scenarios tested.
- [ ] Manual stock adjustments audited.

## Security

- [ ] HTTPS enabled.
- [ ] Admin routes protected.
- [ ] API authorization tested.
- [ ] Rate limiting enabled.
- [ ] Bot protection enabled.
- [ ] Sensitive customer data protected.

## SEO

- [ ] Metadata.
- [ ] Sitemap.
- [ ] Robots.
- [ ] Product URLs.
- [ ] Open Graph.

## Production

- [ ] Environment variables configured.
- [ ] Database backup strategy configured.
- [ ] Error monitoring configured.
- [ ] Domain configured.
- [ ] Mobile responsive testing completed.

---

# 39. Open Questions for Owner

These questions must be answered before final implementation.

### Inventory

1. Is stock tracked per product only?
2. Or per size?
3. Or per size + color?
4. Can customers order multiple variants in one order?

### Order

5. Is there a maximum quantity per customer/order?
6. Can customers submit another order while they already have a pending order?
7. How should duplicate orders be handled?
8. Should pending orders expire after 1 month?
9. What exactly happens when an order expires?

### Payment

10. Which manual payment method/bank will be used?
11. Does the owner want customers to upload payment proof?
12. Or will payment always be confirmed manually by the owner through WhatsApp?

### Customer

13. Which customer information is mandatory?
14. Is full shipping address required at the first order?
15. Does the owner need email?

### Catalogue

16. Should all historical designs remain permanently visible?
17. Should historical designs display their original price?
18. Should customers be able to filter by collection/drop?
19. Does each product have a release date?

### Blog / Journal

20. What type of content will be published?
21. Should the section be called Blog, Journal, Stories, News, or another brand-specific name?
22. Does the owner need categories/tags?
23. Does the owner need multiple authors?
24. Should posts support related products?
25. Does the owner need scheduled publishing?
26. Should the blog launch with existing content?

### Admin

27. Will there be one admin or multiple admins?
28. Does the owner need different admin permissions?
29. Does the owner need export to Excel/CSV?

---

# 40. Requirement Change Policy

This document is intentionally a **living PRD**.

The current requirements represent the best-known understanding of the business at this stage.

If the owner requests a change:

```text
Owner Request
     ↓
Identify affected requirement
     ↓
Evaluate business value
     ↓
Evaluate technical impact
     ↓
Evaluate development effort
     ↓
Evaluate impact on existing order/inventory rules
     ↓
Classify:
MVP / Phase 2 / Phase 3 / Reject
     ↓
Update PRD
     ↓
Implement
```

### Important

Do not automatically implement every new request.

Each request should be evaluated against:

- Business value.
- Customer value.
- Revenue impact.
- Operational benefit.
- Development cost.
- Maintenance cost.
- Security implications.
- Inventory/order consistency.
- Scope impact.

---

# 41. Final Product Definition

The MVP can be summarized as:

```text
              LIMITED T-SHIRT BRAND
                       │
                       ▼
                PUBLIC CATALOGUE
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
        CURRENT DROP       PAST DESIGNS
             │                   │
             ▼                   ▼
       AVAILABLE          OUT OF STOCK
             │
             ▼
        GUEST ORDER
             │
             ▼
     ANTI-SPAM + VALIDATION
             │
             ▼
       PENDING REQUEST
             │
             ▼
       OWNER REVIEWS
             │
             ▼
      WHATSAPP CONTACT
             │
             ▼
       MANUAL PAYMENT
             │
             ▼
      PAYMENT CONFIRMED
             │
             ▼
       STOCK REDUCED
             │
             ▼
            PAID
             │
             ▼
         FULFILLED
```

### MVP Positioning

> **A branded limited T-shirt catalogue and brand journal with guest purchase requests, manual WhatsApp payment confirmation, customer order history, and controlled inventory.**

The system should remain deliberately smaller than a conventional e-commerce platform unless real business requirements justify expanding it.
