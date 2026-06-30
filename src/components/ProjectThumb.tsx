"use client";

import { useState } from "react";

export default function ProjectThumb({
  id,
  titulo,
  version,
}: {
  id: string;
  titulo: string;
  version: number;
}) {
  const [show, setShow] = useState(version > 0);
  return (
    <div className="thumb">
      <span className="ph-name">{titulo}</span>
      <span className="ph-tag">captura pendiente</span>
      {show && version > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/${id}.jpg?v=${version}`}
          alt={`Captura del proyecto ${titulo}`}
          loading="lazy"
          onError={() => setShow(false)}
        />
      )}
    </div>
  );
}
