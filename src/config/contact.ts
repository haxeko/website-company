/**
 * How visitors reach VILLA NEST.
 *
 * ★ zalo — the phone number (e.g. '0901234567') or Zalo Official Account id that the Zalo
 *   button at the bottom right of every page opens a chat with (https://zalo.me/<zalo>).
 *   Left empty, the button opens Zalo's own site.
 * ★ whatsapp — the phone number, with its country code (e.g. '+84 977 177 497'), that the
 *   WhatsApp button over the Zalo button opens a chat with (https://wa.me/<digits>). Left
 *   empty, there is no WhatsApp button.
 */
export const contact = {
  zalo: '0981584328',
  whatsapp: '+84977177497',
}

/** Where the Zalo button leads (spaces in a phone number are dropped). */
export const zaloHref = contact.zalo ? `https://zalo.me/${encodeURIComponent(contact.zalo.replace(/\s+/g, ''))}` : 'https://zalo.me/'

/** Where the WhatsApp button leads (the number's digits only, as wa.me asks; '' : no button). */
export const whatsappHref = contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D+/g, '')}` : ''
