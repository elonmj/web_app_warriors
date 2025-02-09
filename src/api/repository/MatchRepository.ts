import { Match } from '@/types/Match';
import { BaseRepository } from './BaseRepository';
import * as fs from 'fs/promises';
import path from 'path';

export class MatchRepository extends BaseRepository {
  private async ensureMatchFile(eventId: string): Promise<void> {
    const matchesPath = path.join(this.dataDir, 'matches');
    const eventMatchPath = path.join(matchesPath, `${eventId}.json`);

    try {
      await fs.mkdir(matchesPath, { recursive: true });
      const exists = await this.fileExists(`matches/${eventId}.json`);
      if (!exists) {
        await this.writeJsonFile(`matches/${eventId}.json`, { matches: [] });
      }
    } catch (error) {
      console.error('Error ensuring match file:', error);
      throw new Error('Failed to initialize match storage');
    }
  }

  async getMatch(matchId: string): Promise<Match | null> {
    try {
      const matches = await this.getAllMatches();
      return matches.find(m => m.id === matchId) || null;
    } catch (error) {
      console.error('Error getting match:', error);
      return null;
    }
  }

  async getEventMatches(eventId: string): Promise<Match[]> {
    try {
      const matchesPath = `matches/${eventId}.json`;
      await this.ensureMatchFile(eventId);
      
      const data = await this.readJsonFile<{ matches: Match[] }>(matchesPath);
      return data?.matches || [];
    } catch (error) {
      console.error('Error getting event matches:', error);
      return [];
    }
  }

  async getAllMatches(): Promise<Match[]> {
    const eventMatches: Match[] = [];
    try {
      const matchesDir = path.join(this.dataDir, 'matches');
      await fs.mkdir(matchesDir, { recursive: true });
      
      const files = await fs.readdir(matchesDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(matchesDir, file), 'utf-8');
            const data = JSON.parse(content);
            if (data.matches && Array.isArray(data.matches)) {
              eventMatches.push(...data.matches);
            }
          } catch (error) {
            console.error(`Error reading match file ${file}:`, error);
            // Continue with other files even if one fails
          }
        }
      }
    } catch (error) {
      console.error('Error getting all matches:', error);
    }
    return eventMatches;
  }

  async updateMatch(updatedMatch: Match): Promise<boolean> {
    try {
      await this.ensureMatchFile(updatedMatch.eventId);
      
      return await this.withLock(`matches_${updatedMatch.eventId}`, async () => {
        // Get the event's matches
        const matches = await this.getEventMatches(updatedMatch.eventId);
        
        // Update or add the match
        const matchIndex = matches.findIndex(m => m.id === updatedMatch.id);
        if (matchIndex >= 0) {
          matches[matchIndex] = updatedMatch;
        } else {
          matches.push(updatedMatch);
        }

        // Write back to file
        await this.writeJsonFile(
          `matches/${updatedMatch.eventId}.json`,
          { matches }
        );

        return true;
      });
    } catch (error) {
      console.error('Error updating match:', error);
      return false;
    }
  }
}