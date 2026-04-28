/*
  Announcement Media Utilities
  ────────────────────────────────────────────────────────────
  Backend constraints:
    • annonces-upload middleware only accepts pdf/image/doc.
    • Schema has no dedicated youtube field.
  Convention: YouTube / video URLs are embedded anywhere in the
  announcement `contenu`. We extract them on render.
*/

const YOUTUBE_REGEX =
  /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&][^\s)]*)?/i;

const VIDEO_EXT_REGEX = /\.(mp4|webm|ogg|ogv|mov|m4v)(?:\?|#|$)/i;
const IMAGE_EXT_REGEX = /\.(png|jpe?g|webp|gif|avif|svg)(?:\?|#|$)/i;

export function extractYouTubeId(text) {
  if (typeof text !== 'string') return null;
  const match = text.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

export function buildYouTubeEmbedUrl(videoId) {
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

export function buildYouTubeThumbnailUrl(videoId) {
  if (!videoId) return null;
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Strips the raw YouTube URL out of content so it doesn't render as text. */
export function stripYouTubeUrl(content) {
  if (typeof content !== 'string') return '';
  return content.replace(YOUTUBE_REGEX, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Classifies an AnnonceDocument into a display kind.
 * The backend `type` field is "pdf" | "image" | "doc" | "autre" (no video);
 * we additionally sniff the file extension to support future video uploads
 * if the backend ever accepts them.
 */
export function classifyAttachment(doc) {
  if (!doc?.fichier) return null;
  const url = String(doc.fichier);
  const type = String(doc.type || '').toLowerCase();

  if (VIDEO_EXT_REGEX.test(url)) return 'video';
  if (type === 'image' || IMAGE_EXT_REGEX.test(url)) return 'image';
  if (type === 'pdf' || /\.pdf(?:\?|#|$)/i.test(url)) return 'pdf';
  if (type === 'doc' || /\.(doc|docx)(?:\?|#|$)/i.test(url)) return 'doc';
  return 'file';
}

/**
 * Returns the "primary media" to render in a card:
 *   { kind: 'youtube',  youtubeId, embedUrl, thumbnailUrl }
 *   { kind: 'video',    url }
 *   { kind: 'image',    url }
 *   { kind: 'pdf'|'doc'|'file', url, label }
 *   null
 *
 * Resolution order:
 *   1. YouTube URL detected in `content` text
 *   2. AnnonceMedia entries (future schema support)
 *   3. First attached document
 */
export function resolvePrimaryMedia(item, { resolveMediaUrl }) {
  if (!item) return null;

  const contentText =
    (typeof item.contenu_en === 'string' && item.contenu_en) ||
    (typeof item.contenu_ar === 'string' && item.contenu_ar) ||
    '';

  const ytId = extractYouTubeId(contentText) || extractYouTubeId(item?.contenu);
  if (ytId) {
    return {
      kind: 'youtube',
      youtubeId: ytId,
      embedUrl: buildYouTubeEmbedUrl(ytId),
      thumbnailUrl: buildYouTubeThumbnailUrl(ytId),
    };
  }

  const mediaEntries = Array.isArray(item.media) ? item.media : [];
  for (const media of mediaEntries) {
    const kind = String(media?.type || '').toLowerCase();
    if (kind === 'youtube' && media.url) {
      const id = extractYouTubeId(media.url);
      if (id) {
        return {
          kind: 'youtube',
          youtubeId: id,
          embedUrl: buildYouTubeEmbedUrl(id),
          thumbnailUrl: buildYouTubeThumbnailUrl(id),
        };
      }
    }
    if (kind === 'video' && media.url) {
      return { kind: 'video', url: resolveMediaUrl(media.url) };
    }
    if (kind === 'image' && media.url) {
      return { kind: 'image', url: resolveMediaUrl(media.url) };
    }
  }

  const doc = Array.isArray(item.documents) ? item.documents[0] : null;
  const kind = classifyAttachment(doc);
  if (!kind) return null;

  const url = resolveMediaUrl(doc.fichier);
  const label = doc.fichier.split('/').pop() || 'Attachment';
  return { kind, url, label };
}

/**
 * Build the `contenu` payload when an admin provides a YouTube URL.
 * Appends the URL on its own line so the backend sees a normal string
 * and the frontend still detects it for embedding.
 */
export function embedYouTubeInContent(content, youtubeUrl) {
  const body = typeof content === 'string' ? content.trim() : '';
  const link = typeof youtubeUrl === 'string' ? youtubeUrl.trim() : '';
  if (!link) return body;
  if (body.includes(link)) return body;
  return body ? `${body}\n\n${link}` : link;
}
