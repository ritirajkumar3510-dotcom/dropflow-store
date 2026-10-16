# DropFlow — Frontend + Backend starter

This package contains a responsive storefront demo and a Python Flask + SQLite API.

## Run on Windows
1. Install Python 3.10+ from https://www.python.org/downloads/ (enable “Add Python to PATH”).
2. Extract this ZIP.
3. Double-click `run_windows.bat`. It installs dependencies and starts the local server.
4. Open http://127.0.0.1:5000

If `py` is not recognized, open a terminal in this folder and run:
`python -m pip install -r requirements.txt`
then `python app.py`.

## API
- `GET /health` — health check
- `GET /api/products` — active product list
- `POST /api/orders` — validate and save a demo order
- `GET /api/admin/orders` — admin order list, requires `X-Admin-Key`

Example order request:
```json
{
  "customer_name": "Demo Customer",
  "customer_email": "customer@example.com",
  "store_name": "My Store",
  "items": [
    {"product_id": 1, "quantity": 2},
    {"product_id": 4, "quantity": 1}
  ]
}
```

## Configure admin access
Set an unpredictable `DROPFlow_ADMIN_API_KEY` environment variable before running the server. Example in PowerShell:
`$env:DROPFlow_ADMIN_API_KEY = "replace-with-a-long-random-secret"`
Do not share the key or place it in frontend JavaScript. The admin endpoint is disabled when no key is configured.

## Important limitations
- Product data and prices are sample data; supplier costs/margins are illustrative.
- Orders are saved as `pending_demo`; no payment is collected and no supplier is notified.
- No customer login, shipping integration, email notifications, refunds, taxes, or real payment gateway is included.
- Do not expose this development server publicly as-is. Before production, add proper authentication, HTTPS, rate limiting, privacy/terms pages, monitoring, backups, and a real payment provider integration.
- Use `waitress-serve --listen=127.0.0.1:5000 app:app` if you want to run with Waitress locally. For public deployment, configure a suitable production host and environment variables.
