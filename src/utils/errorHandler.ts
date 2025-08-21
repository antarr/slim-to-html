import * as vscode from 'vscode';

export enum ErrorType {
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  CONVERSION_ERROR = 'CONVERSION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export interface ConversionError {
  type: ErrorType;
  message: string;
  filePath?: string;
  lineNumber?: number;
  details?: string;
}

export class ErrorHandler {
  private static errors: ConversionError[] = [];

  static addError(error: ConversionError) {
    this.errors.push(error);
    console.error('Slim to ERB Error:', error);
  }

  static clearErrors() {
    this.errors = [];
  }

  static getErrors(): ConversionError[] {
    return [...this.errors];
  }

  static hasErrors(): boolean {
    return this.errors.length > 0;
  }

  static async showError(error: ConversionError) {
    const message = this.formatErrorMessage(error);
    
    const action = await vscode.window.showErrorMessage(
      message,
      'View Details',
      'Dismiss'
    );

    if (action === 'View Details') {
      this.showErrorDetails(error);
    }
  }

  static async showErrorSummary() {
    if (this.errors.length === 0) {
      return;
    }

    const summary = this.generateErrorSummary();
    const action = await vscode.window.showErrorMessage(
      `Conversion completed with ${this.errors.length} error(s)`,
      'View Details',
      'Dismiss'
    );

    if (action === 'View Details') {
      this.showAllErrors();
    }
  }

  static async showWarning(message: string, ...actions: string[]): Promise<string | undefined> {
    return vscode.window.showWarningMessage(message, ...actions);
  }

  static async showInfo(message: string, ...actions: string[]): Promise<string | undefined> {
    return vscode.window.showInformationMessage(message, ...actions);
  }

  private static formatErrorMessage(error: ConversionError): string {
    let message = error.message;
    
    if (error.filePath) {
      const fileName = error.filePath.split('/').pop() || error.filePath;
      message = `${fileName}: ${message}`;
    }
    
    if (error.lineNumber) {
      message += ` (line ${error.lineNumber})`;
    }
    
    return message;
  }

  private static showErrorDetails(error: ConversionError) {
    const details = [
      `Type: ${error.type}`,
      `Message: ${error.message}`,
      error.filePath ? `File: ${error.filePath}` : null,
      error.lineNumber ? `Line: ${error.lineNumber}` : null,
      error.details ? `Details: ${error.details}` : null
    ].filter(Boolean).join('\n');

    vscode.window.showErrorMessage(details, { modal: true });
  }

  private static showAllErrors() {
    const errorList = this.errors.map((error, index) => 
      `${index + 1}. ${this.formatErrorMessage(error)}`
    ).join('\n');

    const content = `Conversion Errors:\n\n${errorList}`;
    
    vscode.workspace.openTextDocument({
      content,
      language: 'plaintext'
    }).then(doc => {
      vscode.window.showTextDocument(doc);
    });
  }

  private static generateErrorSummary(): string {
    const errorsByType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<ErrorType, number>);

    const summary = Object.entries(errorsByType)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    return `Error summary: ${summary}`;
  }

  static createError(
    type: ErrorType,
    message: string,
    filePath?: string,
    lineNumber?: number,
    details?: string
  ): ConversionError {
    return {
      type,
      message,
      filePath,
      lineNumber,
      details
    };
  }

  static handleUnexpectedError(error: unknown, context: string): ConversionError {
    const message = error instanceof Error ? error.message : String(error);
    const conversionError = this.createError(
      ErrorType.CONVERSION_ERROR,
      `Unexpected error in ${context}: ${message}`,
      undefined,
      undefined,
      error instanceof Error ? error.stack : undefined
    );
    
    this.addError(conversionError);
    return conversionError;
  }
}