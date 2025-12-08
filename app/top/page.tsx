"use client";

import React, { useEffect, useState } from "react";
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
        setErrorMessage(
          "Foximo bows in regret: the royal Top 10 could not be loaded."
        );
      } else {
        setCompliments((data ?? []) as ComplimentRow[]);
      }

      setLoading(false);
    }

    loadTop();
  }, []);

  function getRankIcon(rank: number) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "👑";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(circle at top, #020617 0, #020617 40%, #0b1120 100%)",
        color: "#e5e7eb",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "2.5rem auto 2rem",
          padding: "0 1rem",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            borderRadius: "24px",
            background:
              "radial-gradient(circle at top left, #fef3c7 0, #ffffff 45%, #f9fafb 100%)",
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.7)",
            padding: "1.75rem 1.5rem 2.25rem",
          }}
        >
          {/* Fejléc */}
          <header
            style={{
              textAlign: "center",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                borderRadius: "999px",
                background: "rgba(15,23,42,0.06)",
                marginBottom: "0.75rem",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🦊</span>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#4b5563",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Foximo&apos;s Royal Ranking
              </span>
            </div>

            <h1
              style={{
                fontSize: "2rem",
                marginBottom: "0.4rem",
                color: "#111827",
              }}
            >
              Top 10 Praises of the Court
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                color: "#6b7280",
                maxWidth: "520px",
                margin: "0 auto",
              }}
            >
              These praises have received the most heartfelt thanks from noble
              visitors. A true hall of fame for Foximo&apos;s finest flattery.
            </p>

            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                marginTop: "1.1rem",
                fontSize: "0.9rem",
                color: "#4f46e5",
                textDecoration: "none",
              }}
            >
              <span>←</span>
              <span>Back to Foximo&apos;s main hall</span>
            </a>
          </header>

          {errorMessage && (
            <p
              style={{
                marginBottom: "1rem",
                color: "#b91c1c",
                textAlign: "center",
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
              The royal scribes are assembling the Top 10 scrolls...
            </p>
          )}

          {!loading && compliments.length === 0 && !errorMessage && (
            <p
              style={{
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              No praises have entered the royal hall of fame yet. Foximo awaits
              the first legendary flattery.
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
                gap: "1rem",
              }}
            >
              {compliments.map((compliment, index) => {
                const rank = index + 1;
                const icon = getRankIcon(rank);

                return (
                  <li key={compliment.id}>
                    <article
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto",
                        gap: "0.9rem",
                        alignItems: "center",
                        padding: "1rem 1rem",
                        borderRadius: "16px",
                        border: "1px solid #e5e7eb",
                        boxShadow:
                          "0 10px 25px rgba(15,23,42,0.06)",
                        background:
                          rank <= 3
                            ? "linear-gradient(135deg, #fef3c7, #ffffff)"
                            : "linear-gradient(135deg, #f9fafb, #ffffff)",
                        transform: "translateY(0)",
                        transition:
                          "transform 150ms ease, box-shadow 150ms ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform =
                          "translateY(-3px)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "0 14px 30px rgba(15,23,42,0.12)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform =
                          "translateY(0)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "0 10px 25px rgba(15,23,42,0.06)";
                      }}
                    >
                      {/* Rang + ikon */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.15rem",
                          minWidth: "52px",
                        }}
                      >
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "999px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: rank <= 3 ? "1.4rem" : "1.1rem",
                            background:
                              rank === 1
                                ? "radial-gradient(circle at top, #fde68a, #f97316)"
                                : rank === 2
                                ? "radial-gradient(circle at top, #e5e7eb, #9ca3af)"
                                : rank === 3
                                ? "radial-gradient(circle at top, #fed7aa, #fb923c)"
                                : "radial-gradient(circle at top, #eef2ff, #e0e7ff)",
                          }}
                        >
                          {icon}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#6b7280",
                          }}
                        >
                          #{rank}
                        </div>
                      </div>

                      {/* Szöveg */}
                      <div>
                        <p
                          style={{
                            fontSize: "0.95rem",
                            color: "#374151",
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {compliment.text.replace("{name}", "Your Grace")}
                        </p>
                      </div>

                      {/* Köszönet számláló */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "0.25rem",
                          minWidth: "80px",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.9rem",
                            color: "#6b7280",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              width: "22px",
                              height: "22px",
                              borderRadius: "999px",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#fee2e2",
                            }}
                          >
                            ❤️
                          </span>
                          <span>{compliment.thank_count}</span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af",
                          }}
                        >
                          Praised & thanked
                        </span>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <footer
        style={{
          textAlign: "center",
          fontSize: "0.8rem",
          color: "#9ca3af",
          paddingBottom: "1.5rem",
        }}
      >
        Foximo respectfully salutes the finest flattery of the realm. 🦊👑
      </footer>
    </main>
  );
}