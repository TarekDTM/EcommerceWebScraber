export async function fetchProducts() {
  const res = await fetch("https://your-api.com/products", { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data?.products ?? [];
}