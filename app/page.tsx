"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">
        Workload Drift
      </h1>

      {!session ? (
        <button
          onClick={() => signIn("google")}
          className="px-6 py-3 bg-black text-white rounded-lg hover:opacity-80"
        >
          Connect Google Calendar
        </button>
      ) : (
        <>
          <p className="text-lg">
            Signed in as {session.user?.email}
          </p>
          <button
            onClick={() => signOut()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:opacity-80"
          >
            Sign Out
          </button>
        </>
      )}
    </main>
  );
}