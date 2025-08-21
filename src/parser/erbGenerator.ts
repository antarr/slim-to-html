import { SlimNode } from './slimParser';

export interface GeneratorOptions {
  indentSize: number;
  preserveComments: boolean;
}

export class ErbGenerator {
  private options: GeneratorOptions;
  private output: string[] = [];
  private tagStack: Array<{ tagName: string; indentLevel: number }> = [];

  constructor(options: GeneratorOptions = { indentSize: 2, preserveComments: true }) {
    this.options = options;
  }

  generate(nodes: SlimNode[]): string {
    this.output = [];
    this.tagStack = [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nextNode = nodes[i + 1];
      
      this.processNode(node, nextNode);
    }

    // Close any remaining open tags
    this.closeRemainingTags(0);

    return this.output.join('\n');
  }

  private processNode(node: SlimNode, nextNode?: SlimNode): void {
    // Close tags if we're moving to a less indented level
    if (nextNode) {
      this.closeTagsToLevel(nextNode.indentLevel);
    }

    switch (node.type) {
      case 'tag':
        this.generateTag(node, nextNode);
        break;
      case 'text':
        this.generateText(node);
        break;
      case 'ruby_code':
        this.generateRubyCode(node);
        break;
      case 'ruby_output':
        this.generateRubyOutput(node);
        break;
      case 'comment':
        this.generateComment(node);
        break;
      case 'doctype':
        this.generateDoctype(node);
        break;
    }
  }

  private generateTag(node: SlimNode, nextNode?: SlimNode): void {
    const indent = this.getIndent(node.indentLevel);
    const tagName = node.tagName!;
    const attributes = this.formatAttributes(node.attributes || {});
    
    // Check if this tag has content or children
    const hasInlineContent = node.children && node.children.length > 0;
    const hasBlockContent = nextNode && nextNode.indentLevel > node.indentLevel;
    
    if (hasInlineContent && node.children!.length === 1 && node.children![0].type === 'text') {
      // Self-closing tag with inline text content
      const content = node.children![0].content || '';
      this.output.push(`${indent}<${tagName}${attributes}>${content}</${tagName}>`);
    } else if (hasInlineContent && node.children!.length === 1 && node.children![0].type === 'ruby_output') {
      // Self-closing tag with inline Ruby output
      const content = node.children![0].content || '';
      this.output.push(`${indent}<${tagName}${attributes}><%= ${content} %></${tagName}>`);
    } else if (hasBlockContent) {
      // Opening tag with block content
      this.output.push(`${indent}<${tagName}${attributes}>`);
      this.tagStack.push({ tagName, indentLevel: node.indentLevel });
    } else {
      // Self-closing tag
      this.output.push(`${indent}<${tagName}${attributes}></${tagName}>`);
    }
  }

  private generateText(node: SlimNode): void {
    const indent = this.getIndent(node.indentLevel);
    this.output.push(`${indent}${node.content || ''}`);
  }

  private generateRubyCode(node: SlimNode): void {
    const indent = this.getIndent(node.indentLevel);
    this.output.push(`${indent}<% ${node.content || ''} %>`);
  }

  private generateRubyOutput(node: SlimNode): void {
    const indent = this.getIndent(node.indentLevel);
    this.output.push(`${indent}<%= ${node.content || ''} %>`);
  }

  private generateComment(node: SlimNode): void {
    if (this.options.preserveComments) {
      const indent = this.getIndent(node.indentLevel);
      this.output.push(`${indent}<%# ${node.content || ''} %>`);
    }
  }

  private generateDoctype(node: SlimNode): void {
    if (node.content === 'doctype html' || node.content === '!!! 5') {
      this.output.push('<!DOCTYPE html>');
    } else {
      this.output.push(`<!DOCTYPE ${node.content || 'html'}>`);
    }
  }

  private formatAttributes(attributes: { [key: string]: string }): string {
    const attrs = Object.entries(attributes)
      .map(([key, value]) => {
        // Handle boolean attributes
        if (value === '' || value === key) {
          return key;
        }
        // Escape quotes in attribute values
        const escapedValue = value.replace(/"/g, '&quot;');
        return `${key}="${escapedValue}"`;
      })
      .join(' ');
    
    return attrs ? ` ${attrs}` : '';
  }

  private closeTagsToLevel(targetLevel: number): void {
    while (this.tagStack.length > 0) {
      const lastTag = this.tagStack[this.tagStack.length - 1];
      if (lastTag.indentLevel < targetLevel) {
        break;
      }
      
      const tag = this.tagStack.pop()!;
      const indent = this.getIndent(tag.indentLevel);
      this.output.push(`${indent}</${tag.tagName}>`);
    }
  }

  private closeRemainingTags(targetLevel: number): void {
    this.closeTagsToLevel(targetLevel);
  }

  private getIndent(level: number): string {
    return ' '.repeat(level * this.options.indentSize);
  }
}