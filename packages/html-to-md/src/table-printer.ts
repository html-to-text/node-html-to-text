interface TablePrinterCell {
  colspan: number;
  rowspan: number;
  text: string;
  line?: string;
  rendered?: boolean;
  renderedCol?: number;
  renderedRow?: number;
}

type Layout = Array<Array<TablePrinterCell | undefined>>;

function getRow<T> (matrix: T[][], j: number): T[] {
  if (!matrix[j]) {
    matrix[j] = [];
  }
  return matrix[j];
}

function findFirstVacantIndex<T> (row: Array<T | undefined>, x = 0): number {
  while (row[x]) {
    x++;
  }
  return x;
}

function transposeInPlace (matrix: Layout, maxSize: number): void {
  for (let i = 0; i < maxSize; i++) {
    const rowI = getRow(matrix, i);
    for (let j = 0; j < i; j++) {
      const rowJ = getRow(matrix, j);
      const temp = rowI[j];
      rowI[j] = rowJ[i];
      rowJ[i] = temp;
    }
  }
}

function putCellIntoLayout (
  cell: TablePrinterCell,
  layout: Layout,
  baseRow: number,
  baseCol: number
): void {
  for (let r = 0; r < cell.rowspan; r++) {
    const layoutRow = getRow(layout, baseRow + r);
    for (let c = 0; c < cell.colspan; c++) {
      layoutRow[baseCol + c] = cell;
    }
  }
}

function linearizeText (text: string): string {
  return text
    .replace(/(?: *\n){2,} */g, (m) =>
      '<br>'.repeat((m.match(/\n/g) || []).length - 1))
    .replace(/ *\n */g, ' ');
}

function createLayout (tableRows: TablePrinterCell[][]): {
  layout: Layout;
  rowNumber: number;
  colNumber: number;
} {
  const layout: Layout = [];
  let colNumber = 0;
  const rowNumber = tableRows.length;
  for (let j = 0; j < rowNumber; j++) {
    const layoutRow = getRow(layout, j);
    const cells = tableRows[j];
    let x = 0;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      x = findFirstVacantIndex(layoutRow, x);
      putCellIntoLayout(cell, layout, j, x);
      x += cell.colspan;
      cell.line = linearizeText(cell.text);
    }
    colNumber = layoutRow.length > colNumber ? layoutRow.length : colNumber;
  }
  return {
    layout: layout,
    rowNumber: rowNumber,
    colNumber: colNumber,
  };
}

function addCellText (
  lines: string[],
  y: number,
  text: string,
  separator = '|'
): void {
  if (lines[y]) {
    lines[y] += ` ${separator} ${text}`;
  } else {
    lines[y] = `${separator} ${text}`;
  }
}

function addEmptyCell (lines: string[], y: number, separator = '|'): void {
  if (lines[y]) {
    lines[y] += ' ' + separator;
  } else {
    lines[y] = separator;
  }
}

function cellOpenTag (cell: TablePrinterCell): string {
  const colspan = cell.colspan === 1 ? '' : ` colspan="${cell.colspan}"`;
  const rowspan = cell.rowspan === 1 ? '' : ` rowspan="${cell.rowspan}"`;
  return `<td${colspan}${rowspan}>`;
}

function renderRowsRepeat (layout: Layout, colNumber: number, rowNumber: number): string[] {
  const outputLines: string[] = [];
  for (let x = 0; x < colNumber; x++) {
    for (let y = 0; y < rowNumber; y++) {
      const cell = layout[x][y];
      if (cell) {
        addCellText(outputLines, y, layout[x][y]?.line ?? '');
      } else {
        addEmptyCell(outputLines, y);
      }
    }
  }
  return outputLines;
}

function renderRowsFirst (layout: Layout, colNumber: number, rowNumber: number): string[] {
  const outputLines: string[] = [];
  for (let x = 0; x < colNumber; x++) {
    for (let y = 0; y < rowNumber; y++) {
      const cell = layout[x][y];
      if (!cell || cell.rendered) {
        addEmptyCell(outputLines, y);
      } else {
        addCellText(outputLines, y, cell.line ?? '');
        cell.rendered = true;
      }
    }
  }
  return outputLines;
}

function renderRowsFirstCol (layout: Layout, colNumber: number, rowNumber: number): string[] {
  const outputLines: string[] = [];
  for (let x = 0; x < colNumber; x++) {
    for (let y = 0; y < rowNumber; y++) {
      const cell = layout[x][y];
      if (!cell || (cell.renderedCol !== undefined && cell.renderedCol !== x)) {
        addEmptyCell(outputLines, y);
      } else {
        addCellText(outputLines, y, cell.line ?? '');
        cell.renderedCol = x;
      }
    }
  }
  return outputLines;
}

function renderRowsFirstRow (layout: Layout, colNumber: number, rowNumber: number): string[] {
  const outputLines: string[] = [];
  for (let x = 0; x < colNumber; x++) {
    for (let y = 0; y < rowNumber; y++) {
      const cell = layout[x][y];
      if (!cell || (cell.renderedRow !== undefined && cell.renderedRow !== y)) {
        addEmptyCell(outputLines, y);
      } else {
        addCellText(outputLines, y, cell.line ?? '');
        cell.renderedRow = y;
      }
    }
  }
  return outputLines;
}

function renderRowsTag (
  layout: Layout,
  colNumber: number,
  rowNumber: number
): string[] {
  const outputLines: string[] = [];
  for (let x = 0; x < colNumber; x++) {
    for (let y = 0; y < rowNumber; y++) {
      const cell = layout[x][y];
      if (cell && !cell.rendered) {
        const separator =
          cell.colspan === 1 && cell.rowspan === 1 ? '|' : cellOpenTag(cell);
        addCellText(outputLines, y, cell.line ?? '', separator);
        cell.rendered = true;
      }
    }
  }
  return outputLines;
}

/**
 * Render a table into a string.
 * Cells can contain multiline text and span across multiple rows and columns.
 *
 * Can modify cells.
 *
 * Returns `null` if the table can't be rendered with chosen mode.
 *
 * @param { TablePrinterCell[][] } tableRows Table to render.
 * @param { boolean } firstRowIsHeader If false then the header row will contain empty comments.
 * @param { 'first' | 'firstCol' | 'firstRow' | 'repeat' | 'tag' } spanMode How to render cells with colspan/rowspan.
 * @returns { string | null }
 */
function tableToString (
  tableRows: TablePrinterCell[][],
  firstRowIsHeader: boolean,
  spanMode: 'first' | 'firstCol' | 'firstRow' | 'repeat' | 'tag'
): string | null {
  if (
    spanMode === 'tag' &&
    tableRows.some((r) => r[0] && (r[0].colspan > 1 || r[0].rowspan > 1))
  ) {
    // `tag` mode has a limitation - first cell in any row must not be spanned.
    return null;
  }

  const { rowNumber, layout, colNumber } = createLayout(tableRows);

  transposeInPlace(layout, rowNumber > colNumber ? rowNumber : colNumber);

  let outputLines: string[] = [];
  switch (spanMode) {
    case 'repeat': {
      outputLines = renderRowsRepeat(layout, colNumber, rowNumber);
      break;
    }
    case 'first': {
      outputLines = renderRowsFirst(layout, colNumber, rowNumber);
      break;
    }
    case 'firstCol': {
      outputLines = renderRowsFirstCol(layout, colNumber, rowNumber);
      break;
    }
    case 'firstRow': {
      outputLines = renderRowsFirstRow(layout, colNumber, rowNumber);
      break;
    }
    case 'tag': {
      outputLines = renderRowsTag(layout, colNumber, rowNumber);
      break;
    }
    default:
      throw new Error(`Unhandled span mode: ${spanMode}`);
  }

  if (firstRowIsHeader) {
    outputLines.splice(1, 0, Array(colNumber).fill('| ---').join(' '));
  } else {
    outputLines.unshift(
      Array(colNumber).fill('| <!-- -->').join(' '),
      Array(colNumber).fill('| --------').join(' ')
    );
  }

  return outputLines.join('\n');
}

export { tableToString };
