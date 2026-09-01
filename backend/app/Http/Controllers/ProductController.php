<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\ScraperService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * GET /api/products
     * Returns stored products, most recently scraped first.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 24), 100);

        $products = Product::orderByDesc('created_at')->paginate($perPage);

        return response()->json($products);
    }

    /**
     * POST /api/products/scrape
     * Triggers a scrape of a single product URL using the supplied
     * XPath selectors, stores it, and returns the created record.
     *
     * Body: { "url": "...", "selectors": { "title": "...", "price": "...", "image": "..." } }
     */
    public function scrape(Request $request, ScraperService $scraper): JsonResponse
    {
        $validated = $request->validate([
            'url' => ['required', 'url'],
            'selectors' => ['required', 'array'],
            'selectors.title' => ['required', 'string'],
            'selectors.price' => ['required', 'string'],
            'selectors.image' => ['required', 'string'],
        ]);

        $product = $scraper->scrapeProduct($validated['url'], $validated['selectors']);

        if (!$product) {
            return response()->json([
                'message' => 'Scrape failed or no matching content found for the given selectors.',
            ], 422);
        }

        return response()->json($product, 201);
    }
}
