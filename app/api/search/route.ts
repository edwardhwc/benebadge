import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("query") || "").trim();

  if (!query) {
    return NextResponse.json({ organizations: [] });
  }

  try {
    const url = `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${encodeURIComponent(
      query
    )}`;

    console.log("Fetching:", url);

    const res = await fetch(url);
    const data = await res.json();

    console.log("Returned:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Search error:", error);

    return NextResponse.json(
      { organizations: [], error: "Search failed" },
      { status: 500 }
    );
  }
}
