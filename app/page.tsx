"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type ComplimentRow = {
  id: number;
  title: string;
  text: string; // {name} placeholder
  thank_count: number;
};

export default function Home() {
  const [userName, setUserName] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);

  const [compliments, setCompliments] = useState<ComplimentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [sessionPraiseCount, setSessionPraiseCount] = useState(0);
  const [thankReply, setThankReply] = useState<string | null>(null);

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  // Név + állapot + „praised” számláló betöltése
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedName = window.localStorage.getItem("foximoUserName");
    const storedIsNameSet = window.localStorage.getItem("foximoIsNameSet");
    const storedPraiseCount = window.sessionStorage.getItem(
      "foximoSessionPraiseCount"
    );

    if (storedName) {
      setUserName(storedName);
    }
    if (storedIsNameSet === "true") {
      setIsNameSet(true);
    }
    if (storedPraiseCount) {
      const parsed = parseInt(storedPraiseCount, 10);
      if (!Number.isNaN(parsed)) {
        setSessionPraiseCount(parsed);
      }
    }
  }, []);

  // Bókok betöltése Supabase-ből
  useEffect(() => {
    async function loadCompliments() {
      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("compliments")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error loading compliments:", error.message);
        setErrorMessage(
          "Foximo is terribly sorry, but the praises could not be loaded."
        );
      } else {
        setCompliments((data ?? []) as ComplimentRow[]);
      }

      setLoading(false);
    }

    loadCompliments();
  }, []);

  // Session praise count mentése (reload túlél, tab bezárás nem)
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      "foximoSessionPraiseCount",
      String(sessionPraiseCount)
    );
  }, [sessionPraiseCount]);

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userName.trim()) return;
    setIsNameSet(true);
    setCurrentIndex(null);
    setThankReply(null);
    setSessionPraiseCount(0);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("foximoUserName", userName.trim());
      window.localStorage.setItem("foximoIsNameSet", "true");
      window.sessionStorage.setItem("foximoSessionPraiseCount", "0");
    }
  }

  function handleChangeName() {
    setIsNameSet(false);
    setCurrentIndex(null);
    setThankReply(null);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("foximoIsNameSet", "false");
    }
  }

  function formatWithName(text: string) {
    const fallback = "Your Grace";
    const name = userName.trim() || fallback;
    return text.replace("{name}", name);
  }

  async function handleThankYou(id: number) {
    setErrorMessage(null);
    setUpdatingId(id);

    const compliment = compliments.find((c) => c.id === id);
    if (!compliment) {
      setUpdatingId(null);
      return;
    }

    const newCount = compliment.thank_count + 1;

    const { data, error } = await supabase
      .from("compliments")
      .update({ thank_count: newCount })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating thank_count:", error.message);
      setErrorMessage("Alas! Foximo could not record your gracious thanks.");
      setUpdatingId(null);
      return;
    }

    if (data) {
      setCompliments((prev) =>
        prev.map((c) => (c.id === id ? (data as ComplimentRow) : c))
      );
    }

    const replyTemplates = [
      "No, I thank you, {name}.",
      "Your gratitude greatly honours this humble fox, {name}.",
      "Foximo bows deeply: your thanks are more precious than gold, {name}.",
      "Your kindness is noted in the royal ledger, {name}.",
      "Ever at your service, {name} – your thanks are warmly received.",
    ];
    const randomIndex = Math.floor(Math.random() * replyTemplates.length);
    const rawReply = replyTemplates[randomIndex];
    const replyText = formatWithName(rawReply);
    setThankReply(replyText);

    setUpdatingId(null);
  }

  function handleRequestPraise() {
    if (compliments.length === 0) return;

    setThankReply(null);

    setSessionPraiseCount((prev) => prev + 1);

    setCurrentIndex((prevIndex) => {
      if (compliments.length === 1) {
        return 0;
      }

      if (prevIndex === null) {
        return Math.floor(Math.random() * compliments.length);
      }

      let newIndex = prevIndex;
      while (newIndex === prevIndex) {
        newIndex = Math.floor(Math.random() * compliments.length);
      }
      return newIndex;
    });
  }

  const activeCompliment: ComplimentRow | null =
    !loading &&
    compliments.length > 0 &&
    currentIndex !== null &&
    compliments[currentIndex]
      ? compliments[currentIndex]!
      : null;

  function buildShareText() {
    const baseName = recipientName.trim() || "you";
    const praiseText =
      activeCompliment ? formatWithName(activeCompliment.text) : "";
    return (
      `Foximo the Courtier sends this praise to ${baseName}:\n\n` +
      `"${praiseText}"\n\n` +
      `Try Foximo: https://your-foximo-site.com`
    );
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
          {/* Hero */}
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.2rem",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "2.25rem",
            }}
          >
            <img
              src="/foximo_hero.png"
              alt="Foximo the Courtier"
              style={{
                width: "180px",
                height: "auto",
                borderRadius: "999px",
              }}
            />
            <div>
              <h1
                style={{
                  fontSize: "2.2rem",
                  marginBottom: "0.75rem",
                  color: "#111827",
                }}
              >
                Foximo the Courtier
              </h1>
              <p
                style={{
                  fontSize: "1.02rem",
                  color: "#4b5563",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                Your humble digital courtier, ever ready to bow, flatter, and
                sprinkle a little royal joy upon Your Grace&apos;s day.
              </p>

              {/* Ko-fi */}
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  alignItems: "center",
                }}
              >
                <a
                  href="https://ko-fi.com/YOUR_KOFI_PAGE"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "999px",
                    border: "none",
                    cursor: "pointer",
                    background:
                      "linear-gradient(135deg, #22c55e, #16a34a)",
                    color: "white",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    boxShadow: "0 6px 14px rgba(22,163,74,0.35)",
                    textDecoration: "none",
                  }}
                >
                  Offer alms on Ko-fi
                </a>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#6b7280",
                  }}
                >
                  A small token keeps Foximo&apos;s feather fabulous.
                </span>
              </div>

              {/* Toplist link */}
              <a
                href="/top"
                style={{
                  display: "inline-block",
                  marginTop: "0.8rem",
                  fontSize: "0.9rem",
                  color: "#4f46e5",
                  textDecoration: "underline",
                }}
              >
                View Foximo&apos;s royal Top 10 →
              </a>
            </div>
          </section>

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

          {/* Name form */}
          {!isNameSet && (
            <section
              style={{
                marginBottom: "2.5rem",
                padding: "1.5rem 1.25rem",
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
                background:
                  "radial-gradient(circle at top left, #fef3c7 0, #ffffff 45%, #f9fafb 100%)",
                maxWidth: "480px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <h2
                style={{
                  fontSize: "1.4rem",
                  marginBottom: "0.75rem",
                  textAlign: "center",
                  color: "#111827",
                }}
              >
                Most gracious visitor,
              </h2>
              <p
                style={{
                  fontSize: "0.98rem",
                  color: "#374151",
                  textAlign: "center",
                  marginBottom: "1rem",
                }}
              >
                Pray tell, how shall Foximo address Your Grace in his most
                devoted praises?
              </p>

              <form
                onSubmit={handleNameSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  maxWidth: "360px",
                  margin: "0 auto",
                }}
              >
                <input
                  type="text"
                  placeholder="Enter your name or title (e.g. Lady Elvira)"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  style={{
                    padding: "0.6rem 0.8rem",
                    borderRadius: "999px",
                    border: "1px solid #d1d5db",
                    fontSize: "0.95rem",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "0.6rem 0.8rem",
                    borderRadius: "999px",
                    border: "none",
                    cursor: "pointer",
                    background:
                      "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: "white",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    boxShadow: "0 6px 14px rgba(55,48,163,0.35)",
                  }}
                >
                  Let Foximo address me properly
                </button>
              </form>
            </section>
          )}

          {/* Praise section */}
          {isNameSet && (
            <section>
              <div
                style={{
                  marginBottom: "1.5rem",
                  textAlign: "center",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.6rem",
                    marginBottom: "0.25rem",
                    color: "#111827",
                  }}
                >
                  Courtly Praise for {userName.trim() || "Your Grace"}
                </h2>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "#6b7280",
                    marginBottom: "0.5rem",
                  }}
                >
                  Foximo stands ready to deliver a fresh praise at Your
                  command.
                </p>
              </div>

              {loading && (
                <p
                  style={{
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Foximo is carefully polishing your praises...
                </p>
              )}

              {!loading && compliments.length === 0 && (
                <p
                  style={{
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Foximo bows in apology – no praises have been prepared yet.
                </p>
              )}

              {/* Aktív bók box – a request gomb FELETT */}
              {!loading && activeCompliment && (
                <div
                  style={{
                    maxWidth: "560px",
                    margin: "1.5rem auto 1.5rem",
                  }}
                >
                  <article
                    style={{
                      borderRadius: "16px",
                      border: "1px solid #e5e7eb",
                      padding: "1.25rem",
                      boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
                      background:
                        "radial-gradient(circle at top left, #fef3c7 0, #ffffff 45%, #f9fafb 100%)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.98rem",
                        color: "#374151",
                        marginBottom: "1rem",
                      }}
                    >
                      {formatWithName(activeCompliment.text)}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleThankYou(activeCompliment.id)}
                        disabled={updatingId === activeCompliment.id}
                        style={{
                          flexShrink: 0,
                          padding: "0.45rem 0.9rem",
                          borderRadius: "999px",
                          border: "none",
                          cursor: "pointer",
                          opacity:
                            updatingId === activeCompliment.id ? 0.7 : 1,
                          background:
                            "linear-gradient(135deg, #fbbf24, #f97316)",
                          color: "white",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          boxShadow:
                            "0 6px 14px rgba(194,65,12,0.35)",
                        }}
                      >
                        {updatingId === activeCompliment.id
                          ? "Recording your thanks..."
                          : "Thank you, Foximo"}
                      </button>

                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
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
                        <span>{activeCompliment.thank_count}</span>
                      </div>
                    </div>

                    {thankReply && (
                      <p
                        style={{
                          marginTop: "0.75rem",
                          fontSize: "0.9rem",
                          color: "#4b5563",
                          fontStyle: "italic",
                        }}
                      >
                        {thankReply}
                      </p>
                    )}
                  </article>
                </div>
              )}

              {/* Request praise + Send praise + counter + name change */}
              <div
                style={{
                  textAlign: "center",
                  marginTop: activeCompliment ? 0 : "1.5rem",
                }}
              >
                <button
                  type="button"
                  onClick={handleRequestPraise}
                  disabled={loading || compliments.length === 0}
                  style={{
                    padding: "0.6rem 1rem",
                    borderRadius: "999px",
                    border: "none",
                    cursor: "pointer",
                    background:
                      "linear-gradient(135deg, #fbbf24, #f97316)",
                    color: "white",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    boxShadow: "0 6px 14px rgba(194,65,12,0.35)",
                    opacity:
                      loading || compliments.length === 0 ? 0.7 : 1,
                  }}
                >
                  {sessionPraiseCount === 0
                    ? "Request praise"
                    : "Request more praise"}
                </button>

                <div style={{ marginTop: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCopyFeedback(null);
                      setShareError(null);
                      setIsSendModalOpen(true);
                    }}
                    disabled={!activeCompliment}
                    style={{
                      padding: "0.45rem 0.9rem",
                      borderRadius: "999px",
                      border: "1px solid #4f46e5",
                      cursor: activeCompliment
                        ? "pointer"
                        : "not-allowed",
                      background: "white",
                      color: "#4f46e5",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                      opacity: activeCompliment ? 1 : 0.6,
                    }}
                  >
                    Send this praise to someone
                  </button>
                </div>

                <div
                  style={{
                    marginTop: "0.75rem",
                    fontSize: "0.9rem",
                    color: "#6b7280",
                  }}
                >
                  Praised <strong>{sessionPraiseCount}</strong> times
                  this visit.
                </div>

                <button
                  type="button"
                  onClick={handleChangeName}
                  style={{
                    display: "inline-block",
                    marginTop: "0.75rem",
                    fontSize: "0.85rem",
                    color: "#4f46e5",
                    textDecoration: "underline",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Change name / title
                </button>
              </div>
            </section>
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
        Made with royal mischief by Foximo the Courtier 🦊👑
      </footer>

      {/* Send praise modal */}
      {isSendModalOpen && activeCompliment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
          onClick={() => setIsSendModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "480px",
              width: "100%",
              borderRadius: "18px",
              background:
                "radial-gradient(circle at top left, #fef3c7 0, #ffffff 45%, #f9fafb 100%)",
              padding: "1.5rem 1.5rem 1.25rem",
              boxShadow: "0 16px 40px rgba(15,23,42,0.45)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <img
                src="/foximo_hero.png"
                alt="Foximo avatar"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "999px",
                  objectFit: "cover",
                }}
              />
              <div>
                <h2
                  style={{
                    fontSize: "1.1rem",
                    marginBottom: "0.1rem",
                    color: "#111827",
                  }}
                >
                  Send this praise
                </h2>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#6b7280",
                  }}
                >
                  Share Foximo&apos;s royal praise via your favourite
                  messenger.
                </p>
              </div>
            </div>

            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                color: "#374151",
                marginBottom: "0.35rem",
              }}
            >
              Recipient&apos;s noble name (optional)
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Anna, Sir Robert..."
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "999px",
                border: "1px solid #d1d5db",
                fontSize: "0.9rem",
                marginBottom: "0.9rem",
              }}
            />

            <div
              style={{
                fontSize: "0.9rem",
                color: "#374151",
                background: "#fefce8",
                borderRadius: "12px",
                padding: "0.75rem 0.9rem",
                border: "1px solid #facc15",
                marginBottom: "0.9rem",
                whiteSpace: "pre-wrap",
              }}
            >
              {buildShareText()}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <button
                type="button"
                onClick={async () => {
                  setCopyFeedback(null);
                  setShareError(null);
                  try {
                    const text = buildShareText();
                    await navigator.clipboard.writeText(text);
                    setCopyFeedback(
                      "Copied! Foximo politely suggests: paste this into Messenger, WhatsApp, or your favourite royal channel."
                    );
                  } catch (err) {
                    setShareError(
                      "Could not copy to clipboard. Please try manually."
                    );
                  }
                }}
                style={{
                  padding: "0.5rem 0.9rem",
                  borderRadius: "999px",
                  border: "none",
                  cursor: "pointer",
                  background:
                    "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  color: "white",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  boxShadow: "0 6px 14px rgba(55,48,163,0.35)",
                }}
              >
                Copy text
              </button>

              <button
                type="button"
                onClick={async () => {
                  setCopyFeedback(null);
                  setShareError(null);
                  try {
                    const text = buildShareText();

                    if (navigator.share) {
                      await navigator.share({
                        title: "A royal praise from Foximo",
                        text,
                      });
                    } else {
                      setShareError(
                        "Your browser does not support direct sharing. Please use Copy instead."
                      );
                    }
                  } catch (err) {
                    setShareError(
                      "Sharing was cancelled or failed."
                    );
                  }
                }}
                style={{
                  padding: "0.5rem 0.9rem",
                  borderRadius: "999px",
                  border: "1px solid #4b5563",
                  cursor: "pointer",
                  background: "white",
                  color: "#111827",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
              >
                Share…
              </button>

              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "999px",
                  border: "none",
                  background: "transparent",
                  color: "#6b7280",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            {(copyFeedback || shareError) && (
              <p
                style={{
                  fontSize: "0.85rem",
                  marginTop: "0.25rem",
                  color: shareError ? "#b91c1c" : "#16a34a",
                }}
              >
                {copyFeedback || shareError}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}