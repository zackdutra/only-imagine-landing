import { NextRequest, NextResponse } from 'next/server';

const WEBCONNEX_API_URL = 'https://api.webconnex.com/v2/public';
const API_KEY = process.env.WEBCONNEX_API_KEY;

interface WebconnexInventoryItem {
  path: string;
  name: string;
  sold: number;
  quantity: number;
}

interface WebconnexResponse {
  responseCode: number;
  data: WebconnexInventoryItem[];
  totalResults: number;
}

interface InventoryResult {
  formId: number;
  sold: number;
  capacity: number;
  available: number;
  status: 'available' | 'low_stock' | 'sold_out' | 'unavailable';
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

  // Fetch inventory for each form in parallel
  const inventoryPromises = formIds.map(async (formId) => {
    try {
      const response = await fetch(
        `${WEBCONNEX_API_URL}/forms/${formId}/inventory`,
        {
          headers: {
            'apiKey': API_KEY,
          },
          // Cache for 30 seconds
          next: { revalidate: 30 },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch inventory for form ${formId}: ${response.status}`);
        return null;
      }

      const data: WebconnexResponse = await response.json();

      if (data.responseCode === 200 && data.data && data.data.length > 0) {
        // Sum up all inventory items (in case there are multiple ticket levels)
        const totals = data.data.reduce(
          (acc, item) => ({
            sold: acc.sold + item.sold,
            capacity: acc.capacity + item.quantity,
          }),
          { sold: 0, capacity: 0 }
        );

        return {
          formId,
          sold: totals.sold,
          capacity: totals.capacity,
          available: totals.capacity - totals.sold,
          status: determineStatus(totals.sold, totals.capacity),
        };
      }

      return null;
    } catch (error) {
      console.error(`Error fetching inventory for form ${formId}:`, error);
      return null;
    }
  });

  const inventoryResults = await Promise.all(inventoryPromises);

  // Build results object
  inventoryResults.forEach((result) => {
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
