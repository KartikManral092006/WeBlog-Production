export function htmlToPlainText(content: string): string {
  if (!content) {
    return "";
  }

  const withoutTags = content
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ");

  const decoded = withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  return decoded.replace(/\s+/g, " ").trim();
}

export function getExcerptFromHtml(content: string, size = 160): string {
  const plain = htmlToPlainText(content);
  if (plain.length <= size) {
    return plain;
  }
  return `${plain.slice(0, size)}...`;
}
