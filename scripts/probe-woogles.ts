/**
 * Phase 0 probe: freeze the real Woogles.io API contract into fixtures.
 *
 * The API is ConnectRPC (not the old Twirp path): POST JSON to
 *   https://woogles.io/api/game_service.GameMetadataService/{Method}
 * Response fields are snake_case. No auth needed for public games.
 *
 * Usage: npx tsx scripts/probe-woogles.ts [username]
 * Writes raw responses to scripts/fixtures/.
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const BASE = "https://woogles.io/api/game_service.GameMetadataService";
const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

async function call<T>(method: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${method} -> HTTP ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

function save(name: string, data: unknown) {
  const path = join(FIXTURES_DIR, name);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
  console.log(`wrote ${path}`);
}

async function main() {
  const username = process.argv[2] ?? "HastyBot";
  mkdirSync(FIXTURES_DIR, { recursive: true });

  console.log(`Probing recent games for ${username}...`);
  const recent = await call<{ game_info: any[] }>("GetRecentGames", {
    username,
    numGames: 20,
    offset: 0,
  });
  save("GetRecentGames.json", recent);

  const games = recent.game_info ?? [];
  if (games.length === 0) {
    console.log("No games found for this user.");
    return;
  }

  // Prefer a French-lexicon game if one exists in the page, else take the first.
  const fraGame = games.find((g) =>
    String(g.game_request?.lexicon ?? "").startsWith("FRA")
  );
  const target = fraGame ?? games[0];
  const gameId = target.game_id;
  console.log(
    `Fetching game ${gameId} (lexicon ${target.game_request?.lexicon})...`
  );

  const gcg = await call<{ gcg: string }>("GetGCG", { game_id: gameId });
  save(`GetGCG.${gameId}.json`, gcg);

  const history = await call<{ history: unknown }>("GetGameHistory", {
    game_id: gameId,
  });
  save(`GetGameHistory.${gameId}.json`, history);

  console.log("Done. Contract summary:");
  console.log(
    "- GetRecentGames: {username, numGames, offset} -> {game_info: [{game_id, players[{nickname, rating, first}], scores[], winner, created_at, game_end_reason, game_request:{lexicon, challenge_rule, ...}}]}"
  );
  console.log("- GetGCG: {game_id} -> {gcg}");
  console.log(
    "- GetGameHistory: {game_id} -> {history:{events[{rack, type, position, played_tiles, exchanged, score, cumulative, is_bingo, words_formed, millis_remaining, player_index}], players[], lexicon, final_scores, winner, play_state}}"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
