import * as vscode from 'vscode';
import * as path from 'path';
import { SlimParser } from '../parser/slimParser';
import { ErbGenerator } from '../parser/erbGenerator';
import { FileManager, ConversionOptions } from '../utils/fileManager';
import { ErrorHandler, ErrorType } from '../utils/errorHandler';
import { ProgressTracker } from '../utils/progressTracker';

export async function convertFile(uri?: vscode.Uri): Promise<void> {
  try {
    ErrorHandler.clearErrors();
    
    // Get the target file
    const targetUri = await getTargetFile(uri);
    if (!targetUri) {
      return;
    }

    const filePath = targetUri.fsPath;
    
    // Validate file extension
    if (!filePath.endsWith('.slim')) {
      await ErrorHandler.showError(
        ErrorHandler.createError(
          ErrorType.VALIDATION_ERROR,
          'Selected file is not a .slim file',
          filePath
        )
      );
      return;
    }

    // Get configuration options
    const options = getConversionOptions();

    // Perform conversion with progress tracking
    await ProgressTracker.withProgress(
      'Converting Slim to ERB',
      async (tracker) => {
        tracker.initialize(3, 'Reading Slim file...');
        
        try {
          // Read the slim file
          tracker.reportStep('Reading file', filePath);
          const slimContent = await FileManager.readSlimFile(filePath);
          
          if (tracker.isCancelled()) {
            return;
          }

          // Parse the slim content
          tracker.reportStep('Parsing Slim syntax', filePath);
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

          if (tracker.isCancelled()) {
            return;
          }

          // Generate ERB content
          tracker.reportStep('Generating ERB', filePath);
          const generator = new ErbGenerator({
            indentSize: options.indentSize,
            preserveComments: true
          });
          const erbContent = generator.generate(parseResult.nodes);

          if (tracker.isCancelled()) {
            return;
          }

          // Write ERB file
          const outputPath = await FileManager.writeErbFile(filePath, erbContent, {
            createBackup: options.createBackup,
            deleteOriginal: options.deleteOriginal,
            outputDirectory: options.outputDirectory
          });

          tracker.reportComplete(`Converted to ${path.basename(outputPath)}`);

          // Show completion message
          if (ErrorHandler.hasErrors()) {
            await ErrorHandler.showErrorSummary();
          } else {
            const relativePath = FileManager.getRelativePath(outputPath);
            await ErrorHandler.showInfo(`Successfully converted to ${relativePath}`);
          }

          // Open the converted file
          const shouldOpen = await ErrorHandler.showInfo(
            'Conversion complete. Open the ERB file?',
            'Open File',
            'No'
          );

          if (shouldOpen === 'Open File') {
            const erbUri = vscode.Uri.file(outputPath);
            const document = await vscode.workspace.openTextDocument(erbUri);
            await vscode.window.showTextDocument(document);
          }

        } catch (error) {
          tracker.reportError('Conversion failed');
          const conversionError = ErrorHandler.handleUnexpectedError(error, 'file conversion');
          await ErrorHandler.showError(conversionError);
        }
      }
    );

  } catch (error) {
    const conversionError = ErrorHandler.handleUnexpectedError(error, 'convertFile command');
    await ErrorHandler.showError(conversionError);
  }
}

async function getTargetFile(uri?: vscode.Uri): Promise<vscode.Uri | undefined> {
  if (uri) {
    return uri;
  }

  // If no URI provided, try to get from active editor
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    return activeEditor.document.uri;
  }

  // Otherwise, show file picker
  const fileUris = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    filters: {
      'Slim files': ['slim']
    },
    title: 'Select Slim file to convert'
  });

  return fileUris?.[0];
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