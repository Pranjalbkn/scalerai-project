# Stayly - Airbnb-style marketplace

Stayly is an original full-stack vacation-rental marketplace built for the supplied SDE assignment. It recreates Airbnb's photo-forward browsing and booking patterns without copying Airbnb source code. The application includes persistent listings, availability-aware search, a complete mocked booking flow, wishlists, trips, and a host CRUD dashboard.

## Stack

- **Frontend:** Next.js 15 App Router, React 19, TypeScript, CSS, Lucide icons
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2, Pydantic
- **Database:** SQLite
- **Testing:** Pytest and FastAPI TestClient
- **Continuous integration:** GitHub Actions runs backend tests, frontend type-checking, and the production build

## Features

- Responsive explore grid with destination, date, guest, category, property-type, price, and amenity filters
- Paginated results and persisted favourites
- Listing galleries, host details, amenities, reviews, a location preview, and detailed pricing
- Booking validation for past dates, guest capacity, and overlapping reservations
- Airbnb-style availability calendar that visibly disables past and reserved dates
- Mock checkout with confirmation code and a persistent My Trips page
- Host dashboard with listing creation, editing, deletion, reservation visibility, and revenue summary
- Seeded hosts, guests, 12 properties, galleries, reviews, and an existing reservation
- Interactive API documentation at `http://localhost:8000/docs`

## Project structure

```text
scaler/
├── frontend/                 # Next.js application
│   ├── app/                  # Pages and global styles
│   ├── components/           # Reusable UI and forms
│   └── lib/                  # API client and TypeScript models
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI routes and domain operations
│   │   ├── models.py         # SQLAlchemy relational schema
│   │   ├── schemas.py        # Request and response validation
│   │   ├── seed.py           # Idempotent sample data
│   │   └── database.py       # SQLite session configuration
│   └── tests/                # API and booking tests
└── README.md
```

## Local setup

### 1. Backend

From the repository root:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The SQLite database is created and seeded automatically on first startup. Delete `backend/airbnb.db` only when you intentionally want to reset all local data.

### 2. Frontend

In a second terminal:

```powershell
cd frontend
Copy-Item .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The frontend defaults to `http://localhost:8000/api`; set `NEXT_PUBLIC_API_URL` when deploying the API elsewhere.

## Demo identities

Authentication is intentionally mocked, as permitted by the brief:

- Guest: **Aarav Mehta** (`user_id=1`)
- Host: **Maya Kapoor** (`host_id=2`)

The navigation's **Switch to hosting** action opens Maya's dashboard. Bookings and wishlists operate as Aarav.

## Database schema

| Table | Purpose | Main relationships |
| --- | --- | --- |
| `users` | Guests and hosts | A user owns listings and makes bookings |
| `listings` | Property, pricing, capacity, and location | Belongs to a host; has images, amenities, reviews, and bookings |
| `listing_images` | Ordered gallery images | Belongs to a listing |
| `amenities` | Normalized reusable amenities | Many-to-many with listings through `listing_amenities` |
| `bookings` | Stay dates, price snapshot, status, confirmation | Belongs to one guest and one listing |
| `reviews` | Rating and guest comment | Belongs to one author and one listing |
| `favorites` | Wishlist join table | Composite key of user and listing |

Booking dates use half-open intervals: a reservation conflicts when its `check_in` is before the requested checkout and its `check_out` is after the requested check-in. This permits one guest to check in on the day another checks out.

## API overview

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/listings` | Search, filter, check availability, and paginate |
| GET | `/api/listings/{id}` | Listing gallery, host, amenities, and reviews |
| GET | `/api/listings/{id}/availability` | Reserved date ranges |
| POST | `/api/bookings` | Validate and persist a reservation |
| GET | `/api/users/{id}/trips` | Guest booking history |
| GET/POST/DELETE | `/api/users/{id}/favorites` | Manage a guest wishlist |
| GET | `/api/hosts/{id}/dashboard` | Host properties, bookings, and totals |
| POST/PUT/DELETE | `/api/hosts/{id}/listings` | Full host listing CRUD |

Full request and response schemas are available through FastAPI's `/docs` page.

The API reads two deployment settings from environment variables:

- `DATABASE_URL`: defaults to the local `backend/airbnb.db` SQLite database
- `ALLOWED_ORIGINS`: comma-separated frontend origins allowed by CORS

## Tests

```powershell
cd backend
pytest -q
```

```powershell
cd frontend
pnpm build
```

## Architecture notes and assumptions

- The backend owns pricing and availability calculations; the browser's estimate is for immediate feedback only.
- Fees are stored on the listing and copied into each booking so historical totals remain stable.
- Payments are mocked: a successful booking directly creates a confirmed reservation.
- Authentication, identity verification, messaging, and real map tiles are intentionally out of scope.
- Images are seeded as remote Unsplash URLs. A production system would upload images to object storage and save managed asset identifiers.
- SQLite is appropriate for the assignment and local demo. Production scale would use PostgreSQL, migrations, transaction-level booking locks, and authenticated authorization checks.

## Deployment

A practical deployment is:

1. Connect the repository to Render and apply the root-level `render.yaml` Blueprint.
2. The Blueprint creates the Next.js frontend, FastAPI backend, and a managed PostgreSQL database on Render's free plans.
3. Render wires the public service hostnames and database connection automatically; no secrets need to be copied manually.
4. When both services show `Live`, run the booking smoke test described below.

Local development continues to use SQLite. The hosted environment uses PostgreSQL so bookings and listings survive web-service restarts. Render's free PostgreSQL databases currently expire after 30 days, which is suitable for an assignment demo but should be upgraded for a long-lived production deployment.

### Post-deployment smoke test

1. Open the Vercel URL and search for Goa.
2. Open a listing and reserve a future date range.
3. Confirm the stay appears under Trips.
4. Try the same dates again and verify the API rejects the overlap.
5. Open the host dashboard and create, edit, then remove a temporary listing.
