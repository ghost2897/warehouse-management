# NexStore — Enterprise Warehouse & Inventory Management System

A production-grade, full-stack Warehouse and Inventory Management System built with **React, Vite, Tailwind CSS, Node.js, Express.js**, and **MariaDB**.

The system utilizes `warehouse.sql` as the single source of truth for the database schema, relational foreign keys, and records (8 warehouses, 60 product SKUs, 480 inventory balances, 1,000 transfers, and 25 transport vehicles).

---

## Architecture Overview

```text
React Frontend (Vite + Tailwind CSS + Recharts + Lucide Icons)
       │ (HTTP REST / JSON / Proxied via Vite :3000)
       ▼
Node.js + Express.js API Server (:5000)
       │ (Connection Pooling & Transactions via mysql2/promise)
       ▼
MariaDB Database Engine (:3306)
       │ (Tables: warehouse, product, inventory, transfer, transfer_item, transport_vehicle)
```

---

## Key Features

1. **Operations Dashboard**:
   - Live KPI cards: Total Warehouses, Total Catalog Products, Total Stored Units, Total Logistical Transfers.
   - Warehouse Inventory vs. Capacity Bar Chart.
   - Stock by Category Donut Chart.
   - Critical Stock Item Alerts with instant threshold filtering.
   - Real-time recent transfer stream with visual status badges.

2. **Warehouse Management**:
   - Facility directory with capacity, total inventory, and utilization percentage indicators.
   - Interactive drilldown modal detailing stored product quantities and recent dispatch transfers per facility.
   - Search by facility ID, name, or city.

3. **Product Catalog**:
   - Comprehensive catalog of all 60 SKUs with pricing, categories, and aggregated global stock.
   - Stock distribution modal showing cross-warehouse allocation (e.g. W01 through W08 units).
   - Category filtering chips, search, and multi-column sorting.

4. **Inventory Matrix**:
   - Relational SQL JOIN view connecting products and warehouses with human-readable names.
   - Configurable Low-Stock Threshold (default: &le; 200 units).
   - Facility and category dropdown filtering.
   - Direct inline stock editing capabilities.

5. **Stock Transfers & Manifests**:
   - Multi-product transfer line item selection with live source warehouse stock availability checks.
   - Multi-state workflow: `PENDING` &rarr; `IN TRANSIT` &rarr; `COMPLETED` or `CANCELLED`.
   - Complete itemization manifest modal showing quantities, unit prices, and valuation.

6. **Transaction-Safe Stock Movement**:
   - When a transfer reaches `COMPLETED`, inventory is atomically deducted from the source facility and credited to the destination facility inside a MariaDB database transaction (`BEGIN`, `SELECT ... FOR UPDATE`, `UPDATE`, `COMMIT`).
   - Strict validation guarantees zero negative balances and rolls back (`ROLLBACK`) on any constraint failure.

7. **Transport Fleet Registry**:
   - Vehicle directory with partner names, vehicle types (`TRUCK`, `VAN`, `MINI TRUCK`), number plates, contacts, and insurance.
   - Vehicle trip log modal showing transfer history per vehicle.
   - Safe deletion prevention if a vehicle is referenced by active transfer records.

8. **Analytics & Intelligence**:
   - Capacity vs. Current Stock density comparative charts.
   - Top 10 Most Stocked Products.
   - Most Active Transfer Corridors (warehouse pairs by transfer frequency and volume).
   - Most Transferred Products derived from `transfer_item`.
   - Transfer Status Ratio visualization.

---

## Database Structure & Schema

The system connects to MariaDB and expects the `warehouse` database containing these 6 tables:

| Table | Primary Key | Foreign Keys / Notes |
|---|---|---|
| `warehouse` | `warehouse_id` | Facility name, location, rated capacity |
| `product` | `product_id` | Product name, category, price |
| `inventory` | `inventory_id` | `product_id` &rarr; `product`, `warehouse_id` &rarr; `warehouse`, `quantity` |
| `transfer` | `transfer_id` | `source_warehouse_id`, `destination_warehouse_id`, `transport_id`, `status`, `date` |
| `transfer_item` | `(transfer_id, product_id)` | Composite PK; `transfer_id` &rarr; `transfer`, `product_id` &rarr; `product`, `quantity` |
| `transport_vehicle` | `transport_id` | Fleet partner name, vehicle type, plate, contact, insurance |

---

## Prerequisites

- **Node.js**: v18.0.0 or later (tested on v26.8.2)
- **npm**: v9.0.0 or later
- **MariaDB**: v10.5+ or v13.0+ (tested on MariaDB 13.0.2)

---

## Database Configuration & Setup

### 1. Configure MariaDB User & Database
Log into your MariaDB server as administrator:

```bash
sudo mariadb
```

Execute the following commands to create the database and user:

```sql
CREATE DATABASE IF NOT EXISTS warehouse;

CREATE USER IF NOT EXISTS 'warehouse_app'@'localhost' IDENTIFIED BY 'YOUR_NEW_PASSWORD';
GRANT ALL PRIVILEGES ON warehouse.* TO 'warehouse_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Import `warehouse.sql`
Import the provided SQL dump into the `warehouse` database:

```bash
mariadb -u warehouse_app -p warehouse < warehouse.sql
```
*(Enter `YOUR_NEW_PASSWORD` when prompted).*

---

## Installation & Running the Application

### 1. Backend Setup

Navigate to the backend folder:
```bash
cd backend
npm install
```

Verify your environment configuration in `backend/.env`:
```env
DB_HOST=localhost
DB_USER=warehouse_app
DB_PASSWORD=YOUR_NEW_PASSWORD
DB_NAME=warehouse
DB_PORT=3306
PORT=5000
NODE_ENV=development
```

Run test suite to verify database connection and transaction integrity:
```bash
node test-backend.js
node test-transfer-transaction.js
```

Start the backend API server:
```bash
npm run dev
# or
npm start
```
The backend will launch on `http://localhost:5000`.

---

### 2. Frontend Setup

In a separate terminal, navigate to the frontend folder:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```

Open your browser at:
```text
http://localhost:3000
```
*(Vite proxies all `/api` requests directly to `http://localhost:5000`).*

---

## REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Summary counts, recent transfers, category share, and low-stock alerts |
| `GET` | `/api/analytics` | Deep aggregations: route frequency, top products, utilization rates |
| `GET` | `/api/warehouses` | List all warehouses with calculated inventory and utilization rates |
| `GET` | `/api/warehouses/:id` | Facility details with products stored and recent transfers |
| `POST`| `/api/warehouses` | Create a new warehouse facility |
| `PUT` | `/api/warehouses/:id` | Update warehouse details |
| `GET` | `/api/products` | List products with pagination, search, category filter, and sorting |
| `GET` | `/api/products/categories` | Get distinct product categories |
| `GET` | `/api/products/:id` | Product details with stock distribution across all 8 warehouses |
| `GET` | `/api/inventory` | Joined inventory records with search, low-stock filter, and threshold |
| `PUT` | `/api/inventory/:id` | Adjust inventory stock quantity |
| `GET` | `/api/transfers` | List transfers with filters (status, source, destination, date) |
| `GET` | `/api/transfers/:id` | Transfer manifest with line items and vehicle details |
| `POST`| `/api/transfers` | Create multi-item transfer with inventory checks |
| `PUT` | `/api/transfers/:id/status`| Update status (`PENDING` &rarr; `IN TRANSIT` &rarr; `COMPLETED`, `CANCELLED`) |
| `GET` | `/api/transport-vehicles`| List fleet vehicles with trips count and search |
| `GET` | `/api/transport-vehicles/:id`| Vehicle details with trip history |
| `POST`| `/api/transport-vehicles`| Register new transport vehicle |
| `PUT` | `/api/transport-vehicles/:id`| Update vehicle details |
| `DELETE`| `/api/transport-vehicles/:id`| Safe deletion with transfer reference check |

---

## How Inventory Transfers Work

```text
User creates Transfer (Source: W01, Destination: W02, Items: [P01 x 15])
                           │
                           ▼
                  Status: PENDING / IN TRANSIT
         (Stock remains untouched in source and destination)
                           │
                           ▼
                  Status: COMPLETED
                           │
             ┌─────────────┴─────────────┐
             │ MariaDB Transaction BEGIN │
             └─────────────┬─────────────┘
                           │
          1. Lock source row: SELECT ... FOR UPDATE
          2. Check availability: Available >= 15?
             (If not enough stock: ROLLBACK & return Error 400)
          3. Deduct from W01: UPDATE inventory SET qty = qty - 15
          4. Add to W02:      UPDATE inventory SET qty = qty + 15
          5. Mark transfer:   UPDATE transfer SET status = 'COMPLETED'
                           │
             ┌─────────────┴─────────────┐
             │ MariaDB Transaction COMMIT│
             └───────────────────────────┘
```

---

## License & Author
Built for Enterprise Warehouse Operations on Linux / CachyOS.
All rights reserved.

