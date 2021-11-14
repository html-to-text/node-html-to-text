
function getRow (matrix, j) {
  if (!matrix[j]) { matrix[j] = []; }
  return matrix[j];
}

function findFirstVacantIndex (row, x = 0) {
  while (row[x]) { x++; }
  return x;
}

function transposeInPlace (matrix, maxSize) {
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

function putCellIntoLayout (cell, layout, baseRow, baseCol) {
  for (let r = 0; r < cell.rowspan; r++) {
    const layoutRow = getRow(layout, baseRow + r);
    for (let c = 0; c < cell.colspan; c++) {
      layoutRow[baseCol + c] = cell;
    }
  }
}

function updateOffset (offsets, base, span, value) {
  offsets[base + span] = Math.max(
    offsets[base + span] || 0,
    offsets[base] + value
  );
}

/**
 * @typedef { object } TablePrinterCell
 * Cell definition for the table printer.
 *
 * @property { number } colspan Number of columns this cell occupies.
 * @property { number } rowspan Number of rows this cell occupies.
 * @property { string } text Cell contents (pre-wrapped).
 */

/**
 * Render a table into string.
 * Cells can contain multiline text and span across multiple rows and columns.
 *
 * Modifies cells to add lines array.
 *
 * @param { TablePrinterCell[][] } tableRows Table to render.
 * @param { number } rowSpacing Number of spaces between columns.
 * @param { number } colSpacing Number of empty lines between rows.
 * @returns { string }
 */
function tableToString (tableRows, rowSpacing, colSpacing) {
  const layout = [];
  let colNumber = 0;
  const rowNumber = tableRows.length;
  const rowOffsets = [0];
  // Fill the layout table and row offsets row-by-row.
  for (let j = 0; j < rowNumber; j++) {
    const layoutRow = getRow(layout, j);
    const cells = tableRows[j];
    let x = 0;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      x = findFirstVacantIndex(layoutRow, x);
      putCellIntoLayout(cell, layout, j, x);
      x += cell.colspan;
      cell.lines = cell.text.split('\n');
      const cellHeight = cell.lines.length;
      updateOffset(rowOffsets, j, cell.rowspan, cellHeight + rowSpacing);
    }
    colNumber = (layoutRow.length > colNumber) ? layoutRow.length : colNumber;
  }

  transposeInPlace(layout, (rowNumber > colNumber) ? rowNumber : colNumber);

  const outputLines = [];
  const colOffsets = [0];
  // Fill column offsets and output lines column-by-column.
  for (let x = 0; x < colNumber; x++) {
    let y = 0;
    let cell;
    while (y < rowNumber && (cell = layout[x][y])) {
      if (!cell.rendered) {
        let cellWidth = 0;
        for (let j = 0; j < cell.lines.length; j++) {
          const line = cell.lines[j];
          const lineOffset = rowOffsets[y] + j;
          outputLines[lineOffset] = (outputLines[lineOffset] || '').padEnd(colOffsets[x]) + line;
          cellWidth = (line.length > cellWidth) ? line.length : cellWidth;
        }
        updateOffset(colOffsets, x, cell.colspan, cellWidth + colSpacing);
        cell.rendered = true;
      }
      y += cell.rowspan;
    }
  }

  return outputLines.join('\n');
}

module.exports = { tableToString: tableToString };
