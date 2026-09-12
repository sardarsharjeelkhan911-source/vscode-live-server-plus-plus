# MyStore (Local-First E-commerce App)

MyStore is a complete beginner-friendly e-commerce web application built with **HTML, CSS, and JavaScript**. It runs locally with VS Code Live Server and uses **localStorage** for data persistence.

## 1) Run in VS Code

1. Open this repository in VS Code.
2. Install the **Live Server** extension (if not installed).
3. Right-click `index.html` and select **Open with Live Server**.
4. Serve over HTTP (`http://...`) when testing; do not open pages with `file://` because ES module imports require an HTTP server.
5. Use these pages:
   - `index.html` (home)
   - `shop.html` (catalog)
   - `product.html?id=<productId>`
   - `cart.html`
   - `checkout.html`
   - `tracking.html`
   - `admin.html`

## 2) Add Products

1. Open `admin.html` and login.
2. Use **Product Management** form:
   - name, image URL/path, category, price, discount, stock, description.
3. Click **Save Product**.
4. Product appears in storefront immediately.

## 3) COD Checkout Flow

- Add products to cart from home/shop/product pages.
- Open `checkout.html`.
- Fill customer details (name, phone, email, city, full address).
- Click **Place Order**.
- System validates required fields and phone format, checks stock, generates a unique order ID, updates stock, saves order/customer, and shows confirmation with status **Pending**.

## 4) Admin Login (Demo Credentials)

Demo local credentials are managed in `js/auth.js`.

- Username is `admin`.
- Password is auto-generated on first run and shown on the `admin.html` login card.
- Credentials are stored locally in `mystore.admin.credentials` and can be cleared/reset from browser localStorage.

Session is persisted in localStorage (`mystore.admin.session`).

## 5) Real TCS API Integration Points

`js/tcs-api.js` contains mock functions ready for replacement:

- `createShipment(order)`
- `getTrackingStatus(trackingNumber)`
- `cancelShipment(trackingNumber)`

Add real endpoint URLs and credentials via a secure backend/environment layer. Do not expose real credentials in frontend code.

## 6) Deploy to GitHub Pages

1. Push repository to GitHub.
2. In repository settings, open **Pages**.
3. Select deploy source (branch: `main`, folder: `/ (root)`).
4. Save and wait for publish.
5. Open the generated Pages URL.

## Project Structure

```
/
├── index.html
├── shop.html
├── product.html
├── cart.html
├── checkout.html
├── tracking.html
├── admin.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── products.js
│   ├── cart.js
│   ├── checkout.js
│   ├── orders.js
│   ├── customers.js
│   ├── auth.js
│   ├── storage.js
│   └── tcs-api.js
└── assets/
    └── placeholder.svg
```
