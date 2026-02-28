import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    return NextResponse.json({ error: 'API base URL is not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`${baseUrl}/status`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'External API Error' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
