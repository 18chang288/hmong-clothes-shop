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

1. Customer clicks `Reserve / Buy Request`.
2. Customer enters name, email, phone, shipping address, payment method, and notes.
3. Supabase creates a reservation row.
4. A database trigger marks the product `reserved`.
5. Seller manually checks PayPal, Venmo, or Cash App.
6. Seller marks the reservation/product paid or sold in Supabase.
7. Sold items disappear from the public catalog.

EmailJS/FormSubmit can be added next to send one seller order email and one customer confirmation email after a reservation succeeds.
