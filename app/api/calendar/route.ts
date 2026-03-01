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
  let longestFocusBlock = 0;

  const dailyMap: Record<string, number> = {};

  for (let i = 0; i < events.length; i++) {
    if (!events[i].start?.dateTime || !events[i].end?.dateTime) continue;

    const start = new Date(events[i].start.dateTime);
    const end = new Date(events[i].end.dateTime);

    const duration =
      (end.getTime() - start.getTime()) / (1000 * 60);

    totalMinutes += duration;

    if (start.getHours() >= 18) {
      lateMeetings++;
    }

    const dayKey = start.toISOString().split("T")[0];
    dailyMap[dayKey] = (dailyMap[dayKey] || 0) + duration;

    if (i > 0 && events[i - 1].end?.dateTime) {
      const prevEnd = new Date(events[i - 1].end.dateTime);
      const gap =
        (start.getTime() - prevEnd.getTime()) / (1000 * 60);

      if (gap <= 5) {
        backToBack++;
      }

      if (gap > longestFocusBlock) {
        longestFocusBlock = gap;
      }
    }
  }

  const totalHours = totalMinutes / 60;

  const dailyHours = Object.values(dailyMap).map(
    (min) => min / 60
  );

  const peakDayHours =
    dailyHours.length > 0
      ? Math.max(...dailyHours)
      : 0;

  // Smarter scoring model
  let score = 100;

  score -= totalHours * 1.5;
  score -= peakDayHours * 4;
  score -= backToBack * 3;
  score -= lateMeetings * 5;

  if (longestFocusBlock < 60) {
    score -= 10;
  }

  if (score < 0) score = 0;

  let risk = "Low";
  if (score < 40) risk = "High";
  else if (score < 70) risk = "Medium";

  return NextResponse.json({
    totalHours: Number(totalHours.toFixed(2)),
    peakDayHours: Number(peakDayHours.toFixed(2)),
    longestFocusBlock: Math.round(longestFocusBlock),
    backToBack,
    lateMeetings,
    workloadScore: Math.round(score),
    risk,
  });
}