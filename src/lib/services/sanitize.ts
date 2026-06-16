// Sanitização de texto partilhada pelos serviços de marketplace.

/** Oculta números de telefone moçambicanos em texto livre (descrições de anúncios). */
export const scrubPhoneNumbers = (text: string): string => {
  if (!text) return text;
  return text.replace(
    /(?:84|82|83|85|86|87)\s?\d{3}\s?\d{4}|\+258\s?\d{2}\s?\d{3}\s?\d{4}/g,
    '[CONTACTO OCULTO]'
  );
};
