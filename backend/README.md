# The Duel — Backend API

Node.js + Express + MongoDB backend for the couple expense tracker.

---

## Setup

```bash
cd backend
npm install
npm run dev      # development (nodemon)
npm start        # production
```

Server runs on `http://localhost:5000`

---

## Environment Variables (`.env`)

| Key | Value |
|-----|-------|
| PORT | 5000 |
| MONGO_URI | MongoDB Atlas connection string |
| JWT_SECRET | Any long random string |
| JWT_EXPIRES_IN | 30d |
| SMTP_HOST | smtp.gmail.com |
| SMTP_PORT | 587 |
| SMTP_EMAIL | your Gmail address |
| SMTP_PASSWORD | Gmail app password |
| CLIENT_URL | http://localhost:5173 |

---

## API Reference

All protected routes require header:
```
Authorization: Bearer <token>
```

---

### AUTH  `/api/auth`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/register` | ❌ | `{ name, email, password }` | Register new user |
| GET | `/verify-email?token=xxx` | ❌ | — | Verify email from link |
| POST | `/login` | ❌ | `{ email, password }` | Login, returns JWT |
| POST | `/forgot-password` | ❌ | `{ email }` | Send reset email |
| POST | `/reset-password` | ❌ | `{ token, password }` | Reset password |
| GET | `/me` | ✅ | — | Get current user |
| PATCH | `/me` | ✅ | `{ name }` | Update profile |
| POST | `/change-password` | ✅ | `{ currentPassword, newPassword }` | Change password |

---

### COUPLES  `/api/couples`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/create` | ✅ | `{ partnerAName, name? }` | Create couple, get invite code |
| POST | `/join` | ✅ | `{ inviteCode, partnerBName }` | Join couple with code |
| GET | `/me` | ✅ | — | Get my couple details |
| PATCH | `/me` | ✅ | `{ name }` | Update couple name |
| GET | `/stats` | ✅ | — | Spending stats for couple |
| POST | `/invite` | ✅ | `{ email }` | Email invite code to partner |
| DELETE | `/leave` | ✅ | — | Leave couple & delete all data |

---

### EXPENSES  `/api/expenses`

| Method | Endpoint | Auth | Query / Body | Description |
|--------|----------|------|------|-------------|
| GET | `/` | ✅ | `?category=food&paidBy=Alex&from=2024-01-01&to=2024-12-31&page=1&limit=50&sort=-date` | List expenses |
| POST | `/` | ✅ | `{ title, amount, category, paidBy?, date?, note? }` | Add expense |
| GET | `/summary` | ✅ | `?from=&to=` | Spending by category, partner & daily chart data |
| POST | `/seed-demo` | ✅ | `{ expenses: [...] }` | Bulk load demo data |
| GET | `/:id` | ✅ | — | Get single expense |
| PATCH | `/:id` | ✅ | `{ title?, amount?, category?, paidBy?, date?, note? }` | Update expense |
| DELETE | `/:id` | ✅ | — | Delete expense |

---

## Response Examples

### POST `/api/auth/register`
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "665...",
    "name": "Alex",
    "email": "alex@example.com",
    "coupleId": null,
    "isVerified": false
  }
}
```

### POST `/api/couples/create`
```json
{
  "couple": {
    "_id": "665...",
    "name": "Alex & Jordan",
    "inviteCode": "A3F9B2",
    "partnerA": { "userId": "665...", "name": "Alex" },
    "partnerB": { "userId": null, "name": null },
    "isComplete": false
  }
}
```

### GET `/api/expenses/summary`
```json
{
  "byCategory": [
    { "_id": "food", "total": 450.50, "count": 8 }
  ],
  "byPartner": [
    { "_id": "Alex", "total": 820.00, "count": 14 }
  ],
  "daily": [
    { "_id": { "year": 2024, "month": 6, "day": 9 }, "total": 84.50, "count": 2 }
  ]
}
```
