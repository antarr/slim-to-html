import * as vscode from 'vscode';
import { convertFile } from './commands/convertFile';
import { convertDirectory } from './commands/convertDirectory';
import { previewConversion } from './commands/previewConversion';

export function activate(context: vscode.ExtensionContext) {
  console.log('Slim to ERB extension is now active');

  // Register commands
  const convertFileCommand = vscode.commands.registerCommand('slim-to-erb.convertFile', convertFile);
  const convertDirectoryCommand = vscode.commands.registerCommand('slim-to-erb.convertDirectory', convertDirectory);
  const previewConversionCommand = vscode.commands.registerCommand('slim-to-erb.previewConversion', previewConversion);

  // Add to subscriptions for proper cleanup
  context.subscriptions.push(convertFileCommand);
  context.subscriptions.push(convertDirectoryCommand);
  context.subscriptions.push(previewConversionCommand);
}

export function deactivate() {
  console.log('Slim to ERB extension deactivated');
}