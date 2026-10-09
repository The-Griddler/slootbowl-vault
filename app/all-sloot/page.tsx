
import {
  getHistoricalData,
} from "../../lib/sleeper";

import {
  getAllSlootPlayerDirectory,
} from "../../lib/players";

import {
  calculateAllSloot,
  type AllSlootSelection,
} from "../../lib/allSloot";

type PageProps = {
  searchParams: Promise<{
    season?: string;
    team?: string;
  }>;
};

const TEAM_OPTIONS = [
  {
    id: "first",
    label: "First Team",
  },
  {
    id: "second",
    label: "Second Team",
  },
  {
    id: "rookie",
    label: "Rookie Team",
  },
];

function formatPoints(
  points: number
): string {
  return points.toFixed(2);
}

function TeamTable({
  selections,
}: {
  selections: AllSlootSelection[];
}) {
  if (selections.length === 0) {
    return (
      <p>
        No eligible players were found for
        this team.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "10px",
      }}
    >
      {selections.map(
        (selection, index) => (
          <div
            key={`${selection.slot}-${selection.player.playerId}`}
            style={{
              padding: "14px",
              border:
                "1px solid #263244",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#687384",
                    fontWeight: "700",
                    letterSpacing:
                      "1px",
                    marginBottom: "5px",
                  }}
                >
                  {selection.slot}
                </div>

                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "16px",
                  }}
                >
                  {selection.player.name}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#687384",
                    marginTop: "4px",
                  }}
                >
                  {selection.player.position}
                  {" · "}
                  {selection.player.gamesStarted}
                  {" starts"}
                </div>
              </div>

              <div
                style={{
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontWeight: "800",
                    fontSize: "18px",
                  }}
                >
                  {formatPoints(
                    selection.player.points
                  )}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#687384",
                  }}
                >
                  SFL points
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default async function AllSlootPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const [
    historicalData,
    playerDirectory,
  ] = await Promise.all([
    getHistoricalData(),
    getAllSlootPlayerDirectory(),
  ]);

  const seasons = historicalData
    .map((season) =>
      calculateAllSloot(
        season,
        playerDirectory
      )
    )
    .sort(
      (a, b) =>
        Number(b.season) -
        Number(a.season)
    );

  const requestedSeason =
    params.season;

  const selectedSeason =
    seasons.find(
      (season) =>
        season.season ===
        requestedSeason
    ) ?? seasons[0];

  const selectedTeam =
    TEAM_OPTIONS.some(
      (option) =>
        option.id === params.team
    )
      ? params.team
      : "first";

  const selections =
    selectedTeam === "second"
      ? selectedSeason?.secondTeam ?? []
      : selectedTeam === "rookie"
      ? selectedSeason?.rookieTeam ?? []
      : selectedSeason?.firstTeam ?? [];

  const latestSeason =
    seasons[0]?.season;

  const isCurrentSeason =
    selectedSeason?.season ===
    latestSeason;

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

      <h1>All-Sloot Teams</h1>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "24px",
        }}
      >
        The SFL&apos;s annual recognition
        of its best performers.
      </p>

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        {seasons.map((season) => (
          <a
            key={season.season}
            href={`/all-sloot?season=${season.season}&team=${selectedTeam}`}
            style={{
              padding:
                "9px 14px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "700",
              background:
                selectedSeason?.season ===
                season.season
                  ? "#263244"
                  : "transparent",
              border:
                "1px solid #263244",
              color: "inherit",
            }}
          >
            {season.season}
          </a>
        ))}
      </div>

      {isCurrentSeason && (
        <p
          style={{
            padding: "12px",
            borderRadius: "10px",
            background: "#263244",
            marginBottom: "20px",
            fontSize: "13px",
          }}
        >
          Current season: these selections
          are provisional until the
          regular season finishes.
        </p>
      )}

      {selectedTeam === "rookie" && (
        <p
          style={{
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "13px",
            border:
              "1px solid #263244",
          }}
        >
          Rookie eligibility is currently
          estimated from Sleeper player
          experience data. These results
          require historical verification.
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {TEAM_OPTIONS.map(
          (option) => (
            <a
              key={option.id}
              href={`/all-sloot?season=${selectedSeason?.season}&team=${option.id}`}
              style={{
                padding:
                  "10px 14px",
                borderRadius: "10px",
                textDecoration:
                  "none",
                fontWeight: "700",
                background:
                  selectedTeam ===
                  option.id
                    ? "#263244"
                    : "transparent",
                border:
                  "1px solid #263244",
                color: "inherit",
              }}
            >
              {option.label}
            </a>
          )
        )}
      </div>

      <h2
        style={{
          marginBottom: "16px",
        }}
      >
        {selectedSeason?.season}{" "}
        {TEAM_OPTIONS.find(
          (option) =>
            option.id ===
            selectedTeam
        )?.label}
      </h2>

      <TeamTable
        selections={selections}
      />
    </main>
  );
}
