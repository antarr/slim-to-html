import { SlimParser } from '../../parser/slimParser';

describe('SlimParser', () => {
  let parser: SlimParser;

  beforeEach(() => {
    parser = new SlimParser();
  });

  describe('basic tag parsing', () => {
    it('should parse simple div tag', () => {
      const result = parser.parse('div');
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        type: 'tag',
        tagName: 'div',
        indentLevel: 0
      });
    });

    it('should parse tag with text content', () => {
      const result = parser.parse('p Hello World');
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        type: 'tag',
        tagName: 'p',
        indentLevel: 0
      });
      expect(result.nodes[0].children).toHaveLength(1);
      expect(result.nodes[0].children![0]).toMatchObject({
        type: 'text',
        content: 'Hello World'
      });
    });
  });

  describe('shortcut parsing', () => {
    it('should parse class shortcuts', () => {
      const result = parser.parse('div.container');
      expect(result.nodes[0]).toMatchObject({
        type: 'tag',
        tagName: 'div',
        attributes: { class: 'container' }
      });
    });

    it('should parse id shortcuts', () => {
      const result = parser.parse('div#main');
      expect(result.nodes[0]).toMatchObject({
        type: 'tag',
        tagName: 'div',
        attributes: { id: 'main' }
      });
    });

    it('should parse combined class and id shortcuts', () => {
      const result = parser.parse('div.container#main');
      expect(result.nodes[0]).toMatchObject({
        type: 'tag',
        tagName: 'div',
        attributes: { 
          class: 'container',
          id: 'main'
        }
      });
    });

    it('should parse multiple classes', () => {
      const result = parser.parse('div.container.fluid.large');
      expect(result.nodes[0]).toMatchObject({
        type: 'tag',
        tagName: 'div',
        attributes: { class: 'container fluid large' }
      });
    });
  });

  describe('ruby code parsing', () => {
    it('should parse ruby output expressions', () => {
      const result = parser.parse('= @user.name');
      expect(result.nodes[0]).toMatchObject({
        type: 'ruby_output',
        content: '@user.name'
      });
    });

    it('should parse ruby code blocks', () => {
      const result = parser.parse('- if logged_in?');
      expect(result.nodes[0]).toMatchObject({
        type: 'ruby_code',
        content: 'if logged_in?'
      });
    });

    it('should parse inline ruby output in tags', () => {
      const result = parser.parse('p= @user.name');
      expect(result.nodes[0]).toMatchObject({
        type: 'tag',
        tagName: 'p'
      });
      expect(result.nodes[0].children![0]).toMatchObject({
        type: 'ruby_output',
        content: '@user.name'
      });
    });
  });

  describe('comment parsing', () => {
    it('should parse HTML comments', () => {
      const result = parser.parse('/ This is a comment');
      expect(result.nodes[0]).toMatchObject({
        type: 'comment',
        content: 'This is a comment'
      });
    });
  });

  describe('attribute parsing', () => {
    it.skip('should parse explicit attributes', () => {
      const result = parser.parse('a href="/path" data-id="123" Link Text');
      expect(result.nodes[0]).toMatchObject({
        type: 'tag',
        tagName: 'a',
        attributes: {
          href: '/path',
          'data-id': '123'
        }
      });
    });

    it.skip('should combine shortcuts with explicit attributes', () => {
      const result = parser.parse('div.container href="/path" Test');
      expect(result.nodes[0]).toMatchObject({
        type: 'tag',
        tagName: 'div',
        attributes: {
          class: 'container',
          href: '/path'
        }
      });
    });
  });

  describe('indentation handling', () => {
    it('should track indentation levels', () => {
      const content = `div
  p Hello
    span World`;
      
      const result = parser.parse(content);
      expect(result.nodes).toHaveLength(3);
      expect(result.nodes[0].indentLevel).toBe(0);
      expect(result.nodes[1].indentLevel).toBe(2);
      expect(result.nodes[2].indentLevel).toBe(4);
    });
  });

  describe('complex scenarios', () => {
    it('should parse a realistic slim template', () => {
      const content = `doctype html
html
  head
    title My App
  body.container
    h1.header= @page_title
    - if @user
      p.welcome= "Welcome, #{@user.name}"
    - else
      p Please log in`;

      const result = parser.parse(content);
      expect(result.nodes).toHaveLength(10);
      expect(result.errors).toHaveLength(0);
      
      // Check doctype
      expect(result.nodes[0].type).toBe('doctype');
      
      // Check that we have the right structure
      expect(result.nodes.filter(n => n.type === 'tag')).toHaveLength(7);
      expect(result.nodes.filter(n => n.type === 'ruby_code')).toHaveLength(2);
      expect(result.nodes.filter(n => n.type === 'ruby_output')).toHaveLength(0); // They're inline in tags now
    });
  });
});