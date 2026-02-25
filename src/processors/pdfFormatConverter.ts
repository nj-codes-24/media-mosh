/**
 * Real Client-Side File Format Converter
 *
 * Converts between PDF, DOCX, XLSX, PPTX using:
 * - pdfjs-dist  → extract text from PDF with Y-coordinate line reconstruction
 * - pdf-lib     → create PDF output
 * - jszip       → build / read Office Open XML packages with DEFLATE
 */

/* ─── helpers ────────────────────────────────────────────────────────────────*/

/** * Escape a string for embedding in XML character data.
 * CRITICAL FIX: Strips all invisible ASCII control characters that corrupt Office XML parsers.
 */
const xmlEsc = (s: string): string =>
  s
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') 
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Load JSZip safely regardless of whether the bundler exposes it as
 * module.default (ESM interop) or directly as the module (CJS).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadJSZip(): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = (await import('jszip')) as any;
  return typeof mod.default === 'function' ? mod.default : mod;
}

/* ─── text extraction ────────────────────────────────────────────────────────*/

async function extractTextFromPdf(file: File): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawMod = (await import('pdfjs-dist')) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib: any = rawMod.default ?? rawMod;

  const version: string = pdfjsLib.version ?? '4.0.379';
  const workerExt = version.startsWith('4') ? 'mjs' : 'js';
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.${workerExt}`;

  const data = await file.arrayBuffer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf: any = await pdfjsLib.getDocument({ data }).promise;

  const lines: string[] = [];
  
  for (let i = 1; i <= (pdf.numPages as number); i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page: any = await pdf.getPage(i);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any = await page.getTextContent();
    
    // Group text items by Y coordinate to reconstruct proper lines
    const yGroups = new Map<number, { x: number; str: string }[]>();
    
    for (const item of content.items) {
      if (!item.str || item.str.trim() === '') continue;
      // Round Y to nearest 5 to group slightly misaligned text onto the same line
      const y = item.transform ? Math.round(item.transform[5] / 5) * 5 : 0;
      const x = item.transform ? item.transform[4] : 0;
      
      if (!yGroups.has(y)) yGroups.set(y, []);
      yGroups.get(y)!.push({ x, str: item.str });
    }
    
    // PDF Y-coordinates go bottom-up, so sort descending
    const sortedYs = Array.from(yGroups.keys()).sort((a, b) => b - a);
    
    for (const y of sortedYs) {
      const rowItems = yGroups.get(y)!;
      rowItems.sort((a, b) => a.x - b.x); // Sort left-to-right
      const lineStr = rowItems.map(item => item.str).join(' ').trim();
      if (lineStr) lines.push(lineStr);
    }
  }
  return lines;
}

/** Pull all XML text-run content out of an Office XML fragment. */
function extractXmlText(xml: string): string {
  const matches: string[] =
    xml.match(/<(?:[a-z]+:)?t(?:\s[^>]*)?>([^<]*)<\/(?:[a-z]+:)?t>/g) ?? [];
  return matches
    .map((m) => m.replace(/<[^>]+>/g, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractTextFromOffice(file: File): Promise<string[]> {
  const JSZip = await loadJSZip();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zip: any = await JSZip.loadAsync(await file.arrayBuffer());
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  const nodes: string[] = [];

  if (ext === 'docx') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: string = (await (zip.file('word/document.xml') as any)?.async('text')) ?? '';
    for (const p of raw.split(/<w:p[ >]/)) {
      const t = extractXmlText(p).trim();
      if (t) nodes.push(t);
    }
  } else if (ext === 'xlsx') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sharedRaw: string =
      (await (zip.file('xl/sharedStrings.xml') as any)?.async('text')) ?? '';
    const sharedStrings: string[] = [];
    for (const si of sharedRaw.match(/<si>[\s\S]*?<\/si>/g) ?? []) {
      const t = extractXmlText(si).trim();
      if (t) sharedStrings.push(t);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sheetKeys = Object.keys(zip.files as Record<string, any>).filter((k) =>
      /xl\/worksheets\/sheet\d+\.xml/.test(k),
    );
    for (const sf of sheetKeys) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sheetRaw: string = (await (zip.file(sf) as any)?.async('text')) ?? '';
      for (const row of sheetRaw.match(/<row[^>]*>[\s\S]*?<\/row>/g) ?? []) {
        const vals: string[] = (row.match(/<c[^>]*>[\s\S]*?<\/c>/g) ?? [])
          .map((cell): string => {
            if (cell.includes('t="s"')) {
              const m = cell.match(/<v>(\d+)<\/v>/);
              return m ? (sharedStrings[parseInt(m[1], 10)] ?? '') : '';
            }
            const m = cell.match(/<v>([^<]*)<\/v>/);
            return m ? m[1] : '';
          })
          .filter((v): v is string => v !== '');
        if (vals.length > 0) nodes.push(vals.join('\t'));
      }
    }
  } else if (ext === 'pptx') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slideKeys = Object.keys(zip.files as Record<string, any>)
      .filter((k) => /ppt\/slides\/slide\d+\.xml/.test(k) && !k.includes('_rels'))
      .sort();
    for (const sf of slideKeys) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: string = (await (zip.file(sf) as any)?.async('text')) ?? '';
      for (const p of raw.split(/<a:p[ >]/)) {
        const t = extractXmlText(p).trim();
        if (t) nodes.push(t);
      }
    }
  }

  return nodes.filter((t): t is string => t.length > 0);
}

/* ─── output creators ────────────────────────────────────────────────────────*/

async function createPdf(lines: string[], sourceFileName: string): Promise<Blob> {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

  const doc = await PDFDocument.create();
  const bodyFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN = 50;
  const LINE_H = 16;
  const MAX_W = PAGE_W - MARGIN * 2;
  const docTitle = sourceFileName.replace(/\.[^.]+$/, '');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentPage: any = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const newPage = (): void => {
    currentPage = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrap = (text: string, size: number, font: any): string[] => {
    const words = text.split(' ');
    const out: string[] = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if ((font.widthOfTextAtSize(test, size) as number) > MAX_W) {
        if (line) out.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
    return out.length > 0 ? out : [''];
  };

  if (y < MARGIN + LINE_H) newPage();
  currentPage.drawText(docTitle, {
    x: MARGIN, y, size: 16, font: boldFont,
    color: rgb(0.1, 0.1, 0.1), maxWidth: MAX_W,
  });
  y -= LINE_H * 2;

  for (const line of lines) {
    for (const wl of wrap(line, 11, bodyFont)) {
      if (y < MARGIN + LINE_H) newPage();
      currentPage.drawText(wl, {
        x: MARGIN, y, size: 11, font: bodyFont,
        color: rgb(0.15, 0.15, 0.15), maxWidth: MAX_W,
      });
      y -= LINE_H;
    }
    y -= 4;
  }

  const pdfBytes: Uint8Array = await doc.save();
  return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
}

async function createDocx(lines: string[], sourceFileName: string): Promise<Blob> {
  const JSZip = await loadJSZip();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zip: any = new JSZip();
  const docTitle = sourceFileName.replace(/\.[^.]+$/, '');

  const paraXml = [
    `<w:p>
      <w:pPr><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr>
        <w:t xml:space="preserve">${xmlEsc(docTitle)}</w:t>
      </w:r>
    </w:p>`,
    ...lines.map(
      (l) => `<w:p>
        <w:pPr><w:spacing w:after="120"/></w:pPr>
        <w:r>
          <w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
          <w:t xml:space="preserve">${xmlEsc(l)}</w:t>
        </w:r>
      </w:p>`,
    ),
    `<w:p><w:pPr><w:sectPr/></w:pPr></w:p>`,
  ].join('\n');

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  mc:Ignorable="w14">
  <w:body>${paraXml}</w:body>
</w:document>`;

  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml"
    ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const pkgRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="word/document.xml"/>
</Relationships>`;

  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

  zip.file('[Content_Types].xml', ct);
  zip.file('_rels/.rels', pkgRels);
  zip.file('word/document.xml', docXml);
  zip.file('word/_rels/document.xml.rels', wordRels);

  const MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
  const blob: Blob = await zip.generateAsync({
    type: 'blob',
    mimeType: MIME,
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  return blob;
}

async function createXlsx(lines: string[], sourceFileName: string): Promise<Blob> {
  const JSZip = await loadJSZip();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zip: any = new JSZip();
  const docTitle = sourceFileName.replace(/\.[^.]+$/, '');

  const allRows: string[][] = [[docTitle], ...lines.map((l) => l.split('\t'))];

  const strMap = new Map<string, number>();
  const strList: string[] = [];
  const intern = (s: string): number => {
    const n = strMap.get(s);
    if (n !== undefined) return n;
    const idx = strList.length;
    strMap.set(s, idx);
    strList.push(s);
    return idx;
  };
  for (const row of allRows) for (const cell of row) intern(cell);

  const colLetter = (n: number): string => {
    let s = '';
    let col = n + 1;
    while (col > 0) {
      col -= 1;
      s = String.fromCharCode(65 + (col % 26)) + s;
      col = Math.floor(col / 26);
    }
    return s;
  };

  const rowsXml = allRows
    .map((row, ri) =>
      `    <row r="${ri + 1}">\n` +
      row
        .map((cell, ci) => {
          const ref = `${colLetter(ci)}${ri + 1}`;
          const style = ri === 0 ? ' s="1"' : '';
          return `      <c r="${ref}" t="s"${style}><v>${intern(cell)}</v></c>`;
        })
        .join('\n') +
      `\n    </row>`,
    )
    .join('\n');

  const ssXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
     count="${strList.length}" uniqueCount="${strList.length}">
${strList.map((s) => `  <si><t xml:space="preserve">${xmlEsc(s)}</t></si>`).join('\n')}
</sst>`;

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
           xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;

  const wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`;

  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const pkgRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="xl/workbook.xml"/>
</Relationships>`;

  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
    Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings"
    Target="sharedStrings.xml"/>
  <Relationship Id="rId3"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"
    Target="styles.xml"/>
</Relationships>`;

  zip.file('[Content_Types].xml', ct);
  zip.file('_rels/.rels', pkgRels);
  zip.file('xl/workbook.xml', wbXml);
  zip.file('xl/_rels/workbook.xml.rels', wbRels);
  zip.file('xl/worksheets/sheet1.xml', sheetXml);
  zip.file('xl/sharedStrings.xml', ssXml);
  zip.file('xl/styles.xml', stylesXml);

  const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  
  const blob: Blob = await zip.generateAsync({
    type: 'blob',
    mimeType: MIME,
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  return blob;
}

async function createPptx(lines: string[], sourceFileName: string): Promise<Blob> {
  const JSZip = await loadJSZip();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zip: any = new JSZip();
  const docTitle = sourceFileName.replace(/\.[^.]+$/, '');
  const PER_SLIDE = 8;

  const groups: string[][] = [];
  if (lines.length === 0) {
    groups.push([docTitle]);
  } else {
    for (let i = 0; i < lines.length; i += PER_SLIDE) {
      groups.push(lines.slice(i, i + PER_SLIDE));
    }
  }

  const makeSlide = (slideLines: string[], idx: number): string => {
    const content = idx === 0 ? [docTitle, ...slideLines] : slideLines;
    const body = content
      .map(
        (l) =>
          `          <a:p><a:r><a:rPr lang="en-US" dirty="0" sz="1800"/><a:t>${xmlEsc(l)}</a:t></a:r></a:p>`,
      )
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/><a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="TextBox"/>
          <p:cNvSpPr txBox="1">
            <a:spLocks noGrp="1"/>
          </p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="457200" y="457200"/>
            <a:ext cx="8229600" cy="5486400"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" rtlCol="0">
            <a:normAutofit/>
          </a:bodyPr>
          <a:lstStyle/>
${body}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
  };

  const slideRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout"
    Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;

  const sldIdEntries = groups
    .map((_, i) => `    <p:sldId id="${256 + i}" r:id="rId${2 + i}"/>`)
    .join('\n');

  const presXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  saveSubsetFonts="1">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
${sldIdEntries}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;

  const presRels = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    `  <Relationship Id="rId1"`,
    `    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster"`,
    `    Target="slideMasters/slideMaster1.xml"/>`,
    ...groups.map(
      (_, i) =>
        `  <Relationship Id="rId${2 + i}"\n` +
        `    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide"\n` +
        `    Target="slides/slide${i + 1}.xml"/>`,
    ),
    `</Relationships>`,
  ].join('\n');

  // CRITICAL FIX: The master slide MUST have a theme linked to it to bypass the repair prompt.
  const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="44546A"/></a:dk2>
      <a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>
      <a:accent1><a:srgbClr val="4472C4"/></a:accent1>
      <a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
      <a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>
      <a:accent4><a:srgbClr val="FFC000"/></a:accent4>
      <a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>
      <a:accent6><a:srgbClr val="70AD47"/></a:accent6>
      <a:hlink><a:srgbClr val="0563C1"/></a:hlink>
      <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Calibri Light"/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`;

  const masterXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>
        <a:effectLst/>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/><a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2"
    accent1="accent1" accent2="accent2" accent3="accent3"
    accent4="accent4" accent5="accent5" accent6="accent6"
    hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle>
      <a:lstStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr></a:lstStyle>
    </p:titleStyle>
    <p:bodyStyle>
      <a:lstStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr></a:lstStyle>
    </p:bodyStyle>
    <p:otherStyle>
      <a:lstStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr></a:lstStyle>
    </p:otherStyle>
  </p:txStyles>
</p:sldMaster>`;

  const masterRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout"
    Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme"
    Target="../theme/theme1.xml"/>
</Relationships>`;

  const layoutXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  type="blank" preserve="1">
  <p:cSld name="Blank">
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/><a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;

  const layoutRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster"
    Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;

  // Standard DocProps - required to prevent online viewers from rejecting the file
  const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>Universal Converter</Application>
</Properties>`;
  const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>${xmlEsc(docTitle)}</dc:title>
</cp:coreProperties>`;

  const slideOverrides = groups
    .map(
      (_, i) =>
        `  <Override PartName="/ppt/slides/slide${i + 1}.xml"\n` +
        `    ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
    )
    .join('\n');

  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/ppt/presentation.xml"
    ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
${slideOverrides}
</Types>`;

  const pkgRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  zip.file('[Content_Types].xml', ct);
  zip.file('_rels/.rels', pkgRels);
  zip.file('docProps/app.xml', appXml);
  zip.file('docProps/core.xml', coreXml);
  zip.file('ppt/theme/theme1.xml', themeXml);
  zip.file('ppt/presentation.xml', presXml);
  zip.file('ppt/_rels/presentation.xml.rels', presRels);
  zip.file('ppt/slideMasters/slideMaster1.xml', masterXml);
  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', masterRels);
  zip.file('ppt/slideLayouts/slideLayout1.xml', layoutXml);
  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', layoutRels);

  for (let i = 0; i < groups.length; i++) {
    zip.file(`ppt/slides/slide${i + 1}.xml`, makeSlide(groups[i], i));
    zip.file(`ppt/slides/_rels/slide${i + 1}.xml.rels`, slideRels);
  }

  const MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  
  const blob: Blob = await zip.generateAsync({
    type: 'blob',
    mimeType: MIME,
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  return blob;
}

/* ─── public API ─────────────────────────────────────────────────────────────*/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const pdfFormatConverter = async (file: File, options: any): Promise<Blob> => {
  const targetFormat: string = ((options?.format as string | undefined) ?? 'pdf').toLowerCase();
  const sourceExt: string = (file.name.split('.').pop() ?? '').toLowerCase();

  const report = (ratio: number): void => {
    if (typeof options?.onProgress === 'function') {
      (options.onProgress as (p: { ratio: number }) => void)({
        ratio: Math.min(1, Math.max(0, ratio)),
      });
    }
  };

  report(0.05);

  if (sourceExt === targetFormat) {
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    report(1);
    return file;
  }

  // ── Step 1: extract text ──────────────────────────────────────────────────
  let lines: string[] = [];
  try {
    report(0.1);
    if (sourceExt === 'pdf') {
      lines = await extractTextFromPdf(file);
    } else if (sourceExt === 'docx' || sourceExt === 'xlsx' || sourceExt === 'pptx') {
      lines = await extractTextFromOffice(file);
    }
  } catch (err) {
    console.warn('[pdfFormatConverter] text extraction failed — using fallback:', err);
    lines = [`Content converted from: ${file.name}`];
  }

  if (lines.length === 0) lines = [file.name];

  report(0.5);

  // ── Step 2: build target file ─────────────────────────────────────────────
  let result: Blob;

  if (targetFormat === 'pdf') {
    result = await createPdf(lines, file.name);
  } else if (targetFormat === 'docx') {
    result = await createDocx(lines, file.name);
  } else if (targetFormat === 'xlsx') {
    result = await createXlsx(lines, file.name);
  } else if (targetFormat === 'pptx') {
    result = await createPptx(lines, file.name);
  } else {
    throw new Error(
      `Unsupported target format: "${targetFormat}". Expected pdf | docx | xlsx | pptx.`,
    );
  }

  report(1);
  return result;
};