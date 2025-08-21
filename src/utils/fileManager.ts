import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ConversionOptions {
  createBackup: boolean;
  deleteOriginal: boolean;
  outputDirectory?: string;
}

export class FileManager {
  
  static async readSlimFile(filePath: string): Promise<string> {
    try {
      const uri = vscode.Uri.file(filePath);
      const content = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(content).toString('utf8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  static async writeErbFile(filePath: string, content: string, options: ConversionOptions): Promise<string> {
    try {
      const outputPath = this.getOutputPath(filePath, options.outputDirectory);
      
      // Create backup if requested
      if (options.createBackup && fs.existsSync(filePath)) {
        await this.createBackup(filePath);
      }

      // Write the ERB file
      const uri = vscode.Uri.file(outputPath);
      const buffer = Buffer.from(content, 'utf8');
      await vscode.workspace.fs.writeFile(uri, buffer);

      // Delete original if requested
      if (options.deleteOriginal && fs.existsSync(filePath)) {
        await vscode.workspace.fs.delete(vscode.Uri.file(filePath));
      }

      return outputPath;
    } catch (error) {
      throw new Error(`Failed to write ERB file: ${error}`);
    }
  }

  static async createBackup(filePath: string): Promise<string> {
    try {
      const backupPath = `${filePath}.backup`;
      const sourceUri = vscode.Uri.file(filePath);
      const backupUri = vscode.Uri.file(backupPath);
      
      await vscode.workspace.fs.copy(sourceUri, backupUri, { overwrite: true });
      return backupPath;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  static getOutputPath(originalPath: string, outputDirectory?: string): string {
    const parsedPath = path.parse(originalPath);
    const erbFileName = `${parsedPath.name}.erb`;
    
    if (outputDirectory) {
      return path.join(outputDirectory, erbFileName);
    } else {
      return path.join(parsedPath.dir, erbFileName);
    }
  }

  static async findSlimFiles(directoryPath: string): Promise<string[]> {
    const slimFiles: string[] = [];
    
    try {
      const uri = vscode.Uri.file(directoryPath);
      const entries = await vscode.workspace.fs.readDirectory(uri);
      
      for (const [name, type] of entries) {
        const fullPath = path.join(directoryPath, name);
        
        if (type === vscode.FileType.File && name.endsWith('.slim')) {
          slimFiles.push(fullPath);
        } else if (type === vscode.FileType.Directory) {
          // Recursively search subdirectories
          const subFiles = await this.findSlimFiles(fullPath);
          slimFiles.push(...subFiles);
        }
      }
    } catch (error) {
      throw new Error(`Failed to scan directory ${directoryPath}: ${error}`);
    }
    
    return slimFiles;
  }

  static async pathExists(filePath: string): Promise<boolean> {
    try {
      const uri = vscode.Uri.file(filePath);
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      const uri = vscode.Uri.file(dirPath);
      await vscode.workspace.fs.createDirectory(uri);
    } catch (error) {
      // Directory might already exist, check if it's actually an error
      if (!(await this.pathExists(dirPath))) {
        throw new Error(`Failed to create directory ${dirPath}: ${error}`);
      }
    }
  }

  static getRelativePath(filePath: string): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      return path.relative(workspaceFolder.uri.fsPath, filePath);
    }
    return filePath;
  }
}