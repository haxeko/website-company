/**
 * How visitors reach VILLA NEST.
 *
 * ★ zalo — the phone number (e.g. '0901234567') or Zalo Official Account id that the Zalo
 *   button at the bottom right of every page opens a chat with (https://zalo.me/<zalo>).
 *   Left empty, the button opens Zalo's own site.
 */
export const contact = {
  zalo: '0981584328',
}

/** Where the Zalo button leads (spaces in a phone number are dropped). */
export const zaloHref = contact.zalo ? `https://zalo.me/${encodeURIComponent(contact.zalo.replace(/\s+/g, ''))}` : 'https://zalo.me/'
