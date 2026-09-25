from datetime import date, datetime

from pydantic import BaseModel, Field, model_validator


class ImageIn(BaseModel):
    url: str
    alt_text: str = "Property photo"


class HostOut(BaseModel):
    id: int
    name: str
    avatar_url: str
    is_host: bool


class ReviewOut(BaseModel):
    id: int
    rating: float
    comment: str
    created_at: datetime
    author_name: str
    author_avatar: str


class ListingWrite(BaseModel):
    title: str = Field(min_length=5, max_length=180)
    description: str = Field(min_length=20)
    city: str = Field(min_length=2, max_length=100)
    country: str = Field(min_length=2, max_length=100)
    address: str = Field(min_length=4, max_length=255)
    property_type: str
    category: str = "Amazing views"
    price_per_night: float = Field(gt=0)
    cleaning_fee: float = Field(default=0, ge=0)
    service_fee: float = Field(default=0, ge=0)
    bedrooms: int = Field(default=1, ge=0)
    beds: int = Field(default=1, ge=1)
    bathrooms: float = Field(default=1, ge=0.5)
    max_guests: int = Field(default=2, ge=1)
    latitude: float = 0
    longitude: float = 0
    amenities: list[str] = []
    images: list[ImageIn] = Field(min_length=1)


class BookingCreate(BaseModel):
    listing_id: int
    guest_id: int = 1
    check_in: date
    check_out: date
    guests: int = Field(ge=1)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.check_out <= self.check_in:
            raise ValueError("Check-out must be after check-in")
        return self


class BookingOut(BaseModel):
    id: int
    listing_id: int
    check_in: date
    check_out: date
    guests: int
    nights: int
    subtotal: float
    cleaning_fee: float
    service_fee: float
    total: float
    status: str
    confirmation_code: str
    listing_title: str
    listing_city: str
    listing_image: str


class PaginatedListings(BaseModel):
    items: list[dict]
    total: int
    page: int
    pages: int
    page_size: int

