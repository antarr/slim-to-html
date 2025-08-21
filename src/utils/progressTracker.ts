import * as vscode from 'vscode';

export interface ProgressReport {
  current: number;
  total: number;
  message: string;
  filePath?: string;
}

export class ProgressTracker {
  private progress: vscode.Progress<{ message?: string; increment?: number }>;
  private token: vscode.CancellationToken;
  private currentStep = 0;
  private totalSteps = 0;

  constructor(
    progress: vscode.Progress<{ message?: string; increment?: number }>,
    token: vscode.CancellationToken
  ) {
    this.progress = progress;
    this.token = token;
  }

  initialize(totalSteps: number, initialMessage = 'Starting conversion...') {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.progress.report({ message: initialMessage });
  }

  reportStep(message: string, filePath?: string) {
    this.currentStep++;
    const increment = this.totalSteps > 0 ? (100 / this.totalSteps) : 0;
    
    let displayMessage = message;
    if (filePath) {
      const fileName = filePath.split('/').pop() || filePath;
      displayMessage = `${message}: ${fileName}`;
    }
    
    this.progress.report({
      message: `${displayMessage} (${this.currentStep}/${this.totalSteps})`,
      increment
    });
  }

  reportError(message: string, filePath?: string) {
    let displayMessage = `Error: ${message}`;
    if (filePath) {
      const fileName = filePath.split('/').pop() || filePath;
      displayMessage = `Error in ${fileName}: ${message}`;
    }
    
    this.progress.report({ message: displayMessage });
  }

  reportComplete(message = 'Conversion complete') {
    this.progress.report({ message, increment: 100 });
  }

  isCancelled(): boolean {
    return this.token.isCancellationRequested;
  }

  static async withProgress<T>(
    title: string,
    task: (tracker: ProgressTracker) => Promise<T>
  ): Promise<T> {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: true
      },
      async (progress, token) => {
        const tracker = new ProgressTracker(progress, token);
        return await task(tracker);
      }
    );
  }
}