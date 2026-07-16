# DoldFind Admin Dashboard Backend Documentation

This document explains the architecture, security practices, and configurations of the **DoldFind Admin Portal** backend built on Next.js App Router (Route Handlers).

---

## 1. Folder Structure

The project conforms to **Clean Architecture** patterns, separating routing, business logic, data persistence, and utility helpers:

```
doldfind-admin/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/
│   │       │   │   └── route.ts     # POST login endpoint (rate limited, locked out)
│   │       │   ├── logout/
│   │       │   │   └── route.ts     # POST logout endpoint (clears cookie)
│   │       │   └── session/
│   │       │       └── route.ts     # GET session status and auto-renewal
│   │       └── places/
│   │           └── submit/
│   │               └── route.ts     # POST place entry submit handler (protected, WAF audited)
│   ├── lib/
│   │   ├── auth/
│   │   │   └── session.ts           # JWT session token signing/cookie management
│   │   ├── config/
│   │   │   └── index.ts             # Environment variables loader and validator
│   │   ├── logger/
│   │   │   ├── index.ts             # Server logger utility
│   │   │   └── auditLogger.ts       # Security & access events audit logs recorder
│   │   ├── parser/
│   │   │   └── index.ts             # Independent pure parser utility
│   │   ├── repositories/
│   │   │   ├── placeRepository.interface.ts     # Repository abstract interface
│   │   │   └── googleSheetsPlaceRepository.ts   # Google Sheets implementation
│   │   ├── security/
│   │   │   └── index.ts             # Rate limits, lockout registry, and input WAF filters
│   │   ├── services/
│   │   │   ├── authService.ts       # Password hashing & lockout business logic
│   │   │   └── placeSubmissionService.ts # Orchestrates data submission
│   │   └── utils/
│   │       └── response.ts          # Standard JSON API responses formatting
│   ├── middleware.ts                # Next.js global Edge authentication middleware
```

---

## 2. Environment Variables

All secrets are loaded dynamically from environment configurations via the config module:

| Variable Name | Type | Description |
| :--- | :--- | :--- |
| `JWT_SESSION_SECRET` | `string` | Cryptographic secret key used to sign session cookies. |
| `GOOGLE_PROJECT_ID` | `string` | Google Cloud project ID. |
| `GOOGLE_CLIENT_EMAIL` | `string` | Google service account email. |
| `GOOGLE_PRIVATE_KEY` | `string` | RSA private key for the Google service account. |
| `GOOGLE_SHEET_ID` | `string` | Target Google Spreadsheet ID for entries queues. |
| `ADMIN_SWAPNA_USERNAME` | `string` | Username for founder Swapna. |
| `ADMIN_SWAPNA_PASSWORD_HASH` | `string` | Argon2id password hash for founder Swapna. |
| `ADMIN_SWAPNA_BADGE` | `string` | Badge designation (e.g. `"Founder"`). |
| `ADMIN_RIHAN_USERNAME` | `string` | Username for founder Rihan. |
| `ADMIN_RIHAN_PASSWORD_HASH` | `string` | Argon2id password hash for founder Rihan. |
| `ADMIN_RIHAN_BADGE` | `string` | Badge designation. |
| `ADMIN_ISHAN_USERNAME` | `string` | Username for founder Ishan. |
| `ADMIN_ISHAN_PASSWORD_HASH` | `string` | Argon2id password hash for founder Ishan. |
| `ADMIN_ISHAN_BADGE` | `string` | Badge designation. |

---

## 3. Authentication & Session Flow

1. **Argon2id Passwords**: Password hashing uses Rust-compiled bindings (`@node-rs/argon2`). Verification utilizes generic errors and a **dummy hash check** for unknown users to enforce constant-time responses, preventing timing attacks and username enumeration.
2. **Account Lockouts**: Five consecutive failed attempts on any username locks out that login profile for 15 minutes.
3. **Session Cookies**:
   - Encrypted with `jose` using HS256 algorithm.
   - Stored in cookies with `HttpOnly`, `Secure` (in production), `SameSite=Strict` attributes.
   - Lifetime: 1 hour.
   - Automatic Renewal: If the user makes requests within the last 15 minutes of session lifetime, the server automatically updates and extends the cookie.

---

## 4. Request Lifecycle & Validation Flow

Every place submission executes through the following filters:

```
Client request (Payload)
  ↓
Edge Middleware (Token decrypted & validated; yields 401 JSON if missing/invalid)
  ↓
Rate Limiter (Limits IP requests per window; yields 429 JSON if exceeded)
  ↓
Payload Size Check (Limits payload size to 50KB to block denial of service)
  ↓
WAF Sanitization Filter (Recursively checks strings; rejects HTML, scripts, XSS, malformed unicode)
  ↓
Zod Validation (Enforces type checking, strict Zod schemas; yields 400 JSON on error)
  ↓
Parser Utility (Trims, collapses spaces, dedups categories, standardizes infoCards)
  ↓
PlaceSubmissionService (Generates ID, timestamp, session uploader, empty defaults)
  ↓
GoogleSheetsPlaceRepository (Appends entry and audit logs to sheet)
  ↓
Success Response returned (201 JSON)
```

---

## 5. Parser Details

The parser module in [parser/index.ts](file:///C:/Users/ishan/.gemini/antigravity/scratch/doldfind-admin/src/lib/parser/index.ts) is pure and decoupled from Sheets:
- Trims whitespace and collapses repeated middle spaces.
- Normalizes unicode using NFC and newlines to `\n`.
- De-duplicates place categories, enforcing that `"Free"` and `"Paid"` are mutually exclusive (prioritizing `"Free"` if both are submitted).
- Prepends the 7 standardized information cards (Main Category, Best Timings, Closed On, Metro, Crowd, Safety, Fee).
- Filters out manual cards whose labels match these 7 reserved fields.

---

## 6. Repository Pattern

The API route handler interacts with data only through `PlaceSubmissionService` and `PlaceRepository` interfaces:

```
Route Handler -> PlaceSubmissionService -> PlaceRepository Interface -> GoogleSheetsPlaceRepository
```

This ensures that the Google Sheets persistence layer can be swapped out for Supabase, PostgreSQL, or MongoDB in the future by writing a new repository class conforming to `PlaceRepository` without touching any route handler code.

---

## 7. Google Sheets Format

The Google Sheets repository formats information cards into readable semicolons-delimited strings rather than storing raw JSON:

```
Main Category: Waterfall; Best Timings: 5 AM - 7 AM; Closed On: Never Closed; Nearest Metro: Baner Metro; Crowd Level: Low; Safety Note: Watch out for slippery rocks; Fee: FREE - NO TICKET REQUIRED;
```
It appends exactly one row containing: Submission ID, Timestamp, Submitted By, Badge, Place ID, Title, Categories, Description, Location, Latitude, Longitude, Information Cards, Uploader Username, Uploader Badge, Safety Note.
