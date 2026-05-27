# Hmong Clothes Shop

Vite + React storefront for reserving Hmong clothes and miscellaneous handmade items. Supabase is the source of truth for products, product notes, measurements, and reservation requests.

## Run

```bash
npm install
npm run dev
npm run build
```

On Windows PowerShell, use `npm.cmd run dev` if script execution policy blocks `npm`.

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

1. Push the app to a GitHub repository with `main` as the default branch.
2. In GitHub, open `Settings > Pages`.
3. Set `Build and deployment > Source` to `GitHub Actions`.
4. Add these repository secrets in `Settings > Secrets and variables > Actions`:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Every push to `main` will build `dist` and publish it to GitHub Pages.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Paste and run `supabase/schema-and-seed.sql`.
4. Add these Vite environment variables:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

5. Restart Vite after editing `.env`.

The public site can read available/reserved products and create reservation requests. Payment confirmation should be handled in Supabase first, or through a later authenticated admin screen.

## Current Flow

1. Customer clicks `Create Ticket`.
2. Customer enters name, email, phone, shipping address, payment method, and notes.
3. Supabase creates a reservation row.
4. A database trigger marks the product `reserved`.
5. Seller manually checks PayPal, Venmo, or Cash App.
6. Seller marks the reservation/product paid or sold in Supabase.
7. Sold items disappear from the public catalog.

EmailJS/FormSubmit can be added next to send one seller order email and one customer confirmation email after a reservation succeeds.

## Ticket Workflow

Ready-made tickets: created, waiting for payment verification, packed with USPS tracking, delivered, completed.

Custom or adjustment tickets: created, confirm measurements, crafting/adjustment, final photo approval, packed with USPS tracking, completed.

The current site stores ticket type and measurement notes in `reservations.customer_note` so it works with the existing database. A later admin dashboard can add dedicated columns for ticket status, tracking number, delivery status, and final product photos. USPS delivery updates can be automated later through a tracking API or shipping provider webhook.

## Account Access Direction

The easiest customer path should be call or text support. Many customers may not want to manage an online account, so keep a visible shop phone number and let the seller look up tickets manually.

Do not expose order details by email or phone number alone. For customers who want self-service, use email or phone verification through Supabase Auth OTP, then show only tickets attached to that verified user/contact.

Admin access should be separate from customer access. Store admin permission in server-controlled auth metadata or an admin profile table protected by Row Level Security. Do not store admin permission in customer-editable profile fields.
