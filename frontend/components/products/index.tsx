// app/products/products-client.tsx
"use client";

import { fetchProducts } from "@/APIRequests/requests";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

export default function Products() {
  const { data: products = [], isLoading, error } = useSuspenseQuery({
    queryKey: ["products"], // must match the server's key exactly
    queryFn: fetchProducts,
    refetchInterval: 30000,
  });

  // isLoading will be false on first render — data came from hydration
  if (isLoading) return <p>Loading products...</p>;
  if (error) return <p>{(error as Error).message}</p>;

  return (
    <div>
      {products.map((p: any) => (
        <div key={p.id}>{p.title}</div>
      ))}
    </div>
  );
}