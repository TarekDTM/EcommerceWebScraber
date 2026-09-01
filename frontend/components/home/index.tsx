"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_SELECTORS, fetchProducts, scrapeProduct } from "@/APIRequests/requests";
import { Product } from "@/Utils/types/products/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const [url, setUrl] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: products = [], error: productsError } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    refetchInterval: 30000,
  });

  const scrapeMutation = useMutation({
    mutationFn: ({ productUrl }: { productUrl: string }) => scrapeProduct(productUrl, DEFAULT_SELECTORS),
    onSuccess: (newProduct) => {
      queryClient.setQueryData<Product[]>(["products"], (existingProducts = []) => [
        newProduct,
        ...existingProducts.filter((product) => product.id !== newProduct.id),
      ]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const latestScrapedProduct = useMemo(() => {
    if (scrapeMutation.data) return scrapeMutation.data;
    return products[0] ?? null;
  }, [products, scrapeMutation.data]);

  const handleScrape = () => {
    if (!url.trim()) {
      return;
    }

    scrapeMutation.mutate({ productUrl: url.trim() });
  };

  const showError = scrapeMutation.error instanceof Error ? scrapeMutation.error.message : productsError instanceof Error ? productsError.message : "";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff7ed,#f8fafc_45%,#eef2ff_100%)] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-[28px] border border-orange-100 bg-white/80 p-6 shadow-lg shadow-orange-100/60 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">
              Jumia Scraper
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Paste a product link and scrape it
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["products"] });
              router.push("/products");
            }}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            List scrapes
          </button>
        </header>

        <div className="grid gap-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm ">
            <label htmlFor="jumia-link" className="mb-2 block text-sm font-medium text-slate-700">
              Jumia product URL
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="jumia-link"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.jumia.com.eg/..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none ring-0 transition focus:border-orange-400 focus:bg-white"
              />

              <button
                type="button"
                onClick={handleScrape}
                disabled={scrapeMutation.isPending}
                className="inline-flex min-w-37.5 items-center justify-center rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 px-5 py-3 font-semibold text-white shadow-lg shadow-orange-200 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {scrapeMutation.isPending ? "Scraping..." : "Scrape now"}
              </button>
            </div>

            {showError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {showError}
              </div>
            )}

            {latestScrapedProduct && (
              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                <div className="flex flex-col gap-4 p-4 sm:flex-row">
                  <img
                    src={latestScrapedProduct.image_url || "https://placehold.co/600x400?text=No+Image"}
                    alt={latestScrapedProduct.title || "Scraped product"}
                    className="h-40 w-full rounded-2xl object-cover sm:w-40"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                      Latest scrape
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">
                      {latestScrapedProduct.title || "Untitled product"}
                    </h2>
                    <p className="mt-3 text-2xl font-bold text-slate-900">
                      {latestScrapedProduct.price ?? "--"} <span className="text-base font-medium text-slate-500">EGP</span>
                    </p>
                    {latestScrapedProduct.source_url && (
                      <a
                        href={latestScrapedProduct.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Open source link
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Saved scrapes</h2>
              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                {products.length}
              </span>
            </div>

            <div className="space-y-3">
              {products.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  No scrapes yet. Click “List scrapes” or scrape a link to begin.
                </div>
              ) : (
                products.map((product: Product) => (
                  <div
                    key={product.id ?? product.source_url}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <img
                      src={product.image_url || "https://placehold.co/120x120?text=Item"}
                      alt={product.title || "Saved product"}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {product.title || "Untitled product"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {product.price ?? "--"} EGP
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
