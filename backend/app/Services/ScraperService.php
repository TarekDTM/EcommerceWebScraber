<?php

namespace App\Services;

use App\Models\Product;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class ScraperService
{
    /**
     * Pool of user agents rotated on every request to vary the request
     * fingerprint. In production you'd want a larger, regularly-updated list.
     */
    protected array $userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    ];

    protected Client $client;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 15,
            'allow_redirects' => true,
        ]);
    }

    protected function randomUserAgent(): string
    {
        return $this->userAgents[array_rand($this->userAgents)];
    }

    /**
     * Ask the Go proxy microservice for the next proxy in its rotation.
     * Returns null (direct connection) if the microservice is unreachable
     * or proxying is disabled, so scraping still works without it.
     */
    protected function nextProxy(): ?string
    {
        if (!config('services.proxy_manager.enabled')) {
            return null;
        }

        try {
            $base = config('services.proxy_manager.url', 'http://localhost:9090');
            $response = $this->client->get("{$base}/proxy", ['timeout' => 3]);
            $data = json_decode((string) $response->getBody(), true);

            return $data['proxy'] ?? null;
        } catch (GuzzleException $e) {
            Log::warning('Proxy manager unreachable, falling back to direct connection', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Fetch a product page and extract title/price/image using XPath
     * selectors supplied by the caller, since markup differs per site.
     *
     * @param  string  $url  Product page URL
     * @param  array{title:string,price:string,image:string}  $selectors  XPath expressions
     */
    public function scrapeProduct(string $url, array $selectors): ?Product
    {
        $options = [
            'headers' => [
                'User-Agent' => $this->randomUserAgent(),
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language' => 'en-US,en;q=0.9',
            ],
        ];

        if ($proxy = $this->nextProxy()) {
            $options['proxy'] = $proxy;
        }

        try {
            $response = $this->client->get($url, $options);
            $html = (string) $response->getBody();
        } catch (GuzzleException $e) {
            Log::error("Failed to fetch {$url}: {$e->getMessage()}");

            return null;
        }

        $data = $this->extract($html, $selectors);

        if (empty($data['title'])) {
            Log::warning("No title extracted for {$url}; selectors may need updating");

            return null;
        }

        return Product::create([
            'title' => $data['title'],
            'price' => $this->normalizePrice($data['price'] ?? null),
            'image_url' => $data['image'] ?? null,
            'source_url' => $url,
        ]);
    }

    protected function extract(string $html, array $selectors): array
    {
        $doc = new \DOMDocument();
        libxml_use_internal_errors(true);
        $doc->loadHTML($html);
        libxml_clear_errors();

        $xpath = new \DOMXPath($doc);

        $get = function (string $expression) use ($xpath) {
            $nodes = $xpath->query($expression);

            if (!$nodes || $nodes->length === 0) {
                return null;
            }

            $node = $nodes->item(0);

            // If the selector targets an <img>, prefer its src attribute.
            if ($node instanceof \DOMElement && $node->tagName === 'img') {
                return $node->getAttribute('src');
            }

            return trim($node->textContent);
        };

        return [
            'title' => $get($selectors['title']),
            'price' => $get($selectors['price']),
            'image' => $get($selectors['image']),
        ];
    }

    protected function normalizePrice(?string $raw): ?float
    {
        if ($raw === null) {
            return null;
        }

        // Strip currency symbols/thousands separators, keep digits and dot.
        $clean = preg_replace('/[^0-9.]/', '', str_replace(',', '', $raw));

        return $clean === '' ? null : (float) $clean;
    }
}
