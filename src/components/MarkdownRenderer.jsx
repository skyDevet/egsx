// ============================================================
// MarkdownRenderer.jsx - Renders Markdown with syntax highlighting
// ============================================================

import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

// Configure marked with syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        return code;
      }
    }
    return code;
  },
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false
});

// Custom renderer for AGIG-specific elements
const renderer = new marked.Renderer();

// Custom link rendering - opens in new tab
renderer.link = function(href, title, text) {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${title || ''}">${text}</a>`;
};

// Custom image rendering with lazy loading
renderer.image = function(href, title, text) {
  return `<img src="${href}" alt="${text || ''}" title="${title || ''}" class="markdown-image" loading="lazy" />`;
};

// Custom table rendering with responsive wrapper
renderer.table = function(header, body) {
  return `<div class="table-wrapper"><table>${header}${body}</table></div>`;
};

// Custom code block with copy button
renderer.code = function(code, lang) {
  const highlighted = lang && hljs.getLanguage(lang) 
    ? hljs.highlight(code, { language: lang }).value 
    : code;
  
  return `
    <div class="code-block-wrapper">
      ${lang ? `<div class="code-language">${lang}</div>` : ''}
      <pre><code class="hljs ${lang || ''}">${highlighted}</code></pre>
      <button class="copy-code-btn" onclick="navigator.clipboard.writeText(\`${code.replace(/`/g, '\\`')}\`)">
        📋 Copy
      </button>
    </div>
  `;
};

marked.use({ renderer });

export function MarkdownRenderer({ content, className = '' }) {
  // If content is empty, return empty
  if (!content) return null;
  
  // If content is already HTML (from nlpProcessor), render as HTML
  if (typeof content === 'string' && content.trim().startsWith('<')) {
    return (
      <div 
        className={`markdown-content ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  
  // Otherwise, render as markdown
  try {
    const html = marked.parse(content.toString() || '');
    return (
      <div 
        className={`markdown-content ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (error) {
    console.error('Markdown parsing error:', error);
    return <div className="markdown-content markdown-error">{content}</div>;
  }
}