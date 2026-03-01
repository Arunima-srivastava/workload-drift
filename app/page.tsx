"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  function generateInsight(data: any) {
    if (!data) return "";

    if (data.risk === "High") {
      if (data.peakDayHours > 5) {
        return "Your workload is heavily concentrated on a single day. Consider redistributing meetings.";
      }
      if (data.backToBack > 5) {
        return "Frequent back-to-back meetings may reduce recovery time and increase fatigue.";
      }
      return "Your weekly meeting load is high and may increase burnout risk.";
    }

    if (data.risk === "Medium") {
      if (data.longestFocusBlock < 90) {
        return "Your focus blocks are fragmented. Try protecting longer deep work windows.";
      }
      return "Your workload is moderate but could improve with better spacing.";
    }

    return "Your workload appears balanced with healthy focus time.";
  }

  useEffect(() => {
    if (session) {
      setLoading(true);
      fetch("/api/calendar")
        .then((res) => res.json())
        .then((result) => {
          setData(result);
          setLoading(false);
        });
    }
  }, [session]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-semibold">
          Workload Drift
        </h1>
        <button
          onClick={() => signIn("google")}
          className="px-6 py-3 bg-black text-white rounded-md"
        >
          Connect Google Calendar
        </button>
      </main>
    );
  }

  if (loading || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Analyzing your workload...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-10 flex flex-col items-center gap-10">
      <div className="text-center">
        <h1 className="text-5xl font-bold">
          {data.workloadScore}
        </h1>

        <p className="text-xl mt-2">
          Risk Level:{" "}
          <span
            className={
              data.risk === "High"
                ? "text-red-500"
                : data.risk === "Medium"
                ? "text-yellow-500"
                : "text-green-500"
            }
          >
            {data.risk}
          </span>
        </p>

        <p className="mt-4 max-w-md text-center text-gray-600">
          {generateInsight(data)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 text-lg">
        <div>
          <p className="font-semibold">Total Meeting Hours</p>
          <p>{data.totalHours}</p>
        </div>

        <div>
          <p className="font-semibold">Peak Day Hours</p>
          <p>{data.peakDayHours}</p>
        </div>

        <div>
          <p className="font-semibold">Longest Focus Block (min)</p>
          <p>{data.longestFocusBlock}</p>
        </div>

        <div>
          <p className="font-semibold">Back-to-Back Meetings</p>
          <p>{data.backToBack}</p>
        </div>
      </div>

      <button
        onClick={() => signOut()}
        className="mt-10 px-4 py-2 border rounded-md"
      >
        Sign Out
      </button>
    </main>
  );
}