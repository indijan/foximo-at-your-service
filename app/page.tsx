"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type ComplimentRow = {
  id: number;
  title: string;
  text: string; // {name} placeholder
  thank_count: number;
};

const SITE_URL = "https://www.foximoatyourservice.today/";

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

  // Parallax háttérhez offset
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  // Hangeffektek
  const [soundPraise, setSoundPraise] = useState<HTMLAudioElement | null>(null);
  const [soundThank, setSoundThank] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const xRatio = e.clientX / window.innerWidth - 0.5;
      const yRatio = e.clientY / window.innerHeight - 0.5;
      setParallaxOffset({
        x: xRatio * 40,
        y: yRatio * 40,
      });
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Hangeffektek inicializálása
  useEffect(() => {
    if (typeof window === "undefined") return;

    const praise = new Audio("/sounds/praise.mp3");
    const thank = new Audio("/sounds/thank.mp3");

    praise.volume = 0.6;
    thank.volume = 0.6;

    setSoundPraise(praise);
    setSoundThank(thank);
  }, []);

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

  // Session praise count mentése (tab bezárásig él)
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

  // Küldéshez: a címzett neve kerüljön a szövegbe
  function formatForShare(text: string) {
    const rName = recipientName.trim();
    const nameForShare = rName || "you";
    return text.replace("{name}", nameForShare);
  }

  async function handleThankYou(id: number) {
    setErrorMessage(null);
    setUpdatingId(id);

    if (soundThank) {
      try {
        soundThank.currentTime = 0;
        await soundThank.play();
      } catch {
        // ignore
      }
    }

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

    if (soundPraise) {
      try {
        soundPraise.currentTime = 0;
        soundPraise.play();
      } catch {
        // ignore
      }
    }

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
      activeCompliment ? formatForShare(activeCompliment.text) : "";

    return (
      `🦊 A royal praise from Foximo the Courtier\n\n` +
      `For ${baseName}:\n` +
      `“${praiseText}”\n\n` +
      `Receive more courtly compliments here:\n` +
      `${SITE_URL}`
    );
  }

  const primaryButtonHover = {
    transform: "translateY(-1px) scale(1.02)",
    boxShadow: "0 8px 18px rgba(15,23,42,0.25)",
  };

  // 🔸 Közös megjelenítendő név mindenhez
  const displayName = userName.trim() || "Your Grace";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(circle at top, #020617 0, #020617 40%, #0b1120 100%)",
        color: "#e5e7eb",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Parallax háttér elemek */}
      <div
        style={{
          position: "fixed",
          top: "-80px",
          left: "-120px",
          width: "260px",
          height: "260px",
          borderRadius: "999px",
          background:
            "radial-gradient(circle at center, rgba(250,204,21,0.45), rgba(248,113,113,0))",
          filter: "blur(4px)",
          opacity: 0.85,
          transform: `translate3d(${parallaxOffset.x * 0.6}px, ${
            parallaxOffset.y * 0.6
          }px, 0)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-120px",
          right: "-80px",
          width: "320px",
          height: "320px",
          borderRadius: "999px",
          background:
            "radial-gradient(circle at center, rgba(59,130,246,0.35), rgba(56,189,248,0))",
          filter: "blur(6px)",
          opacity: 0.9,
          transform: `translate3d(${-parallaxOffset.x * 0.4}px, ${
            -parallaxOffset.y * 0.4
          }px, 0)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: "960px",
          margin: "2.5rem auto 2rem",
          padding: "0 1rem",
          width: "100%",
          boxSizing: "border-box",
          position: "relative",
          zIndex: 1,
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
                    boxSizing: "border-box",
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
                  onMouseEnter={(e) => {
                    Object.assign(
                      (e.currentTarget as HTMLButtonElement).style,
                      primaryButtonHover
                    );
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(0) scale(1)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 6px 14px rgba(55,48,163,0.35)";
                  }}
                >
                  🎩 Let Foximo address me properly
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
                  Courtly Praise for{" "}
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#b45309",
                    }}
                  >
                    {displayName}
                  </span>
                </h2>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "#6b7280",
                    marginBottom: "0.5rem",
                  }}
                >
                  Foximo stands ready to deliver a fresh praise at Your command.
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

              {/* Aktív bók box – kiemelve */}
              {!loading && activeCompliment && (
                <div
                  style={{
                    maxWidth: "580px",
                    margin: "1.5rem auto 1.5rem",
                  }}
                >
                  <article
                  	key={`${activeCompliment.id}-${sessionPraiseCount}`}
                  	className="foximo-praise-card"
                  	style={{
                  		position: "relative",
                  		borderRadius: "18px",
                  		border: "2px solid #fbbf24",
                  		padding: "1.35rem 1.25rem 1.8rem",
                  		boxShadow: "0 14px 32px rgba(15,23,42,0.18)",
                  		background:
                  			"radial-gradient(circle at top left, #fef3c7 0, #ffffff 45%, #f9fafb 100%)",
                  		animation: "fadeInUp 380ms ease-out",
                  		overflow: "hidden",
                  	}}
                  	>
                    <div
                      style={{
                        position: "absolute",
                        top: "0.35rem",
                        left: "1.2rem",
                        padding: "0.15rem 0.55rem",
                        borderRadius: "999px",
                        background: "#fbbf24",
                        color: "#78350f",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        boxShadow: "0 4px 10px rgba(180,83,9,0.4)",
                      }}
                    >
                      Today&apos;s praise
                    </div>

                    <p
                      style={{
                        fontSize: "1.05rem",
                        color: "#78350f",
                        marginTop: "1.4rem",
                        marginBottom: "1rem",
                        lineHeight: 1.6,
                        fontWeight: 500,
                      }}
                    >
                      {(() => {
                        const full = formatWithName(activeCompliment.text);
                        const highlightedName = displayName;

                        if (!full.includes(highlightedName)) {
                          return <>“{full}”</>;
                        }

                        const parts = full.split(highlightedName);

                        return (
                          <>
                            {/* Nyitó idézőjel */}
                            <span
                              style={{
                                fontSize: "1.2rem",
                                marginRight: "0.15rem",
                              }}
                            >
                              “
                            </span>
                            {parts.map((part, idx) => (
                              <React.Fragment key={idx}>
                                {part}
                                {idx < parts.length - 1 && (
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      color: "#b45309",
                                    }}
                                  >
                                    {highlightedName}
                                  </span>
                                )}
                              </React.Fragment>
                            ))}
                            {/* Záró idézőjel */}
                            <span
                              style={{
                                fontSize: "1.2rem",
                                marginLeft: "0.15rem",
                              }}
                            >
                              ”
                            </span>
                          </>
                        );
                      })()}
                    </p>

                    <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
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
      opacity: updatingId === activeCompliment.id ? 0.7 : 1,
      background: "linear-gradient(135deg, #f97316, #fb923c)",
      color: "white",
      fontSize: "0.9rem",
      fontWeight: 600,
      boxShadow: "0 6px 14px rgba(194,65,12,0.35)",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem",
    }}
    onMouseEnter={(e) => {
      Object.assign(
        (e.currentTarget as HTMLButtonElement).style,
        primaryButtonHover
      );
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.transform =
        "translateY(0) scale(1)";
      (e.currentTarget as HTMLButtonElement).style.boxShadow =
        "0 6px 14px rgba(194,65,12,0.35)";
    }}
  >
    {updatingId === activeCompliment.id ? (
      "Recording your thanks..."
    ) : (
      <>
        Thank you, Foximo
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            fontSize: "0.85rem",
          }}
        >
          <span style={{ fontSize: "0.95rem" }}>❤️</span>
          <span>{activeCompliment.thank_count}</span>
        </span>
      </>
    )}
  </button>
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

                    {/* Kis Foximo a box jobb szélén */}
                    <img
                      src="/foximo_box.png"
                      alt="Foximo the Courtier bowing"
                      className="foximo-box-fox"
                      style={{
                      	pointerEvents: "none",
                      	animation: "foxBow 2600ms ease-in-out infinite",
                      }}
                    />
                  </article>
                </div>
              )}

              {/* Request praise + session counter + name change */}
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
                    padding: "0.6rem 1.1rem",
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
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                  onMouseEnter={(e) => {
                    Object.assign(
                      (e.currentTarget as HTMLButtonElement).style,
                      primaryButtonHover
                    );
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(0) scale(1)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 6px 14px rgba(194,65,12,0.35)";
                  }}
                >
                  {sessionPraiseCount === 0
                    ? "🎁 Request praise"
                    : "🎁 Request more praise"}
                </button>

                <div
                  style={{
                    marginTop: "0.75rem",
                    fontSize: "0.9rem",
                    color: "#6b7280",
                  }}
                >
                  Praised <strong>{sessionPraiseCount}</strong> times this
                  visit.
                </div>

                <button
                  type="button"
                  onClick={handleChangeName}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    marginTop: "0.85rem",
                    fontSize: "0.85rem",
                    color: "#4b5563",
                    background: "#f9fafb",
                    borderRadius: "999px",
                    border: "1px solid #e5e7eb",
                    padding: "0.35rem 0.75rem",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: "0.9rem" }}>🖋️</span>
                  <span>Change name / title</span>
                </button>
              </div>
            </section>
          )}

          {/* Globális alsó gombsor: Ko-fi, Top 10, Send praise */}
          <section
            style={{
              marginTop: "2rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Ko-fi gomb */}
            <a
              href="https://ko-fi.com/foximothecourtier"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "0.55rem 1.1rem",
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
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
              onMouseEnter={(e) => {
                Object.assign(
                  (e.currentTarget as HTMLAnchorElement).style,
                  primaryButtonHover
                );
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform =
                  "translateY(0) scale(1)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  "0 6px 14px rgba(22,163,74,0.35)";
              }}
            >
              🦊 Offer alms on Ko-fi
            </a>

            {/* Toplista gomb */}
            <a
              href="/top"
              style={{
                padding: "0.55rem 1.1rem",
                borderRadius: "999px",
                border: "1px solid #4f46e5",
                background: "white",
                color: "#4f46e5",
                fontSize: "0.9rem",
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              👑 View Foximo&apos;s royal Top 10
            </a>

            {/* Send praise gomb */}
            <button
              type="button"
              onClick={() => {
                setCopyFeedback(null);
                setShareError(null);
                setIsSendModalOpen(true);
              }}
              disabled={!activeCompliment}
              style={{
                padding: "0.55rem 1.1rem",
                borderRadius: "999px",
                border: "1px solid #4b5563",
                cursor: activeCompliment ? "pointer" : "not-allowed",
                background: "white",
                color: "#111827",
                fontSize: "0.9rem",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                opacity: activeCompliment ? 1 : 0.6,
              }}
            >
              📨 Send this praise to someone
            </button>
          </section>
        </div>
      </div>

      <footer
        style={{
          textAlign: "center",
          fontSize: "0.8rem",
          color: "#9ca3af",
          paddingBottom: "1.5rem",
          position: "relative",
          zIndex: 1,
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
              padding: "1.6rem 1.5rem 1.25rem",
              boxShadow: "0 16px 40px rgba(15,23,42,0.45)",
              boxSizing: "border-box",
              position: "relative", // 🔸 EZ AZ ÚJ
            }}
          >
          <button
  			type="button"
  			onClick={() => setIsSendModalOpen(false)}
  			style={{
  				position: "absolute",
  				top: "0.6rem",
  				right: "0.7rem",
  				border: "none",
  				background: "transparent",
  				fontSize: "1.1rem",
  				cursor: "pointer",
  				color: "#6b7280",
  			}}
  			aria-label="Close"
  			>
  			✕
  		</button>
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
                  Share Foximo&apos;s royal praise via your favourite messenger.
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
                boxSizing: "border-box",
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
                boxSizing: "border-box",
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
                  } catch {
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                📋 Copy text
              </button>

              <button
  type="button"
  onClick={async () => {
    setCopyFeedback(null);
    setShareError(null);
    try {
      const text = buildShareText(); // 👈 csak ezt használjuk, nincs extra link

      if (navigator.share) {
        await navigator.share({
          text,
        });
      } else {
        setShareError(
          "Your browser does not support direct sharing. Please use Copy instead."
        );
      }
    } catch {
      setShareError("Sharing was cancelled or failed.");
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
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  }}
>
  📤 Share…
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

      {/* Globális animációk */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Foximo minimál meghajlás – stabil alul, csak picit meghajol */
        @keyframes foxBow {
          0%,
          100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-4deg);
          }
        }
        /* Praise card: alapban jobbra nagy hely Foximónak */
  .foximo-praise-card {
    padding-right: 7rem;
  }

  .foximo-box-fox {
    position: absolute;
    right: 0.5rem;
    bottom: -2px;
    width: 90px;
    height: auto;
    transform-origin: bottom center;
  }

  @media (max-width: 640px) {
    .foximo-praise-card {
      padding-right: 1.25rem;
    }

    .foximo-box-fox {
      position: static;
      display: block;
      margin: 0.5rem auto 0;
      width: 72px;
    }
  }
      `}</style>
    </main>
  );
}