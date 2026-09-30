import {
  getPlayerRecords,
} from "../../lib/playerRecords";

import {
  getPlayers,
  getPlayerName,
  getPlayerPosition,
} from "../../lib/players";

import PlayerDirectory from "./PlayerDirectory";

export default async function PlayerRecordsPage() {
  const [
    records,
    players,
  ] = await Promise.all([
    getPlayerRecords(),
    getPlayers(),
  ]);

  const directory =
    records.careers
      .map((record) => {
        const player =
          players[
            record.playerId
          ];

        return {
          playerId:
            record.playerId,
          name:
            getPlayerName(
              player
            ),
          position:
            getPlayerPosition(
              player
            ),
          points:
            record.points,
          starts:
            record.starts,
          seasons:
            record.seasons.length,
        };
      })
      .sort(
        (a, b) =>
          b.points - a.points
      );

  return (
    <PlayerDirectory
      players={directory}
    />
  );
}