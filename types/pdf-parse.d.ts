declare module "pdf-parse" {
  interface PDFInfo {
    PDFFormatVersion?: string
    IsAcroFormPresent?: boolean
    IsXFAPresent?: boolean
    Producer?: string
    Creator?: string
    Author?: string
    Title?: string
    CreationDate?: string
    ModDate?: string
    Pages?: number
  }

  interface PDFMetadata {
    _: string
    [key: string]: any
  }

  interface PDFParseResult {
    numpages: number
    numrender: number
    info: PDFInfo
    metadata?: PDFMetadata
    text: string
    version?: string
  }

  function pdf(buffer: Buffer | Uint8Array | ArrayBuffer, options?: any): Promise<PDFParseResult>
  export = pdf
}
