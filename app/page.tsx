"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Home() {
  const { data: session, status } = useSession();

  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  function generateInsight(data: any) {
    if (!data) return "";

    if (data.risk === "High") {
      if (data.peakDayHours > 5) {
        return "Your workload is heavily concentrated on a single day. Consider redistributing meetings.";
      }
      if (data.backToBack > 5) {
        return "Frequent back-to-back meetings are creating heavy context switching.";
      }
      return "Your meeting load is high and may increase burnout risk.";
    }

    if (data.risk === "Medium") {
      if (data.longestFocusBlock < 90) {
        return "Your focus blocks are fragmented. Protect longer deep work windows.";
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

      fetch("/api/history")
        .then((res) => res.json())
        .then((result) => setHistory(result));
    }
  }, [session]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading...
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-semibold">Workload Drift</h1>

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
        Analyzing your workload...
      </main>
    );
  }

  return (
    <main className="min-h-screen p-10 flex flex-col items-center gap-10">

      {/* SCORE CARD */}

      <div className="bg-white shadow-md rounded-xl p-10 text-center w-full max-w-lg">
        <h1 className="text-6xl font-bold">
          {data.workloadScore}
        </h1>

        <p className="text-lg mt-2 uppercase tracking-wide">
          Burnout Risk
        </p>

        <p
          className={`text-2xl mt-2 font-semibold ${
            data.risk === "High"
              ? "text-red-500"
              : data.risk === "Medium"
              ? "text-yellow-500"
              : "text-green-500"
          }`}
        >
          {data.risk}
        </p>

        <p className="mt-6 text-gray-600">
          {generateInsight(data)}
        </p>
      </div>

      {/* WORKLOAD BREAKDOWN */}

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
          <p className="font-semibold">Longest Focus Block</p>
          <p>{data.longestFocusBlock} min</p>
        </div>

        <div>
          <p className="font-semibold">Back-to-Back Meetings</p>
          <p>{data.backToBack}</p>
        </div>

      </div>

      {/* TREND GRAPH */}

      <div className="w-full max-w-xl mt-10">
        <h2 className="text-xl font-semibold mb-4">
          Workload Trend
        </h2>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={history}>
            <XAxis dataKey="created_at" hide />
            <YAxis domain={[0,100]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="workload_score"
              stroke="#ef4444"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
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