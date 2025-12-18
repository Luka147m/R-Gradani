import * as cheerio from 'cheerio';
import { decode } from 'html-entities';

export function cleanText(text?: string): string {
    if (!text) return '';
    const replacements: Record<string, string> = {
        '\u2013': '-', '\u2014': '-',
        '\u2212': '-', '\u2018': "'",
        '\u2019': "'", '\u201C': '"',
        '\u201D': '"', '\u2026': '...',
        '\u00A0': ' ', '\u200B': ''
    };
    for (const [bad, good] of Object.entries(replacements)) {
        text = text.replace(new RegExp(bad, 'g'), good);
    }
    text = text.replace(/[\u2000-\u200F\u202A-\u202F\u205F\u3000]/g, ' ');
    text = text.replace(/\s+/g, ' ');
    return text.trim();
}

export function cleanHtml(txt: string): string {
    if (!txt) return '';

    const $ = cheerio.load(decode(txt), null, false);

    $('script, style, noscript, img').remove();

    $('*').contents().each((_, elem) => {
        if (elem.type === 'text' && elem.data) {
            $(elem).replaceWith(cleanText(elem.data));
        }
    });

    $('*').each(function () {
        if ('attribs' in this) {
            this.attribs = {};
        }
    });

    return $.html();
}