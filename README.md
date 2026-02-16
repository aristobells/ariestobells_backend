# 🛒 AriesToBells E-commerce API

A production-ready E-commerce REST API built with **Node.js** and **NestJS**, designed to power a modern online store.

This project demonstrates secure authentication, role-based access control, order processing, payment integration, product management with variants, and scalable API design.

**Live API Documentation:**  
https://ariestobells.up.railway.app/api/docs#/

---

## 📌 Overview

AriesToBells API provides a complete backend solution for an online store, including:

- User authentication with email verification and password reset
- Product and category management with slug-based routing
- Shopping cart system
- Order creation and tracking
- Payment processing via Paystack
- Image uploads via Cloudinary
- Role-based admin operations
- Product filtering, pagination, and sorting

The architecture follows clean NestJS modular structure, separation of concerns, and scalable service patterns.

---

## 🛠 Tech Stack

- **Runtime:** Node.js  
- **Framework:** NestJS  
- **Database:** PostgreSQL  
- **Authentication:** JWT  
- **Password Hashing:** bcrypt  
- **Payments:** Paystack  
- **Image Storage:** Cloudinary  
- **Email Service:** SMTP  
- **Deployment:** Railway  

---

## 🏗 Architecture Highlights

- Modular domain-based structure (Auth, Products, Orders, Payments, etc.)
- DTO validation using class-validator
- JWT guards and role-based guards
- Slug-based resource retrieval
- Pagination and filtering at query level
- Centralized error handling
- Secure webhook handling for payments
- Environment-driven configuration

---

# 🔐 Authentication & Authorization

## Authentication

- JWT-based authentication
- Secure password hashing with bcrypt
- Email verification required before full access
- Password reset flow using token-based system

## Role-Based Access Control

Two main roles:

- `CUSTOMER`
- `ADMIN`

Admin-only routes include:

- Product management
- Category management
- Order status updates
- Payment administration
- File uploads

Protected endpoints require:
Authorization: Bearer <JWT_TOKEN>

---

# 📦 API Modules & Endpoints

The API is organized into 8 main modules.

---

## 1️⃣ Authentication (7 Endpoints)

| Method | Endpoint | Description |
|--------|----------|------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/profile` | Current user profile |
| POST | `/api/v1/auth/verify-email` | Verify email |
| POST | `/api/v1/auth/resend-verification` | Resend verification |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password |

---

## 2️⃣ Categories (6 Endpoints)

Supports both ID-based and slug-based retrieval.

Admin-only:
- Create
- Update
- Delete
---

## 3️⃣ Products (7 Endpoints)

Supports:

- Search
- Category filtering
- Price range filtering
- Featured products
- Pagination
- Sorting
- Slug lookup
- Product variants (size, color, SKU, stock)

Example query:
GET /api/v1/products?search=leather&minPrice=25000&maxPrice=50000&page=1&limit=10

---

## 4️⃣ Cart (6 Endpoints)

- Add item
- Update quantity
- Remove item
- Clear cart
- Get item count
- Get full cart

Cart is user-scoped and JWT-protected.

---

## 5️⃣ User Addresses (6 Endpoints)

- Multiple addresses per user
- Default address support
- Full CRUD operations

---

## 6️⃣ Orders (8 Endpoints)

- Create order from cart
- Cancel order
- View user orders
- Order statistics
- Admin order management
- Order status updates

Order lifecycle supports status tracking.

---

## 7️⃣ Payments (6 Endpoints)

- Initialize payment
- Verify transaction
- Secure Paystack webhook
- Retrieve payment by order
- Admin payment stats

Payments are linked directly to orders.

---

## 8️⃣ Upload (5 Endpoints)

Admin-only image uploads:

- Single image upload
- Multiple image upload
- Category image upload
- Delete operations

Integrated with Cloudinary.

---

# 📘 Example API Usage

## Register User

```json
POST /api/v1/auth/register

{
  "email": "john.doe@example.com",
  "password": "Password1",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+2348012345678"
}
Response 
{
  "user": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "role": "CUSTOMER"
  },
  "token": "jwt_token_here",
  "message": "Registration successful"
}
Create Order → Initialize Payment
POST /api/v1/orders
{
  "addressId": "user-address-id"
}
POST /api/v1/payments/initialize
{
  "orderId": "order-id"
}
Returns Paystack authorization URL for checkout.

⚙️ Environment Variables
Create a .env file in the root directory:

# Database
DATABASE_URL=

# JWT
JWT_SECRET=
JWT_EXPIRATION=7d

# App
PORT=3000
NODE_ENV=development

# Paystack
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_CALLBACK_URL=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=

# URLs
FRONTEND_URL=
BACKEND_URL=

🚀 Local Setup
Prerequisites
Node.js v16+
PostgreSQL
Paystack account
Cloudinary account

📊 Production Deployment
- Currently deployed on Railway.
- Production checklist:
- Secure JWT secret
- Configure production database
- Configure Paystack webhook URL
- Set NODE_ENV=production
- Enable secure CORS policy

Live documentation:
https://ariestobells.up.railway.app/api/docs#/

📈 Project Value

This API demonstrates:

- Clean modular backend architecture
- Secure authentication and RBAC
- Real-world payment integration
- Scalable product and order system
- Cloud service integrations
- Production deployment experience

If you're reviewing this as a recruiter, feel free to explore the live Swagger documentation and test the endpoints directly.
