import * as vscode from 'vscode';
import * as path from 'path';
import { SlimParser } from '../parser/slimParser';
import { ErbGenerator } from '../parser/erbGenerator';
import { FileManager, ConversionOptions } from '../utils/fileManager';
import { ErrorHandler, ErrorType } from '../utils/errorHandler';
import { ProgressTracker } from '../utils/progressTracker';

export async function convertDirectory(uri?: vscode.Uri): Promise<void> {
  try {
    ErrorHandler.clearErrors();
    
    // Get the target directory
    const targetUri = await getTargetDirectory(uri);
    if (!targetUri) {
      return;
    }

    const directoryPath = targetUri.fsPath;
    
    // Find all slim files in the directory
    let slimFiles: string[];
    try {
      slimFiles = await FileManager.findSlimFiles(directoryPath);
    } catch (error) {
      const conversionError = ErrorHandler.createError(
        ErrorType.FILE_READ_ERROR,
        `Failed to scan directory: ${error}`,
        directoryPath
      );
      await ErrorHandler.showError(conversionError);
      return;
    }

    if (slimFiles.length === 0) {
      await ErrorHandler.showInfo('No .slim files found in the selected directory.');
      return;
    }

    // Confirm batch conversion
    const confirmMessage = `Found ${slimFiles.length} .slim file(s). Convert all to ERB?`;
    const confirmation = await ErrorHandler.showWarning(
      confirmMessage,
      'Convert All',
      'Cancel'
    );

    if (confirmation !== 'Convert All') {
      return;
    }

    // Get configuration options
    const options = getConversionOptions();

    // Perform batch conversion with progress tracking
    await ProgressTracker.withProgress(
      `Converting ${slimFiles.length} files`,
      async (tracker) => {
        tracker.initialize(slimFiles.length, 'Starting batch conversion...');
        
        let successCount = 0;
        let errorCount = 0;

        for (const filePath of slimFiles) {
          if (tracker.isCancelled()) {
            break;
          }

          try {
            const fileName = path.basename(filePath);
            tracker.reportStep('Converting', filePath);

            await convertSingleFile(filePath, options);
            successCount++;

          } catch (error) {
            errorCount++;
            const conversionError = ErrorHandler.createError(
              ErrorType.CONVERSION_ERROR,
              `Failed to convert file: ${error}`,
              filePath
            );
            ErrorHandler.addError(conversionError);
            tracker.reportError('Conversion failed', filePath);
          }
        }

        if (tracker.isCancelled()) {
          tracker.reportComplete('Conversion cancelled');
          await ErrorHandler.showWarning('Batch conversion was cancelled.');
        } else {
          tracker.reportComplete(`Converted ${successCount} files`);
          await showBatchResults(successCount, errorCount, slimFiles.length);
        }
      }
    );

  } catch (error) {
    const conversionError = ErrorHandler.handleUnexpectedError(error, 'convertDirectory command');
    await ErrorHandler.showError(conversionError);
  }
}

async function convertSingleFile(filePath: string, options: ConversionOptions & { indentSize: number }): Promise<void> {
  // Read the slim file
  const slimContent = await FileManager.readSlimFile(filePath);
  
  // Parse the slim content
  const parser = new SlimParser();
  const parseResult = parser.parse(slimContent);
  
  if (parseResult.errors.length > 0) {
    parseResult.errors.forEach(error => {
      ErrorHandler.addError(
        ErrorHandler.createError(
          ErrorType.PARSE_ERROR,
          error,
          filePath
        )
      );
    });
  }

  // Generate ERB content
  const generator = new ErbGenerator({
    indentSize: options.indentSize,
    preserveComments: true
  });
  const erbContent = generator.generate(parseResult.nodes);

  // Write ERB file
  await FileManager.writeErbFile(filePath, erbContent, {
    createBackup: options.createBackup,
    deleteOriginal: options.deleteOriginal,
    outputDirectory: options.outputDirectory
  });
}

async function getTargetDirectory(uri?: vscode.Uri): Promise<vscode.Uri | undefined> {
  if (uri) {
    return uri;
  }

  // Show directory picker
  const folderUris = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    title: 'Select directory containing Slim files'
  });

  return folderUris?.[0];
}

function getConversionOptions(): ConversionOptions & { indentSize: number } {
  const config = vscode.workspace.getConfiguration('slimToErb');
  
  return {
    indentSize: config.get<number>('indentSize', 2),
    createBackup: config.get<boolean>('createBackup', true),
    deleteOriginal: config.get<boolean>('deleteOriginal', false),
    outputDirectory: config.get<string>('outputDirectory') || undefined
  };
}

async function showBatchResults(successCount: number, errorCount: number, totalCount: number): Promise<void> {
  const message = `Batch conversion complete: ${successCount}/${totalCount} files converted successfully`;
  
  if (errorCount > 0) {
    const action = await ErrorHandler.showWarning(
      `${message}. ${errorCount} error(s) occurred.`,
      'View Errors',
      'OK'
    );
    
    if (action === 'View Errors') {
      await ErrorHandler.showErrorSummary();
    }
  } else {
    await ErrorHandler.showInfo(message);
  }
}