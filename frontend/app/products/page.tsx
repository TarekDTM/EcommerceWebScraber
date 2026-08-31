import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { fetchProducts } from "@/APIRequests/requests";
import Products from "@/components/products";
import { getQueryClientSingleton } from "@/lib/queryClient/get-query-client";

export default async function ProductsPage() {
  const queryClient = getQueryClientSingleton()

  await queryClient.query({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Products />
    </HydrationBoundary>
  );
}