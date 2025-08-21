import { SlimParser } from '../../parser/slimParser';
import { ErbGenerator } from '../../parser/erbGenerator';

describe('Edge Cases and Error Handling', () => {
  const parser = new SlimParser();
  const generator = new ErbGenerator();

  const convertSlimToErb = (slimContent: string): string => {
    const parsed = parser.parse(slimContent);
    return generator.generate(parsed.nodes);
  };

  describe('Empty and Whitespace Cases', () => {
    it('should handle empty input', () => {
      expect(convertSlimToErb('')).toBe('');
    });

    it('should handle whitespace-only input', () => {
      expect(convertSlimToErb('   \n  \n   ')).toBe('');
    });

    it('should handle single line with spaces', () => {
      expect(convertSlimToErb('   div   ')).toBe('<div></div>');
    });
  });

  describe('Malformed Input', () => {
    it('should handle unclosed Ruby blocks gracefully', () => {
      const slim = `- if @user
  p User exists`;
      
      // Should still generate something, even if not perfect
      const result = convertSlimToErb(slim);
      expect(result).toContain('<% if @user %>');
      expect(result).toContain('<p>User exists</p>');
      // Note: Missing <% end %> - parser should ideally handle this
    });

    it('should handle mixed indentation', () => {
      const slim = `div
  p First
    span Nested
  p Second`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('<div>');
      expect(result).toContain('<p>First</p>');
      expect(result).toContain('<p>Second</p>');
    });

    it('should handle invalid class names', () => {
      const slim = `.123invalid.-also-invalid.valid-class Content`;
      
      const result = convertSlimToErb(slim);
      // Should still attempt to convert, even with invalid class names
      expect(result).toContain('class="');
      expect(result).toContain('Content');
    });
  });

  describe('Special Characters', () => {
    it('should handle special characters in content', () => {
      const slim = `p This & that < > " '`;
      
      const result = convertSlimToErb(slim);
      expect(result).toBe('<p>This & that < > " \'</p>');
    });

    it('should handle special characters in attributes', () => {
      const slim = `a href="/path?foo=bar&baz=qux" Link`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('href="/path?foo=bar&baz=qux"');
    });

    it('should handle Unicode characters', () => {
      const slim = `p 你好世界 🌍 émojis`;
      
      const result = convertSlimToErb(slim);
      expect(result).toBe('<p>你好世界 🌍 émojis</p>');
    });
  });

  describe('Complex Attribute Cases', () => {
    it('should handle attributes with equals signs in values', () => {
      const slim = `div data-config="key=value" Content`;
      
      const result = convertSlimToErb(slim);
      expect(result).toBe('<div data-config="key=value">Content</div>');
    });

    it('should handle boolean attributes', () => {
      const slim = `input type="checkbox" checked disabled`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('checked');
      expect(result).toContain('disabled');
    });

    it('should handle attributes with single quotes', () => {
      const slim = `div title='It\\'s a test' Content`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('title=');
      expect(result).toContain('Content');
    });
  });

  describe('Ruby Code Edge Cases', () => {
    it('should handle Ruby interpolation in text', () => {
      const slim = `p Text with #{@variable} interpolation`;
      
      const result = convertSlimToErb(slim);
      expect(result).toBe('<p>Text with #{@variable} interpolation</p>');
    });

    it('should handle complex Ruby expressions', () => {
      const slim = `= link_to "Home", root_path, class: "btn", data: { confirm: "Sure?" }`;
      
      const result = convertSlimToErb(slim);
      expect(result).toBe('<%= link_to "Home", root_path, class: "btn", data: { confirm: "Sure?" } %>');
    });

    it('should handle nested Ruby blocks', () => {
      const slim = `- @items.each do |item|
  - if item.visible?
    p= item.name`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('<% @items.each do |item| %>');
      expect(result).toContain('<% if item.visible? %>');
      expect(result).toContain('<%= item.name %>');
    });
  });

  describe('Line Continuation Cases', () => {
    it('should handle long attribute lists', () => {
      const slim = `a href="/path" \
  class="btn btn-primary" \
  data-toggle="modal" \
  Link Text`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('href="/path"');
      expect(result).toContain('class="btn btn-primary"');
      expect(result).toContain('data-toggle="modal"');
    });

    it('should handle pipe text blocks', () => {
      const slim = `p
  | This is a long
  | paragraph that spans
  | multiple lines`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('This is a long');
      expect(result).toContain('paragraph that spans');
      expect(result).toContain('multiple lines');
    });
  });

  describe('Nested Structure Edge Cases', () => {
    it('should handle deeply nested structures', () => {
      const slim = `.level1
  .level2
    .level3
      .level4
        .level5
          p Deep content`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('<div class="level1">');
      expect(result).toContain('<div class="level5">');
      expect(result).toContain('<p>Deep content</p>');
      
      // Check proper nesting
      const level5Index = result.indexOf('class="level5"');
      const contentIndex = result.indexOf('Deep content');
      expect(level5Index).toBeLessThan(contentIndex);
    });

    it('should handle siblings after nested content', () => {
      const slim = `.parent
  .child1
    p Nested
  .child2
    p Sibling`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('<div class="child1">');
      expect(result).toContain('<div class="child2">');
      expect(result).toContain('<p>Nested</p>');
      expect(result).toContain('<p>Sibling</p>');
    });
  });

  describe('Mixed Content Types', () => {
    it('should handle inline HTML', () => {
      const slim = `div
  <p>This is inline HTML</p>
  span Regular Slim`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('<p>This is inline HTML</p>');
      expect(result).toContain('<span>Regular Slim</span>');
    });

    it('should handle JavaScript blocks', () => {
      const slim = `javascript:
  console.log('Hello');
  alert('World');`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('<script>');
      expect(result).toContain('console.log');
    });

    it('should handle CSS blocks', () => {
      const slim = `css:
  .class { color: red; }
  #id { background: blue; }`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('<style>');
      expect(result).toContain('.class { color: red; }');
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle very long lines', () => {
      const longText = 'a'.repeat(1000);
      const slim = `p ${longText}`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain(longText);
    });

    it('should handle many siblings', () => {
      const lines = [];
      for (let i = 0; i < 100; i++) {
        lines.push(`p Paragraph ${i}`);
      }
      const slim = lines.join('\n');
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('<p>Paragraph 0</p>');
      expect(result).toContain('<p>Paragraph 99</p>');
    });
  });

  describe('Error Recovery', () => {
    it('should recover from parsing errors and continue', () => {
      const slim = `div
  p Valid
  !!!invalid syntax!!!
  p Also valid`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('<p>Valid</p>');
      expect(result).toContain('<p>Also valid</p>');
    });

    it('should handle missing closing tags gracefully', () => {
      const slim = `div
  p Start
    span Nested
  / Missing closing for span
p Outside`;
      
      const result = convertSlimToErb(slim);
      expect(result).toContain('<div>');
      expect(result).toContain('<p>Start</p>');
      expect(result).toContain('<p>Outside</p>');
    });
  });
});