import { NextResponse } from 'next/server';

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const BOARD_ID = '5090692461';

export async function GET() {
  try {
    const query = `query {
      boards(ids: ${BOARD_ID}) {
        items_page(limit: 20) {
          items {
            name
          }
        }
      }
    }`;

    const res = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_KEY!,
      },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    const items = data.data?.boards?.[0]?.items_page?.items?.map((i: any) => i.name) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ items: [] });
  }
}
