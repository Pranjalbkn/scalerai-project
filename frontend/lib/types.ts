export interface ListingImage {
  url: string;
  alt_text: string;
}

export interface Host {
  id: number;
  name: string;
  avatar_url: string;
  is_host: boolean;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  author_name: string;
  author_avatar: string;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  city: string;
  country: string;
  address: string;
  property_type: string;
  category: string;
  price_per_night: number;
  cleaning_fee: number;
  service_fee: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  max_guests: number;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  images: ListingImage[];
  amenities: string[];
  is_favorite: boolean;
  host?: Host;
  reviews?: Review[];
}

export interface ListingPage {
  items: Listing[];
  total: number;
  page: number;
  pages: number;
  page_size: number;
}

export interface Booking {
  id: number;
  listing_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
  status: string;
  confirmation_code: string;
  listing_title: string;
  listing_city: string;
  listing_image: string;
  guest_name?: string;
}

export interface ListingPayload {
  title: string;
  description: string;
  city: string;
  country: string;
  address: string;
  property_type: string;
  category: string;
  price_per_night: number;
  cleaning_fee: number;
  service_fee: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  max_guests: number;
  latitude: number;
  longitude: number;
  amenities: string[];
  images: ListingImage[];
}

