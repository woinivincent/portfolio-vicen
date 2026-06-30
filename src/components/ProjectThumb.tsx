"use client";

import { useState } from "react";

export default function ProjectThumb({ id, titulo }: { id: string; titulo: string }) {
  const [show, setShow] = useState(true);
  return (
    <div className="thumb">
      <span className="ph-name">{titulo}</span>
      <span className="ph-tag">captura pendiente</span>
      {show && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/images/${id}.jpg`}
          alt={`Captura del proyecto ${titulo}`}
          loading="lazy"
          onError={() => setShow(false)}
        />
      )}
    </div>
  );
}
