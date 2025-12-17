# 🚀 Order Engine (DEX Routing + WebSocket Streaming)

A production-style backend service that simulates a real-world **crypto order execution engine** with:

* Smart DEX routing (Raydium vs Meteora)
* Concurrent order execution using queues
* Real-time order lifecycle streaming via WebSockets
* Redis-backed active order tracking
* PostgreSQL-backed order & failure history

This project is intentionally designed to resemble **how real trading / execution systems are built**, not just a demo app.

---

## 🧠 High-Level Architecture

```
Client
  │
  ├── HTTP (Create Order)
  │        ↓
  │   Fastify API
  │        ↓
  │   BullMQ Queue (Redis)
  │        ↓
  │   Order Worker (Concurrency + Retries)
  │        ↓
  │   PostgreSQL (Orders / Failures)
  │        ↓
  │   Redis (Active Orders)
  │        ↓
  └── WebSocket (Live Order Updates)
```

---

## ✨ Key Features

### 1️⃣ Order Types

(Current implementation: **Market Orders**)

* Immediate execution at best available price
* Designed to be extensible for:

  * Limit Orders
  * Sniper Orders

---

### 2️⃣ Smart DEX Routing

* Queries **Raydium** and **Meteora**
* Compares quotes
* Automatically routes to best price
* Logs routing decisions for transparency

```ts
[ROUTER] Selected raydium | Raydium=99.96 Meteora=97.88
```

---

### 3️⃣ HTTP → WebSocket Pattern

* Orders are created via HTTP
* Clients subscribe to live updates via WebSocket
* Same backend handles both protocols

**Flow:**

1. `POST /orders` → returns `orderId`
2. Client connects to:

   ```
   ws://localhost:3000/ws/orders?orderId=...
   ```
3. Server streams lifecycle updates

---

### 4️⃣ Real-Time Order Lifecycle Streaming

Order states are pushed live:

* `PENDING`
* `ROUTING`
* `BUILDING`
* `CONFIRMED`
* `FAILED`

Two WebSocket event types:

```ts
enum SocketEventType {
  SNAPSHOT = 'SNAPSHOT', // On connection
  EVENT = 'EVENT',       // Live updates
}
```

---

### 5️⃣ Active Orders (Redis)

* Redis stores **only in-flight orders**
* Ensures clients never miss updates
* Enables recovery after:

  * Server restarts
  * WebSocket reconnects

**Lifecycle:**

* Added to Redis when order is active
* Removed immediately on terminal state

```txt
active:order:{orderId}
```

---

### 6️⃣ Concurrent Processing & Rate Limiting

* BullMQ worker
* Configured for:

  * **10 concurrent orders**
  * **100 orders / minute**

```ts
concurrency: 10,
limiter: {
  max: 100,
  duration: 60_000,
}
```

---

### 7️⃣ Retry & Failure Handling

* Automatic retries with exponential backoff
* Max retries: **3 attempts**
* If still unsuccessful:

  * Order marked as `FAILED`
  * Failure reason persisted separately

📌 **Design choice:**
Failure reasons are stored in a **dedicated table**, not on the order row.

This avoids state ambiguity when retries later succeed.

---

## 🗄️ Data Model

### Orders Table

```sql
orders (
  id,
  token_in,
  token_out,
  amount,
  status,
  selected_dex,
  executed_price,
  tx_hash,
  created_at,
  updated_at
)
```

### Order Failures Table

```sql
order_failures (
  id,
  order_id,
  reason,
  created_at
)
```

---

## 🧩 Tech Stack

| Layer     | Technology                  |
| --------- | --------------------------- |
| Runtime   | Node.js + TypeScript        |
| API       | Fastify (WebSocket support) |
| Queue     | BullMQ + Redis              |
| Database  | PostgreSQL                  |
| Cache     | Redis                       |
| Messaging | WebSockets                  |

---

## 🧪 Running Locally

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Start Redis & PostgreSQL

```bash
brew services start redis
brew services start postgresql
```

### 3️⃣ Run migrations / create tables

```sql
CREATE TABLE orders (...);
CREATE TABLE order_failures (...);
```

### 4️⃣ Start the server

```bash
npm run dev
```

---

## 🔌 WebSocket Testing

Using `wscat`:

```bash
npm install -g wscat

wscat -c "ws://localhost:3000/ws/orders?orderId=ord_xxx"
```

You will receive:

* Initial `SNAPSHOT`
* Streaming `EVENT`s

---

## 🧠 Design Decisions (Why This Matters)

* **Redis Active Orders** instead of DB polling
* **In-memory WS map** + Redis snapshot (industry pattern)
* **Failure history decoupled from order state**
* **Queue-based execution** for backpressure & retries
* **WebSocket-first UX** for real-time trading workflows

This mirrors how real exchanges and execution engines operate.

---

## 🚧 Future Enhancements

* Redis Pub/Sub for multi-instance WS fanout
* Limit & Sniper orders
* Devnet integration (Raydium / Meteora)
* Order timeline API (merge DB + failures)
* Observability (metrics, tracing)

---

## 👨‍💻 Author

Built by **Shivanshu Tripathi**

Focus: Backend systems, queues, real-time architectures, and trading infra.

---

## ✅ Evaluation Checklist

✔ DEX routing & comparison
✔ WebSocket lifecycle streaming
✔ Queue-based concurrency
✔ Retry & failure persistence
✔ Redis active orders
✔ Clean code organization

---