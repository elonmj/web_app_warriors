/**
 * One-shot migration: initialize wooglesUsername from iscUsername for every
 * player that doesn't have one yet, and report whether each username actually
 * exists on Woogles (usernames may differ between platforms — the admin should
 * fix mismatches by hand in the admin players page).
 *
 * Usage: npx tsx scripts/init-woogles-usernames.ts [--dry-run]
 */
import { FirebasePlayerRepository } from '../src/api/repository/FirebasePlayerRepository';

const WOOGLES_API_BASE =
  'https://woogles.io/api/game_service.GameMetadataService';

async function existsOnWoogles(username: string): Promise<boolean> {
  try {
    const res = await fetch(`${WOOGLES_API_BASE}/GetRecentGames`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, numGames: 1, offset: 0 }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    // A valid user returns 200 (possibly with an empty game list);
    // an unknown user returns an error payload.
    return !('code' in data && 'msg' in data);
  } catch {
    return false;
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const repo = new FirebasePlayerRepository();
  const players = await repo.getAllPlayers();

  console.log(`${players.length} players found. ${dryRun ? '(dry-run)' : ''}\n`);
  const report: string[] = [];

  for (const player of players) {
    if (player.wooglesUsername) {
      report.push(`= ${player.name}: already set (${player.wooglesUsername})`);
      continue;
    }
    if (!player.iscUsername) {
      report.push(`! ${player.name}: no ISC username either — set manually`);
      continue;
    }

    const candidate = player.iscUsername.trim();
    const found = await existsOnWoogles(candidate);

    if (!dryRun) {
      await repo.updatePlayer(player.id, { wooglesUsername: candidate });
    }
    report.push(
      found
        ? `+ ${player.name}: wooglesUsername := ${candidate} (exists on Woogles)`
        : `? ${player.name}: wooglesUsername := ${candidate} (NOT found on Woogles — fix manually)`
    );
  }

  console.log(report.join('\n'));
  const toFix = report.filter((l) => l.startsWith('?') || l.startsWith('!'));
  console.log(`\n${toFix.length} player(s) need manual attention.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
