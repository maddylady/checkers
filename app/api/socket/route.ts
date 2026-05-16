// This route is a placeholder. The actual Socket.io server runs in server.js
// In development and production, the Socket.io path is /api/socket
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'Socket.io runs via server.js' });
}
