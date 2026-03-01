"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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