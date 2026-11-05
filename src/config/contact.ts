/**
 * How visitors reach VILLA NEST: the chat button at the bottom right of every page opens these
 * three, one above another (one left empty is not offered).
 *
 * ★ facebook — the address of VILLA NEST's Facebook page (e.g. 'https://www.facebook.com/villanest'),
 *   or its Messenger link to open a chat at once ('https://m.me/villanest'). For now Facebook's own
 *   site: put the page's address here once there is one.
 * ★ whatsapp — the phone number, with its country code (e.g. '+84 977 177 497'): a WhatsApp chat
 *   with it (https://wa.me/<digits>).
 * ★ zalo — the phone number (e.g. '0901234567') or Zalo Official Account id: a Zalo chat with it
 *   (https://zalo.me/<zalo>).
 */
export const contact = {
  facebook: 'https://www.facebook.com/',
  whatsapp: '+84977177497',
  zalo: '0981584328',
}

/** Where the Facebook button leads ('' : no Facebook button). */
export const facebookHref = contact.facebook.trim()

/** Where the Zalo button leads (spaces in a phone number are dropped; '' : no Zalo button). */
export const zaloHref = contact.zalo ? `https://zalo.me/${encodeURIComponent(contact.zalo.replace(/\s+/g, ''))}` : ''

/** Where the WhatsApp button leads (the number's digits only, as wa.me asks; '' : no WhatsApp button). */
export const whatsappHref = contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D+/g, '')}` : ''
