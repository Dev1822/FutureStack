import jsPDF from 'jspdf';
import { formatDate } from './dateHelpers';

/**
 * Generate PDF report from opportunities data
 * @param {Array} opportunities - Array of opportunity objects to include
 * @param {Object} statistics - Statistics object with counts
 * @param {string} exportType - Type of export: 'all', 'selected', or 'summary'
 */
export const generatePDF = (opportunities, statistics, exportType = 'all') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FutureTracker Report', margin, yPosition);
  yPosition += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;

  // Summary Statistics Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const stats = [
    `Total Opportunities: ${statistics.total}`,
    `Applied: ${statistics.applied}`,
    `Shortlisted: ${statistics.shortlisted}`,
    `Interviewed: ${statistics.interviewed}`,
    `Selected: ${statistics.selected}`,
    `Rejected: ${statistics.rejected}`,
  ];

  stats.forEach(stat => {
    doc.text(stat, margin + 5, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // If summary only, stop here
  if (exportType === 'summary') {
    return doc;
  }

  // Opportunities Details Section
  checkPageBreak(30);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Opportunities Details', margin, yPosition);
  yPosition += 10;

  // Iterate through opportunities
  opportunities.forEach((opp, index) => {
    checkPageBreak(50);

    // Opportunity number and title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${opp.title}`, margin, yPosition);
    yPosition += 7;

    // Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const details = [
      `Category: ${opp.category.charAt(0).toUpperCase() + opp.category.slice(1)}`,
      `Status: ${opp.status.charAt(0).toUpperCase() + opp.status.slice(1)}`,
      `Deadline: ${formatDate(opp.deadline)}`,
    ];

    if (opp.description) {
      details.push(`Description: ${opp.description}`);
    }

    if (opp.link) {
      details.push(`Link: ${opp.link}`);
    }

    if (opp.notes) {
      details.push(`Notes: ${opp.notes}`);
    }

    details.forEach(detail => {
      checkPageBreak(10);

      // Handle long text wrapping
      const lines = doc.splitTextToSize(detail, pageWidth - 2 * margin - 5);
      lines.forEach(line => {
        checkPageBreak(6);
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      });
    });

    yPosition += 8; // Space between opportunities
  });

  return doc;
};

/**
 * Download PDF with given filename
 * @param {jsPDF} doc - jsPDF document object
 * @param {string} filename - Name for the downloaded file
 */
export const downloadPDF = (doc, filename = 'futurestack-report.pdf') => {
  doc.save(filename);
};
