const SEASON_HISTORY = [
  {
    season: 2026,
    status: "CURRENT SEASON",
    champion: "TBC",
    mvp: "TBC",
  },
];

export default function HistoryPage() {
  return (
    <main>
      <header
        style={{
          marginBottom: "28px",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "2px",
            color: "#687384",
            marginBottom: "6px",
          }}
        >
          DYNASTY SLUTS
        </p>

        <h1
          style={{
            fontSize: "34px",
            margin: 0,
          }}
        >
          History
        </h1>

        <p
          style={{
            marginTop: "6px",
          }}
        >
          The Dynasty Sluts archive
        </p>
      </header>

      <section
        style={{
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#687384",
            marginBottom: "12px",
          }}
        >
          SLOOTBOWL CHAMPIONS
        </div>

        <article
          style={{
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: "20px",
            padding: "20px",
          }}
        >
          <div
            style={{
              fontSize: "32px",
              marginBottom: "8px",
            }}
          >
            🏆
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "20px",
            }}
          >
            Championship history
          </h2>

          <p
            style={{
              marginTop: "8px",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Every Slootbowl champion, from the first
            season to the latest winner.
          </p>
        </article>
      </section>

      <section
        style={{
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#687384",
            marginBottom: "12px",
          }}
        >
          SFL MVP
        </div>

        <article
          style={{
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: "20px",
            padding: "20px",
          }}
        >
          <div
            style={{
              fontSize: "32px",
              marginBottom: "8px",
            }}
          >
            ⭐
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "20px",
            }}
          >
            SFL MVP history
          </h2>

          <p
            style={{
              marginTop: "8px",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            The complete list of SFL MVP winners across
            every season.
          </p>
        </article>
      </section>

      <section
        style={{
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#687384",
            marginBottom: "12px",
          }}
        >
          SEASON HISTORY
        </div>

        {SEASON_HISTORY.map((season) => (
          <article
            key={season.season}
            style={{
              background: "#151b23",
              border: "1px solid #27303b",
              borderRadius: "20px",
              padding: "20px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "1.5px",
                    color: "#687384",
                  }}
                >
                  {season.status}
                </p>

                <h2
                  style={{
                    margin: "4px 0 0",
                    fontSize: "24px",
                  }}
                >
                  {season.season}
                </h2>
              </div>

              <div
                style={{
                  fontSize: "28px",
                }}
              >
                📅
              </div>
            </div>

            <div
              style={{
                height: "1px",
                background: "#27303b",
                margin: "18px 0",
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "1px",
                    color: "#687384",
                  }}
                >
                  SLOOTBOWL
                </p>

                <p
                  style={{
                    marginTop: "5px",
                    fontSize: "15px",
                    color: "#f5f7fa",
                  }}
                >
                  {season.champion}
                </p>
              </div>

              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "1px",
                    color: "#687384",
                  }}
                >
                  SFL MVP
                </p>

                <p
                  style={{
                    marginTop: "5px",
                    fontSize: "15px",
                    color: "#f5f7fa",
                  }}
                >
                  {season.mvp}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#687384",
            marginBottom: "12px",
          }}
        >
          ALL-TIME ARCHIVE
        </div>

        <article
          style={{
            background: "#151b23",
            border: "1px solid #27303b",
            borderRadius: "20px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
            }}
          >
            The Dynasty Sluts archive
          </h2>

          <p
            style={{
              marginTop: "8px",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Previous seasons, championship runs, MVPs,
            playoff histories, franchise records and
            legendary performances will eventually live
            here.
          </p>
        </article>
      </section>
    </main>
  );
}