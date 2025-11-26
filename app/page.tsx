// Nonprofit page with body background applied only on this page
"use client";
import { useState, useEffect } from "react";

export default function NonprofitLookupPage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [titles, setTitles] = useState<string[]>([]);
  const [loadingGPT, setLoadingGPT] = useState(false);
  const [loadingBadge, setLoadingBadge] = useState(false);
  const [badgeUrl, setBadgeUrl] = useState<string | null>(null);

  // Page-only background
  useEffect(() => {
    document.body.style.background = "#faf5ee";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  // Autocomplete search
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.organizations || []);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  function selectNonprofit(org: any) {
    if (selected.length >= 5) {
      setError("You can select up to 5 nonprofits that you support.");
      return;
    }
    if (selected.find((o) => o.ein === org.ein)) {
      setError("Already selected.");
      return;
    }
    setSelected([...selected, org]);
    setQuery("");
    setSuggestions([]);
    setError("");
  }

  function removeNonprofit(ein: number) {
    setSelected(selected.filter((o) => o.ein !== ein));
  }

  async function submitToGPT() {
    setLoadingGPT(true);
    setTitles([]);
    setError("");

    try {
      const res = await fetch("/api/titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonprofits: selected.map(n => n.name) })
      });

      const data = await res.json();

      if (data.error) setError(data.error);
      else setTitles(data.titles);
    } catch {
      setError("Failed to contact ChatGPT API.");
    }

    setLoadingGPT(false);
  }

  const chosenTitle = titles.find(t => t.startsWith("✔ "))?.replace(/^✔ /, "");

  async function generateBadge() {
    if (!chosenTitle || loadingBadge) return;

    setLoadingBadge(true);
    setError("");

    sessionStorage.setItem("badgeTitle", chosenTitle);

    try {
      const badgeRes = await fetch("/api/badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: chosenTitle }),
      });

      const badgeData = await badgeRes.json();
      if (!badgeData.imageBase64) throw new Error("No imageBase64 returned");

      sessionStorage.setItem("badgeImageUrl", badgeData.imageUrl);

      const nonprofits = selected.map(n => ({ name: n.name, ein: n.ein }));

      const pageRes = await fetch("/api/render-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: chosenTitle, nonprofits }),
      });

      const pageData = await pageRes.json();
      if (!pageData.html) throw new Error("No HTML returned");

      sessionStorage.setItem("badgeHTML", pageData.html);
      sessionStorage.setItem("g1", pageData.g1);
      sessionStorage.setItem("g2", pageData.g2);
      sessionStorage.setItem("g3", pageData.g3);

      window.location.href = "/badge-result";
    } catch {
      setError("Failed to generate badge.");
    }

    setLoadingBadge(false);
  }

  return (
    <main className="min-h-screen w-full flex justify-center items-start p-4 pt-16 sm:pt-20">
      <div className="w-full max-w-[18rem] xs:max-w-sm sm:max-w-md bg-white/80 backdrop-blur-xl shadow-lg rounded-2xl p-6 sm:p-10 border border-gray-200 space-y-6">
      <p className="text-sm sm:text-sm">
        Welcome to Good Badger. This was made so that you can share which nonprofits you donate to,
        volunteer at, or just care about. Take a screenshot at the end and share on your favorite
        platform. Tag @good.badgerorg!
      </p>

      <h1 className="text-xl sm:text-2xl font-bold">
        Select Up to 5 nonprofits
      </h1>

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query || ""}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by nonprofit name"
          className="border p-2 sm:p-3 rounded w-full text-black bg-white/70 backdrop-blur text-sm sm:text-base"
        />

        {suggestions.length > 0 && (
          <ul className="absolute bg-white border rounded w-full z-10 max-h-60 overflow-auto mt-1 text-sm sm:text-base">
            {suggestions.map((s) => (
              <li
                key={s.ein}
                onClick={() => selectNonprofit(s)}
                className="p-2 sm:p-3 hover:bg-gray-100 cursor-pointer text-black"
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected nonprofits */}
      <div className="space-y-2 text-black text-sm sm:text-base">
        {selected.map((org) => (
          <div
            key={org.ein}
            className="flex justify-between items-center border bg-white/60 backdrop-blur p-2 sm:p-3 rounded"
          >
            <span>{org.name}</span>
            <button
              onClick={() => removeNonprofit(org.ein)}
              className="text-red-600 hover:underline text-xs sm:text-sm"
            >
              Remove
            </button>
          </div>
        ))}
        {selected.length === 0 && (
          <p className="text-gray-700 text-xs sm:text-sm">No nonprofits selected yet.</p>
        )}
      </div>

      {/* Create Title */}
      <button
        onClick={submitToGPT}
        disabled={selected.length === 0 || loadingGPT}
        className="px-4 py-2 sm:px-5 sm:py-3 bg-black text-white rounded disabled:opacity-50 text-sm sm:text-base"
      >
        {loadingGPT ? "Generating titles..." : "Create Title"}
      </button>

      {/* Titles */}
      {titles.length > 0 && (
        <div className="bg-white/60 backdrop-blur p-3 sm:p-4 rounded border space-y-2 text-sm sm:text-base">
          <ul className="space-y-0.5 sm:space-y-1">
            {titles.map((t, idx) => (
              <li
                key={idx}
                onClick={() =>
                  setTitles(prev =>
                    prev.map((item, i) =>
                      i === idx ? "✔ " + item.replace(/^✔ /, "") : item.replace(/^✔ /, "")
                    )
                  )
                }
                className="p-1.5 sm:p-2 cursor-pointer rounded hover:bg-gray-200 text-black"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generate Badge */}
      {titles.length > 0 && (
        <button
          onClick={generateBadge}
          disabled={!chosenTitle || loadingBadge}
          className="px-4 py-2 sm:px-5 sm:py-3 bg-black text-white rounded disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
        >
          {loadingBadge ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              Generating badge, this will take a minute...
            </>
          ) : (
            "Generate Badge"
          )}
        </button>
      )}

      {/* Debug badge preview */}
      {badgeUrl && (
        <div className="mt-4">
          <img src={badgeUrl} alt="Generated badge" className="rounded border w-32 sm:w-40" />
        </div>
      )}

      {error && <p className="text-red-600 text-xs sm:text-sm">{error}</p>}
      </div>
    </main>
  );
}