import { chromium } from 'playwright';
import { ISCCredentials, ISCPlayerIdentifier, ISCMatchResult } from '@/types/ISC';

interface SearchResult {
  player1Score: number;
  player2Score: number;
  timestamp: string;
}

export class ISCService {
  private baseUrl = 'https://www.isc.ro';
  private debug = process.env.NODE_ENV !== 'production';

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
        const searchResult = await this.searchPlayerGames(page, player1.iscUsername, player2.iscUsername);
        if (!searchResult) {
          throw new Error(`No recent matches found between ${player1.iscUsername} and ${player2.iscUsername}`);
        }

        return searchResult;
      } catch (searchError) {
        // Log current page state for debugging
        try {
          const pageContent = await page.content();
          this.log('Page content at error:');
          this.log(pageContent.slice(0, 1000) + '...');

          const bodyText = await page.evaluate(() => document.body.textContent);
          this.log('Body text content:');
          this.log(bodyText?.slice(0, 1000) + '...');

          await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
          this.log('Error screenshot saved as error-screenshot.png');
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
      // Wait for the command to appear in results with polling
      await page.waitForFunction(
        async (xpath: string, expectedCommand: string) => {
          const element = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;
          return element?.textContent?.includes(expectedCommand) || false;
        },
        { timeout: 10000, polling: 500 },
        resultDivXPath,
        command
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
    page: any,
    player1Username: string,
    player2Username: string
  ): Promise<SearchResult | null> {
    try {
      this.log('Looking for command input...');
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

      // Check fewer games to minimize timeouts
      let resultsText = '';
      const nLast = 3;
      
      for (let i = 0; i < nLast; i++) {
        const success = await sendCommand(`EXAMINE HISTORY ${player1Username} ${i}`);
        if (!success) {
          this.log(`Warning: Command EXAMINE HISTORY ${i} failed, continuing...`);
        }
        // Get fresh content after each command
        resultsText = await page.evaluate(() => document.body.textContent || '');
        if (resultsText.includes('Analyses de partie:')) break;
        await page.waitForTimeout(1000);
      }

      if (!resultsText.includes('Analyses de partie:')) {
        throw new Error('Failed to get game analyses after multiple attempts');
      }
      
      // Find matches between players
      const matches = resultsText
        .split('\n')
        .filter((line: string) => line.startsWith('Analyses de partie:'))
        .filter((line: string) => 
          line.includes(`${player1Username} vs ${player2Username}`) || 
          line.includes(`${player2Username} vs ${player1Username}`)
        );

      if (matches.length === 0) {
        return null;
      }

      // Get most recent match
      const mostRecentMatch = matches[0];
      const gameIndex = mostRecentMatch.split(':')[0].split(' ').pop();

      this.log(`Re-examining game at index ${gameIndex}...`);
      const examineSuccess = await sendCommand(`EXAMINE HISTORY ${player1Username} ${gameIndex}`);
      if (!examineSuccess) {
        throw new Error('Failed to re-examine specific game');
      }
      
      this.log('Getting move list...');
      const listSuccess = await sendCommand('LIST');
      if (!listSuccess) {
        throw new Error('Failed to get move list');
      }
      
      // Extract scores with retries
      let scoreLine = null;
      let attempts = 3;
      
      while (attempts > 0 && !scoreLine) {
        const content = await page.evaluate(() => document.body.textContent || '');
        const lines = content.split('\n');
        scoreLine = lines.find((line: string) => /\d+\s+points\s+\d+\s+points/.test(line));
        
        if (!scoreLine && attempts > 1) {
          this.log(`No score line found, retrying... (${attempts - 1} attempts left)`);
          await page.waitForTimeout(1000);
        }
        attempts--;
      }

      if (!scoreLine) {
        throw new Error('Could not find score line after multiple attempts');
      }

      const scores = scoreLine.match(/\d+(?=\s+points)/g);
      if (!scores || scores.length !== 2) {
        throw new Error('Failed to parse game scores');
      }

      return {
        player1Score: parseInt(scores[0], 10),
        player2Score: parseInt(scores[1], 10),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const err = error as Error;
      this.logError('Error in searchPlayerGames', err);
      throw new Error(`Failed to search player games: ${err.message}`);
    }
  }
}

export const iscService = new ISCService();
