import { Match } from '@/types/Match';
import { BaseRepository } from './BaseRepository';
import * as fs from 'fs/promises';
import path from 'path';

export class MatchRepository extends BaseRepository {
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
      const data = await this.readJsonFile<{ matches: Match[] }>(matchesPath);
      return data.matches || [];
    } catch (error) {
      console.error('Error getting event matches:', error);
      return [];
    }
  }

  async getAllMatches(): Promise<Match[]> {
    const eventMatches: Match[] = [];
    try {
      const matchesDir = path.join(this.dataDir, 'matches');
      const files = await fs.readdir(matchesDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(matchesDir, file), 'utf-8');
          const data = JSON.parse(content);
          if (data.matches && Array.isArray(data.matches)) {
            eventMatches.push(...data.matches);
          }
        }
      }
    } catch (error) {
      console.error('Error getting all matches:', error);
    }
    return eventMatches;
  }
}