// Nonprofit page with body background gradient applied only on this page
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

  // Apply page-only background
  useEffect(() => {
    document.body.style.background = "#FFF8F0";

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
      } catch (err) {
        console.error(err);
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
        body: JSON.stringify({ nonprofits: selected.map((n) => n.name) })
      });

      const data = await res.json();

      if (data.error) setError(data.error);
      else setTitles(data.titles);
    } catch (err) {
      console.error(err);
      setError("Failed to contact ChatGPT API.");
    }

    setLoadingGPT(false);
  }

  const chosenTitle = titles.find((t) => t.startsWith("✔ "))?.replace(/^✔ /, "");

  async function generateBadge() {
    if (!chosenTitle || loadingBadge) return;

    setLoadingBadge(true);
    setError("");

    sessionStorage.setItem("badgeTitle", chosenTitle);

    try {
      const badgeRes = await fetch("/api/badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: chosenTitle })
      });

      const badgeData = await badgeRes.json();
      if (!badgeData.imageBase64) throw new Error("No imageBase64 returned");

      sessionStorage.setItem("badgeImageUrl", badgeData.imageUrl);

      const nonprofits = selected.map((n) => ({ name: n.name, ein: n.ein }));

      const pageRes = await fetch("/api/render-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: chosenTitle, nonprofits })
      });

      const pageData = await pageRes.json();
      if (!pageData.html) throw new Error("No HTML returned");

      sessionStorage.setItem("badgeHTML", pageData.html);
      console.log("g1: " + pageData.g1);
      sessionStorage.setItem("g1", pageData.g1);
      sessionStorage.setItem("g2", pageData.g2);
      sessionStorage.setItem("g3", pageData.g3);

      window.location.href = "/badge-result";
    } catch (err) {
      console.error(err);
      setError("Failed to generate badge.");
    }

    setLoadingBadge(false);
  }

  return (
    <main className="p-10 max-w-xl mx-auto space-y-6 text-black">
      <p>Welcome to Good Badger.  This was made so that you can share what nonprofits that you donate to, volunteer at, or just care about.  Take a screenshot at the end and share on your favorite platform.  Feel free to tag @good.badgerorg!</p>
      <h1 className="text-3xl font-bold">Select Up to 5 nonprofits</h1>

      <div className="relative">
        <input
          type="text"
          value={query || ""}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by nonprofit name"
          className="border p-3 rounded w-full text-black bg-white/70 backdrop-blur"
        />

        {suggestions.length > 0 && (
          <ul className="absolute bg-white border rounded w-full z-10 max-h-60 overflow-auto mt-1">
            {suggestions.map((s) => (
              <li
                key={s.ein}
                onClick={() => selectNonprofit(s)}
                className="p-3 hover:bg-gray-100 cursor-pointer text-black"
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 text-black">
        {selected.map((org) => (
          <div
            key={org.ein}
            className="flex justify-between items-center border bg-white/60 backdrop-blur p-3 rounded"
          >
            <span>{org.name}</span>
            <button
              onClick={() => removeNonprofit(org.ein)}
              className="text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        {selected.length === 0 && <p className="text-gray-700">No nonprofits selected yet.</p>}
      </div>

      <button
        onClick={submitToGPT}
        disabled={selected.length === 0 || loadingGPT}
        className="px-5 py-3 bg-black text-white rounded disabled:opacity-50"
      >
        {loadingGPT ? "Generating titles..." : "Create Title"}
      </button>

      {titles.length > 0 && (
        <div className="bg-white/60 backdrop-blur p-4 rounded border space-y-2">
          <ul className="space-y-2">
            {titles.map((t, idx) => (
              <li
                key={idx}
                onClick={() =>
                  setTitles((prev) =>
                    prev.map((item, i) => (i === idx ? "✔ " + item.replace(/^✔ /, "") : item.replace(/^✔ /, "")))
                  )
                }
                className="p-2 cursor-pointer rounded hover:bg-gray-200 text-black"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {titles.length > 0 && (
        <button
          onClick={generateBadge}
          disabled={!chosenTitle || loadingBadge}
          className="px-5 py-3 bg-black text-white rounded disabled:opacity-50 flex items-center justify-center"
        >
          {loadingBadge ? (
            <>
              <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              Generating badge, this will take a minute...
            </>
          ) : (
            "Generate Badge"
          )}
        </button>
      )}

      {badgeUrl && (
        <div className="mt-4">
          <img src={badgeUrl} alt="Generated badge" className="rounded border" />
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}
    </main>
  );
}