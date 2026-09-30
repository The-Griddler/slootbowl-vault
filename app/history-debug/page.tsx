import {
  fetchBracketForPage,
  getMatchups,
} from "../../lib/sleeper";
const LEAGUE_ID = "1194916402053423104";
export default async function HistoryDebugPage() {
  const [losersBracket, winnersBracket, week15, week16, week17] =
    await Promise.all([
      fetchBracketForPage(LEAGUE_ID, "losers_bracket"),
      fetchBracketForPage(LEAGUE_ID, "winners_bracket"),
      getMatchups(15, LEAGUE_ID),
      getMatchups(16, LEAGUE_ID),
      getMatchups(17, LEAGUE_ID),
    ]);
  return (
    <main
      style={{
        padding: "24px",
        fontFamily: "monospace",
        background: "#111",
        color: "#eee",
        minHeight: "100vh",
      }}
    >
      <h1>2025 History Debug</h1>
      <h2>Losers Bracket</h2>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {JSON.stringify(losersBracket, null, 2)}
      </pre>
      <h2>Winners Bracket</h2>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {JSON.stringify(winnersBracket, null, 2)}
      </pre>
      <h2>Week 15 Matchups</h2>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {JSON.stringify(week15, null, 2)}
      </pre>
      <h2>Week 16 Matchups</h2>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {JSON.stringify(week16, null, 2)}
      </pre>
      <h2>Week 17 Matchups</h2>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {JSON.stringify(week17, null, 2)}
      </pre>
    </main>
  );
}