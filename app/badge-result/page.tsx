"use client";
import { useEffect, useState } from "react";

// Load Google Fonts dynamically
if (typeof document !== "undefined") {
  const addFont = (href: string) => {
    if (!document.querySelector(`link[href='${href}']`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  };

  addFont("https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap");
  addFont("https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600&display=swap");
}

export default function BadgeResultPage() {
  const [html, setHtml] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);

  // gradient colors
  const [g1, setG1] = useState<string | null>(null);
  const [g2, setG2] = useState<string | null>(null);
  const [g3, setG3] = useState<string | null>(null);

  // Load stored render data
  useEffect(() => {
    setHtml(sessionStorage.getItem("badgeHTML"));
    setImageUrl(sessionStorage.getItem("badgeImageUrl"));
    setTitle(sessionStorage.getItem("badgeTitle"));

    setG1(sessionStorage.getItem("g1"));
    setG2(sessionStorage.getItem("g2"));
    setG3(sessionStorage.getItem("g3"));
  }, []);

  // Inject image + title into AI-rendered HTML
  useEffect(() => {
    if (!html || !imageUrl) return;

    const img = document.getElementById("badge-image") as HTMLImageElement | null;
    if (img) img.src = imageUrl;

    const h1 = document.querySelector("h1");
    if (h1 && title) {
      h1.textContent = title;
      h1.classList.add("font-poppins");
      h1.style.textShadow = "0 2px 3px rgba(0,0,0,0.35)";
      h1.style.color = "#ffffff";
    }

    // General body text enhancements
    const bodyNodes = document.querySelectorAll("p, span, div, h2");
    bodyNodes.forEach((el) => {
      (el as HTMLElement).style.color = "#ffffff";
      (el as HTMLElement).style.textShadow = "0 1px 2px rgba(0,0,0,0.35)";
    });

    // 🔥 Make nonprofit list items larger
    const nonprofitItems = document.querySelectorAll("li");
    nonprofitItems.forEach((el) => {
      (el as HTMLElement).style.color = "#ffffff";
      (el as HTMLElement).style.textShadow = "0 1px 2px rgba(0,0,0,0.35)";
      (el as HTMLElement).style.fontSize = "0.8rem"; // larger
      (el as HTMLElement).style.fontWeight = "600";
    });

  }, [html, imageUrl, title]);


  if (!html) {
    return <main className="min-h-screen w-full"></main>;
  }

  return (
    <main
      className="min-h-screen p-0 m-0 w-full font-nunito"
      style={{
        background: g1 && g2 && g3 ? `linear-gradient(to bottom, ${g1}, ${g2}, ${g3})` : "#222222"
      }}
    >
      <div
        className="w-full max-w-2xl mx-auto p-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
