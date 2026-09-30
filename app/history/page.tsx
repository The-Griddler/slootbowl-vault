import { getLeagueHistory } from "../../lib/sleeper";

export default async function HistoryPage() {
  const seasons = await getLeagueHistory();

  return (
    <main>
      <p
        style={{
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "1.5px",
          color: "#687384",
          marginBottom: "8px",
        }}
      >
        DYNASTY SLUTS
      </p>

      <h1>History</h1>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "28px",
        }}
      >
        The history of the Dynasty Sluts.
      </p>

      <section style={{ marginBottom: "40px" }}>
        <SectionHeading title="Slootbowl Champions" />

        <article style={heroCardStyle}>
          <div
            style={{
              fontSize: "42px",
              marginBottom: "10px",
            }}
          >
            🏆
          </div>

          <p style={eyebrowStyle}>
            MOST RECENT CHAMPION
          </p>

          <h2
            style={{
              margin: "6px 0 0",
              fontSize: "24px",
            }}
          >
            TBC
          </h2>

          <p
            style={{
              marginTop: "6px",
              fontSize: "13px",
            }}
          >
            Championship history coming soon.
          </p>
        </article>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <SectionHeading title="SFL MVP" />

        <article style={heroCardStyle}>
          <div
            style={{
              fontSize: "42px",
              marginBottom: "10px",
            }}
          >
            ⭐
          </div>

          <p style={eyebrowStyle}>
            MOST RECENT MVP
          </p>

          <h2
            style={{
              margin: "6px 0 0",
              fontSize: "24px",
            }}
          >
            TBC
          </h2>

          <p
            style={{
              marginTop: "6px",
              fontSize: "13px",
            }}
          >
            MVP history coming soon.
          </p>
        </article>
      </section>

      <section>
        <SectionHeading title="Season Archive" />

        {seasons.map((season, index) => (
          <a
            key={season.league_id}
            href={`/history/${season.season}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <SeasonCard
              season={season.season}
              current={index === 0}
            />
          </a>
        ))}
      </section>
    </main>
  );
}

function SectionHeading({
  title,
}: {
  title: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          width: "4px",
          height: "26px",
          background: "#ffffff",
          borderRadius: "4px",
        }}
      />

      <h2
        style={{
          margin: 0,
          fontSize: "24px",
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function SeasonCard({
  season,
  current,
}: {
  season: string;
  current: boolean;
}) {
  return (
    <article
      style={{
        background: "#151b23",
        border: "1px solid #27303b",
        borderRadius: "18px",
        padding: "18px",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <p style={eyebrowStyle}>
          {current
            ? "CURRENT SEASON"
            : "SEASON"}
        </p>

        <h3
          style={{
            margin: "5px 0 0",
            fontSize: "24px",
          }}
        >
          {season}
        </h3>
      </div>

      <div
        style={{
          fontSize: "24px",
          color: "#687384",
        }}
      >
        ›
      </div>
    </article>
  );
}

const heroCardStyle = {
  background: "#151b23",
  border: "1px solid #27303b",
  borderRadius: "18px",
  padding: "22px",
  marginBottom: "12px",
};

const eyebrowStyle = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#687384",
};