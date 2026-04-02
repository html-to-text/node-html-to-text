import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import test from 'ava';


function stableSerialize (value) {
  const seen = new WeakSet();
  return JSON.stringify(value, function (key, current) {
    if (typeof current === 'function') {
      return `[Function ${current.name || 'anonymous'}]`;
    }
    if (typeof current === 'object' && current !== null) {
      if (seen.has(current)) {
        return '[Circular]';
      }
      seen.add(current);
      if (Array.isArray(current)) {
        return current;
      }
      const sorted = {};
      for (const objectKey of Object.keys(current).sort()) {
        sorted[objectKey] = current[objectKey];
      }
      return sorted;
    }
    return current;
  }, 2);
}

export function snapshotTitle ({
  title = undefined,
  html,
  options = undefined,
  metadata = undefined
}) {
  const sections = [];
  if (title !== undefined) {
    sections.push(title);
  }
  if (html !== undefined) {
    sections.push(`\`\`\`html\n${html}\n\`\`\``);
  }
  if (options !== undefined) {
    sections.push(`\`\`\`options\n${stableSerialize(options)}\n\`\`\``);
  }
  if (metadata !== undefined) {
    sections.push(`\`\`\`metadata\n${stableSerialize(metadata)}\n\`\`\``);
  }
  return sections.join('\n\n');
}

export function assertSnapshot (t, params) {
  const {
    convert,
    html = undefined,
    input,
    metadata = undefined,
    options = undefined,
    title = undefined
  } = params;
  const result = convert(input, options, metadata);
  const message = snapshotTitle({
    html: (html === undefined) ? input : html,
    metadata: metadata,
    options: options,
    title: title
  });

  if (message === '') {
    t.snapshot(result);
    return;
  }

  t.snapshot(result, message);
}

export function assertSnapshotCompiled (t, params) {
  const {
    convert,
    html = undefined,
    input,
    metadata = undefined,
    options = undefined,
    title = undefined
  } = params;
  const result = convert(input, metadata);
  const message = snapshotTitle({
    html: (html === undefined) ? input : html,
    metadata: metadata,
    options: options,
    title: title
  });

  if (message === '') {
    t.snapshot(result);
    return;
  }

  t.snapshot(result, message);
}

export const snapshotMacro = test.macro({
  exec: function (t, params) {
    assertSnapshot(t, params);
  }
});

export const snapshotCompiledMacro = test.macro({
  exec: function (t, params) {
    assertSnapshotCompiled(t, params);
  }
});

function loadDocument (documentPath, callerFileUrl = undefined) {
  const filePath = (callerFileUrl === undefined)
    ? resolve(process.cwd(), documentPath)
    : fileURLToPath(new URL(documentPath, callerFileUrl));

  return readFileSync(filePath, 'utf8');
}

export const documentSnapshotMacro = test.macro({
  exec: function (t, {
    callerFileUrl = undefined,
    convert,
    documentPath,
    metadata = undefined,
    options = undefined,
    title = undefined
  }) {
    const input = loadDocument(documentPath, callerFileUrl);
    const result = convert(input, options, metadata);
    const message = snapshotTitle({
      metadata: metadata,
      options: options,
      title: title ?? `document: ${documentPath}`
    });

    if (message === '') {
      t.snapshot(result);
      return;
    }

    t.snapshot(result, message);
  }
});

export const documentSnapshotMacroCompiled = test.macro({
  exec: function (t, {
    callerFileUrl = undefined,
    convert,
    documentPath,
    metadata = undefined,
    options = undefined,
    title = undefined
  }) {
    const input = loadDocument(documentPath, callerFileUrl);
    const result = convert(input, metadata);
    const message = snapshotTitle({
      metadata: metadata,
      options: options,
      title: title ?? `document: ${documentPath}`
    });

    if (message === '') {
      t.snapshot(result);
      return;
    }

    t.snapshot(result, message);
  }
});
