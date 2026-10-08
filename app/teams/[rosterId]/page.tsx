
import Link from "next/link";
import { notFound } from "next/navigation";
import { FRANCHISES } from "../../../lib/franchises";
import {
  getHistoricalData,
  type HistoricalMatchup,
} from "../../../lib/sleeper";

const OBFC_IDS = [4, 6, 8, 7, 9];

const CHAMPIONS: Record<string, number> = {
  "2022": 2,
  "2023": 4,
  "2024": 10,
  "2025": 10,
};

const FINALISTS: Record<string, number[]> = {
  "2022": [2, 8],
  "2023": [4, 2],
  "2024": [10, 4],
  "2025": [10, 9],
};

function isPlayed(matchup: HistoricalMatchup) {
  return (
    Number.isFinite(matchup.scoreA) &&
    Number.isFinite(matchup.scoreB) &&
    (matchup.scoreA !== 0 || matchup.scoreB !== 0)
  );
}

function calculateRecord(
  matchups: HistoricalMatchup[],
  rosterId: number
) {
  const record = {
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    games: 0,
  };

  for (const matchup of matchups) {
    if (!isPlayed(matchup)) continue;

    if (
      matchup.rosterA !== rosterId &&
      matchup.rosterB !== rosterId
    ) {
      continue;
    }

    const isA = matchup.rosterA === rosterId;

    const scored = isA
      ? matchup.scoreA
      : matchup.scoreB;

    const conceded = isA
      ? matchup.scoreB
      : matchup.scoreA;

    record.games++;
    record.pointsFor += scored;
    record.pointsAgainst += conceded;

    if (scored > conceded) record.wins++;
    else if (scored < conceded) record.losses++;
    else record.ties++;
  }

  return record;
}

function formatPoints(value: number) {
  return value.toFixed(2);
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        background: "#151b23",
        border: "1px solid #27303b",
        borderRadius: "14px",
        padding: "18px 12px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "#ffffff",
          fontSize: "23px",
          fontWeight: "800",
          marginBottom: "6px",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#9da7b3",
          fontSize: "11px",
          fontWeight: "700",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default async function FranchisePage({
  params,
}: {
  params: Promise<{ rosterId: string }>;
}) {
  const { rosterId: rosterIdParam } = await params;
  const rosterId = Number(rosterIdParam);

  const franchise = FRANCHISES.find(
    (team) => team.rosterId === rosterId
  );

  if (!franchise) notFound();

  const conference = OBFC_IDS.includes(rosterId)
    ? "OBFC"
    : "GPFC";

  const conferenceName =
    conference === "OBFC"
      ? "Osmington Bay Football Conference"
      : "Gloucester-Plymouth Football Conference";

  const trophyName =
    conference === "OBFC"
      ? "George Barnes Memorial Trophy"
      : "Ryan Birr Memorial Shield";

  const historicalData = await getHistoricalData();

  const seasons = historicalData
    .map((season) => {
      const year = season.league.season;

      const regularMatchups = season.matchups.filter(
        (matchup) =>
          matchup.phase === "Regular Season"
      );

      const record = calculateRecord(
        regularMatchups,
        rosterId
      );

      return {
        year,
        ...record,
        champion: CHAMPIONS[year] === rosterId,
        finalist:
          FINALISTS[year]?.includes(rosterId) ?? false,
        conferenceChampion:
          FINALISTS[year]?.includes(rosterId) ?? false,
      };
    })
    .sort((a, b) => Number(b.year) - Number(a.year));

  const career = seasons.reduce(
    (total, season) => ({
      wins: total.wins + season.wins,
      losses: total.losses + season.losses,
      ties: total.ties + season.ties,
      games: total.games + season.games,
      pointsFor: total.pointsFor + season.pointsFor,
      pointsAgainst:
        total.pointsAgainst + season.pointsAgainst,
    }),
    {
      wins: 0,
      losses: 0,
      ties: 0,
      games: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    }
  );

  const winPercentage = career.games
    ? (
        ((career.wins + career.ties / 2) /
          career.games) *
        100
      ).toFixed(1)
    : "0.0";

  const championships = seasons.filter(
    (season) => season.champion
  );

  const appearances = seasons.filter(
    (season) => season.finalist
  );

  const conferenceChampionshipAppearances =
  historicalData.filter((season) =>
    season.matchups.some(
      (matchup) =>
        matchup.week === 16 &&
        matchup.phase === "Main Playoffs" &&
        (matchup.rosterA === rosterId ||
          matchup.rosterB === rosterId)
    )
  ).length;

  const cardStyle = {
    background: "#151b23",
    border: "1px solid #27303b",
    borderRadius: "14px",
    padding: "18px",
  };

  return (
    <main>
      <Link
        href="/teams"
        style={{
          color: "#9da7b3",
          textDecoration: "none",
          fontSize: "13px",
        }}
      >
        ← All Franchises
      </Link>

      <div style={{ marginTop: "28px" }}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            marginBottom: "8px",
          }}
        >
          {conference} · EST. 2022
        </p>

        <h1>{franchise.name}</h1>

        <p
          style={{
            marginTop: "8px",
            fontSize: "13px",
          }}
        >
          {conferenceName}
        </p>
      </div>

      <section style={{ marginTop: "32px" }}>
        <h2 style={{ fontSize: "21px" }}>
          SFL Career
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
            marginTop: "16px",
          }}
        >
          <StatCard
            label="Regular Season Record"
            value={`${career.wins}-${career.losses}-${career.ties}`}
          />

          <StatCard
            label="Winning Percentage"
            value={`${winPercentage}%`}
          />

          <StatCard
            label="Points Scored"
            value={formatPoints(career.pointsFor)}
          />

          <StatCard
            label="Points Conceded"
            value={formatPoints(career.pointsAgainst)}
          />
        </div>
      </section>

      <section style={{ marginTop: "36px" }}>
        <h2 style={{ fontSize: "21px" }}>
          Trophy Cabinet
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginTop: "16px",
          }}
        >
          <StatCard
            label="Slootbowl Titles"
            value={championships.length}
          />

          <StatCard
            label="Conference Championship Appearances"
            value={conferenceChampionshipAppearances}
          />

          <StatCard
            label="Conference Titles"
            value={conferenceTitles.length}
          />
        </div>

        <div
          style={{
            ...cardStyle,
            marginTop: "12px",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: "15px",
            }}
          >
            🏆 Championship History
          </h3>

          {championships.length > 0 ? (
            <p style={{ lineHeight: "1.8" }}>
              Slootbowl Champions:{" "}
              {championships
                .map((season) => season.year)
                .join(", ")}
            </p>
          ) : (
            <p>No Slootbowl championships yet.</p>
          )}

          <p
            style={{
              marginTop: "12px",
              lineHeight: "1.8",
            }}
          >
            {trophyName}:{" "}
            {conferenceTitles.length > 0
              ? conferenceTitles
                  .map((season) => season.year)
                  .join(", ")
              : "None yet"}
          </p>
        </div>
      </section>

      <section style={{ marginTop: "36px" }}>
        <h2 style={{ fontSize: "21px" }}>
          Season History
        </h2>

        <p
          style={{
            marginTop: "8px",
            marginBottom: "16px",
            fontSize: "12px",
          }}
        >
          Regular-season records across every SFL
          season.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {seasons.map((season) => (
            <Link
              key={season.year}
              href={`/history/${season.year}`}
              style={{
                ...cardStyle,
                display: "block",
                color: "#ffffff",
                textDecoration: "none",
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
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "800",
                    }}
                  >
                    {season.year}
                  </div>

                  <div
                    style={{
                      color: "#9da7b3",
                      fontSize: "12px",
                      marginTop: "6px",
                    }}
                  >
                    {season.wins}-{season.losses}-
                    {season.ties} ·{" "}
                    {formatPoints(season.pointsFor)} PF
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "right",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  {season.champion ? (
                    <span>🏆 Champion</span>
                  ) : season.finalist ? (
                    <span>🥈 Finalist</span>
                  ) : (
                    <span
                      style={{
                        color: "#687384",
                      }}
                    >
                      View Season ›
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
