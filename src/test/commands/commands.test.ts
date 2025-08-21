import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { convertFile } from '../../commands/convertFile';
import { convertDirectory } from '../../commands/convertDirectory';
import { previewConversion } from '../../commands/previewConversion';

// Mock VS Code API
jest.mock('vscode');

describe('VS Code Commands', () => {
  const mockWorkspaceFolder = '/test/workspace';
  const mockContext: any = {
    subscriptions: [],
    extensionUri: vscode.Uri.file('/test/extension'),
    globalState: {
      get: jest.fn(),
      update: jest.fn()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock workspace folders
    (vscode.workspace as any).workspaceFolders = [{
      uri: vscode.Uri.file(mockWorkspaceFolder),
      name: 'Test Workspace',
      index: 0
    }];

    // Mock workspace configuration
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string) => {
        switch (key) {
          case 'slimToErb.indentSize': return 2;
          case 'slimToErb.createBackup': return true;
          case 'slimToErb.deleteOriginal': return false;
          case 'slimToErb.outputDirectory': return '';
          default: return undefined;
        }
      })
    });

    // Mock window methods
    (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);
    (vscode.window.showErrorMessage as jest.Mock).mockResolvedValue(undefined);
    (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue(undefined);
    (vscode.window.withProgress as jest.Mock).mockImplementation(
      async (options: any, task: any) => {
        const progress = {
          report: jest.fn()
        };
        const token = {
          isCancellationRequested: false,
          onCancellationRequested: jest.fn()
        };
        return task(progress, token);
      }
    );
  });

  describe('convertFile Command', () => {
    it('should convert a single Slim file to ERB', async () => {
      const mockUri = vscode.Uri.file(path.join(mockWorkspaceFolder, 'test.slim'));
      
      // Mock file system operations
      const mockReadFile = jest.spyOn(fs.promises, 'readFile')
        .mockResolvedValue('div\n  p Hello');
      const mockWriteFile = jest.spyOn(fs.promises, 'writeFile')
        .mockResolvedValue(undefined);
      const mockStat = jest.spyOn(fs.promises, 'stat')
        .mockResolvedValue({ isFile: () => true } as any);

      await convertFile(mockUri);

      expect(mockReadFile).toHaveBeenCalledWith(mockUri.fsPath, 'utf8');
      expect(mockWriteFile).toHaveBeenCalled();
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('Successfully converted')
      );

      mockReadFile.mockRestore();
      mockWriteFile.mockRestore();
      mockStat.mockRestore();
    });

    it('should create backup when configured', async () => {
      const mockUri = vscode.Uri.file(path.join(mockWorkspaceFolder, 'test.slim'));
      
      const mockReadFile = jest.spyOn(fs.promises, 'readFile')
        .mockResolvedValue('div\n  p Hello');
      const mockWriteFile = jest.spyOn(fs.promises, 'writeFile')
        .mockResolvedValue(undefined);
      const mockCopyFile = jest.spyOn(fs.promises, 'copyFile')
        .mockResolvedValue(undefined);
      const mockStat = jest.spyOn(fs.promises, 'stat')
        .mockResolvedValue({ isFile: () => true } as any);

      await convertFile(mockUri);

      expect(mockCopyFile).toHaveBeenCalledWith(
        mockUri.fsPath,
        expect.stringContaining('.slim.bak')
      );

      mockReadFile.mockRestore();
      mockWriteFile.mockRestore();
      mockCopyFile.mockRestore();
      mockStat.mockRestore();
    });

    it('should handle conversion errors gracefully', async () => {
      const mockUri = vscode.Uri.file(path.join(mockWorkspaceFolder, 'test.slim'));
      
      const mockReadFile = jest.spyOn(fs.promises, 'readFile')
        .mockRejectedValue(new Error('File not found'));
      const mockStat = jest.spyOn(fs.promises, 'stat')
        .mockResolvedValue({ isFile: () => true } as any);

      await convertFile(mockUri);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Error converting file')
      );

      mockReadFile.mockRestore();
      mockStat.mockRestore();
    });

    it('should validate file extension', async () => {
      const mockUri = vscode.Uri.file(path.join(mockWorkspaceFolder, 'test.txt'));
      
      const mockStat = jest.spyOn(fs.promises, 'stat')
        .mockResolvedValue({ isFile: () => true } as any);

      await convertFile(mockUri);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Please select a .slim file')
      );

      mockStat.mockRestore();
    });
  });

  describe('convertDirectory Command', () => {
    it('should convert all Slim files in directory', async () => {
      const mockUri = vscode.Uri.file(mockWorkspaceFolder);
      
      const mockReaddir = jest.spyOn(fs.promises, 'readdir')
        .mockResolvedValue([
          { name: 'file1.slim', isFile: () => true, isDirectory: () => false },
          { name: 'file2.slim', isFile: () => true, isDirectory: () => false },
          { name: 'other.txt', isFile: () => true, isDirectory: () => false },
          { name: 'subdir', isFile: () => false, isDirectory: () => true }
        ] as any);
      
      const mockReadFile = jest.spyOn(fs.promises, 'readFile')
        .mockResolvedValue('div\n  p Content');
      const mockWriteFile = jest.spyOn(fs.promises, 'writeFile')
        .mockResolvedValue(undefined);
      const mockStat = jest.spyOn(fs.promises, 'stat')
        .mockResolvedValue({ isDirectory: () => true } as any);

      await convertDirectory(mockUri);

      expect(mockReadFile).toHaveBeenCalledTimes(2); // Only .slim files
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('Successfully converted 2 files')
      );

      mockReaddir.mockRestore();
      mockReadFile.mockRestore();
      mockWriteFile.mockRestore();
      mockStat.mockRestore();
    });

    it('should handle recursive directory conversion', async () => {
      const mockUri = vscode.Uri.file(mockWorkspaceFolder);
      
      let callCount = 0;
      const mockReaddir = jest.spyOn(fs.promises, 'readdir')
        .mockImplementation(async (path: any) => {
          if (callCount++ === 0) {
            return [
              { name: 'file.slim', isFile: () => true, isDirectory: () => false },
              { name: 'subdir', isFile: () => false, isDirectory: () => true }
            ] as any;
          } else {
            return [
              { name: 'nested.slim', isFile: () => true, isDirectory: () => false }
            ] as any;
          }
        });
      
      const mockReadFile = jest.spyOn(fs.promises, 'readFile')
        .mockResolvedValue('div');
      const mockWriteFile = jest.spyOn(fs.promises, 'writeFile')
        .mockResolvedValue(undefined);
      const mockStat = jest.spyOn(fs.promises, 'stat')
        .mockResolvedValue({ isDirectory: () => true } as any);

      await convertDirectory(mockUri);

      expect(mockReadFile).toHaveBeenCalledTimes(2); // file.slim and nested.slim
      expect(mockWriteFile).toHaveBeenCalledTimes(2);

      mockReaddir.mockRestore();
      mockReadFile.mockRestore();
      mockWriteFile.mockRestore();
      mockStat.mockRestore();
    });

    it('should handle empty directories', async () => {
      const mockUri = vscode.Uri.file(mockWorkspaceFolder);
      
      const mockReaddir = jest.spyOn(fs.promises, 'readdir')
        .mockResolvedValue([]);
      const mockStat = jest.spyOn(fs.promises, 'stat')
        .mockResolvedValue({ isDirectory: () => true } as any);

      await convertDirectory(mockUri);

      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining('No .slim files found')
      );

      mockReaddir.mockRestore();
      mockStat.mockRestore();
    });
  });

  describe('previewConversion Command', () => {
    it('should show preview in diff editor', async () => {
      const mockUri = vscode.Uri.file(path.join(mockWorkspaceFolder, 'test.slim'));
      
      const mockReadFile = jest.spyOn(fs.promises, 'readFile')
        .mockResolvedValue('div.container\n  p Hello');
      const mockStat = jest.spyOn(fs.promises, 'stat')
        .mockResolvedValue({ isFile: () => true } as any);
      
      const mockTextDocument = {
        uri: mockUri,
        getText: () => '<div class="container">\n  <p>Hello</p>\n</div>',
        languageId: 'erb'
      };
      
      (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockTextDocument);
      (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);

      await previewConversion(mockUri);

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        'vscode.diff',
        mockUri,
        expect.any(Object),
        expect.stringContaining('Preview')
      );

      mockReadFile.mockRestore();
      mockStat.mockRestore();
    });

    it('should handle preview errors', async () => {
      const mockUri = vscode.Uri.file(path.join(mockWorkspaceFolder, 'test.slim'));
      
      const mockReadFile = jest.spyOn(fs.promises, 'readFile')
        .mockRejectedValue(new Error('Cannot read file'));
      const mockStat = jest.spyOn(fs.promises, 'stat')
        .mockResolvedValue({ isFile: () => true } as any);

      await previewConversion(mockUri);

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Error previewing')
      );

      mockReadFile.mockRestore();
      mockStat.mockRestore();
    });
  });

  describe('Command Registration', () => {
    it('should register all commands on activation', () => {
      const mockRegisterCommand = jest.spyOn(vscode.commands, 'registerCommand');
      
      // Simulate extension activation
      const commands = [
        'slimToErb.convertFile',
        'slimToErb.convertDirectory',
        'slimToErb.previewConversion'
      ];

      commands.forEach(cmd => {
        expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
          cmd,
          expect.any(Function)
        );
      });

      mockRegisterCommand.mockRestore();
    });
  });

  describe('Progress Reporting', () => {
    it('should show progress during conversion', async () => {
      const mockUri = vscode.Uri.file(path.join(mockWorkspaceFolder, 'test.slim'));
      
      const mockReadFile = jest.spyOn(fs.promises, 'readFile')
        .mockResolvedValue('div');
      const mockWriteFile = jest.spyOn(fs.promises, 'writeFile')
        .mockResolvedValue(undefined);
      const mockStat = jest.spyOn(fs.promises, 'stat')
        .mockResolvedValue({ isFile: () => true } as any);

      await convertFile(mockUri);

      expect(vscode.window.withProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          location: vscode.ProgressLocation.Notification,
          title: expect.stringContaining('Converting')
        }),
        expect.any(Function)
      );

      mockReadFile.mockRestore();
      mockWriteFile.mockRestore();
      mockStat.mockRestore();
    });
  });
});