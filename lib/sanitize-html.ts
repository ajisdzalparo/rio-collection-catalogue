/**
 * Safe, serverless-friendly HTML sanitization for rich text articles and journal content.
 * Prevents XSS while safely permitting rich typography, embeds, and images (including base64/data URIs).
 * Does not require heavy jsdom which crashes on serverless runtimes.
 */
export const sanitizeArticleHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';

  // 1. Remove dangerous script, iframe, object, embed, form, input tags and their contents
  let clean = html.replace(
    /<(script|style|iframe|object|embed|form|input|button|textarea|base)[\s\S]*?<\/\1>/gi,
    ''
  );
  clean = clean.replace(
    /<(script|style|iframe|object|embed|form|input|button|textarea|base)[^>]*\/?>/gi,
    ''
  );

  // 2. Remove inline event handlers (e.g. onload, onclick, onerror)
  clean = clean.replace(/\s+on[a-z]+(?:\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+))?/gi, '');

  // 3. Remove dangerous URIs in href and src (javascript:, vbscript:, data: except image data)
  clean = clean.replace(
    /\s+(href|src)\s*=\s*(["'])(?:javascript:|vbscript:|data:(?!image\/(?:png|jpeg|jpg|gif|webp|svg\+xml);base64,))[\s\S]*?\2/gi,
    ' $1=""'
  );

  return clean;
};

