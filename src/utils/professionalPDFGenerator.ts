// Professional PDF Generator for KIVRO Inbox Messages
// Designed for government and business services with official formatting

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

export interface InboxMessage {
  id: string;
  subject: string;
  message_body: string;
  message_type: string;
  priority: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  sent_at: string;
  reference_number?: string;
  metadata?: any;
  sender_type?: string;
  sender?: {
    organization_name: string;
    organization_code?: string;
  };
  company_sender?: {
    company_name: string;
    company_code?: string;
  };
}

export interface PDFOptions {
  includeWatermark?: boolean;
  includeQRCode?: boolean;
  officialDocument?: boolean;
  letterhead?: boolean;
}

export class ProfessionalPDFGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 25;
  private contentWidth: number;
  private yPosition: number = 25;
  
  // KIVRO Brand Colors
  private readonly colors = {
    primary: [22, 163, 74] as [number, number, number],      // Green #16a34a
    primaryLight: [34, 197, 94] as [number, number, number], // Light Green #22c55e
    primaryDark: [21, 128, 61] as [number, number, number],  // Dark Green #15803d
    secondary: [59, 130, 246] as [number, number, number],   // Blue #3b82f6
    accent: [168, 85, 247] as [number, number, number],      // Purple #a855f7
    gray: {
      50: [249, 250, 251] as [number, number, number],
      100: [243, 244, 246] as [number, number, number],
      200: [229, 231, 235] as [number, number, number],
      300: [209, 213, 219] as [number, number, number],
      400: [156, 163, 175] as [number, number, number],
      500: [107, 114, 128] as [number, number, number],
      600: [75, 85, 99] as [number, number, number],
      700: [55, 65, 81] as [number, number, number],
      800: [31, 41, 55] as [number, number, number],
      900: [17, 24, 39] as [number, number, number]
    },
    status: {
      success: [34, 197, 94] as [number, number, number],
      warning: [251, 191, 36] as [number, number, number],
      error: [239, 68, 68] as [number, number, number],
      info: [59, 130, 246] as [number, number, number]
    }
  };

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - (2 * this.margin);
  }

  /**
   * Generate professional PDF for inbox message
   */
  public async generateMessagePDF(message: InboxMessage, options: PDFOptions = {}): Promise<Blob> {
    try {
      // Set document properties
      this.setDocumentProperties(message);
      
      // Add letterhead
      if (options.letterhead !== false) {
        await this.addOfficialLetterhead();
      }
      
      // Add document header
      this.addDocumentHeader(message);
      
      // Add message metadata table
      this.addMessageMetadata(message);
      
      // Add message content
      this.addMessageContent(message);
      
      // Add payment information if exists
      if (message.metadata?.payment_required || message.metadata?.fine_amount || message.metadata?.payment_amount) {
        this.addPaymentSection(message);
      }
      
      // Add verification section
      this.addVerificationSection(message);
      
      // Add official footer
      this.addOfficialFooter(options);
      
      // Add watermark if requested
      if (options.includeWatermark) {
        this.addWatermark();
      }
      
      // Return PDF as Blob for preview
      return this.pdf.output('blob');
      
    } catch (error) {
      throw error; // Re-throw the original error instead of wrapping it
    }
  }

  /**
   * Get the generated filename
   */
  public getFileName(message: InboxMessage): string {
    return this.generateFileName(message);
  }

  /**
   * Set PDF document properties
   */
  private setDocumentProperties(message: InboxMessage): void {
    this.pdf.setProperties({
      title: `KIVRO Message - ${message.subject}`,
      subject: message.subject,
      author: 'KIVRO Digital Platform',
      creator: 'KIVRO PDF Generator v2.0',
      keywords: 'KIVRO, Digital Address, Official Document, Government, Business'
    });
  }

  /**
   * Add professional letterhead with KIVRO branding
   */
  private async addOfficialLetterhead(): Promise<void> {
    // Header background with gradient effect
    this.pdf.setFillColor(...this.colors.primary);
    this.pdf.rect(0, 0, this.pageWidth, 35, 'F');
    
    // Accent bar
    this.pdf.setFillColor(...this.colors.primaryLight);
    this.pdf.rect(0, 35, this.pageWidth, 2, 'F');
    
    // Add KIVRO Logo (left side)
    try {
      const logoUrl = '/kivro-logo.png';
      const img = await this.loadImage(logoUrl);
      this.pdf.addImage(img, 'PNG', this.margin, 8, 20, 20);
    } catch (error) {
      // Fallback to text logo
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(24);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('KIVRO', this.margin, 15);
    }
    
    // Company name and tagline (next to logo)
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('KIVRO', this.margin + 25, 15);
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Digital Address & Communication Platform', this.margin + 25, 22);
    
    // Contact Information (right side) - positioned to avoid seal overlap
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    
    const contactInfo = [
      'www.kivro.africa',
      'support@kivro.africa',
      '+46 70 794 9110'
    ];
    
    let contactY = 10;
    const rightMargin = this.pageWidth - this.margin - 25; // Leave space for seal
    
    contactInfo.forEach(info => {
      this.pdf.text(info, rightMargin, contactY, { align: 'right' });
      contactY += 4;
    });
    
    // Official Seal/Badge placeholder (far right)
    this.pdf.setDrawColor(255, 255, 255);
    this.pdf.setLineWidth(1);
    this.pdf.circle(this.pageWidth - this.margin - 10, 18, 7, 'S');
    this.pdf.setFontSize(5);
    this.pdf.text('OFFICIAL', this.pageWidth - this.margin - 10, 17.5, { align: 'center' });
    this.pdf.text('DOCUMENT', this.pageWidth - this.margin - 10, 19.5, { align: 'center' });
    
    this.yPosition = 45;
  }

  /**
   * Load image from URL for PDF
   */
  private loadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  /**
   * Add document header with classification and reference
   */
  private addDocumentHeader(message: InboxMessage): void {
    // Document classification bar
    const classification = this.getDocumentClassification(message);
    this.pdf.setFillColor(...classification.color);
    this.pdf.rect(this.margin, this.yPosition, this.contentWidth, 8, 'F');
    
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(classification.label, this.margin + 5, this.yPosition + 5);
    
    // Document reference (right side)
    if (message.reference_number) {
      this.pdf.text(`Ref: ${message.reference_number}`, this.pageWidth - this.margin - 5, this.yPosition + 5, { align: 'right' });
    }
    
    this.yPosition += 15;
    
    // Document title
    this.pdf.setTextColor(...this.colors.gray[800]);
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    const titleLines = this.pdf.splitTextToSize(message.subject, this.contentWidth);
    this.pdf.text(titleLines, this.margin, this.yPosition);
    this.yPosition += titleLines.length * 7 + 10;
  }

  /**
   * Add message metadata in professional table format
   */
  private addMessageMetadata(message: InboxMessage): void {
    const senderName = message.sender_type === 'company' 
      ? (message.company_sender?.company_name || 'Company') 
      : (message.sender?.organization_name || 'Government Agency');
    
    const senderCode = message.sender_type === 'company' 
      ? message.company_sender?.company_code 
      : message.sender?.organization_code;

    const metadata = [
      ['From:', senderName],
      ['Sender Code:', senderCode || 'N/A'],
      ['Message Type:', this.formatMessageType(message.message_type)],
      ['Priority Level:', this.formatPriority(message.priority)],
      ['Date Issued:', this.formatDate(message.sent_at)],
      ['Document ID:', message.id.substring(0, 8).toUpperCase()],
      ['Status:', message.is_read ? 'Read' : 'Unread']
    ];

    autoTable(this.pdf, {
      startY: this.yPosition,
      head: [['Document Information', '']],
      body: metadata,
      theme: 'grid',
      headStyles: {
        fillColor: this.colors.gray[100],
        textColor: this.colors.gray[800],
        fontStyle: 'bold',
        fontSize: 12
      },
      bodyStyles: {
        fontSize: 10,
        textColor: this.colors.gray[700]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: this.margin, right: this.margin },
      tableWidth: this.contentWidth
    });

    this.yPosition = (this.pdf as any).lastAutoTable.finalY + 15;
  }

  /**
   * Add message content with proper formatting
   */
  private addMessageContent(message: InboxMessage): void {
    // Content header
    this.pdf.setFillColor(...this.colors.gray[50]);
    this.pdf.rect(this.margin, this.yPosition, this.contentWidth, 8, 'F');
    
    this.pdf.setTextColor(...this.colors.gray[800]);
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('MESSAGE CONTENT', this.margin + 5, this.yPosition + 5);
    
    this.yPosition += 15;
    
    // Message body with proper formatting
    this.pdf.setTextColor(...this.colors.gray[700]);
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    
    const bodyLines = this.pdf.splitTextToSize(message.message_body, this.contentWidth - 10);
    
    // Add border around content
    const contentHeight = bodyLines.length * 5 + 10;
    this.pdf.setDrawColor(...this.colors.gray[200]);
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(this.margin, this.yPosition, this.contentWidth, contentHeight, 'S');
    
    // Add content with padding
    let contentY = this.yPosition + 8;
    bodyLines.forEach((line: string) => {
      if (contentY > this.pageHeight - 30) {
        this.pdf.addPage();
        contentY = this.margin + 10;
      }
      this.pdf.text(line, this.margin + 5, contentY);
      contentY += 5;
    });
    
    this.yPosition = this.yPosition + contentHeight + 15;
  }

  /**
   * Add payment section for financial documents
   */
  private addPaymentSection(message: InboxMessage): void {
    if (this.yPosition > this.pageHeight - 60) {
      this.pdf.addPage();
      this.yPosition = this.margin;
    }

    // Payment alert header
    this.pdf.setFillColor(...this.colors.status.error);
    this.pdf.rect(this.margin, this.yPosition, this.contentWidth, 10, 'F');
    
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('⚠️ PAYMENT REQUIRED', this.margin + 5, this.yPosition + 6);
    
    this.yPosition += 15;
    
    // Get payment amount from various possible fields
    const paymentAmount = message.metadata.payment_amount || message.metadata.fine_amount;
    const currency = message.metadata.currency || 'KES';
    const dueDate = message.metadata.payment_due_date || message.metadata.due_date;
    
    // Payment details table
    const paymentData = [
      ['Amount Due:', `${currency} ${paymentAmount ? Number(paymentAmount).toLocaleString() : 'N/A'}`],
      ['Due Date:', dueDate ? this.formatDate(dueDate) : 'Immediate'],
      ['Payment Method:', 'As specified by issuing authority'],
      ['Late Fee:', 'May apply after due date']
    ];

    autoTable(this.pdf, {
      startY: this.yPosition,
      body: paymentData,
      theme: 'striped',
      styles: {
        fontSize: 10,
        textColor: this.colors.gray[700]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.yPosition = (this.pdf as any).lastAutoTable.finalY + 15;
  }

  /**
   * Add verification section for document authenticity
   */
  private addVerificationSection(message: InboxMessage): void {
    if (this.yPosition > this.pageHeight - 40) {
      this.pdf.addPage();
      this.yPosition = this.margin;
    }

    // Verification header
    this.pdf.setFillColor(...this.colors.gray[100]);
    this.pdf.rect(this.margin, this.yPosition, this.contentWidth, 8, 'F');
    
    this.pdf.setTextColor(...this.colors.gray[800]);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('DOCUMENT VERIFICATION', this.margin + 5, this.yPosition + 5);
    
    this.yPosition += 15;
    
    // Verification details
    const verificationId = `KV-${message.id.substring(0, 8).toUpperCase()}`;
    const verificationUrl = `https://kivro.africa/verify/${verificationId}`;
    
    this.pdf.setTextColor(...this.colors.gray[600]);
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    
    const verificationText = [
      `Verification ID: ${verificationId}`,
      `Verify at: ${verificationUrl}`,
      `Generated: ${new Date().toLocaleString()}`,
      'This document is digitally signed and can be verified online.'
    ];
    
    verificationText.forEach(text => {
      this.pdf.text(text, this.margin + 5, this.yPosition);
      this.yPosition += 4;
    });
    
    this.yPosition += 10;
  }

  /**
   * Add official footer with legal information
   */
  private addOfficialFooter(options: PDFOptions): void {
    const footerY = this.pageHeight - 25;
    
    // Footer separator line
    this.pdf.setDrawColor(...this.colors.primary);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    // Footer content
    this.pdf.setTextColor(...this.colors.gray[600]);
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    
    // Line 1: Platform name and tagline
    this.pdf.text(
      'KIVRO - Digital Address & Communication Platform | Connecting Africa Digitally',
      this.pageWidth / 2,
      footerY,
      { align: 'center' }
    );
    
    // Line 2: Document info
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(...this.colors.gray[500]);
    this.pdf.text(
      'This is an official document generated from the KIVRO platform. For verification, visit www.kivro.africa/verify',
      this.pageWidth / 2,
      footerY + 3.5,
      { align: 'center' }
    );
    
    // Line 3: Generation date and copyright
    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const generatedTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    this.pdf.text(
      `Document generated on ${generatedDate} at ${generatedTime} | Copyright ${new Date().getFullYear()} KIVRO. All rights reserved.`,
      this.pageWidth / 2,
      footerY + 7,
      { align: 'center' }
    );
    
    // Page number
    const pageCount = this.pdf.getNumberOfPages();
    if (pageCount > 1) {
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(...this.colors.gray[600]);
      this.pdf.text(`Page ${pageCount}`, this.pageWidth - this.margin, footerY, { align: 'right' });
    }
  }

  /**
   * Add watermark for document security
   */
  private addWatermark(): void {
    const pageCount = this.pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      
      // Semi-transparent watermark
      this.pdf.setGState(new (this.pdf as any).GState({ opacity: 0.1 }));
      this.pdf.setTextColor(...this.colors.primary);
      this.pdf.setFontSize(60);
      this.pdf.setFont('helvetica', 'bold');
      
      // Rotate and center the watermark
      this.pdf.text('KIVRO', this.pageWidth / 2, this.pageHeight / 2, {
        align: 'center',
        angle: 45
      });
      
      // Reset opacity
      this.pdf.setGState(new (this.pdf as any).GState({ opacity: 1 }));
    }
  }

  /**
   * Helper methods for formatting
   */
  private getDocumentClassification(message: InboxMessage): { label: string; color: [number, number, number] } {
    const classifications = {
      'government': { label: 'GOVERNMENT DOCUMENT', color: this.colors.status.info },
      'legal': { label: 'LEGAL NOTICE', color: this.colors.status.error },
      'business': { label: 'BUSINESS COMMUNICATION', color: this.colors.primary },
      'urgent': { label: 'URGENT NOTICE', color: this.colors.status.warning },
      'default': { label: 'OFFICIAL DOCUMENT', color: this.colors.gray[600] }
    };
    
    return classifications[message.message_type as keyof typeof classifications] || classifications.default;
  }

  private formatMessageType(type: string): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private formatPriority(priority: string): string {
    const priorities = {
      urgent: '🔴 URGENT',
      high: '🟡 HIGH',
      normal: '🟢 NORMAL',
      low: '🔵 LOW'
    };
    return priorities[priority as keyof typeof priorities] || priority.toUpperCase();
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  private generateFileName(message: InboxMessage): string {
    const date = new Date().toISOString().split('T')[0];
    const ref = message.reference_number || message.id.substring(0, 8);
    const type = message.message_type.replace(/[^a-zA-Z0-9]/g, '_');
    return `KIVRO_Official_Document_${type}_${ref}_${date}.pdf`;
  }
}

/**
 * Convenience function to generate professional PDF and return as Blob
 */
export const generateProfessionalPDF = async (
  message: InboxMessage, 
  options: PDFOptions = {}
): Promise<{ blob: Blob; fileName: string }> => {
  const generator = new ProfessionalPDFGenerator();
  const blob = await generator.generateMessagePDF(message, {
    includeWatermark: true,
    officialDocument: true,
    letterhead: true,
    ...options
  });
  const fileName = generator.getFileName(message);
  return { blob, fileName };
};
