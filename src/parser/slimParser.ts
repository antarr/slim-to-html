export interface SlimNode {
  type: 'tag' | 'text' | 'ruby_code' | 'ruby_output' | 'comment' | 'doctype';
  tagName?: string;
  attributes?: { [key: string]: string };
  content?: string;
  children?: SlimNode[];
  indentLevel: number;
  raw?: string;
}

export interface ParseResult {
  nodes: SlimNode[];
  errors: string[];
}

export class SlimParser {
  private lines: string[] = [];
  private currentIndex = 0;
  private errors: string[] = [];

  parse(content: string): ParseResult {
    this.lines = content.split('\n');
    this.currentIndex = 0;
    this.errors = [];

    const nodes: SlimNode[] = [];
    
    while (this.currentIndex < this.lines.length) {
      const node = this.parseLine(this.lines[this.currentIndex]);
      if (node) {
        nodes.push(node);
      }
      this.currentIndex++;
    }

    return {
      nodes,
      errors: this.errors
    };
  }

  private parseLine(line: string): SlimNode | null {
    const trimmed = line.trim();
    const indentLevel = line.length - line.trimStart().length;

    // Skip empty lines
    if (!trimmed) {
      return null;
    }

    // Handle comments
    if (trimmed.startsWith('/')) {
      return {
        type: 'comment',
        content: trimmed.substring(1).trim(),
        indentLevel,
        raw: line
      };
    }

    // Handle doctype
    if (trimmed.startsWith('doctype') || trimmed.startsWith('!!!')) {
      return {
        type: 'doctype',
        content: trimmed,
        indentLevel,
        raw: line
      };
    }

    // Handle Ruby output (=)
    if (trimmed.startsWith('= ')) {
      return {
        type: 'ruby_output',
        content: trimmed.substring(2),
        indentLevel,
        raw: line
      };
    }

    // Handle Ruby code (-)
    if (trimmed.startsWith('- ')) {
      return {
        type: 'ruby_code',
        content: trimmed.substring(2),
        indentLevel,
        raw: line
      };
    }

    // Handle plain text (|)
    if (trimmed.startsWith('| ')) {
      return {
        type: 'text',
        content: trimmed.substring(2),
        indentLevel,
        raw: line
      };
    }

    // Handle HTML tags and shortcuts
    return this.parseTag(trimmed, indentLevel, line);
  }

  private parseTag(content: string, indentLevel: number, raw: string): SlimNode {
    // First check if this is a tag with inline Ruby output (e.g., "p= @user.name")
    if (content.includes('=')) {
      const equalIndex = content.indexOf('=');
      const tagPart = content.substring(0, equalIndex);
      const rubyContent = content.substring(equalIndex + 1).trim();
      
      if (rubyContent) {
        // Extract tag name and shortcuts from the tag part
        const tagNameMatch = tagPart.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
        const tagName = tagNameMatch ? tagNameMatch[1] : 'div';
        
        // Find where tag name ends to get shortcuts
        const tagNameEnd = tagNameMatch ? tagNameMatch[0].length : 0;
        const shortcuts = tagPart.substring(tagNameEnd);
        
        const attributes = this.parseShortcuts(shortcuts);
        
        return {
          type: 'tag',
          tagName,
          attributes,
          indentLevel,
          raw,
          children: [{
            type: 'ruby_output',
            content: rubyContent,
            indentLevel: indentLevel + 1
          }]
        };
      }
    }

    // Parse tag with potential shortcuts and attributes
    // Split the content to separate tag+shortcuts from text content
    const parts = content.split(/\s+/);
    const tagPart = parts[0] || '';
    const textContent = parts.slice(1).join(' ');
    
    // Extract tag name and shortcuts from the first part
    const tagNameMatch = tagPart.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
    const tagName = tagNameMatch ? tagNameMatch[1] : 'div';
    
    // Find where tag name ends to get shortcuts
    const tagNameEnd = tagNameMatch ? tagNameMatch[0].length : 0;
    const shortcuts = tagPart.substring(tagNameEnd);
    
    const shortcutAttrs = this.parseShortcuts(shortcuts);
    const explicitAttrs = this.parseExplicitAttributes(textContent);
    const attributes = { ...shortcutAttrs, ...explicitAttrs };
    
    // Extract actual text content (after attributes)
    const actualContent = this.extractTextContent(textContent);

    const node: SlimNode = {
      type: 'tag',
      tagName,
      attributes,
      indentLevel,
      raw,
      children: []
    };

    // Handle inline content
    if (actualContent) {
      if (actualContent.startsWith('= ')) {
        node.children!.push({
          type: 'ruby_output',
          content: actualContent.substring(2),
          indentLevel: indentLevel + 1
        });
      } else {
        node.children!.push({
          type: 'text',
          content: actualContent,
          indentLevel: indentLevel + 1
        });
      }
    }

    return node;
  }

  private parseShortcuts(shortcuts: string): { [key: string]: string } {
    const attributes: { [key: string]: string } = {};
    
    // Parse class shortcuts (.class-name)
    const classMatches = shortcuts.match(/\.([a-zA-Z0-9_-]+)/g);
    if (classMatches) {
      const classes = classMatches.map(match => match.substring(1));
      attributes.class = classes.join(' ');
    }

    // Parse ID shortcuts (#id-name)
    const idMatch = shortcuts.match(/#([a-zA-Z0-9_-]+)/);
    if (idMatch) {
      attributes.id = idMatch[1];
    }

    return attributes;
  }

  private parseExplicitAttributes(content: string): { [key: string]: string } {
    const attributes: { [key: string]: string } = {};
    
    // Parse explicit attributes (key="value" or key=value)
    const attrPattern = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
    let attrMatch;
    
    while ((attrMatch = attrPattern.exec(content)) !== null) {
      const [, key, doubleQuoted, singleQuoted, unquoted] = attrMatch;
      attributes[key] = doubleQuoted || singleQuoted || unquoted;
    }

    return attributes;
  }

  private extractTextContent(content: string): string {
    // Remove attribute patterns to get remaining text
    const withoutAttrs = content.replace(/([a-zA-Z0-9_-]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s]+)/g, '').trim();
    return withoutAttrs;
  }
}