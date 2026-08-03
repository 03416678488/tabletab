import * as path from 'path';
import { createReadStream } from 'fs';
import { extname } from 'path';
import { Readable } from 'stream';
import { parse, Options as CsvParseOptions } from 'csv-parse';
import { Injectable, Logger } from '@nestjs/common';
import { access, constants } from 'fs/promises';

@Injectable()
export class CSVService {
  private readonly logger = new Logger(CSVService.name);

  /**
   * Base parse options. Note `cast` is intentionally OFF: callers (e.g. the
   * contact importer) do their own type coercion, and global casting mangles
   * epoch timestamps, leading-zero zip codes, phone numbers, etc.
   */
  private readonly csvOptions: CsvParseOptions = {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: false,
    bom: true, // strip a UTF-8 BOM so the first header isn't "\uFEFFemail"
  };

  /** Delimiters we attempt to detect, in priority order. */
  private readonly supportedDelimiters = [',', ';', '\t', '|'];

  // ──────────────────────────────────────────────────────────────────────────
  // Delimiter detection
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Sniffs the delimiter from the first non-empty line of the file by counting
   * candidate delimiters outside of quoted segments and picking the most
   * frequent. Falls back to comma. Reads only the first line, so it's cheap.
   */
  public async detectDelimiter(filePath: string): Promise<string> {
    const firstLine = await this.readFirstLine(filePath);
    return this.detectDelimiterFromLine(firstLine);
  }

  /** Picks the most frequent unquoted delimiter in a single line. */
  private detectDelimiterFromLine(line: string): string {
    if (!line) return ',';

    let best = ',';
    let bestCount = 0;

    for (const delimiter of this.supportedDelimiters) {
      const count = this.countUnquotedOccurrences(line, delimiter);
      if (count > bestCount) {
        bestCount = count;
        best = delimiter;
      }
    }
    return best;
  }

  /** Counts a delimiter's occurrences in a line, ignoring those inside quotes. */
  private countUnquotedOccurrences(line: string, delimiter: string): number {
    let count = 0;
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (!inQuotes && char === delimiter) {
        count++;
      }
    }
    return count;
  }

  /** Reads just the first line of a file without buffering the whole thing. */
  private async readFirstLine(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const stream = createReadStream(filePath, { encoding: 'utf8' });
      let buffer = '';
      let settled = false;

      const finish = (line: string) => {
        if (settled) return;
        settled = true;
        stream.destroy();
        // Strip a leading BOM so detection isn't thrown off.
        resolve(line.replace(/^\uFEFF/, ''));
      };

      stream.on('data', (chunk: string) => {
        buffer += chunk;
        const newlineIndex = buffer.indexOf('\n');
        if (newlineIndex !== -1) {
          finish(buffer.slice(0, newlineIndex).replace(/\r$/, ''));
        }
      });
      stream.on('end', () => finish(buffer.replace(/\r$/, '')));
      stream.on('error', (error) => {
        if (settled) return;
        settled = true;
        reject(new Error(`Failed to read first line: ${error.message}`));
      });
    });
  }

  /** Builds parse options for a given delimiter, layered on the base options. */
  private buildParseOptions(delimiter: string): CsvParseOptions {
    return { ...this.csvOptions, delimiter };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Whole-file reads (fine for small/validation use; buffers all rows)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Parses an entire stream into an in-memory array.
   * Use only when you know the file is small (validation, previews). For large
   * imports prefer `streamCsvInBatches`, which never holds the whole file.
   */
  public async parseCsvStream<T = Record<string, any>>(
    stream: NodeJS.ReadableStream,
    delimiter = ',',
  ): Promise<T[]> {
    const parser = parse(this.buildParseOptions(delimiter));
    const records: T[] = [];

    return new Promise<T[]>((resolve, reject) => {
      const fail = (error: Error, context: string) => {
        // Tear down both ends so we don't leak the file descriptor.
        parser.destroy();
        (stream as Readable).destroy?.();
        reject(new Error(`${context}: ${error.message}`));
      };

      stream.on('error', (error) => fail(error, 'Stream error'));

      stream
        .pipe(parser)
        .on('data', (row: T) => records.push(row))
        .on('end', () => resolve(records))
        .on('error', (error) => fail(error, 'CSV parsing error'));
    });
  }

  public async readCsvFromPath<T = Record<string, any>>(filePath: string): Promise<T[]> {
    // createReadStream does not throw synchronously for a missing file — the
    // error surfaces as a stream 'error' event, handled in parseCsvStream.
    const delimiter = await this.detectDelimiter(filePath);
    const stream = createReadStream(filePath);
    return this.parseCsvStream<T>(stream, delimiter);
  }

  public async readCsvFromBuffer<T = Record<string, any>>(buffer: Buffer): Promise<T[]> {
    // Detect from the buffer's first line directly (no file to sniff).
    const firstLine =
      buffer
        .toString('utf8')
        .split(/\r?\n/, 1)[0]
        ?.replace(/^\uFEFF/, '') ?? '';
    const delimiter = this.detectDelimiterFromLine(firstLine);

    const stream = Readable.from(buffer);
    return this.parseCsvStream<T>(stream, delimiter);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Streaming read in batches (preferred for large imports)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Streams a CSV file and invokes `onBatch` every `batchSize` rows, applying
   * backpressure so memory stays flat regardless of file size. The parser is
   * paused while `onBatch` runs, so a slow DB write won't pile up rows in RAM.
   *
   * Returns the total number of rows processed.
   */
  public async streamCsvInBatches<T = Record<string, any>>(
    filePath: string,
    batchSize: number,
    onBatch: (batch: T[]) => Promise<void>,
  ): Promise<number> {
    const delimiter = await this.detectDelimiter(filePath);
    const stream = createReadStream(filePath);
    const parser = parse(this.buildParseOptions(delimiter));

    let batch: T[] = [];
    let totalRows = 0;

    const flush = async () => {
      if (batch.length === 0) return;
      const current = batch;
      batch = [];
      await onBatch(current);
    };

    return new Promise<number>((resolve, reject) => {
      const fail = (error: Error, context: string) => {
        parser.destroy();
        stream.destroy();
        reject(new Error(`${context}: ${error.message}`));
      };

      stream.on('error', (error) => fail(error, 'Stream error'));

      stream
        .pipe(parser)
        .on('data', (row: T) => {
          batch.push(row);
          totalRows++;

          if (batch.length >= batchSize) {
            // Pause to apply backpressure while the async handler runs.
            parser.pause();
            flush()
              .then(() => parser.resume())
              .catch((error) => fail(error, 'Batch handler error'));
          }
        })
        .on('end', () => {
          // Flush the final partial batch.
          flush()
            .then(() => resolve(totalRows))
            .catch((error) => fail(error, 'Final batch handler error'));
        })
        .on('error', (error) => fail(error, 'CSV parsing error'));
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Validation helpers
  // ──────────────────────────────────────────────────────────────────────────

  public hasValidCsvExtension(file: Express.Multer.File): boolean {
    return extname(file.originalname).toLowerCase() === '.csv';
  }

  public async hasCsvData(file: Express.Multer.File): Promise<boolean> {
    try {
      const rowCount = await this.countDataRows(file.path);
      return rowCount > 0;
    } catch {
      return false;
    }
  }

  public async hasValidCsvContent(
    file: Express.Multer.File,
    requiredHeaders: string[] = ['email'],
  ): Promise<boolean> {
    try {
      // Only the header row is needed — don't read the whole file.
      const headers = await this.getFileHeaders(file.path);
      return requiredHeaders.every((header) => headers.includes(header));
    } catch {
      return false;
    }
  }

  /**
   * Validates extension, headers, and row-count bounds. Reads headers via a
   * cheap header-only parse; only counts rows when min/max bounds are given.
   */
  public async validateCsvStructure(
    file: Express.Multer.File,
    config: {
      requiredHeaders?: string[];
      maxRows?: number;
      minRows?: number;
    } = {},
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const { requiredHeaders = ['email'], maxRows, minRows = 1 } = config;

    try {
      if (!this.hasValidCsvExtension(file)) {
        errors.push('Invalid file type. Only CSV files are allowed.');
        return { isValid: false, errors };
      }

      const headers = await this.getFileHeaders(file.path);
      const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
      if (missingHeaders.length > 0) {
        errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      // Count rows by streaming (no full buffer) only when a bound requires it.
      if (minRows > 0 || maxRows) {
        const rowCount = await this.countDataRows(file.path);
        if (rowCount < minRows) {
          errors.push(`CSV must contain at least ${minRows} data row(s)`);
        }
        if (maxRows && rowCount > maxRows) {
          errors.push(`CSV cannot contain more than ${maxRows} rows`);
        }
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      errors.push(`CSV validation error: ${error.message}`);
      return { isValid: false, errors };
    }
  }

  /** Counts data rows by streaming — constant memory regardless of file size. */
  public async countDataRows(filePath: string): Promise<number> {
    const delimiter = await this.detectDelimiter(filePath);
    const stream = createReadStream(filePath);
    const parser = parse(this.buildParseOptions(delimiter));
    let count = 0;

    return new Promise<number>((resolve, reject) => {
      const fail = (error: Error) => {
        parser.destroy();
        stream.destroy();
        reject(new Error(`CSV row count error: ${error.message}`));
      };

      stream.on('error', fail);
      stream
        .pipe(parser)
        .on('data', () => count++)
        .on('end', () => resolve(count))
        .on('error', fail);
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Preview / header helpers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Reads up to `limit` rows for previews (default 10). Cleanly stops the
   * stream once enough rows are gathered.
   * (Renamed from parseFirst15Rows; a backward-compatible alias is kept below.)
   */
  public async parsePreviewRows<T = Record<string, any>>(
    filePath: string,
    limit = 10,
  ): Promise<T[]> {
    const delimiter = await this.detectDelimiter(filePath);
    const stream = createReadStream(filePath);
    const parser = parse(this.buildParseOptions(delimiter));
    const results: T[] = [];
    let settled = false;

    return new Promise<T[]>((resolve, reject) => {
      const finish = () => {
        if (settled) return;
        settled = true;
        parser.destroy();
        stream.destroy();
        resolve(results);
      };
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        parser.destroy();
        stream.destroy();
        reject(new Error(`CSV preview error: ${error.message}`));
      };

      stream.on('error', fail);
      stream
        .pipe(parser)
        .on('data', (row: T) => {
          results.push(row);
          if (results.length >= limit) finish();
        })
        .on('end', finish)
        .on('error', fail);
    });
  }

  /** Backward-compatible alias for existing callers. */
  public async parseFirst15Rows(filePath: string): Promise<any[]> {
    return this.parsePreviewRows(filePath, 10);
  }

  /**
   * Returns the header row only. Rejects on an empty file instead of hanging.
   */
  public async getFileHeaders(filePath: string): Promise<string[]> {
    const delimiter = await this.detectDelimiter(filePath);
    const stream = createReadStream(filePath);
    const parser = parse({ delimiter, from_line: 1, to_line: 1, bom: true });
    let settled = false;

    return new Promise<string[]>((resolve, reject) => {
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        parser.destroy();
        stream.destroy();
        reject(new Error(`Failed to read headers: ${error.message}`));
      };

      stream.on('error', fail);
      stream
        .pipe(parser)
        .on('data', (row: string[]) => {
          if (settled) return;
          settled = true;
          stream.destroy();
          resolve(row);
        })
        .on('end', () => {
          // Empty file: 'end' fires with no 'data' — reject rather than hang.
          if (!settled) {
            settled = true;
            reject(new Error('CSV file has no header row'));
          }
        })
        .on('error', fail);
    });
  }

  public async isFileExists(filePath: string): Promise<boolean> {
    try {
      const absolutePath = path.resolve(process.cwd(), filePath);
      await access(absolutePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
