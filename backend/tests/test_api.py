from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.seed import seed_database


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session = Session(engine)
    seed_database(session)

    def override_db():
        yield session

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    session.close()
    engine.dispose()


def listing_payload(title="A new hillside retreat"):
    return {
        "title": title,
        "description": "A carefully prepared home with generous light and a quiet view over the valley.",
        "city": "Shimla",
        "country": "India",
        "address": "12 Cedar Lane",
        "property_type": "Cottage",
        "category": "Countryside",
        "price_per_night": 145,
        "cleaning_fee": 20,
        "service_fee": 18,
        "bedrooms": 2,
        "beds": 2,
        "bathrooms": 1.5,
        "max_guests": 4,
        "latitude": 31.1048,
        "longitude": 77.1734,
        "amenities": ["Wifi", "Kitchen"],
        "images": [{"url": "/listings/mountain-cabin.jpg", "alt_text": "Cedar cottage"}],
    }


def test_listings_are_seeded(client):
    response = client.get("/api/listings")
    assert response.status_code == 200
    assert response.json()["total"] == 12


def test_listing_detail_has_gallery_host_and_reviews(client):
    response = client.get("/api/listings/1")
    assert response.status_code == 200
    body = response.json()
    assert len(body["images"]) >= 5
    assert len(body["reviews"]) >= 1
    assert body["host"]["is_host"] is True


def test_search_filters_by_city_and_guest_capacity(client):
    response = client.get("/api/listings", params={"location": "Goa", "guests": 6})
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["city"] == "Goa"


def test_search_filters_by_amenity_and_price(client):
    response = client.get(
        "/api/listings",
        params={"amenities": "Pool,Workspace", "min_price": 180, "max_price": 220},
    )
    assert response.status_code == 200
    assert response.json()["total"] > 0
    assert all(180 <= item["price_per_night"] <= 220 for item in response.json()["items"])


def test_booking_rejects_overlapping_dates(client):
    start = date.today() + timedelta(days=12)
    response = client.post(
        "/api/bookings",
        json={
            "listing_id": 1,
            "guest_id": 1,
            "check_in": start.isoformat(),
            "check_out": (start + timedelta(days=2)).isoformat(),
            "guests": 2,
        },
    )
    assert response.status_code == 409


def test_booking_rejects_past_dates_and_excess_guests(client):
    yesterday = date.today() - timedelta(days=1)
    past = client.post(
        "/api/bookings",
        json={"listing_id": 2, "guest_id": 1, "check_in": yesterday.isoformat(), "check_out": date.today().isoformat(), "guests": 1},
    )
    assert past.status_code == 422

    future = date.today() + timedelta(days=40)
    crowded = client.post(
        "/api/bookings",
        json={"listing_id": 2, "guest_id": 1, "check_in": future.isoformat(), "check_out": (future + timedelta(days=2)).isoformat(), "guests": 99},
    )
    assert crowded.status_code == 422


def test_successful_booking_appears_in_trips_and_blocks_dates(client):
    start = date.today() + timedelta(days=40)
    payload = {
        "listing_id": 2,
        "guest_id": 1,
        "check_in": start.isoformat(),
        "check_out": (start + timedelta(days=3)).isoformat(),
        "guests": 2,
    }
    booked = client.post("/api/bookings", json=payload)
    assert booked.status_code == 201
    assert booked.json()["nights"] == 3
    assert booked.json()["confirmation_code"].startswith("STAY-")

    trips = client.get("/api/users/1/trips")
    assert any(item["id"] == booked.json()["id"] for item in trips.json())
    assert client.post("/api/bookings", json=payload).status_code == 409


def test_favorite_can_be_added_and_removed(client):
    assert client.post("/api/users/1/favorites/3").status_code == 204
    favorites = client.get("/api/users/1/favorites")
    assert [item["id"] for item in favorites.json()] == [3]
    assert client.delete("/api/users/1/favorites/3").status_code == 204
    assert client.get("/api/users/1/favorites").json() == []


def test_host_listing_crud(client):
    created = client.post("/api/hosts/2/listings", json=listing_payload())
    assert created.status_code == 201
    listing_id = created.json()["id"]
    assert client.get(f"/api/listings/{listing_id}").json()["city"] == "Shimla"

    updated = listing_payload("An updated cedar retreat")
    updated["price_per_night"] = 175
    assert client.put(f"/api/hosts/2/listings/{listing_id}", json=updated).status_code == 200
    assert client.get(f"/api/listings/{listing_id}").json()["price_per_night"] == 175

    assert client.delete(f"/api/hosts/2/listings/{listing_id}").status_code == 204
    assert client.get(f"/api/listings/{listing_id}").status_code == 404


def test_non_host_cannot_create_listing(client):
    response = client.post("/api/hosts/1/listings", json=listing_payload())
    assert response.status_code == 404

