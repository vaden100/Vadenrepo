import { PDFDocument, PDFName } from 'pdf-lib';

/**
 * Removes document metadata (author, creator, producer, XMP) from a PDF (SPEC 6). Encrypted
 * or unreadable PDFs are rejected rather than stored as-is.
 */
export async function cleanPdf(input: Uint8Array): Promise<{ data: Uint8Array; pages: number }> {
  const doc = await PDFDocument.load(input, { updateMetadata: false });
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setCreator('');
  doc.setProducer('');
  doc.catalog.delete(PDFName.of('Metadata'));
  const info = doc.context.trailerInfo.Info;
  if (info) doc.context.delete(info as never);
  doc.context.trailerInfo.Info = undefined;
  const data = await doc.save({ useObjectStreams: true, updateFieldAppearances: false });
  return { data, pages: doc.getPageCount() };
}
