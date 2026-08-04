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
│   │       ├── upload/
│   │       │   └── route.ts         # POST image file upload endpoint (Appwrite Cloud Bucket)
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
│   │   │   ├── placeRepository.interface.ts # Repository abstract interface
│   │   │   ├── appwritePlaceRepository.ts   # Appwrite Cloud integration (node-appwrite v27)
│   │   │   ├── jsonPlaceRepository.ts       # Local JSON persistence implementation
│   │   │   └── getPlaceRepository.ts        # Repository factory (Appwrite Cloud with JSON fallback)
│   │   ├── security/
│   │   │   └── index.ts             # Rate limits, lockout registry, and input WAF filters
│   │   ├── services/
│   │   │   ├── appwriteStorageService.ts    # Appwrite Cloud Storage Bucket file upload manager
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
| `APPWRITE_ENDPOINT` | `string` | Appwrite API endpoint (default: `https://cloud.appwrite.io/v1`). |
| `APPWRITE_PROJECT_ID` | `string` | Appwrite Cloud Project ID. |
| `APPWRITE_API_KEY` | `string` | Appwrite Cloud API Key with database & storage scopes (`documents.read`, `documents.write`, `files.read`, `files.write`). |
| `APPWRITE_DATABASE_ID` | `string` | Database ID in Appwrite Cloud (default: `doldfind-db`). |
| `APPWRITE_COLLECTION_ID` | `string` | Collection ID in Appwrite Cloud (default: `places`). |
| `APPWRITE_BUCKET_ID` | `string` | Appwrite Storage Bucket ID for place images (default: `place-images`). |
| `ADMIN_SWAPNA_USERNAME` | `string` | Username for founder Swapna. |
| `ADMIN_SWAPNA_PASSWORD_HASH` | `string` | Argon2id password hash for founder Swapna. |
| `ADMIN_SWAPNA_BADGE` | `string` | Badge designation (e.g. `"Founder"`). |

---

## 3. Appwrite Cloud Storage Integration Details

The project integrates with **Appwrite Cloud** using the official Node Server SDK (`node-appwrite` v27):

- **Image File Uploads** (`AppwriteStorageService` & `/api/upload`):
  - Admin users drag & drop image files in the dashboard.
  - Image files are processed via `AppwriteStorageService.uploadImage()` using `Storage.createFile()`.
  - Appwrite returns the generated public view URL (`${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`).
  - The returned URL string is appended into the `images` array of the `PlaceDetails` record.
- **Repository Factory** (`getPlaceRepository()`): Dynamically detects if `APPWRITE_PROJECT_ID` and `APPWRITE_API_KEY` are provided. When configured, it uses `AppwritePlaceRepository`. If unconfigured, it seamlessly falls back to `JsonPlaceRepository` and local file uploads.

### Collection Attribute Mapping

| Attribute Key | Type | Size / Options |
| :--- | :--- | :--- |
| `placeName` | String | 100 |
| `description` | String | 5000 |
| `placeType` | Enum / String | `"Spot"`, `"Cafe"`, `"Market"` |
| `mainCategory` | String | 50 |
| `categories` | String Array | Array of strings |
| `images` | String Array | Array of Appwrite Cloud Storage view URLs |
| `city` | String | 100 |
| `area` | String | 100 |
| `state` | String | 100 |
| `latitude` | String | 20 |
| `longitude` | String | 20 |
| `bestTimings` | String | 200 |
| `closedOn` | String | 100 |
| `nearestMetro` | String | 100 |
| `crowdLevel` | String | 50 |
| `safetyNote` | String | 1000 |
| `entryFee` | String | 200 |
| `likes` | Integer | Default: 0 |
| `saves` | Integer | Default: 0 |
| `visited` | Integer | Default: 0 |
| `uploaderId` | String | 100 |
| `createdAt` | String / Datetime | ISO 8601 string |
| `updatedAt` | String / Datetime | ISO 8601 string |
