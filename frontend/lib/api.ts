import { Booking, Listing, ListingPage, ListingPayload } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export const DEMO_GUEST_ID = 1;
export const DEMO_HOST_ID = 2;

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Something went wrong. Please try again.");
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const getListings = (params: URLSearchParams) =>
  api<ListingPage>(`/listings?${params.toString()}`);
export const getListing = (id: string | number) => api<Listing>(`/listings/${id}`);
export const getTrips = () => api<Booking[]>(`/users/${DEMO_GUEST_ID}/trips`);
export const getFavorites = () => api<Listing[]>(`/users/${DEMO_GUEST_ID}/favorites`);

export async function toggleFavorite(listingId: number, active: boolean) {
  return api<void>(`/users/${DEMO_GUEST_ID}/favorites/${listingId}`, {
    method: active ? "DELETE" : "POST",
  });
}

export async function saveListing(payload: ListingPayload, id?: number) {
  return api<{ id: number }>(`/hosts/${DEMO_HOST_ID}/listings${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
}

