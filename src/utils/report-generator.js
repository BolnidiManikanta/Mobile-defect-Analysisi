import { jsPDF } from 'jspdf';

/**
 * Generate a PDF Diagnostic Report for a given scan result
 */
export async function generatePDFReport(scan) {
  if (!scan) return;
  const doc = new jsPDF();
  const date = new Date(scan.created_at || Date.now()).toLocaleString();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(0, 229, 255);
  doc.text('SMARTSEP AI', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('MOBILE DIAGNOSTIC REPORT', 105, 28, { align: 'center' });
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 35, 190, 35);

  // Device Info
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Device: ${scan.brand} ${scan.model}`, 20, 50);
  
  doc.setFontSize(10);
  doc.text(`Report Date: ${date}`, 20, 58);
  doc.text(`Scan ID: ${scan.id || 'N/A'}`, 20, 64);
  
  // Status & Confidence
  doc.setFontSize(11);
  doc.text(`Overall Severity: ${scan.overall_severity.toUpperCase()}`, 140, 50);
  doc.text(`Inference Confidence: ${Math.round(scan.assessment_confidence * 100)}%`, 140, 58);

  // Damages Table
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('DETECTED ISSUES', 20, 80);
  doc.setLineWidth(0.5);
  doc.line(20, 82, 60, 82);

  let y = 95;
  scan.damages.forEach((dmg, i) => {
    if (y > 250) { doc.addPage(); y = 20; }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${i+1}. ${dmg.label}`, 20, y);
    
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(dmg.description, 160);
    doc.text(descLines, 25, y + 6);
    
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Location: ${dmg.location} | Confidence: ${Math.round(dmg.confidence * 100)}%`, 25, y + 6 + (descLines.length * 5));
    
    y += 20 + (descLines.length * 5);
    doc.setTextColor(0, 0, 0);
  });

  // Cost Estimation
  if (y > 230) { doc.addPage(); y = 20; }
  y += 10;
  doc.setFontSize(12);
  doc.text('REPAIR COST ESTIMATION (INR)', 20, y);
  doc.line(20, y+2, 90, y+2);
  
  y += 15;
  doc.setFontSize(10);
  doc.text(`Minimum Cost:   Rs. ${scan.estimated_repair_cost?.min?.toLocaleString() || '—'}`, 30, y);
  doc.text(`Market Average: Rs. ${scan.estimated_repair_cost?.avg?.toLocaleString() || '—'}`, 30, y + 8);
  doc.text(`Maximum Cost:   Rs. ${scan.estimated_repair_cost?.max?.toLocaleString() || '—'}`, 30, y + 16);

  // Footer / Disclaimer
  y = 275;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This is an AI-generated diagnostic report. Final inspection by a qualified technician is required.', 105, y, { align: 'center' });
  doc.text('Copyright 2024 SmartSep AI. All rights reserved.', 105, y + 5, { align: 'center' });

  // Save the PDF
  doc.save(`SmartSep_Report_${scan.brand}_${scan.model}.pdf`);
}
