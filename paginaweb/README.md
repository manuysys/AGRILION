This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Mapa GPS

El dashboard incluye `src/components/dashboard/silo-map.tsx`:

- Leaflet 1.9.4 con tiles OpenStreetMap y filtro CSS oscuro (sin API key).
- En modo real solo se muestra para usuarios autenticados; un invitado ve el
  aviso de login.
- En modo demostración se muestran coordenadas simuladas sin login.
- Marcadores para silos con `gps_has_fix=true`, popup y link al detalle.
- Los datos llegan de `GET /api/v1/silos/overview`; `data-service.ts` los mapea
  a `SiloBag.coordinates` y `SiloBag.gps`.

La integración completa se documenta en `../docs/GPS_INTEGRACION.md`.

## Autenticación del dashboard real

- En modo real, `/dashboard` exige una sesión de Firebase.
- El login/registro guarda el ID token en una cookie `httpOnly` (`agrilion_session`);
  el servidor la lee y envía `Authorization: Bearer` a la API.
- `SessionRefresh` renueva la cookie cada 20 minutos y al volver a la pestaña.
- La API filtra los silos por propietario; no se muestran datos de otros usuarios.
- El modo demo no exige login y usa datos simulados.

## Estado de datos y modo demo

- Si la API no responde, el dashboard muestra un aviso rojo y no inventa datos.
- Si la última lectura supera el umbral de 6 h, el sensor se marca como offline:
  el hero dice “Sin datos en vivo” y se muestra la antigüedad real.
- El botón **Actualizar** vuelve a pedir los datos al servidor.
- Las sparklines decorativas se retiraron para no mostrar tendencias inventadas.
- `NEXT_PUBLIC_MOCK_MODE=true` activa 6 silos simulados, banner de demostración,
  coordenadas de ejemplo y mapa habilitado sin login.

Guía de presentación: `../docs/DEMO_PROFESOR.md`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
