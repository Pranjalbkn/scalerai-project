from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Amenity, Booking, Listing, ListingImage, Review, User


PHOTO_SETS = [
    [
        "/listings/valley-villa.jpg", "/listings/coastal-villa.jpg", "/listings/heritage-haveli.jpg",
        "/listings/mountain-cabin.jpg", "/listings/valley-villa.jpg",
    ],
    [
        "/listings/mountain-cabin.jpg", "/listings/valley-villa.jpg", "/listings/heritage-haveli.jpg",
        "/listings/coastal-villa.jpg", "/listings/mountain-cabin.jpg",
    ],
    [
        "/listings/coastal-villa.jpg", "/listings/heritage-haveli.jpg", "/listings/valley-villa.jpg",
        "/listings/mountain-cabin.jpg", "/listings/coastal-villa.jpg",
    ],
    [
        "/listings/heritage-haveli.jpg", "/listings/valley-villa.jpg", "/listings/coastal-villa.jpg",
        "/listings/mountain-cabin.jpg", "/listings/heritage-haveli.jpg",
    ],
]

LISTINGS = [
    ("Architect's glass villa above the valley", "Lonavala", "India", "Villa", "Amazing views", 185, 4, 6, 3.5),
    ("Quiet hillside cottage with a private pool", "Mussoorie", "India", "Cottage", "Countryside", 128, 3, 4, 2),
    ("Design-forward beach house steps from the sea", "Goa", "India", "Beach house", "Beachfront", 216, 4, 7, 4),
    ("Warm cedar cabin under the stars", "Manali", "India", "Cabin", "Cabins", 96, 2, 4, 2),
    ("Sunlit heritage haveli in the old city", "Jaipur", "India", "Heritage home", "Historical homes", 142, 3, 5, 2.5),
    ("Clifftop retreat with an infinity pool", "Varkala", "India", "Villa", "Amazing pools", 268, 4, 8, 4),
    ("Minimalist lake house with mountain views", "Nainital", "India", "Lake house", "Lakefront", 174, 3, 6, 3),
    ("Tropical courtyard home near Auroville", "Puducherry", "India", "Home", "Tropical", 112, 2, 4, 2),
    ("Modern penthouse in the heart of Bandra", "Mumbai", "India", "Apartment", "Design", 198, 3, 5, 2.5),
    ("Private tea estate bungalow", "Munnar", "India", "Bungalow", "Countryside", 154, 3, 6, 3),
    ("Riverside dome made for slow weekends", "Rishikesh", "India", "Dome", "OMG!", 87, 1, 2, 1),
    ("Whitewashed villa overlooking the Arabian Sea", "Alibaug", "India", "Villa", "Beachfront", 235, 4, 8, 4),
]


def seed_database(db: Session):
    if db.scalar(select(User.id).limit(1)):
        return

    guest = User(
        name="Aarav Mehta",
        email="aarav@example.com",
        avatar_url="/avatars/aarav.svg",
    )
    host = User(
        name="Maya Kapoor",
        email="maya@example.com",
        avatar_url="/avatars/maya.svg",
        is_host=True,
    )
    cohost = User(
        name="Kabir Shah",
        email="kabir@example.com",
        avatar_url="/avatars/kabir.svg",
        is_host=True,
    )
    db.add_all([guest, host, cohost])
    db.flush()

    amenities = {
        name: Amenity(name=name, icon=icon)
        for name, icon in [
            ("Wifi", "wifi"), ("Kitchen", "kitchen"), ("Pool", "pool"),
            ("Free parking", "parking"), ("Air conditioning", "snow"),
            ("Workspace", "workspace"), ("Mountain view", "mountain"),
            ("Washer", "washer"), ("Pet friendly", "pet"), ("Breakfast", "coffee"),
        ]
    }
    db.add_all(amenities.values())
    db.flush()

    created = []
    for index, values in enumerate(LISTINGS):
        title, city, country, property_type, category, price, bedrooms, guests, baths = values
        listing = Listing(
            host_id=host.id if index < 7 else cohost.id,
            title=title,
            description=(
                f"A thoughtfully designed {property_type.lower()} in {city}, made for restorative stays. "
                "Wake up to generous natural light, settle into carefully chosen interiors, and enjoy "
                "a private setting close to the best local food and scenery. Your host has prepared "
                "everything for an easy, memorable escape."
            ),
            city=city,
            country=country,
            address=f"{index + 10} Scenic Lane, {city}",
            property_type=property_type,
            category=category,
            price_per_night=price,
            cleaning_fee=22 + index % 4 * 5,
            service_fee=18 + index % 3 * 4,
            bedrooms=bedrooms,
            beds=max(bedrooms, guests // 2),
            bathrooms=baths,
            max_guests=guests,
            latitude=15.0 + index,
            longitude=73.0 + index,
        )
        amenity_names = ["Wifi", "Kitchen", "Air conditioning", "Free parking"]
        if index % 2 == 0:
            amenity_names += ["Pool", "Workspace"]
        if index % 3 == 0:
            amenity_names += ["Mountain view", "Breakfast"]
        listing.amenities = [amenities[name] for name in amenity_names]
        for position, url in enumerate(PHOTO_SETS[index % len(PHOTO_SETS)]):
            listing.images.append(ListingImage(url=url, alt_text=f"{title} - photo {position + 1}", position=position))
        db.add(listing)
        created.append(listing)
    db.flush()

    review_texts = [
        "Even better than the photos. The space was calm, spotless, and beautifully considered.",
        "A wonderful weekend away. Check-in was seamless and our host shared excellent local tips.",
        "The view alone is worth the trip. We would happily stay here again.",
    ]
    for listing in created:
        for i, text in enumerate(review_texts):
            db.add(Review(listing_id=listing.id, author_id=guest.id, rating=4.7 + i * 0.1, comment=text))

    first = created[0]
    check_in = date.today() + timedelta(days=12)
    nights = 3
    db.add(
        Booking(
            listing_id=first.id,
            guest_id=guest.id,
            check_in=check_in,
            check_out=check_in + timedelta(days=nights),
            guests=2,
            nights=nights,
            subtotal=first.price_per_night * nights,
            cleaning_fee=first.cleaning_fee,
            service_fee=first.service_fee,
            total=first.price_per_night * nights + first.cleaning_fee + first.service_fee,
            status="confirmed",
            confirmation_code="ABNB-DEMO24",
        )
    )
    db.commit()
