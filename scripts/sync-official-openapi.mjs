import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const sourceUrl = 'https://d39uqv4p1mtopj.cloudfront.net/openapi/openapi.yaml';
const outputPath = resolve('docs/contracts/tizo.openapi.yaml');

const response = await fetch(sourceUrl, {
  headers: { accept: 'application/yaml, text/yaml, text/plain' },
});

if (!response.ok) {
  throw new Error(`No se pudo descargar el OpenAPI oficial: HTTP ${response.status}`);
}

const contents = await response.text();
if (!contents.includes('openapi: 3.1.0') || !contents.includes('/api/catalog/products:')) {
  throw new Error('El documento descargado no parece ser el contrato OpenAPI de Tizo.');
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, contents, 'utf8');

const digest = createHash('sha256').update(contents).digest('hex').toUpperCase();
console.log(`OpenAPI oficial actualizado: ${outputPath}`);
console.log(`SHA-256: ${digest}`);
