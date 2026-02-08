import { NextRequest, NextResponse } from 'next/server';

const WEBCONNEX_API_URL = 'https://api.webconnex.com/v2/public';
const API_KEY = process.env.WEBCONNEX_API_KEY;

interface WebconnexInventoryItem {
  path: string;
  name: string;
  sold: number;
  quantity: number;
}

interface WebconnexFormResponse {
  responseCode: number;
  data: {
    id: number;
    name: string;
    publishedPath: string;
    status: string;
    eventStart: string;
    timeZone: string;
    inventory?: WebconnexInventoryItem[];
  };
}

interface InventoryResult {
  formId: number;
  sold: number;
  capacity: number;
  available: number;
  status: 'available' | 'low_stock' | 'sold_out' | 'unavailable';
  url: string;
  time: string;
  eventStart: string;
}

function formatTime(isoString: string, timeZone: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone,
    });
  } catch {
    return '';
  }
}

function determineStatus(sold: number, capacity: number): InventoryResult['status'] {
  const available = capacity - sold;
  if (available <= 0) return 'sold_out';
  if (available <= Math.ceil(capacity * 0.1)) return 'low_stock';
  return 'available';
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  const response = await fetch(url, options);
  if (response.status === 429 && retries > 0) {
    const retryAfter = parseInt(response.headers.get('retry-after') || '', 10);
    const delay = retryAfter ? retryAfter * 1000 : 2000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1);
  }
  return response;
}

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const formIdsParam = searchParams.get('formIds');

  if (!formIdsParam) {
    return NextResponse.json(
      { error: 'formIds parameter required' },
      { status: 400 }
    );
  }

  const formIds = formIdsParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));

  if (formIds.length === 0) {
    return NextResponse.json(
      { error: 'No valid form IDs provided' },
      { status: 400 }
    );
  }

  const fetchOptions: RequestInit = {
    headers: { 'apiKey': API_KEY },
    cache: 'no-store',
  };

  const results: Record<number, InventoryResult> = {};
  let rateLimits: Record<string, number> | null = null;

  // Fetch form details + inventory in a single call per form using expand
  const fetchPromises = formIds.map(async (formId) => {
    try {
      const response = await fetchWithRetry(
        `${WEBCONNEX_API_URL}/forms/${formId}?product=ticketspice.com&[]expand=inventory`,
        fetchOptions,
      );

      // Capture rate limit headers
      const burstRemaining = response.headers.get('x-burst-remaining');
      if (burstRemaining !== null) {
        rateLimits = {
          burstLimit: Number(response.headers.get('x-burst-limit')),
          burstRemaining: Number(burstRemaining),
          burstReset: Number(response.headers.get('x-burst-limit-reset')),
          dailyLimit: Number(response.headers.get('x-daily-limit')),
          dailyRemaining: Number(response.headers.get('x-daily-remaining')),
          dailyReset: Number(response.headers.get('x-daily-limit-reset')),
        };
      }

      if (!response.ok) {
        console.error(`Failed to fetch form ${formId}: ${response.status}`);
        return null;
      }

      const formData: WebconnexFormResponse = await response.json();

      if (formData.responseCode !== 200 || !formData.data) {
        return null;
      }

      // Form details
      const publishedPath = formData.data.publishedPath || '';
      const url = publishedPath && !publishedPath.startsWith('http')
        ? `https://${publishedPath}`
        : publishedPath;
      const eventStart = formData.data.eventStart || '';
      const timeZone = formData.data.timeZone || 'America/Los_Angeles';
      const time = formatTime(eventStart, timeZone);

      // Inventory from expanded data
      let sold = 0;
      let capacity = 0;
      const inventoryItems = formData.data.inventory;

      if (inventoryItems && inventoryItems.length > 0) {
        const totals = inventoryItems.reduce(
          (acc, item) => ({
            sold: acc.sold + item.sold,
            capacity: acc.capacity + item.quantity,
          }),
          { sold: 0, capacity: 0 }
        );
        sold = totals.sold;
        capacity = totals.capacity;
      }

      return {
        formId,
        sold,
        capacity,
        available: capacity - sold,
        status: determineStatus(sold, capacity),
        url,
        time,
        eventStart,
      };
    } catch (error) {
      console.error(`Error fetching data for form ${formId}:`, error);
      return null;
    }
  });

  const fetchResults = await Promise.all(fetchPromises);

  fetchResults.forEach((result) => {
    if (result) {
      results[result.formId] = result;
    }
  });

  return NextResponse.json({ ...results, ...(rateLimits ? { _rateLimits: rateLimits } : {}) }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60',
    },
  });
}
