import { Product } from "@/Utils/types/products/type";
import { PaginatedResponse } from "@/Utils/types/responseTypes";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/products`, {
    cache: "no-store",
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to fetch products: ${res.status} ${res.statusText}${
        errorText ? ` - ${errorText}` : ""
      }`
    );
  }

  const data: PaginatedResponse<Product> = await res.json();
  return data.data ?? [];
}