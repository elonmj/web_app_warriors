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
      
      // Read the file content
      const filePath = path.join(this.dataDir, matchesPath);
      console.log('Reading match file:', filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Try to parse the JSON directly first
      try {
        const data = JSON.parse(content);
        console.log(`Successfully parsed ${eventId} directly, found ${data.matches?.length || 0} matches`);
        if (data.matches && Array.isArray(data.matches)) {
          return data.matches;
        }
      } catch (directParseError) {
        console.warn(`Direct parse failed for ${eventId}, attempting cleanup:`, directParseError);
        
        // Clean up the content and try again
        const cleanContent = content
          .replace(/\n/g, '')
          .replace(/\s+/g, ' ')
          .replace(/([{[,])\s*"(\w+)":/g, '$1"$2":')
          .replace(/,\s*([\]}])/g, '$1')
          .replace(/}\s*{/g, '},{')
          .replace(/]\s*\[/g, '],[')
          .replace(/}\s*\[/g, '},[')
          .replace(/]\s*{/g, '],[');

        try {
          const data = JSON.parse(cleanContent);
          console.log(`Successfully parsed ${eventId} after cleanup, found ${data.matches?.length || 0} matches`);
          if (data.matches && Array.isArray(data.matches)) {
            return data.matches;
          }
        } catch (cleanupParseError) {
          console.error(`Failed to parse ${eventId} after cleanup:`, cleanupParseError);
          throw cleanupParseError;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error getting event matches:', error);
      return [];
    }
  }

  async getAllMatches(): Promise<Match[]> {
    let allMatches: Match[] = [];
    try {
      const matchesDir = path.join(this.dataDir, 'matches');
      await fs.mkdir(matchesDir, { recursive: true });
      
      console.log('Reading matches directory:', matchesDir);
      const files = await fs.readdir(matchesDir);
      console.log('Found match files:', files);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const eventId = file.replace('.json', '');
          console.log(`Processing matches from event: ${eventId}`);
          
          try {
            const matches = await this.getEventMatches(eventId);
            console.log(`Successfully read ${matches.length} matches from ${file}`);
            
            // Validate matches before adding
            const validMatches = matches.filter(match => {
              const isValid = match && match.id && match.player1 && match.player2;
              if (!isValid) {
                console.warn(`Invalid match found in ${file}:`, match);
              }
              return isValid;
            });
            
            allMatches = [...allMatches, ...validMatches];
          } catch (error) {
            console.error(`Error processing match file ${file}:`, error);
            // Continue with other files even if one fails
          }
        }
      }

      console.log('Total valid matches found:', allMatches.length);
    } catch (error) {
      console.error('Error getting all matches:', error);
    }
    return allMatches;
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