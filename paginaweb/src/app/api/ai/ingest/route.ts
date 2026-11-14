/**
 * Proxy server-side para el endpoint /ingest de la AI API.
 *
 * Permite que el frontend envíe lecturas sin exponer la X-Ingest-Key
 * en el bundle del cliente. La clave se lee del .env del servidor.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const ingestKey = process.env.AI_INGEST_KEY;
  if (!ingestKey) {
    return NextResponse.json(
      { error: 'AI_INGEST_KEY no configurada en el servidor' },
      { status: 500 },
    );
  }

  try {
    const aiApiUrl = process.env.AI_API_URL || 'http://localhost:8000';
    const response = await fetch(`${aiApiUrl}/api/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ingest-Key': ingestKey,
      },
      body: JSON.stringify(body),
      // Timeout de 15s para dar tiempo al modelo LSTM
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json().catch(() => null);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying /ingest:', error);
    return NextResponse.json(
      { error: 'No se pudo conectar a la AI API' },
      { status: 502 },
    );
  }
}
