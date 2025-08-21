import * as fs from 'fs';
import * as path from 'path';
import { SlimParser } from '../../parser/slimParser';
import { ErbGenerator } from '../../parser/erbGenerator';

describe('End-to-end Slim to ERB Conversion', () => {
  const parser = new SlimParser();
  const generator = new ErbGenerator();

  const convertSlimToErb = (slimContent: string): string => {
    const parsed = parser.parse(slimContent);
    return generator.generate(parsed.nodes);
  };

  describe('Basic HTML Conversion', () => {
    it('should convert basic HTML structure', () => {
      const slim = `doctype html
html
  head
    title Test Page
  body
    h1 Welcome
    p This is a test`;

      const expected = `<!DOCTYPE html>
<html>
  <head>
    <title>Test Page</title>
  </head>
  <body>
    <h1>Welcome</h1>
    <p>This is a test</p>
  </body>
</html>`;

      expect(convertSlimToErb(slim)).toBe(expected);
    });

    it('should handle nested divs with classes and IDs', () => {
      const slim = `.container
  #header
    h1.title Main Title
  .content
    p.text Some content here`;

      const expected = `<div class="container">
  <div id="header">
    <h1 class="title">Main Title</h1>
  </div>
  <div class="content">
    <p class="text">Some content here</p>
  </div>
</div>`;

      expect(convertSlimToErb(slim)).toBe(expected);
    });
  });

  describe('Ruby Code Conversion', () => {
    it('should convert Ruby output statements', () => {
      const slim = `div
  p= @user.name
  span= current_time`;

      const expected = `<div>
  <p><%= @user.name %></p>
  <span><%= current_time %></span>
</div>`;

      expect(convertSlimToErb(slim)).toBe(expected);
    });

    it('should convert Ruby control flow', () => {
      const slim = `- if @user.logged_in?
  p Welcome back!
- else
  p Please log in`;

      const expected = `<% if @user.logged_in? %>
  <p>Welcome back!</p>
<% else %>
  <p>Please log in</p>
<% end %>`;

      expect(convertSlimToErb(slim)).toBe(expected);
    });

    it('should handle Ruby loops', () => {
      const slim = `ul
  - @items.each do |item|
    li= item.name`;

      const expected = `<ul>
  <% @items.each do |item| %>
    <li><%= item.name %></li>
  <% end %>
</ul>`;

      expect(convertSlimToErb(slim)).toBe(expected);
    });
  });

  describe('Attributes Conversion', () => {
    it('should convert HTML attributes', () => {
      const slim = `a href="/path" target="_blank" Link Text
img src="/image.jpg" alt="Description"
input type="text" name="username" required=true`;

      const expected = `<a href="/path" target="_blank">Link Text</a>
<img src="/image.jpg" alt="Description">
<input type="text" name="username" required="true">`;

      expect(convertSlimToErb(slim)).toBe(expected);
    });

    it('should handle data attributes', () => {
      const slim = `div data-id="123" data-name="test" Content`;

      const expected = `<div data-id="123" data-name="test">Content</div>`;

      expect(convertSlimToErb(slim)).toBe(expected);
    });

    it('should merge class attributes with shortcuts', () => {
      const slim = `div.existing class="additional" Content`;

      const expected = `<div class="existing additional">Content</div>`;

      expect(convertSlimToErb(slim)).toBe(expected);
    });
  });

  describe('Comments Conversion', () => {
    it('should handle regular comments', () => {
      const slim = `/ This is a comment
div
  / Another comment
  p Content`;

      const expected = `<!-- This is a comment -->
<div>
  <!-- Another comment -->
  <p>Content</p>
</div>`;

      expect(convertSlimToErb(slim)).toBe(expected);
    });

    it('should handle HTML comments', () => {
      const slim = `/! This will appear in HTML
div Content`;

      const expected = `<!-- This will appear in HTML -->
<div>Content</div>`;

      expect(convertSlimToErb(slim)).toBe(expected);
    });
  });

  describe('Complex Nested Structures', () => {
    it('should handle complex nested forms', () => {
      const slim = `form action="/submit" method="post"
  .form-group
    label for="email" Email
    input#email type="email" name="email"
  .form-group
    label for="password" Password
    input#password type="password" name="password"
  button.btn.btn-primary type="submit" Submit`;

      const expected = `<form action="/submit" method="post">
  <div class="form-group">
    <label for="email">Email</label>
    <input id="email" type="email" name="email">
  </div>
  <div class="form-group">
    <label for="password">Password</label>
    <input id="password" type="password" name="password">
  </div>
  <button class="btn btn-primary" type="submit">Submit</button>
</form>`;

      expect(convertSlimToErb(slim)).toBe(expected);
    });

    it('should handle mixed content with Ruby', () => {
      const slim = `.wrapper
  header
    nav
      - if @user
        span= @user.name
        a href="/logout" Logout
      - else
        a href="/login" Login
  main
    - @posts.each do |post|
      article.post
        h2= post.title
        p= post.summary`;

      const expected = `<div class="wrapper">
  <header>
    <nav>
      <% if @user %>
        <span><%= @user.name %></span>
        <a href="/logout">Logout</a>
      <% else %>
        <a href="/login">Login</a>
      <% end %>
    </nav>
  </header>
  <main>
    <% @posts.each do |post| %>
      <article class="post">
        <h2><%= post.title %></h2>
        <p><%= post.summary %></p>
      </article>
    <% end %>
  </main>
</div>`;

      expect(convertSlimToErb(slim)).toBe(expected);
    });
  });

  describe('File-based Integration Tests', () => {
    const fixturesDir = path.join(__dirname, '../fixtures/slim');
    
    it('should convert basic.slim fixture correctly', () => {
      const slimPath = path.join(fixturesDir, 'basic.slim');
      if (fs.existsSync(slimPath)) {
        const slimContent = fs.readFileSync(slimPath, 'utf8');
        const result = convertSlimToErb(slimContent);
        
        expect(result).toContain('<!DOCTYPE html>');
        expect(result).toContain('<title>Test Page</title>');
        expect(result).toContain('<h1 class="main-title">Welcome</h1>');
        expect(result).toContain('<div class="container">');
        expect(result).toContain('<div id="unique-id">A div with an ID</div>');
      }
    });

    it('should convert ruby-code.slim fixture correctly', () => {
      const slimPath = path.join(fixturesDir, 'ruby-code.slim');
      if (fs.existsSync(slimPath)) {
        const slimContent = fs.readFileSync(slimPath, 'utf8');
        const result = convertSlimToErb(slimContent);
        
        expect(result).toContain('<% if @user.logged_in? %>');
        expect(result).toContain('<%= @user.name %>');
        expect(result).toContain('<% @items.each do |item| %>');
        expect(result).toContain('<%= item.name %>');
        expect(result).toContain('<% end %>');
      }
    });

    it('should convert attributes.slim fixture correctly', () => {
      const slimPath = path.join(fixturesDir, 'attributes.slim');
      if (fs.existsSync(slimPath)) {
        const slimContent = fs.readFileSync(slimPath, 'utf8');
        const result = convertSlimToErb(slimContent);
        
        expect(result).toContain('<form action="/submit" method="post">');
        expect(result).toContain('<input type="text" name="username" placeholder="Enter username">');
        expect(result).toContain('data-id="123"');
        expect(result).toContain('target="_blank"');
      }
    });
  });
});