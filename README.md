# 🚀 Order Engine (DEX Routing + WebSocket Streaming)

A production-style backend service that simulates a real-world **crypto order execution engine** with:

- Smart DEX routing (Raydium vs Meteora)
- Concurrent order execution using queues
- Real-time order lifecycle streaming via WebSockets
- Redis-backed active order tracking
- PostgreSQL-backed order & failure history

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

## 📋 API Contracts

### 🔗 Base URL
```
http://localhost:3000
```

---

### 🏥 Health Check

#### `GET /health-check`

**Response:**
```json
{
  "status": "ok"
}
```

---

### 📦 Orders API

#### 1. Create Order
**`POST /api/orders`**

**Request Body:**
```json
{
  "tokenIn": "SOL",
  "tokenOut": "USDC", 
  "amount": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to create order"
}
```

---

#### 2. List Orders
**`GET /api/orders?page=1&limit=20`**

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 20, max: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ord_550e8400-e29b-41d4-a716-446655440000",
      "tokenIn": "SOL",
      "tokenOut": "USDC",
      "amount": 100,
      "status": "confirmed",
      "selectedDex": "raydium",
      "executedPrice": 99.85,
      "txHash": "mock_tx_1734567890123",
      "createdAt": "2024-12-18T10:30:00.000Z",
      "updatedAt": "2024-12-18T10:30:15.000Z"
    }
  ],
  "paginate": {
    "totalCount": 1,
    "limit": 20
  }
}
```

---

#### 3. List Order Failures
**`GET /api/orders/failures?page=1&limit=20`**

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 20, max: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "orderId": "ord_550e8400-e29b-41d4-a716-446655440000",
      "reason": "DEX quote timeout",
      "createdAt": "2024-12-18T10:30:00.000Z",
      "updatedAt": "2024-12-18T10:30:00.000Z"
    }
  ],
  "paginate": {
    "totalCount": 1,
    "limit": 20
  }
}
```

---

### 🔌 WebSocket API

#### Order Updates Stream
**`ws://localhost:3000/ws/orders?orderId={orderId}`**

**Query Parameters:**
- `orderId` (required): The order ID to subscribe to

**Connection Response (Snapshot):**
```json
{
  "type": "snapshot",
  "orderId": "ord_550e8400-e29b-41d4-a716-446655440000",
  "status": "routing",
  "selectedDex": null,
  "executedPrice": null,
  "txHash": null
}
```

**Live Updates (Events):**
```json
{
  "type": "event",
  "orderId": "ord_550e8400-e29b-41d4-a716-446655440000", 
  "status": "building",
  "selectedDex": "raydium",
  "amount": 99.85
}
```

```json
{
  "type": "event",
  "orderId": "ord_550e8400-e29b-41d4-a716-446655440000",
  "status": "confirmed",
  "txHash": "mock_tx_1734567890123",
  "executedPrice": 99.85
}
```

**Error Cases:**
- Missing `orderId` → Connection closed immediately
- Invalid `orderId` → Only live updates (no snapshot)

---

### 🧪 WebSocket Test Endpoint
**`ws://localhost:3000/ws`**

**Connection Response:**
```json
{
  "msg": "connected"
}
```

**Echo Response:**
```json
{
  "echo": "your_message_here"
}
```

---

## 🔄 Order Status Lifecycle

| Status      | Description                           |
|-------------|---------------------------------------|
| `pending`   | Order created, queued for processing  |
| `routing`   | Comparing DEX quotes                  |
| `building`  | Building transaction                  |
| `submitted` | Transaction submitted to blockchain   |
| `confirmed` | Transaction confirmed on chain       |
| `failed`    | Order failed (see failures endpoint) |

---

## 🎯 Socket Event Types

| Type       | When                    | Contains                        |
|------------|-------------------------|---------------------------------|
| `snapshot` | On WebSocket connection | Current order state (if exists)|
| `event`    | Status updates          | Real-time order changes        |

---

## 📊 Data Types

### Order Object
```typescript
{
  id: string;                    // Order ID (ord_...)
  tokenIn: string;              // Input token symbol
  tokenOut: string;             // Output token symbol  
  amount: number;               // Input amount
  status: OrderStatus;          // Current order status
  selectedDex?: string | null;  // Chosen DEX (raydium/meteora)
  executedPrice?: number | null;// Final execution price
  txHash?: string | null;       // Transaction hash
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
}
```

### Order Failure Object
```typescript
{
  id: string;       // Failure record ID
  orderId: string;  // Related order ID
  reason: string;   // Failure reason
  createdAt: string;// ISO timestamp
  updatedAt: string;// ISO timestamp
}
```

---

## 🧪 Testing Examples

### Create Order with curl
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "SOL",
    "tokenOut": "USDC",
    "amount": 100
  }'
```

### WebSocket Connection with wscat
```bash
# Install wscat
npm install -g wscat

# Connect to order updates
wscat -c "ws://localhost:3000/ws/orders?orderId=ord_your_order_id"

# Test WebSocket echo
wscat -c "ws://localhost:3000/ws"
```

### List Orders with curl
```bash
curl "http://localhost:3000/api/orders?page=1&limit=10"
```

### List Failures with curl
```bash
curl "http://localhost:3000/api/orders/failures?page=1&limit=10"
```

---

## ✨ Key Features

### 1️⃣ Order Types

(Current implementation: **Market Orders**)

- Immediate execution at best available price
- Designed to be extensible for:
  - Limit Orders
  - Sniper Orders

---

### 2️⃣ Smart DEX Routing

- Queries **Raydium** and **Meteora**
- Compares quotes
- Automatically routes to best price
- Logs routing decisions for transparency

```ts
[ROUTER] Selected raydium | Raydium=99.96 Meteora=97.88
```

---

### 3️⃣ HTTP → WebSocket Pattern

- Orders are created via HTTP
- Clients subscribe to live updates via WebSocket
- Same backend handles both protocols

**Flow:**

1. `POST /api/orders` → returns `orderId`
2. Client connects to:
   ```
   ws://localhost:3000/ws/orders?orderId=...
   ```
3. Server streams lifecycle updates

---

### 4️⃣ Real-Time Order Lifecycle Streaming

Order states are pushed live:

- `PENDING`
- `ROUTING` 
- `BUILDING`
- `CONFIRMED`
- `FAILED`

Two WebSocket event types:

```ts
enum SocketEventType {
  SNAPSHOT = 'snapshot', // On connection
  EVENT = 'event',       // Live updates
}
```

---

### 5️⃣ Active Orders (Redis)

- Redis stores **only in-flight orders**
- Ensures clients never miss updates
- Enables recovery after:
  - Server restarts
  - WebSocket reconnects

**Lifecycle:**

- Added to Redis when order is active
- Removed immediately on terminal state

```txt
active:order:{orderId}
```

---

### 6️⃣ Concurrent Processing & Rate Limiting

- BullMQ worker
- Configured for:
  - **10 concurrent orders**
  - **100 orders / minute**

```ts
concurrency: 10,
limiter: {
  max: 100,
  duration: 60_000,
}
```

---

### 7️⃣ Retry & Failure Handling

- Automatic retries with exponential backoff
- Max retries: **3 attempts**
- If still unsuccessful:
  - Order marked as `FAILED`
  - Failure reason persisted separately

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
CREATE TABLE orders (
  id VARCHAR PRIMARY KEY,
  token_in VARCHAR NOT NULL,
  token_out VARCHAR NOT NULL,
  amount DECIMAL NOT NULL,
  status VARCHAR NOT NULL,
  selected_dex VARCHAR,
  tx_hash VARCHAR,
  executed_price DECIMAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_failures (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4️⃣ Set environment variables

Create `.env` file:
```env
PG_HOST=localhost
PG_USER=your_username
PG_PASSWORD=your_password
PG_DATABASE=order_engine
```

### 5️⃣ Start the server

```bash
npm run dev
```

---

## 🧠 Design Decisions (Why This Matters)

- **Redis Active Orders** instead of DB polling
- **In-memory WS map** + Redis snapshot (industry pattern)
- **Failure history decoupled from order state**
- **Queue-based execution** for backpressure & retries
- **WebSocket-first UX** for real-time trading workflows

This mirrors how real exchanges and execution engines operate.

---

## 🚧 Future Enhancements

- Redis Pub/Sub for multi-instance WS fanout
- Limit & Sniper orders
- Devnet integration (Raydium / Meteora)
- Order timeline API (merge DB + failures)
- Observability (metrics, tracing)

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
✔ Complete API documentation

---