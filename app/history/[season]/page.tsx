import {
  getLeagueHistory,
} from "../../../lib/sleeper";

import {
  getFranchiseName,
} from "../../../lib/franchises";

type PageProps = {
  params: Promise<{
    season: string;
  }>;
};

export default async function SeasonHistoryPage({
  params,
}: PageProps) {
  const { season } = await params;

  const seasons =
    await getLeagueHistory();

  const selectedSeason =
    seasons.find(
      (league) =>
        league.season === season
    );

  if (!selectedSeason) {
    return (
      <main>
        <h1>Season Not Found</h1>

        <p
          style={{
            marginTop: "8px",
          }}
        >
          We couldn't find that Dynasty Sluts
          season.
        </p>
      </main>
    );
  }

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

      <h1>{selectedSeason.season}</h1>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "28px",
        }}
      >
        Season history and league archive.
      </p>

      <section>
        <SectionHeading title="Season Overview" />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <StatCard
            label="SLOOTBOWL CHAMPION"
            value="TBC"
          />

          <StatCard
            label="SFL MVP"
            value="TBC"
          />
        </div>
      </section>

      <section
        style={{
          marginTop: "40px",
        }}
      >
        <SectionHeading title="Season Details" />

        <DetailCard
          label="SEASON"
          value={selectedSeason.season}
        />

        <DetailCard
          label="LEAGUE"
          value={selectedSeason.name}
        />

        <DetailCard
          label="LEAGUE ID"
          value={selectedSeason.league_id}
        />
      </section>

      <section
        style={{
          marginTop: "40px",
        }}
      >
        <SectionHeading title="Coming Soon" />

        <DetailCard
          label="FINAL STANDINGS"
          value="Coming soon"
        />

        <DetailCard
          label="PLAYOFF BRACKET"
          value="Coming soon"
        />

        <DetailCard
          label="BIGGEST GAMES"
          value="Coming soon"
        />

        <DetailCard
          label="SEASON RECORDS"
          value="Coming soon"
        />
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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article
      style={{
        background: "#151b23",
        border: "1px solid #27303b",
        borderRadius: "18px",
        padding: "18px",
      }}
    >
      <p style={eyebrowStyle}>
        {label}
      </p>

      <h3
        style={{
          margin: "8px 0 0",
          fontSize: "20px",
        }}
      >
        {value}
      </h3>
    </article>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article
      style={{
        background: "#151b23",
        border: "1px solid #27303b",
        borderRadius: "18px",
        padding: "18px",
        marginBottom: "12px",
      }}
    >
      <p style={eyebrowStyle}>
        {label}
      </p>

      <p
        style={{
          marginTop: "7px",
          color: "#ffffff",
          fontWeight: "600",
        }}
      >
        {value}
      </p>
    </article>
  );
}

const eyebrowStyle = {
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1px",
  color: "#687384",
};