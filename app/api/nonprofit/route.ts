import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ein = searchParams.get("ein");

  if (!ein) {
    return NextResponse.json(
      { error: "Missing EIN" },
      { status: 400 }
    );
  }

  try {
    const url = `https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`;

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: "ProPublica org error" },
        { status: 500 }
      );
    }

    const data = await res.json();

    if (!data || !data.organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data.organization);
  } catch (error) {
    console.error("Org fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from ProPublica" },
      { status: 500 }
    );
  }
}
