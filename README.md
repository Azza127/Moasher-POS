# Moasher POS & Inventory Management System

Moasher POS is a modern, responsive Point of Sale (POS) and inventory management web application built using Angular 21. It provides an intuitive interface for store owners, managers, and employees to track product inventory, manage categories, handle sales orders, and configure store settings.

---

## 🌟 Key Features

- **Inventory Tracking**: Monitor stock levels in real time with visual status indicators for `optimal`, `low`, and `out of stock` levels.
- **Product Management**: Add, view, edit, and delete products, complete with fields for pricing, SKU, description, min/max stock thresholds, and product images.
- **Category Organization**: Group products into customizable categories. Manage categories directly or inline while adding new products.
- **Store Settings Configuration**: Manage default store details, including tax rates, currency, phone numbers, and addresses.
- **Sales & Orders Processing**: Maintain and track complete transactional histories, calculating subtotals, taxes, and final totals automatically.

---

## 👥 User Roles & Privileges

The system is configured with **three distinct roles**, each tailored to fit specific business operations. These roles are defined in [`user.model.ts`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/core/models/user.model.ts) and utilized through initial mock accounts in [`db.json`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/db.json).

| Action / Capability | Owner | Manager | Employee |
| :--- | :---: | :---: | :---: |
| **Manage Store Settings** (Currency, Tax, Details) | ✅ | ❌ | ❌ |
| **Manage Users & Staff Accounts** | ✅ | ❌ | ❌ |
| **Full Financial Reporting & Analytics** | ✅ | ❌ | ❌ |
| **Add, Edit, and Delete Products** | ✅ | ✅ | ❌ |
| **Add, Edit, and Delete Categories** | ✅ | ✅ | ❌ |
| **View Inventory & Search Catalog** | ✅ | ✅ | ✅ |
| **Process Orders & Cashier Checkout** | ✅ | ✅ | ✅ |

### 1. 👑 Owner (e.g., username: `owner`)
The **Owner** has full administrative access across the entire platform.
- **Full Access Control**: Write, edit, view, and delete capabilities for all categories, products, orders, and users.
- **Store Configuration**: Exclusive rights to view and modify global store parameters, including store name, phone, address, currency, and tax rate.
- **Staff Management**: Add, update, activate, or deactivate Manager and Employee user accounts.
- **Financial Auditing**: View the entire history of transactions, total sales figures, and calculated taxes.

### 2. 💼 Manager (e.g., username: `manager`)
The **Manager** focuses on the day-to-day operations of the store's inventory and products.
- **Inventory Control**: Full capability to add, update, and remove products and categories.
- **Stock Oversight**: Monitor stock levels, track minimum and maximum stock settings, and oversee low-stock warnings.
- **Order Monitoring**: Access and review order/sales histories.
- **Restrictions**: Cannot change global store configurations (tax rates, currency, etc.) and cannot manage other users.

### 3. 🏷️ Employee / Cashier (e.g., username: `employee`)
The **Employee** is the front-facing user responsible for handling sales and checking inventory.
- **POS Checkout & Transactions**: Process sales transactions, add products to cart, specify quantities, calculate tax-inclusive totals, and complete checkouts.
- **Catalog Navigation**: Search products quickly by name or SKU, filter by category, and view real-time stock levels.
- **Restrictions**: Cannot add, edit, or delete any products or categories. Cannot view backend financial reports, edit store settings, or manage user accounts.

---

## 📁 Project Structure

The project follows a modular, feature-based Angular structure:

* **Mock Database**: [`db.json`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/db.json) — Local mock database for `json-server` (contains initial mock data for users, products, categories, orders, settings).
* **`src/app/`**:
  * [`app.ts`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/app.ts) / [`app.html`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/app.html) — Main application root component & shell layout.
  * [`app.routes.ts`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/app.routes.ts) — Route routing paths (Products component, Categories component).
  * **`core/`**:
    * **`models/`** (TypeScript interfaces):
      * [`user.model.ts`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/core/models/user.model.ts) — Schema of user profiles and roles.
      * [`product.model.ts`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/core/models/product.model.ts) — Schema of inventory items.
      * [`category.model.ts`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/core/models/category.model.ts) — Schema of product category groups.
      * [`order.model.ts`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/core/models/order.model.ts) — Schema of transactions/sales details.
      * [`order-item.model.ts`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/core/models/order-item.model.ts) — Schema of products inside an order.
      * [`store-settings.model.ts`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/core/models/store-settings.model.ts) — Schema of store profile.
    * **`services/`** (API communication):
      * [`product.service.ts`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/core/services/product.service.ts) — HTTP calls for product CRUD operations.
      * [`category.service.ts`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/core/services/category.service.ts) — HTTP calls for category management.
  * **`features/`** (Component modules):
    * **`products/`**:
      * [`products.ts`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/features/products/products.ts) — Component logic for adding/editing/deleting products, searching and filtering.
      * [`products.html`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/features/products/products.html) — Table layout, filter bar, pop-up edit modals.
      * [`products.css`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/features/products/products.css) — Styling for product list and alerts.
    * **`categories/`**:
      * [`categories.ts`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/features/categories/categories.ts) — Component logic for listing, editing, and creating product categories.
      * [`categories.html`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/features/categories/categories.html) — Category listing and modal UI.
      * [`categories.css`](file:///d:/fs-work/AZZA/angularPro/Moasher-POS/src/app/features/categories/categories.css) — Styling for categories page.

---

## 🛠️ Tech Stack & Dependencies

* **Frontend**: Angular 21.2.0, TypeScript, RxJS, HTML5, Vanilla CSS3
* **Mock Backend**: `json-server` (serving mock REST APIs from `db.json`)
* **Build/Dev Tooling**: Angular CLI, Vitest (Testing), Prettier

---

## 🚀 Getting Started

To run this application locally, you will need to start both the **Angular development server** and the **Mock API server (`json-server`)**.

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18.x or above recommended).

### 2. Installation
Install the project dependencies:
```bash
npm install
```

### 3. Start the Mock API Server
`json-server` hosts the mock database REST endpoints. Start it by running:
```bash
npx json-server db.json
```
By default, this server runs at `http://localhost:3000`.

### 4. Start the Angular App
Start the Angular development server:
```bash
npm start
```
*Alternatively, you can run `ng serve`.*

Open your browser and navigate to **`http://localhost:4200`** to view the application.

---

## 🧪 Testing

To run unit tests using the Vitest test runner:
```bash
npm test
```
d Command Reference](https://angular.dev/tools/cli) page.
