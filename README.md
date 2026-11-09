# BellaStyle.mk

BellaStyle.mk is an online fashion shop for browsing clothing, choosing sizes, and placing cash-on-delivery orders.

## Features

- Product catalogue with category filters and size selection
- Shopping cart and checkout for North Macedonia, Kosovo, and Albania
- Cash-on-delivery order flow with shipping estimates
- Customer accounts, order history, and password updates
- Admin dashboard for products, orders, and stock
- Two-factor authentication for administrator accounts
- Optional transactional email notifications

## Technology

- HTML, CSS, and vanilla JavaScript
- Node.js HTTP server
- PostgreSQL with the `pg` driver; local JSON-backed storage is available for development
- Render deployment configuration

## Run locally

Requires Node.js 18 or newer.

```sh
npm install
npm start
```

Open <http://localhost:3000>.

For production, configure the required environment variables in the hosting service: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `MFA_ENCRYPTION_KEY`. Optional email delivery uses `RESEND_API_KEY` and `EMAIL_FROM`. Keep credentials and customer data out of Git.

## Project structure

- `index.html` — storefront markup and styles
- `app.js` — storefront, cart, customer account, and admin UI interactions
- `server.js` — HTTP server and application API
- `store.js` — PostgreSQL and local data-store implementations
- `mfa.js` — time-based two-factor authentication utilities
- `catalog.json` and `products/` — product catalogue data and images
- `render.yaml` — Render service and database configuration

