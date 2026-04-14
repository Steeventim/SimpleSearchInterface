declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer): Promise<PDFData>;

  export = pdfParse;
}</content>
<parameter name="filePath">c:\Users\laure\Desktop\SimpleSearchInterface\SimpleSearchInterface\types\pdf-parse.d.ts