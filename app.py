import os
import secrets
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("DROPFlow_DB_PATH", BASE_DIR / "dropflow.db"))
ADMIN_API_KEY = os.environ.get("DROPFlow_ADMIN_API_KEY", "")
MAX_ORDER_ITEMS = 30

app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024
CORS(app, resources={r"/api/*": {"origins": os.environ.get("DROPFlow_ALLOWED_ORIGINS", "*").split(",")}})

SEED_PRODUCTS = [
    (1, "Sculpted Ceramic Vase", "Home", 899, 420, "🏺", "#f2e7d9", "BESTSELLER", "A warm, minimal accent for any shelf."),
    (2, "Everyday Wireless Buds", "Tech", 1499, 780, "🎧", "#e5eaf2", "TRENDING", "A compact everyday audio companion."),
    (3, "Cloud Desk Lamp", "Home", 1299, 650, "💡", "#f5efcf", "STAFF PICK", "Soft light for your desk and bedside."),
    (4, "Canvas Weekend Tote", "Lifestyle", 699, 300, "👜", "#e8e5d8", "EASY GIFT", "A simple carry-all for daily plans."),
    (5, "Portable Mini Speaker", "Tech", 1199, 610, "🔊", "#e5e0f0", "POPULAR", "Bring your playlist along for the day."),
    (6, "Insulated Travel Bottle", "Lifestyle", 549, 240, "🥤", "#dcebe1", "EVERYDAY", "A reusable bottle for busy routines."),
    (7, "Soft Knit Cushion", "Home", 799, 380, "🛋️", "#f2dfd7", "COZY PICK", "Add a softer layer to your space."),
    (8, "Foldable Phone Stand", "Tech", 399, 150, "📱", "#e2e9e8", "BUDGET FIND", "Keep your screen at a comfortable angle."),
]

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price INTEGER NOT NULL CHECK(price >= 0),
            supplier_cost INTEGER NOT NULL CHECK(supplier_cost >= 0),
            emoji TEXT NOT NULL,
            bg TEXT NOT NULL,
            tag TEXT NOT NULL,
            description TEXT NOT NULL,
            active INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number TEXT NOT NULL UNIQUE,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            store_name TEXT NOT NULL,
            items_json TEXT NOT NULL,
            subtotal INTEGER NOT NULL CHECK(subtotal >= 0),
            status TEXT NOT NULL DEFAULT 'pending_demo',
            payment_status TEXT NOT NULL DEFAULT 'not_connected',
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
        """)
        count = conn.execute("SELECT COUNT(*) AS n FROM products").fetchone()["n"]
        if count == 0:
            conn.executemany("""INSERT INTO products
                (id,name,category,price,supplier_cost,emoji,bg,tag,description)
                VALUES (?,?,?,?,?,?,?,?,?)""", SEED_PRODUCTS)

def product_json(row):
    return {
        "id": row["id"], "name": row["name"], "category": row["category"],
        "price": row["price"], "cost": row["supplier_cost"], "emoji": row["emoji"],
        "bg": row["bg"], "tag": row["tag"], "desc": row["description"]
    }

@app.after_request
def security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    return response

@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")

@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "DropFlow API"})

@app.get("/api/products")
def list_products():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM products WHERE active=1 ORDER BY id").fetchall()
    return jsonify({"products": [product_json(r) for r in rows]})

@app.post("/api/orders")
def create_order():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Send a JSON request body."}), 400

    customer_name = str(data.get("customer_name", "")).strip()
    customer_email = str(data.get("customer_email", "")).strip().lower()
    store_name = str(data.get("store_name", "DropFlow Demo")).strip()[:80]
    items = data.get("items")

    if not customer_name or len(customer_name) > 100:
        return jsonify({"error": "A customer name (1–100 characters) is required."}), 400
    if len(customer_email) > 254 or "@" not in customer_email or "." not in customer_email.split("@")[-1]:
        return jsonify({"error": "Enter a valid email address."}), 400
    if not isinstance(items, list) or not items or len(items) > MAX_ORDER_ITEMS:
        return jsonify({"error": f"Choose between 1 and {MAX_ORDER_ITEMS} item lines."}), 400

    clean_items = []
    subtotal = 0
    quantities = {}
    for item in items:
        if not isinstance(item, dict):
            return jsonify({"error": "Each item must be an object."}), 400
        try:
            product_id = int(item.get("product_id"))
            quantity = int(item.get("quantity"))
        except (TypeError, ValueError):
            return jsonify({"error": "Product IDs and quantities must be integers."}), 400
        if quantity < 1 or quantity > 50:
            return jsonify({"error": "Quantity must be between 1 and 50."}), 400
        quantities[product_id] = quantities.get(product_id, 0) + quantity
    if any(q > 50 for q in quantities.values()):
        return jsonify({"error": "Maximum quantity per product is 50."}), 400

    import json
    with get_db() as conn:
        for product_id, quantity in quantities.items():
            product = conn.execute("SELECT id,name,price FROM products WHERE id=? AND active=1", (product_id,)).fetchone()
            if product is None:
                return jsonify({"error": f"Product {product_id} is unavailable."}), 400
            line_total = product["price"] * quantity
            subtotal += line_total
            clean_items.append({
                "product_id": product["id"], "name": product["name"],
                "unit_price": product["price"], "quantity": quantity,
                "line_total": line_total
            })
        if subtotal > 10_000_000:
            return jsonify({"error": "Order total is too high."}), 400
        order_number = "DF-" + secrets.token_hex(4).upper()
        created_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
        conn.execute("""INSERT INTO orders
            (order_number,customer_name,customer_email,store_name,items_json,subtotal,status,payment_status,created_at)
            VALUES (?,?,?,?,?,?,?,?,?)""",
            (order_number, customer_name, customer_email, store_name,
             json.dumps(clean_items, ensure_ascii=False), subtotal, "pending_demo",
             "not_connected", created_at))
    return jsonify({
        "message": "Demo order saved. No payment was collected.",
        "order": {"order_number": order_number, "subtotal": subtotal,
                  "status": "pending_demo", "payment_status": "not_connected",
                  "created_at": created_at}
    }), 201

@app.get("/api/admin/orders")
def admin_orders():
    # Set DROPFlow_ADMIN_API_KEY before exposing the app. No insecure default admin key.
    if not ADMIN_API_KEY:
        return jsonify({"error": "Admin API is disabled. Configure DROPFlow_ADMIN_API_KEY."}), 503
    supplied = request.headers.get("X-Admin-Key", "")
    if not secrets.compare_digest(supplied, ADMIN_API_KEY):
        return jsonify({"error": "Unauthorized"}), 401
    import json
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM orders ORDER BY id DESC LIMIT 200").fetchall()
    result = []
    for r in rows:
        result.append({
            "order_number": r["order_number"], "customer_name": r["customer_name"],
            "customer_email": r["customer_email"], "store_name": r["store_name"],
            "items": json.loads(r["items_json"]), "subtotal": r["subtotal"],
            "status": r["status"], "payment_status": r["payment_status"],
            "created_at": r["created_at"]
        })
    return jsonify({"orders": result})

@app.errorhandler(413)
def too_large(_error):
    return jsonify({"error": "Request body is too large."}), 413

@app.errorhandler(404)
def not_found(_error):
    if request.path.startswith("/api/"):
        return jsonify({"error": "API route not found."}), 404
    return "Not found", 404

init_db()

if __name__ == "__main__":
    # Local development only. Use a production WSGI server when deploying.
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
