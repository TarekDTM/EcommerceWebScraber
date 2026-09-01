// app/products/products-client.tsx
"use client";

import { fetchProducts } from "@/APIRequests/requests";
import { Product } from "@/Utils/types/products/type";
import { useSuspenseQuery } from "@tanstack/react-query";

export default function Products() {
  const { data: products = [], isLoading, error } = useSuspenseQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-75 items-center justify-center text-lg font-medium text-slate-500">
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-gray-100">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
            Featured Products
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Fresh picks for you</h1>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 ">
        {products.map((p: Product) => (
          <article
            key={p.id}
            className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative overflow-hidden bg-slate-100">
              <img
                className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={p.image_url || "https://placehold.co/600x400?text=No+Image"}
                alt={p.title || "Scraped product"}
              />
            </div>

            <div className="flex flex-col gap-3 p-5">
         

              <h2 className="line-clamp-2  text-lg font-semibold leading-snug text-slate-800">
                {p.title}
              </h2>

              <div className="mt-auto flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Price</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {p.price ?? "--"} <span className="text-base font-medium text-slate-500">EGP</span>
                  </p>
                </div>
                <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-500">
                  View
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}