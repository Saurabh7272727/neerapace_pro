import sanitizeHtml from "sanitize-html";

const richOptions = {
  allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li", "h2", "h3", "a"],
  allowedAttributes: { a: ["href"] },
  allowedSchemes: ["http", "https", "mailto"],
};

export function sanitizeRichText(value = "") {
  return sanitizeHtml(String(value), richOptions);
}

export function sanitizePlain(value = "") {
  return sanitizeHtml(String(value), { allowedTags: [], allowedAttributes: {} }).trim();
}
