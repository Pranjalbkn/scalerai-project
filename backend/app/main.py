import math
import os
import secrets
from contextlib import asynccontextmanager
from datetime import date

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import and_, delete, func, or_, select
from sqlalchemy.orm import Session, selectinload

from .database import Base, SessionLocal, engine, get_db
from .models import Amenity, Booking, Favorite, Listing, ListingImage, Review, User
from .schemas import BookingCreate, BookingOut, ListingWrite, PaginatedListings
from .seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(
    title="Stayly API",
    version="1.0.0",
    description="A compact vacation rental marketplace API built for the Airbnb clone assignment.",
    lifespan=lifespan,
)

allowed_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def listing_query():
    return select(Listing).options(
        selectinload(Listing.images),
        selectinload(Listing.amenities),
        selectinload(Listing.reviews),
        selectinload(Listing.host),
    )


def average_rating(listing: Listing) -> float:
    if not listing.reviews:
        return 0
    return round(sum(review.rating for review in listing.reviews) / len(listing.reviews), 2)


def serialize_listing(listing: Listing, favorite_ids: set[int] | None = None, detail: bool = False):
    data = {
        "id": listing.id,
        "title": listing.title,
        "description": listing.description,
        "city": listing.city,
        "country": listing.country,
        "address": listing.address,
        "property_type": listing.property_type,
        "category": listing.category,
        "price_per_night": listing.price_per_night,
        "cleaning_fee": listing.cleaning_fee,
        "service_fee": listing.service_fee,
        "bedrooms": listing.bedrooms,
        "beds": listing.beds,
        "bathrooms": listing.bathrooms,
        "max_guests": listing.max_guests,
        "latitude": listing.latitude,
        "longitude": listing.longitude,
        "rating": average_rating(listing),
        "review_count": len(listing.reviews),
        "images": [{"url": image.url, "alt_text": image.alt_text} for image in listing.images],
        "amenities": [amenity.name for amenity in listing.amenities],
        "is_favorite": listing.id in (favorite_ids or set()),
    }
    if detail:
        data["host"] = {
            "id": listing.host.id,
            "name": listing.host.name,
            "avatar_url": listing.host.avatar_url,
            "is_host": listing.host.is_host,
        }
        data["reviews"] = [
            {
                "id": review.id,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": review.created_at,
                "author_name": review.author.name,
                "author_avatar": review.author.avatar_url,
            }
            for review in listing.reviews
        ]
    return data


def get_favorite_ids(db: Session, user_id: int) -> set[int]:
    return set(db.scalars(select(Favorite.listing_id).where(Favorite.user_id == user_id)).all())


def booking_response(booking: Booking) -> BookingOut:
    return BookingOut(
        id=booking.id,
        listing_id=booking.listing_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        guests=booking.guests,
        nights=booking.nights,
        subtotal=booking.subtotal,
        cleaning_fee=booking.cleaning_fee,
        service_fee=booking.service_fee,
        total=booking.total,
        status=booking.status,
        confirmation_code=booking.confirmation_code,
        listing_title=booking.listing.title,
        listing_city=booking.listing.city,
        listing_image=booking.listing.images[0].url if booking.listing.images else "",
    )


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/listings", response_model=PaginatedListings)
def list_listings(
    location: str | None = None,
    category: str | None = None,
    property_type: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    guests: int | None = Query(default=None, ge=1),
    check_in: date | None = None,
    check_out: date | None = None,
    amenities: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=8, ge=1, le=40),
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    filters = [Listing.is_active.is_(True)]
    if location:
        term = f"%{location.strip()}%"
        filters.append(or_(Listing.city.ilike(term), Listing.country.ilike(term), Listing.title.ilike(term)))
    if category and category != "All":
        filters.append(Listing.category == category)
    if property_type:
        filters.append(Listing.property_type == property_type)
    if min_price is not None:
        filters.append(Listing.price_per_night >= min_price)
    if max_price is not None:
        filters.append(Listing.price_per_night <= max_price)
    if guests:
        filters.append(Listing.max_guests >= guests)
    if check_in and check_out:
        conflicting = select(Booking.listing_id).where(
            Booking.status == "confirmed",
            Booking.check_in < check_out,
            Booking.check_out > check_in,
        )
        filters.append(Listing.id.not_in(conflicting))

    statement = listing_query().where(*filters)
    if amenities:
        for name in [item.strip() for item in amenities.split(",") if item.strip()]:
            statement = statement.where(Listing.amenities.any(Amenity.name == name))

    count_statement = select(func.count()).select_from(statement.with_only_columns(Listing.id).subquery())
    total = db.scalar(count_statement) or 0
    listings = db.scalars(
        statement.order_by(Listing.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).unique().all()
    favorite_ids = get_favorite_ids(db, user_id)
    return {
        "items": [serialize_listing(item, favorite_ids) for item in listings],
        "total": total,
        "page": page,
        "pages": max(1, math.ceil(total / page_size)),
        "page_size": page_size,
    }


@app.get("/api/listings/meta")
def listing_meta(db: Session = Depends(get_db)):
    return {
        "categories": db.scalars(select(Listing.category).distinct().order_by(Listing.category)).all(),
        "property_types": db.scalars(select(Listing.property_type).distinct().order_by(Listing.property_type)).all(),
        "amenities": db.scalars(select(Amenity.name).order_by(Amenity.name)).all(),
    }


@app.get("/api/listings/{listing_id}")
def get_listing(listing_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    listing = db.scalar(listing_query().where(Listing.id == listing_id))
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return serialize_listing(listing, get_favorite_ids(db, user_id), detail=True)


@app.get("/api/listings/{listing_id}/availability")
def listing_availability(listing_id: int, db: Session = Depends(get_db)):
    if not db.get(Listing, listing_id):
        raise HTTPException(status_code=404, detail="Listing not found")
    bookings = db.scalars(
        select(Booking).where(Booking.listing_id == listing_id, Booking.status == "confirmed")
    ).all()
    return {"unavailable_ranges": [{"check_in": item.check_in, "check_out": item.check_out} for item in bookings]}


@app.post("/api/bookings", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db)):
    listing = db.scalar(
        select(Listing).options(selectinload(Listing.images)).where(Listing.id == payload.listing_id)
    )
    if not listing or not listing.is_active:
        raise HTTPException(status_code=404, detail="Listing not found")
    if payload.guests > listing.max_guests:
        raise HTTPException(status_code=422, detail=f"This home allows up to {listing.max_guests} guests")
    if payload.check_in < date.today():
        raise HTTPException(status_code=422, detail="Check-in cannot be in the past")

    conflict = db.scalar(
        select(Booking.id).where(
            Booking.listing_id == listing.id,
            Booking.status == "confirmed",
            Booking.check_in < payload.check_out,
            Booking.check_out > payload.check_in,
        ).limit(1)
    )
    if conflict:
        raise HTTPException(status_code=409, detail="Those dates are no longer available")

    nights = (payload.check_out - payload.check_in).days
    subtotal = round(listing.price_per_night * nights, 2)
    booking = Booking(
        listing_id=listing.id,
        guest_id=payload.guest_id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        guests=payload.guests,
        nights=nights,
        subtotal=subtotal,
        cleaning_fee=listing.cleaning_fee,
        service_fee=listing.service_fee,
        total=round(subtotal + listing.cleaning_fee + listing.service_fee, 2),
        status="confirmed",
        confirmation_code=f"STAY-{secrets.token_hex(3).upper()}",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    booking.listing = listing
    return booking_response(booking)


@app.get("/api/users/{user_id}/trips", response_model=list[BookingOut])
def user_trips(user_id: int, db: Session = Depends(get_db)):
    bookings = db.scalars(
        select(Booking)
        .options(selectinload(Booking.listing).selectinload(Listing.images))
        .where(Booking.guest_id == user_id)
        .order_by(Booking.check_in.desc())
    ).all()
    return [booking_response(item) for item in bookings]


@app.get("/api/users/{user_id}/favorites")
def favorites(user_id: int, db: Session = Depends(get_db)):
    favorite_ids = get_favorite_ids(db, user_id)
    listings = db.scalars(listing_query().where(Listing.id.in_(favorite_ids))).unique().all() if favorite_ids else []
    return [serialize_listing(item, favorite_ids) for item in listings]


@app.post("/api/users/{user_id}/favorites/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def add_favorite(user_id: int, listing_id: int, db: Session = Depends(get_db)):
    if not db.get(User, user_id) or not db.get(Listing, listing_id):
        raise HTTPException(status_code=404, detail="User or listing not found")
    if not db.get(Favorite, (user_id, listing_id)):
        db.add(Favorite(user_id=user_id, listing_id=listing_id))
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.delete("/api/users/{user_id}/favorites/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(user_id: int, listing_id: int, db: Session = Depends(get_db)):
    db.execute(delete(Favorite).where(Favorite.user_id == user_id, Favorite.listing_id == listing_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def apply_listing_payload(listing: Listing, payload: ListingWrite, db: Session):
    fields = payload.model_dump(exclude={"amenities", "images"})
    for key, value in fields.items():
        setattr(listing, key, value)
    listing.amenities = []
    for name in payload.amenities:
        amenity = db.scalar(select(Amenity).where(Amenity.name == name))
        if not amenity:
            amenity = Amenity(name=name)
            db.add(amenity)
        listing.amenities.append(amenity)
    listing.images.clear()
    for position, image in enumerate(payload.images):
        listing.images.append(ListingImage(url=image.url, alt_text=image.alt_text, position=position))


@app.get("/api/hosts/{host_id}/dashboard")
def host_dashboard(host_id: int, db: Session = Depends(get_db)):
    listings = db.scalars(listing_query().where(Listing.host_id == host_id).order_by(Listing.created_at.desc())).unique().all()
    listing_ids = [item.id for item in listings]
    bookings = db.scalars(
        select(Booking)
        .options(selectinload(Booking.guest), selectinload(Booking.listing).selectinload(Listing.images))
        .where(Booking.listing_id.in_(listing_ids))
        .order_by(Booking.created_at.desc())
    ).all() if listing_ids else []
    return {
        "listings": [serialize_listing(item) for item in listings],
        "bookings": [
            {**booking_response(item).model_dump(), "guest_name": item.guest.name}
            for item in bookings
        ],
        "stats": {
            "active_listings": len(listings),
            "total_bookings": len(bookings),
            "revenue": round(sum(item.total for item in bookings if item.status == "confirmed"), 2),
        },
    }


@app.post("/api/hosts/{host_id}/listings", status_code=status.HTTP_201_CREATED)
def create_listing(host_id: int, payload: ListingWrite, db: Session = Depends(get_db)):
    host = db.get(User, host_id)
    if not host or not host.is_host:
        raise HTTPException(status_code=404, detail="Host not found")
    listing = Listing(host_id=host_id)
    db.add(listing)
    apply_listing_payload(listing, payload, db)
    db.commit()
    db.refresh(listing)
    return {"id": listing.id}


@app.put("/api/hosts/{host_id}/listings/{listing_id}")
def update_listing(host_id: int, listing_id: int, payload: ListingWrite, db: Session = Depends(get_db)):
    listing = db.scalar(
        listing_query().where(Listing.id == listing_id, Listing.host_id == host_id)
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    apply_listing_payload(listing, payload, db)
    db.commit()
    return {"id": listing.id}


@app.delete("/api/hosts/{host_id}/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_listing(host_id: int, listing_id: int, db: Session = Depends(get_db)):
    listing = db.scalar(select(Listing).where(Listing.id == listing_id, Listing.host_id == host_id))
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    db.delete(listing)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
