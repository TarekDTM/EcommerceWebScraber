// app/products/products-client.tsx
"use client";

import { fetchProducts } from "@/APIRequests/requests";
import { Product } from "@/Utils/types/products/type";
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
      {products.map((p: Product) => (

        <div key={p.id}>
          <img  src={p.image_url}/>
          <h1>
            {p.title}
          </h1>
          <h4>
            {p.price}
          </h4>
        </div>
      ))}
    </div>
  );
}