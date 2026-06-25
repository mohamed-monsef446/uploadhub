"use client";

import { useState } from "react";

export default function CopyButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      alert("Could not copy link");
    }
  };

  return (
    <button
      onClick={copyLink}
      className={`
        w-full
        inline-flex
        justify-center
        items-center
        gap-2
        px-5
        py-2
        rounded-lg
        font-semibold
        text-white
        shadow-lg
        transition-all
        duration-200
        hover:scale-105
        active:scale-95
        ${
          copied
            ? "bg-green-600 hover:bg-green-700"
            : "bg-blue-600 hover:bg-blue-700"
        }
      `}
    >
      {copied ? "✓ Copied" : "📋 Copy Link"}
    </button>
  );
}