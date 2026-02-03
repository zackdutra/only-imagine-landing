import { NextRequest, NextResponse } from 'next/server';

const WEBCONNEX_API_URL = 'https://api.webconnex.com/v2/public';
const API_KEY = process.env.WEBCONNEX_API_KEY;

interface WebconnexInventoryItem {
  path: string;
  name: string;
  sold: number;
  quantity: number;
}

interface WebconnexInventoryResponse {
  responseCode: number;
  data: WebconnexInventoryItem[];
  totalResults: number;
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
  if (available <= Math.ceil(capacity * 0.1)) return 'low_stock'; // 10% or less remaining
  return 'available';
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

  const results: Record<number, InventoryResult> = {};

  // Fetch form details and inventory for each form in parallel
  const fetchPromises = formIds.map(async (formId) => {
    try {
      // Fetch both form details (for URL) and inventory in parallel
      const [formResponse, inventoryResponse] = await Promise.all([
        fetch(
          `${WEBCONNEX_API_URL}/forms/${formId}?product=ticketspice.com`,
          {
            headers: { 'apiKey': API_KEY },
            next: { revalidate: 300 }, // Cache form details for 5 minutes
          }
        ),
        fetch(
          `${WEBCONNEX_API_URL}/forms/${formId}/inventory`,
          {
            headers: { 'apiKey': API_KEY },
            next: { revalidate: 30 }, // Cache inventory for 30 seconds
          }
        ),
      ]);

      if (!formResponse.ok || !inventoryResponse.ok) {
        console.error(`Failed to fetch data for form ${formId}`);
        return null;
      }

      const formData: WebconnexFormResponse = await formResponse.json();
      const inventoryData: WebconnexInventoryResponse = await inventoryResponse.json();

      if (formData.responseCode !== 200 || !formData.data) {
        return null;
      }

      // Get URL and time from form data
      const publishedPath = formData.data.publishedPath || '';
      const url = publishedPath && !publishedPath.startsWith('http')
        ? `https://${publishedPath}`
        : publishedPath;
      const eventStart = formData.data.eventStart || '';
      const timeZone = formData.data.timeZone || 'America/Los_Angeles';
      const time = formatTime(eventStart, timeZone);

      // Sum up all inventory items (in case there are multiple ticket levels)
      let sold = 0;
      let capacity = 0;

      if (inventoryData.responseCode === 200 && inventoryData.data && inventoryData.data.length > 0) {
        const totals = inventoryData.data.reduce(
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

  // Build results object
  fetchResults.forEach((result) => {
    if (result) {
      results[result.formId] = result;
    }
  });

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
