/**
 * extract.js — PDF/DOCX text extraction stage.
 *
 * Downloads the resume file from Supabase Storage using the document's
 * storage_path (or falls back to file_url for external links), then
 * extracts plain text. Mirrors the pdf.py / pymupdf_rag.py modules from
 * the hiring-agent reference (MIT © HackerRank).
 */

'use strict';

const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const { supabase } = require('../supabase');

const SIGNED_URL_EXPIRY = 300; // 5 minutes – enough to download

/**
 * Download a file buffer from Supabase Storage.
 *
 * @param {string} storagePath - e.g. "userId/timestamp-resume.pdf"
 * @returns {Promise<Buffer>}
 */
async function downloadFromStorage(storagePath) {
    const { data, error } = await supabase
        .storage
        .from('documents')
        .download(storagePath);

    if (error) {
        throw new Error(`Failed to download file from storage: ${error.message}`);
    }

    // Supabase returns a Blob; convert to Buffer
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Download a file from an arbitrary URL (for external documents).
 *
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
async function downloadFromUrl(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
        throw new Error(`Failed to fetch file from URL: HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Extract text from a PDF buffer.
 *
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function extractFromPdf(buffer) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
        const result = await parser.getText();
        return result.text || '';
    } finally {
        await parser.destroy();
    }
}

/**
 * Extract text from a DOCX buffer.
 *
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function extractFromDocx(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
}

/**
 * Infer MIME type from storage path / file URL.
 *
 * @param {string} path
 * @returns {'pdf'|'docx'|'unknown'}
 */
function inferFileType(path) {
    const lower = (path || '').toLowerCase();
    if (lower.includes('.pdf')) return 'pdf';
    if (lower.includes('.docx') || lower.includes('.doc')) return 'docx';
    return 'unknown';
}

/**
 * Main extraction entry point.
 * Given a document record (from Supabase documents table), returns the raw
 * extracted text plus the file type detected.
 *
 * @param {object} document - Row from documents table
 * @param {string|null} document.storage_path
 * @param {string|null} document.file_url
 * @param {boolean}     document.is_external
 * @returns {Promise<{ text: string, fileType: string }>}
 */
async function extractResumeText(document) {
    const { storage_path, file_url, is_external } = document;

    let buffer;
    let pathForTypeInference;

    if (storage_path && !is_external) {
        buffer = await downloadFromStorage(storage_path);
        pathForTypeInference = storage_path;
    } else if (file_url) {
        buffer = await downloadFromUrl(file_url);
        pathForTypeInference = file_url;
    } else {
        throw new Error('Document has no accessible file (no storage_path or file_url)');
    }

    const fileType = inferFileType(pathForTypeInference);

    let text;
    if (fileType === 'pdf') {
        text = await extractFromPdf(buffer);
    } else if (fileType === 'docx') {
        text = await extractFromDocx(buffer);
    } else {
        // Last resort: try PDF first, then DOCX
        try {
            text = await extractFromPdf(buffer);
        } catch {
            text = await extractFromDocx(buffer);
        }
    }

    // Normalise whitespace
    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    if (!text || text.length < 50) {
        throw new Error('Could not extract meaningful text from the resume file. Please ensure it is not scanned/image-only.');
    }

    return { text, fileType };
}

module.exports = { extractResumeText };
