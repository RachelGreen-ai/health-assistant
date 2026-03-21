const MAX_NOTE_LENGTH = 4000; // chars — keeps context window manageable
function stripMarkup(text) {
    return text
        .replace(/<[^>]+>/g, ' ') // strip XML/HTML tags
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/\s{2,}/g, ' ') // collapse whitespace
        .replace(/\n{3,}/g, '\n\n') // max 2 blank lines
        .trim();
}
export function parseDocument(docRef, rawText) {
    const type = docRef.type?.text
        ?? docRef.type?.coding?.[0]?.display
        ?? 'Clinical Note';
    const date = docRef.date
        ?? docRef.context?.period?.start
        ?? 'Unknown date';
    const provider = docRef.author?.[0]?.display;
    let text = stripMarkup(rawText);
    if (text.length > MAX_NOTE_LENGTH) {
        text = text.slice(0, MAX_NOTE_LENGTH) + '\n\n[Note truncated for length]';
    }
    return { type, date, provider, text };
}
//# sourceMappingURL=document.js.map