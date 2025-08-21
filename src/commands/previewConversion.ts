import * as vscode from 'vscode';
import { SlimParser } from '../parser/slimParser';
import { ErbGenerator } from '../parser/erbGenerator';
import { FileManager } from '../utils/fileManager';
import { ErrorHandler, ErrorType } from '../utils/errorHandler';

export async function previewConversion(uri?: vscode.Uri): Promise<void> {
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

    // Get configuration for preview
    const config = vscode.workspace.getConfiguration('slimToErb');
    const indentSize = config.get<number>('indentSize', 2);

    try {
      // Read the slim file
      const slimContent = await FileManager.readSlimFile(filePath);
      
      // Parse the slim content
      const parser = new SlimParser();
      const parseResult = parser.parse(slimContent);
      
      // Generate ERB content
      const generator = new ErbGenerator({
        indentSize,
        preserveComments: true
      });
      const erbContent = generator.generate(parseResult.nodes);

      // Create a side-by-side preview
      await showPreview(slimContent, erbContent, filePath, parseResult.errors);

    } catch (error) {
      const conversionError = ErrorHandler.handleUnexpectedError(error, 'preview conversion');
      await ErrorHandler.showError(conversionError);
    }

  } catch (error) {
    const conversionError = ErrorHandler.handleUnexpectedError(error, 'previewConversion command');
    await ErrorHandler.showError(conversionError);
  }
}

async function showPreview(
  slimContent: string, 
  erbContent: string, 
  filePath: string, 
  parseErrors: string[]
): Promise<void> {
  const fileName = filePath.split('/').pop() || 'file';
  
  // Create preview content with side-by-side comparison
  const previewContent = createPreviewContent(slimContent, erbContent, fileName, parseErrors);
  
  // Open preview in a new untitled document
  const previewDocument = await vscode.workspace.openTextDocument({
    content: previewContent,
    language: 'erb'
  });

  // Show the preview document
  const editor = await vscode.window.showTextDocument(previewDocument, {
    viewColumn: vscode.ViewColumn.Beside,
    preview: true
  });

  // Add actions to the preview
  const action = await vscode.window.showInformationMessage(
    'Preview generated. What would you like to do?',
    'Convert & Save',
    'Copy ERB',
    'Close Preview'
  );

  switch (action) {
    case 'Convert & Save':
      await convertAndSave(filePath, erbContent);
      break;
    case 'Copy ERB':
      await vscode.env.clipboard.writeText(erbContent);
      await vscode.window.showInformationMessage('ERB content copied to clipboard');
      break;
    case 'Close Preview':
    default:
      // Close the preview document
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      break;
  }
}

function createPreviewContent(
  slimContent: string, 
  erbContent: string, 
  fileName: string, 
  parseErrors: string[]
): string {
  const separator = '='.repeat(80);
  const errorSection = parseErrors.length > 0 
    ? `\n${separator}\nPARSE ERRORS:\n${separator}\n${parseErrors.join('\n')}\n`
    : '';

  return `${separator}
SLIM TO ERB CONVERSION PREVIEW: ${fileName}
${separator}

ORIGINAL SLIM:
${separator}
${slimContent}

${separator}
CONVERTED ERB:
${separator}
${erbContent}${errorSection}

${separator}
PREVIEW ONLY - Use "Convert & Save" to create the actual ERB file
${separator}`;
}

async function convertAndSave(filePath: string, erbContent: string): Promise<void> {
  try {
    const config = vscode.workspace.getConfiguration('slimToErb');
    const options = {
      createBackup: config.get<boolean>('createBackup', true),
      deleteOriginal: config.get<boolean>('deleteOriginal', false),
      outputDirectory: config.get<string>('outputDirectory') || undefined
    };

    const outputPath = await FileManager.writeErbFile(filePath, erbContent, options);
    
    await vscode.window.showInformationMessage(
      `Successfully converted and saved to ${FileManager.getRelativePath(outputPath)}`
    );

    // Close preview and open the actual ERB file
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    
    const erbUri = vscode.Uri.file(outputPath);
    const document = await vscode.workspace.openTextDocument(erbUri);
    await vscode.window.showTextDocument(document);

  } catch (error) {
    const conversionError = ErrorHandler.handleUnexpectedError(error, 'save converted file');
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
    title: 'Select Slim file to preview'
  });

  return fileUris?.[0];
}