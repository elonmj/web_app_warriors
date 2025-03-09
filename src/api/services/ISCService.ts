import { chromium, Page } from 'playwright';
import { ISCCredentials, ISCPlayerIdentifier, ISCMatchResult, ISCGameData, Move, PlayerISCStats } from '@/types/ISC';
import { PlayerRepository } from '@/api/repository/playerRepository';
import { Player } from '@/types/Player';

interface SearchResult {
  player1Score: number;
  player2Score: number;
  timestamp: string;
}

export class ISCService {
  private playerRepo = new PlayerRepository();
  private baseUrl = 'https://www.isc.ro';
  private debug = process.env.NODE_ENV !== 'production';

  /**
   * Calculate ISC statistics for a player from their game data
   */
  private calculatePlayerStats(playerName: string, games: ISCGameData[]): PlayerISCStats {
    const stats: PlayerISCStats = {
      playerName,
      totalGames: games.length,
      totalWins: 0,
      totalBingos: 0,
      averageScore: 0,
      highestScore: 0,
      highestScoringMove: { word: '', score: 0 },
      lastUpdated: new Date().toISOString()
    };

    let totalScore = 0;

    for (const game of games) {
      // Get player's score from this game
      const score = game.scores[playerName];
      totalScore += score;

      // Update highest score
      if (score > stats.highestScore) {
        stats.highestScore = score;
      }

      // Check if player won
      if (game.winner === playerName) {
        stats.totalWins++;
      }

      // Check moves for bingos and high scores
      for (const move of game.move_history) {
        if (move.player === playerName) {
          if (move.isBingo) {
            stats.totalBingos++;
          }
          if (move.score > stats.highestScoringMove.score) {
            stats.highestScoringMove = {
              word: move.word,
              score: move.score
            };
          }
        }
      }
    }

    stats.averageScore = totalScore / stats.totalGames;

    return stats;
  }

  /**
   * Calculate and store player statistics from ISC game data
   */
  async calculateAndStorePlayerStats(playerName: string, games: ISCGameData[]): Promise<void> {
    try {
      const stats = this.calculatePlayerStats(playerName, games);
      
      // Find player by ISC username
      const players = await this.playerRepo.getAllPlayers();
      const player = players.find(p => p.iscUsername === playerName);
      
      if (!player) {
        this.log(`Warning: Could not find player with ISC username ${playerName}`);
        return;
      }

      // Update player statistics with ISC stats
      const updatedStats = { ...player.statistics };
      updatedStats.iscData = stats;
      
      await this.playerRepo.updatePlayer(player.id, {
        statistics: updatedStats
      });

    } catch (error) {
      this.logError(`Error calculating stats for player ${playerName}`, error);
      // Don't throw - we want to continue even if stats calculation fails
    }
  }

  /**
   * Process game content to extract ISCGameData
   */
  private async processGameContent(page: Page, content: string): Promise<ISCGameData | null> {
    const lines = content.split('\n');

    // Extract player names
    let player1 = '';
    let player2 = '';
    let winner = '';

    const playersLine = lines.find(line => line.includes(' vs '));
    if (playersLine) {
      const playersMatch = playersLine.match(/(.+) vs (.+)/);
      if (playersMatch && playersMatch.length === 3) {
        player1 = playersMatch[1].trim();
        player2 = playersMatch[2].trim();
      }
    }

    // Extract scores
    const scoreLine = lines.find(line => /\d+\s+points\s+\d+\s+points/.test(line));
    if (!scoreLine) {
      this.logError('Could not find score line', null);
      return null;
    }

    const scores = scoreLine.match(/\d+(?=\s+points)/g);
    if (!scores || scores.length !== 2) {
      this.logError('Failed to parse game scores', null);
      return null;
    }

    const score1 = parseInt(scores[0], 10);
    const score2 = parseInt(scores[1], 10);

    // Determine winner
    if (score1 > score2) {
      winner = player1;
    } else if (score2 > score1) {
      winner = player2;
    }

    // Extract moves
    const moveHistory: Move[] = [];
    const moveLines = lines.filter(line => /^\s*\d+\.\s+/.test(line));

    for (const line of moveLines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const moveNumber = parseInt(parts[0].slice(0, -1));
        const playerIndex = (moveNumber - 1) * 2;

        // Extract word position and check for bingo
        const extractMoveInfo = (word: string): { position: string; isBingo: boolean } => {
          const bingoPrefixes = ['*', '+'];
          const isBingo = bingoPrefixes.some(prefix => word.startsWith(prefix));
          const position = word.match(/\(([^)]+)\)/)?.pop() || '';
          return { position, isBingo };
        };

        if (playerIndex + 1 < parts.length) {
          const { position, isBingo } = extractMoveInfo(parts[playerIndex + 2]);
          moveHistory.push({
            player: parts[playerIndex + 1],
            word: parts[playerIndex + 2].replace(/[*+]/, ''), // Remove bingo markers
            position,
            score: parseInt(parts[playerIndex + 3]),
            isBingo,
          });
        }

        if (playerIndex + 4 < parts.length) {
          const { position, isBingo } = extractMoveInfo(parts[playerIndex + 5]);
          moveHistory.push({
            player: parts[playerIndex + 4],
            word: parts[playerIndex + 5].replace(/[*+]/, ''), // Remove bingo markers
            position,
            score: parseInt(parts[playerIndex + 6]),
            isBingo,
          });
        }
      }
    }

    return {
      players: [player1, player2],
      scores: {
        [player1]: score1,
        [player2]: score2,
      },
      move_history: moveHistory,
      winner,
    };
  }

  private log(message: string): void {
    if (this.debug) {
      const timestamp = new Date().toISOString();
      console.log(`[ISCService ${timestamp}] ${message}`);
    }
  }

  private logError(message: string, error: any): void {
    if (this.debug) {
      const timestamp = new Date().toISOString();
      console.error(`[ISCService ERROR ${timestamp}] ${message}`);
      console.error(error);
      if (error instanceof Error && error.stack) {
        console.error("Stack trace:");
        console.error(error.stack);
      }
    }
  }

  private validateISCUsername(username: string): boolean {
    // ISC usernames must be:
    // - 3-20 characters long
    // - Contain only letters, numbers, and underscores
    // - Start with a letter
    return /^[A-Za-z][A-Za-z0-9_]{2,19}$/.test(username);
  }

  async fetchMatchResult(
    player1: ISCPlayerIdentifier,
    player2: ISCPlayerIdentifier,
    credentials: ISCCredentials
  ): Promise<ISCMatchResult> {
    let browser;

    try {
      // Get ISC usernames, validate presence and format
      if (!player1.iscUsername) {
        throw new Error('Missing ISC username for player 1');
      }
      if (!player2.iscUsername) {
        throw new Error('Missing ISC username for player 2');
      }

      // Validate ISC username format
      if (!this.validateISCUsername(player1.iscUsername)) {
        throw new Error(`Invalid ISC username format for player 1: ${player1.iscUsername}`);
      }
      if (!this.validateISCUsername(player2.iscUsername)) {
        throw new Error(`Invalid ISC username format for player 2: ${player2.iscUsername}`);
      }

      this.log(`Starting fetch match result between ${player1.iscUsername} and ${player2.iscUsername}`);
      
      browser = await chromium.launch({
        headless: false
      });

      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
      });
      
      const page = await context.newPage();
      page.setDefaultTimeout(30000);

      // Log browser and page events
      page.on('console', msg => this.log(`Console [${msg.type()}]: ${msg.text()}`));
      page.on('pageerror', err => this.logError('Page error:', err));

      await page.goto(this.baseUrl, { waitUntil: 'networkidle' });

      // Language selection - Using Python's exact XPath selectors
      this.log('Selecting language...');
      
      // Wait for language dialog
      const languageDialogXPath = "//div[@class='gwt-DialogBox']//div[@class='Caption' and text()='Select language']";
      await page.waitForSelector(`xpath=${languageDialogXPath}`, { timeout: 10000 });

      // Click French radio button
      const frenchRadioXPath = "//input[@name='language' and @id='gwt-uid-3']";
      await page.click(`xpath=${frenchRadioXPath}`);

      // Click OK button
      const okButtonXPath = "//button[contains(@class, 'gwt-Button') and text()='OK']";
      await page.click(`xpath=${okButtonXPath}`);

      // Wait for dialog to close and language to change
      await page.waitForTimeout(2000);

      // Login - Using Python's exact XPath selectors
      this.log('Logging in...');
      
      // Username field
      this.log('Waiting for username field...');
      const usernameXPath = "/html/body/div[5]/div[1]/table[1]/tbody[1]/tr[2]/td[2]/div[1]/div[1]/table[1]/tbody[1]/tr[1]/td[1]/input[1]";
      await page.waitForSelector(`xpath=${usernameXPath}`, { timeout: 10000 });
      this.log('Username field found, filling...');
      await page.fill(`xpath=${usernameXPath}`, credentials.username);

      // Password field
      this.log('Waiting for password field...');
      const passwordXPath = "/html/body/div[5]/div[1]/table[1]/tbody[1]/tr[2]/td[2]/div[1]/div[1]/input[1]";
      await page.waitForSelector(`xpath=${passwordXPath}`, { timeout: 10000 });
      this.log('Password field found, filling...');
      await page.fill(`xpath=${passwordXPath}`, credentials.password);

      // Login button
      this.log('Clicking login button...');
      const loginButtonXPath = "/html/body/div[5]/div[1]/table[1]/tbody[1]/tr[2]/td[2]/div[1]/div[1]/table[1]/tbody[1]/tr[1]/td[3]/button[1]";
      await page.click(`xpath=${loginButtonXPath}`);

      // Wait for login completion and welcome message
      this.log('Verifying login...');
      const welcomeXPath = "/html/body/div[4]/div[2]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]";
      await page.waitForFunction(
        ([xpath, expectedText]) => {
          const element = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
          return element?.textContent?.includes(expectedText) || false;
        },
        [welcomeXPath, "Bienvenue à l'Internet Scrabble Club"],
        { timeout: 30000, polling: 1000 }
      );
      
      this.log('Login successful');

      // Wait for interface to fully load
      await page.waitForTimeout(2000);

      // Search for games with enhanced error handling
      try {
        const gameData = await this.searchPlayerGames(page, player1.iscUsername, player2.iscUsername);
        if (!gameData || gameData.length === 0) {
          throw new Error(`No recent matches found between ${player1.iscUsername} and ${player2.iscUsername}`);
        }
      
        const mostRecentGame = gameData[0];

        // Calculate and store statistics for both players
        const statsPromises = [
          this.calculateAndStorePlayerStats(player1.iscUsername, gameData),
          this.calculateAndStorePlayerStats(player2.iscUsername, gameData)
        ];

        // Don't wait for stats to be stored - let it happen in background
        Promise.all(statsPromises).catch(error => {
          this.logError('Failed to update player statistics', error);
        });

        return {
          player1Score: mostRecentGame.scores[player1.iscUsername!],
          player2Score: mostRecentGame.scores[player2.iscUsername!],
          timestamp: new Date().toISOString(),
          gameData: mostRecentGame,
          warnings: []
        };
      } catch (searchError) {
        // Log current page state for debugging
        try {
          const pageContent = await page.content();
          this.log('Page content at error:');
          this.log(pageContent.slice(0, 1000) + '...');

          const bodyText = await page.evaluate(() => document.body.textContent);
          this.log('Body text content:');
          this.log(bodyText?.slice(0, 1000) + '...');

        } catch (diagError) {
          this.logError('Failed to capture diagnostic information', diagError);
        }

        throw searchError;
      }
    } catch (error) {
      const err = error as Error;
      this.logError('Fatal error in fetchMatchResult', err);
      
      // Enhanced error message with more context
      let errorMessage = `Failed to fetch match result: ${err.message}`;
      if (err.stack) {
        errorMessage += `\nStack trace: ${err.stack}`;
      }
      
      throw new Error(errorMessage);
    } finally {
      if (browser) {
        try {
          await browser.close();
          this.log('Browser closed successfully');
        } catch (closeError) {
          this.logError('Error while closing browser', closeError);
        }
      }
    }
  }

  /**
   * Wait for a command to complete by checking for its appearance in results div
   * Similar to Python's wait_for_command_complete function
   */
  private async waitForCommandComplete(page: any, command: string): Promise<boolean> {
    const resultDivXPath = "/html/body/div[4]/div[2]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]";
    
    try {
     // Wait for the command to appear in results with polling, getting fresh content each time
     await page.waitForFunction(
       async ({ xpath, cmd }: { xpath: string; cmd: string }) => {
         const element = document.evaluate(
           xpath,
           document,
           null,
           XPathResult.FIRST_ORDERED_NODE_TYPE,
           null
         ).singleNodeValue;
         if (!element) return false;

         // Get fresh content each time
         const content = await (element as HTMLElement).textContent;
         return content?.includes(cmd) || false;
       },
       { timeout: 10000, polling: 500 },
       { xpath: resultDivXPath, cmd: command }
     );

      // Small additional wait to ensure response is complete (like Python)
      await page.waitForTimeout(500);
      return true;
    } catch (error) {
      this.logError(`Warning: Timeout waiting for command '${command}' to complete`, error);
      return false;
    }
  }

  private async searchPlayerGames(
    page: Page,
    player1Username: string,
    player2Username?: string
  ): Promise<ISCGameData[] | null> {
    try {
      this.log(`Looking for matches ${player2Username ? 'between players' : 'for player'}`);
      await page.waitForTimeout(2000);

      // Use the exact XPath from Python script
      const commandXPath = "//select[@class='gwt-ListBox']/../following-sibling::td/input[@type='text']";
      
      // Wait for command input with XPath
      const commandInput = page.locator(`xpath=${commandXPath}`);
      await commandInput.waitFor({ state: 'visible', timeout: 10000 });
      
      const sendCommand = async (cmd: string): Promise<boolean> => {
        this.log(`Sending command: ${cmd}`);
        try {
          await commandInput.click();
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Backspace');
          await page.waitForTimeout(200);
          
          // Type slowly and wait like Python
          for (const char of cmd) {
            await page.keyboard.press(char);
            await page.waitForTimeout(50);
          }
          await page.waitForTimeout(500);
          await page.keyboard.press('Enter');
          
          // Wait for command to complete like Python
          return await this.waitForCommandComplete(page, cmd);
        } catch (error) {
          this.logError(`Failed to send command: ${cmd}`, error);
          return false;
        }
      };

      const nLast = 10;
      const examineHistoryCommand = player2Username
        ? `EXAMINE HISTORY ${player1Username} 0` // Fetch only most recent when two players
        : `EXAMINE HISTORY ${player1Username} ${nLast - 1}`; // Fetch recent history for single player

      const success = await sendCommand(examineHistoryCommand);
      if (!success) {
        this.log(`Warning: Command ${examineHistoryCommand} failed, returning...`);
        return null;
      }

      // Get all results text
      const resultsText = await page.evaluate(() => document.body.textContent || '');
      this.log('Raw resultsText before filtering:');
      this.log(resultsText);

      let matches: string[];
      if (player2Username) {
        // Find matches between two players
        this.log(`Filtering for: ${player1Username} vs ${player2Username} OR ${player2Username} vs ${player1Username}`);
        matches = resultsText.split('\n')
          .filter(line => line.startsWith('Analyses de partie:'))
          .filter(line =>
            line.includes(`${player1Username} vs ${player2Username}`) ||
            line.includes(`${player2Username} vs ${player1Username}`)
          );
      } else {
        // Find all matches for the single player
        this.log(`Filtering for all matches involving: ${player1Username}`);
        const playerRegex = new RegExp(`\\b${player1Username}\\b`);
        matches = resultsText.split('\n')
          .filter(line => line.startsWith('Analyses de partie:'))
          .filter(line => playerRegex.test(line));
      }

      if (matches.length === 0) {
        this.log('No matches found, returning null');
        return null;
      }

      this.log(`Found ${matches.length} match(es)`);

      const gameDataPromises = matches.map(async match => {
        const gameIndex = match.split(':')[0].split(' ').pop();
        if (!gameIndex) {
          this.logError('Failed to extract game index', null);
          return null;
        }

        this.log(`Examining game at index ${gameIndex}...`);
        const examineSuccess = await sendCommand(`EXAMINE HISTORY ${player1Username} ${gameIndex}`);
        if (!examineSuccess) {
          this.logError(`Failed to examine game at index ${gameIndex}`, null);
          return null;
        }

        this.log('Getting move list...');
        const listSuccess = await sendCommand('LIST');
        if (!listSuccess) {
          this.logError('Failed to get move list', null);
          return null;
        }

        const content = await page.evaluate(() => document.body.textContent || '');
        return this.processGameContent(page, content);
      });

      const gameDataResults = await Promise.all(gameDataPromises);
      return gameDataResults.filter((data): data is ISCGameData => data !== null);
    } catch (error) {
      const err = error as Error;
      this.logError('Error in searchPlayerGames', err);
      // Keep detailed error logging for debugging, but provide a more informative message for timeouts
      if (err.message.includes('Timeout')) {
        throw new Error(`Timeout while fetching match data. Please check your internet connection and try again.`);
      } else {
        throw new Error(`Failed to fetch match result.`);
      }
    }
  }
}

export const iscService = new ISCService();
