import fs from 'fs/promises';
import path from 'path';

interface FileError extends Error {
  code?: string;
}

export class BaseRepository {
  protected dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
  }

  protected async readJsonFile<T>(filePath: string): Promise<T> {
    try {
      const fullPath = path.join(this.dataDir, filePath);
      const data = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      const fileError = error as FileError;
      if (fileError.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw error;
    }
  }

  protected async writeJsonFile<T>(filePath: string, data: T): Promise<void> {
    try {
      const fullPath = path.join(this.dataDir, filePath);
      const dirPath = path.dirname(fullPath);
      
      // Ensure directory exists
      await fs.mkdir(dirPath, { recursive: true });
      
      // Write data atomically
      const tempPath = `${fullPath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
      await fs.rename(tempPath, fullPath);
    } catch (error) {
      const fileError = error as FileError;
      throw new Error(`Failed to write file ${filePath}: ${fileError.message}`);
    }
  }

  protected async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.dataDir, filePath));
      return true;
    } catch {
      return false;
    }
  }

  protected async createBackup<T>(filePath: string, data: T): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(
      this.dataDir,
      'backups',
      `${path.basename(filePath, '.json')}_${timestamp}.json`
    );
    
    await this.writeJsonFile(backupPath, data);
  }

  protected async listFiles(dir: string): Promise<string[]> {
    try {
      const fullPath = path.join(this.dataDir, dir);
      const files = await fs.readdir(fullPath);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      const fileError = error as FileError;
      if (fileError.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  // Lock file mechanism for concurrent write operations
  protected async acquireLock(resourceId: string): Promise<void> {
    const lockFile = path.join(this.dataDir, 'locks', `${resourceId}.lock`);
    const lockDir = path.dirname(lockFile);
    
    try {
      await fs.mkdir(lockDir, { recursive: true });
      await fs.writeFile(lockFile, new Date().toISOString(), { flag: 'wx' });
    } catch (error) {
      const fileError = error as FileError;
      if (fileError.code === 'EEXIST') {
        // Lock exists, wait and retry
        await new Promise(resolve => setTimeout(resolve, 100));
        await this.acquireLock(resourceId);
      } else {
        throw error;
      }
    }
  }

  protected async releaseLock(resourceId: string): Promise<void> {
    const lockFile = path.join(this.dataDir, 'locks', `${resourceId}.lock`);
    try {
      await fs.unlink(lockFile);
    } catch (error) {
      // Ignore errors when releasing lock
      console.error(`Failed to release lock for ${resourceId}:`, error);
    }
  }

  // Transaction-like operations
  protected async withLock<T>(
    resourceId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    await this.acquireLock(resourceId);
    try {
      const result = await operation();
      return result;
    } finally {
      await this.releaseLock(resourceId);
    }
  }
}