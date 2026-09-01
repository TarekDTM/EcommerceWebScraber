import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { fetchProducts } from "@/APIRequests/requests";
import Products from "@/components/products";
import { getQueryClientSingleton } from "@/lib/queryClient/get-query-client";
import Home from "@/components/home";

export default async function ProductsPage() {
  const queryClient = getQueryClientSingleton()



  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Home />
    </HydrationBoundary>
  );
}