from __future__ import annotations

from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


listing_amenities = Table(
    "listing_amenities",
    Base.metadata,
    Column("listing_id", ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    avatar_url: Mapped[str] = mapped_column(Text, default="")
    is_host: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    listings: Mapped[list[Listing]] = relationship(back_populates="host")
    bookings: Mapped[list[Booking]] = relationship(back_populates="guest")


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(180))
    description: Mapped[str] = mapped_column(Text)
    city: Mapped[str] = mapped_column(String(100), index=True)
    country: Mapped[str] = mapped_column(String(100))
    address: Mapped[str] = mapped_column(String(255))
    property_type: Mapped[str] = mapped_column(String(60), index=True)
    category: Mapped[str] = mapped_column(String(60), index=True)
    price_per_night: Mapped[float] = mapped_column(Float, index=True)
    cleaning_fee: Mapped[float] = mapped_column(Float, default=0)
    service_fee: Mapped[float] = mapped_column(Float, default=0)
    bedrooms: Mapped[int] = mapped_column(Integer, default=1)
    beds: Mapped[int] = mapped_column(Integer, default=1)
    bathrooms: Mapped[float] = mapped_column(Float, default=1)
    max_guests: Mapped[int] = mapped_column(Integer, default=2)
    latitude: Mapped[float] = mapped_column(Float, default=0)
    longitude: Mapped[float] = mapped_column(Float, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    host: Mapped[User] = relationship(back_populates="listings")
    images: Mapped[list[ListingImage]] = relationship(
        back_populates="listing", cascade="all, delete-orphan", order_by="ListingImage.position"
    )
    amenities: Mapped[list[Amenity]] = relationship(secondary=listing_amenities, back_populates="listings")
    bookings: Mapped[list[Booking]] = relationship(back_populates="listing", cascade="all, delete-orphan")
    reviews: Mapped[list[Review]] = relationship(back_populates="listing", cascade="all, delete-orphan")


class ListingImage(Base):
    __tablename__ = "listing_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(Text)
    alt_text: Mapped[str] = mapped_column(String(255), default="Property photo")
    position: Mapped[int] = mapped_column(Integer, default=0)

    listing: Mapped[Listing] = relationship(back_populates="images")


class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    icon: Mapped[str] = mapped_column(String(30), default="check")
    listings: Mapped[list[Listing]] = relationship(secondary=listing_amenities, back_populates="amenities")


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id"), index=True)
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    check_in: Mapped[date] = mapped_column(Date, index=True)
    check_out: Mapped[date] = mapped_column(Date, index=True)
    guests: Mapped[int] = mapped_column(Integer)
    nights: Mapped[int] = mapped_column(Integer)
    subtotal: Mapped[float] = mapped_column(Float)
    cleaning_fee: Mapped[float] = mapped_column(Float)
    service_fee: Mapped[float] = mapped_column(Float)
    total: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(30), default="confirmed")
    confirmation_code: Mapped[str] = mapped_column(String(20), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    listing: Mapped[Listing] = relationship(back_populates="bookings")
    guest: Mapped[User] = relationship(back_populates="bookings")


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    rating: Mapped[float] = mapped_column(Float)
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    listing: Mapped[Listing] = relationship(back_populates="reviews")
    author: Mapped[User] = relationship()


class Favorite(Base):
    __tablename__ = "favorites"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
