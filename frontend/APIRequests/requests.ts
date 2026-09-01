const BASE_URL = process.env.NEXT_PUBLIC_API_URL  || ""
export async function fetchProducts() {
  const res = await fetch(`${BASE_URL}/products`, { cache: "no-store" ,method:"GET"});
  if (!res.ok) res;
  const data = await res.json();
  return Array.isArray(data) ? data : data?.products ?? [];
}