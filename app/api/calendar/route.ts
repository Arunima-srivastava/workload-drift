import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${sevenDaysAgo.toISOString()}&timeMax=${now.toISOString()}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    }
  );

  const data = await res.json();
  const events = data.items || [];

  let totalMinutes = 0;
  let lateMeetings = 0;
  let backToBack = 0;

  for (let i = 0; i < events.length; i++) {
    const start = new Date(events[i].start.dateTime);
    const end = new Date(events[i].end.dateTime);

    const duration =
      (end.getTime() - start.getTime()) / (1000 * 60);

    totalMinutes += duration;

    if (start.getHours() >= 18) {
      lateMeetings++;
    }

    if (i > 0) {
      const prevEnd = new Date(events[i - 1].end.dateTime);
      if (start.getTime() - prevEnd.getTime() <= 5 * 60 * 1000) {
        backToBack++;
      }
    }
  }

  const totalHours = totalMinutes / 60;

  // Simple scoring model
  let score = 100;

  score -= totalHours * 2;        // heavy meeting load penalty
  score -= backToBack * 3;        // context switching penalty
  score -= lateMeetings * 5;      // evening burnout penalty

  if (score < 0) score = 0;

  return NextResponse.json({
    totalHours,
    backToBack,
    lateMeetings,
    workloadScore: Math.round(score),
  });
}