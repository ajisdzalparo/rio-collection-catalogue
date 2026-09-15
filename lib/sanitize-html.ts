import DOMPurify from 'isomorphic-dompurify';

/**
 * Strict HTML sanitization for rich text articles and journal content.
 * Prevents XSS while safely permitting rich typography, embeds, and images (including base64/data URIs).
 */
export const sanitizeArticleHtml = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'h2',
      'h3',
      'h4',
      'blockquote',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      's',
      'u',
      'a',
      'img',
      'figure',
      'figcaption',
      'hr',
      'br',
      'code',
      'pre',
      'span',
      'div'
    ],
    ALLOWED_ATTR: [
      'href',
      'target',
      'rel',
      'src',
      'alt',
      'title',
      'class',
      'style',
      'width',
      'height',
      'loading',
      'contenteditable',
      'data-alignment'
    ],
    ALLOW_DATA_ATTR: true,
    ADD_ATTR: ['target'],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$)|data:image\/(?:png|jpeg|jpg|gif|webp|svg\+xml);base64,|blob:)/i
  });
};
