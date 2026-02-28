import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const userAgent = request.headers.get('user-agent')?.toLowerCase();
  const acceptHeader = request.headers.get('accept');

  if (
    !(pathname.split('/').length > 2 || pathname.endsWith('.js') || pathname.endsWith('.css') || pathname.endsWith('.woff2') || pathname.endsWith('.ico') || pathname.endsWith('.xml') || pathname.endsWith('.txt')) &&
    ((acceptHeader && acceptHeader.includes('application/json')) ||
    (userAgent && (userAgent.includes('curl') || userAgent.includes('wget') || userAgent.includes('windowspowershell'))))
  ) {
    const pathSegments = pathname.split('/').filter(segment => segment);
    const query = pathSegments[0];
    const apiUrl = new URL(`/api/search?query=${query}`, request.url);

     searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value);
    });

    return await fetch(apiUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
}
