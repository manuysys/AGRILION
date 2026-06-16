"use client";

interface BackgroundLayerProps {
  variant:
    | "hero-dark"
    | "semi-dark"
    | "light"
    | "light-alt"
    | "dark";
}

export default function BackgroundLayer({ variant }: BackgroundLayerProps) {
  const base = "absolute inset-0 pointer-events-none overflow-hidden";

  switch (variant) {
    case "hero-dark":
      return (
        <>
          <div className={`${base} bg-gradient-to-b from-[#06120a] via-[#0a1a10] to-[#0f2518]`} />
          <div
            className={`${base}`}
            style={{
              backgroundImage: [
                "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)",
                "linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
              ].join(", "),
              backgroundSize: "60px 60px",
            }}
          />
          <div className={`${base} flex items-center justify-center`}>
            <div className="w-[800px] h-[600px] bg-gradient-to-br from-emerald-500/5 via-emerald-400/3 to-transparent rounded-full blur-[120px]" />
          </div>
          <div className={`${base}`}>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px]" />
          </div>
          <div
            className={`${base}`}
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)",
            }}
          />
        </>
      );

    case "semi-dark":
      return (
        <>
          <div className={`${base} bg-gradient-to-b from-[#0a1a10] via-[#0d2215] to-[#0a1a10]`} />
          <div
            className={`${base}`}
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </>
      );

    case "light":
      return (
        <>
          <div className={`${base} bg-gradient-to-b from-[#f0fdf4] via-[#f5fdf7] to-[#f0fdf4]`} />
          <div
            className={`${base}`}
            style={{
              backgroundImage:
                "radial-gradient(rgba(0,0,0,0.015) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </>
      );

    case "light-alt":
      return (
        <>
          <div className={`${base} bg-gradient-to-b from-[#f5fdf7] via-[#f0fdf4] to-[#f5fdf7]`} />
          <div
            className={`${base}`}
            style={{
              backgroundImage:
                "radial-gradient(rgba(0,0,0,0.015) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </>
      );

    case "dark":
      return (
        <>
          <div className={`${base} bg-gradient-to-b from-[#0a1a10] via-[#0d2215] to-[#0a1a10]`} />
          <div
            className={`${base}`}
            style={{
              backgroundImage: [
                "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)",
                "linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
              ].join(", "),
              backgroundSize: "60px 60px",
            }}
          />
          <div
            className={`${base}`}
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)",
            }}
          />
        </>
      );
  }
}
