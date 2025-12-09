"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type ComplimentRow = {
  id: number;
  title: string;
  text: string; // {name} placeholder
  thank_count: number;
};

export default function TopPage() {
  const [compliments, setCompliments] = useState<ComplimentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userName, setUserName] = useState("Your Grace");

  // név beolvasása localStorage-ból
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("foximoUserName");
    const finalName = stored && stored.trim() ? stored.trim() : "Your Grace";
    setUserName(finalName);
  }, []);

  function formatWithName(text: string) {
    return text.replace("{name}", userName);
  }

  useEffect(() => {
    async function loadTop() {
      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("compliments")
        .select("*")
        .order("thank_count", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error loading top compliments:", error.message);
        setErrorMessage("Foximo could not fetch the royal Top 10 list.");
      } else {
        setCompliments((data ?? []) as ComplimentRow[]);
      }

      setLoading(false);
    }

    loadTop();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, #020617 0, #020617 40%, #0b1120 100%)",
        color: "#e5e7eb",
        padding: "2.5rem 1rem 2rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "820px",
          width: "100%",
          borderRadius: "24px",
          background:
            "radial-gradient(circle at top left, #fef3c7 0, #ffffff 45%, #f9fafb 100%)",
          boxShadow: "0 20px 60px rgba(15,23,42,0.7)",
          padding: "1.8rem 1.6rem 2rem",
          color: "#111827",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "999px",
                background: "#f97316",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
              }}
            >
              🦊
            </div>
            <div>
              <h1
                style={{
                  fontSize: "1.8rem",
                  marginBottom: "0.1rem",
                }}
              >
                Foximo&apos;s Royal Top 10
              </h1>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#4b5563",
                }}
              >
                The most thanked praises, tailor-made for {userName}.
              </p>
            </div>
          </div>

          <a
            href="/"
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid #4f46e5",
              background: "#ffffff",
              color: "#4f46e5",
              fontSize: "0.85rem",
              fontWeight: 500,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            ← Back to Foximo
          </a>
        </header>

        {errorMessage && (
          <p
            style={{
              marginBottom: "1rem",
              color: "#b91c1c",
              fontSize: "0.95rem",
            }}
          >
            {errorMessage}
          </p>
        )}

        {loading && (
          <p
            style={{
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            Foximo is dusting off the royal records...
          </p>
        )}

        {!loading && compliments.length === 0 && !errorMessage && (
          <p
            style={{
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            No praises have been thanked yet. Be the first to honour Foximo on
            the main page!
          </p>
        )}

        {!loading && compliments.length > 0 && (
          <ol
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
            }}
          >
            {compliments.map((c, idx) => (
              <li
                key={c.id}
                style={{
                  borderRadius: "16px",
                  border: "1px solid #e5e7eb",
                  padding: "0.9rem 1rem",
                  background:
                    "radial-gradient(circle at top left, #fefce8 0, #ffffff 60%)",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                }}
              >
                {/* Sorszám badge */}
                <div
                  style={{
                    width: "1.9rem",
                    height: "1.9rem",
                    borderRadius: "999px",
                    background:
                      idx === 0
                        ? "#f97316"
                        : idx === 1
                        ? "#facc15"
                        : idx === 2
                        ? "#22c55e"
                        : "#9ca3af",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.95rem",
                      color: "#374151",
                    }}
                  >
                    {formatWithName(c.text)}
                  </p>

                  <p
                    style={{
                      margin: "0.3rem 0 0",
                      fontSize: "0.8rem",
                      color: "#6b7280",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.9rem",
                      }}
                    >
                      👑
                    </span>
                    <span>
                      Thanked <strong>{c.thank_count}</strong> times
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}