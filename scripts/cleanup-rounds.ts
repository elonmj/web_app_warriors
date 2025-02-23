import fs from 'fs/promises';
import path from 'path';

async function cleanup() {
  try {
    // Delete round 2 matches file
    const matchesPath = path.join(process.cwd(), 'data', 'matches', 'mentoring-league-2025-02', '2.json');
    await fs.unlink(matchesPath).catch(() => console.log('No round 2 matches file to delete'));

    // Delete round 2 rankings file
    const rankingsPath = path.join(process.cwd(), 'data', 'rankings', 'mentoring-league-2025-02', '2.json');
    await fs.unlink(rankingsPath).catch(() => console.log('No round 2 rankings file to delete'));

    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanup();