// Beautiful Professional PDF Generator for KIVRO Inbox Messages
// Enterprise-grade design with modern typography and layout

import { jsPDF } from 'jspdf';

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

export class ModernPDFGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 25;
  private contentWidth: number;
  private yPosition: number = 0;
  
  // Professional Color Palette
  private readonly colors = {
    // KIVRO Brand Colors
    kivroGreen: [22, 163, 74] as [number, number, number],
    kivroOrange: [249, 115, 22] as [number, number, number],
    
    // Professional Grays
    charcoal: [31, 41, 55] as [number, number, number],     // Main text
    slate: [51, 65, 85] as [number, number, number],        // Secondary text  
    stone: [75, 85, 99] as [number, number, number],        // Labels
    silver: [107, 114, 128] as [number, number, number],    // Light text
    pearl: [156, 163, 175] as [number, number, number],     // Very light
    snow: [248, 250, 252] as [number, number, number],      // Background
    
    // Status Colors
    urgent: [220, 38, 38] as [number, number, number],      // Red
    high: [217, 119, 6] as [number, number, number],        // Amber  
    normal: [37, 99, 235] as [number, number, number],      // Blue
    
    // Accent Colors
    success: [34, 197, 94] as [number, number, number],     // Green
    warning: [245, 158, 11] as [number, number, number],    // Yellow
    info: [59, 130, 246] as [number, number, number],       // Blue
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
   * Generate modern, beautiful PDF for inbox message
   */
  public async generateMessagePDF(message: InboxMessage): Promise<Blob> {
    try {
      // Set document properties
      this.pdf.setProperties({
        title: `KIVRO - ${message.subject}`,
        subject: message.subject,
        author: 'KIVRO',
        creator: 'KIVRO Inbox',
        keywords: 'KIVRO, Digital Address, Message'
      });
      
      // Add modern header with logo
      await this.addModernHeader();
      
      // Add message card
      this.addMessageCard(message);
      
      // Add modern footer
      this.addModernFooter();
      
      // Return PDF as Blob
      return this.pdf.output('blob');
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the generated filename
   */
  public getFileName(message: InboxMessage): string {
    const date = new Date(message.sent_at).toISOString().split('T')[0];
    const subject = message.subject.substring(0, 30).replace(/[^a-z0-9]/gi, '_');
    return `KIVRO_Message_${subject}_${date}.pdf`;
  }

  /**
   * Add beautiful professional header with KIVRO branding
   */
  private async addModernHeader(): Promise<void> {
    // Professional gradient header background
    this.pdf.setFillColor(...this.colors.kivroGreen);
    this.pdf.rect(0, 0, this.pageWidth, 50, 'F');
    
    // Subtle gradient overlay
    this.pdf.setFillColor(34, 197, 94); // Lighter green
    this.pdf.setGState(this.pdf.GState({ opacity: 0.2 }));
    this.pdf.rect(0, 0, this.pageWidth, 25, 'F');
    this.pdf.setGState(this.pdf.GState({ opacity: 1 }));
    
    // White accent stripe
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.setGState(this.pdf.GState({ opacity: 0.1 }));
    this.pdf.rect(0, 45, this.pageWidth, 5, 'F');
    this.pdf.setGState(this.pdf.GState({ opacity: 1 }));
    
    // Try to load and add logo with better positioning
    try {
      const logoData = await this.loadImageAsDataURL('/kivro-logo.jpg');
      // Logo with shadow effect
      this.pdf.setGState(this.pdf.GState({ opacity: 0.3 }));
      this.pdf.setFillColor(0, 0, 0);
      this.pdf.roundedRect(this.margin + 1, 11, 30, 22, 3, 3, 'F');
      this.pdf.setGState(this.pdf.GState({ opacity: 1 }));
      
      // Main logo
      this.pdf.addImage(logoData, 'JPEG', this.margin, 10, 30, 22, undefined, 'FAST');
    } catch (error) {
      // Fallback logo box
      this.pdf.setFillColor(255, 255, 255);
      this.pdf.setGState(this.pdf.GState({ opacity: 0.9 }));
      this.pdf.roundedRect(this.margin, 10, 30, 22, 3, 3, 'F');
      this.pdf.setGState(this.pdf.GState({ opacity: 1 }));
      
      this.pdf.setTextColor(22, 163, 74);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(14);
      this.pdf.text('KIVRO', this.margin + 15, 22, { align: 'center' });
    }
    
    // Company name and tagline with better typography
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(28);
    this.pdf.text('KIVRO', this.margin + 40, 22);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(11);
    this.pdf.setGState(this.pdf.GState({ opacity: 0.9 }));
    this.pdf.text('Digital Address & Communication Platform', this.margin + 40, 30);
    this.pdf.setGState(this.pdf.GState({ opacity: 1 }));
    
    this.yPosition = 65;
  }

  /**
   * Add beautifully designed message card
   */
  private addMessageCard(message: InboxMessage): void {
    // Add elegant priority badge
    this.addProfessionalPriorityBadge(message.priority);
    
    // Document title with professional typography
    this.yPosition += 8;
    this.pdf.setTextColor(...this.colors.charcoal);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(20);
    
    const titleLines = this.pdf.splitTextToSize(message.subject, this.contentWidth - 10);
    this.pdf.text(titleLines, this.margin, this.yPosition);
    this.yPosition += titleLines.length * 8 + 15;
    
    // Professional metadata section
    this.addMetadataSection(message);
    
    // Elegant divider
    this.yPosition += 10;
    this.pdf.setDrawColor(...this.colors.pearl);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    this.yPosition += 15;
    
    // Message content with beautiful typography
    this.addMessageContent(message);
    
    // Payment information if exists
    if (message.metadata?.payment_required || message.metadata?.payment_amount || message.metadata?.fine_amount) {
      this.addProfessionalPaymentSection(message);
    }
  }
  
  /**
   * Add professional priority badge
   */
  private addProfessionalPriorityBadge(priority: string): void {
    const badges = {
      urgent: { color: this.colors.urgent, text: 'URGENT', emoji: '🚨' },
      high: { color: this.colors.high, text: 'HIGH PRIORITY', emoji: '⚠️' },
      normal: { color: this.colors.normal, text: 'NORMAL', emoji: '📋' }
    };
    
    const badge = badges[priority.toLowerCase() as keyof typeof badges] || badges.normal;
    
    // Badge background with shadow
    this.pdf.setFillColor(badge.color[0], badge.color[1], badge.color[2]);
    this.pdf.setGState(this.pdf.GState({ opacity: 0.1 }));
    this.pdf.roundedRect(this.margin, this.yPosition, 60, 12, 6, 6, 'F');
    this.pdf.setGState(this.pdf.GState({ opacity: 1 }));
    
    // Badge border
    this.pdf.setDrawColor(badge.color[0], badge.color[1], badge.color[2]);
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(this.margin, this.yPosition, 60, 12, 6, 6, 'S');
    
    // Badge text
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(badge.color[0], badge.color[1], badge.color[2]);
    this.pdf.text(`${badge.emoji} ${badge.text}`, this.margin + 5, this.yPosition + 8);
    
    this.yPosition += 20;
  }
  
  /**
   * Add professional metadata section
   */
  private addMetadataSection(message: InboxMessage): void {
    const senderName = message.sender_type === 'company' 
      ? (message.company_sender?.company_name || 'Company') 
      : (message.sender?.organization_name || 'Government Agency');
    
    const formattedDate = new Date(message.sent_at).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Create metadata table
    const metadata = [
      { label: 'From:', value: senderName },
      { label: 'Date:', value: formattedDate },
    ];
    
    if (message.reference_number) {
      metadata.push({ label: 'Reference:', value: message.reference_number });
    }
    
    // Render metadata in clean table format
    metadata.forEach((item, index) => {
      // Label
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(11);
      this.pdf.setTextColor(...this.colors.stone);
      this.pdf.text(item.label, this.margin, this.yPosition);
      
      // Value
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(...this.colors.charcoal);
      this.pdf.text(item.value, this.margin + 35, this.yPosition);
      
      this.yPosition += 8;
    });
  }
  
  /**
   * Add message content with beautiful formatting
   */
  private addMessageContent(message: InboxMessage): void {
    // Message label
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(...this.colors.slate);
    this.pdf.text('Message:', this.margin, this.yPosition);
    this.yPosition += 10;
    
    // Message content with proper formatting
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(...this.colors.charcoal);
    
    const bodyLines = this.pdf.splitTextToSize(message.message_body || 'No message content available.', this.contentWidth - 5);
    
    // Check for page break
    const estimatedHeight = bodyLines.length * 6;
    if (this.yPosition + estimatedHeight > this.pageHeight - 80) {
      this.pdf.addPage();
      this.yPosition = this.margin + 20;
    }
    
    // Render message content with proper line spacing
    bodyLines.forEach((line: string, index: number) => {
      this.pdf.text(line, this.margin, this.yPosition);
      this.yPosition += 6;
    });
    
    this.yPosition += 15;
  }

  /**
   * Add professional payment section
   */
  private addProfessionalPaymentSection(message: InboxMessage): void {
    const amount = message.metadata?.payment_amount || message.metadata?.fine_amount || 0;
    const currency = message.metadata?.currency || 'USD';
    const dueDate = message.metadata?.due_date;
    
    this.yPosition += 10;
    
    // Payment alert header
    this.pdf.setFillColor(...this.colors.urgent);
    this.pdf.setGState(this.pdf.GState({ opacity: 0.1 }));
    this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, 35, 8, 8, 'F');
    this.pdf.setGState(this.pdf.GState({ opacity: 1 }));
    
    // Payment border
    this.pdf.setDrawColor(...this.colors.urgent);
    this.pdf.setLineWidth(1);
    this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, 35, 8, 8, 'S');
    
    this.yPosition += 12;
    
    // Payment title
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(...this.colors.urgent);
    this.pdf.text('⚠️ PAYMENT REQUIRED', this.margin + 10, this.yPosition);
    this.yPosition += 10;
    
    // Amount display
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(...this.colors.stone);
    this.pdf.text('Amount:', this.margin + 10, this.yPosition);
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(...this.colors.urgent);
    this.pdf.text(`${currency} ${amount.toLocaleString()}`, this.margin + 50, this.yPosition);
    
    // Due date if exists
    if (dueDate) {
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(...this.colors.stone);
      const formattedDue = new Date(dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      this.pdf.text(`Due: ${formattedDue}`, this.pageWidth - this.margin - 60, this.yPosition);
    }
    
    this.yPosition += 20;
  }

  /**
   * Add professional footer
   */
  private addModernFooter(): void {
    // Add generous spacing before footer
    this.yPosition += 25;
    
    // Check if we need a new page
    if (this.yPosition > this.pageHeight - 50) {
      this.pdf.addPage();
      this.yPosition = this.margin + 20;
    }
    
    // Elegant footer divider
    this.pdf.setDrawColor(...this.colors.pearl);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    
    this.yPosition += 12;
    
    // Footer content with professional styling
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...this.colors.silver);
    this.pdf.text('📬 Generated from KIVRO Inbox', this.margin, this.yPosition);
    
    // Website with KIVRO branding
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...this.colors.kivroGreen);
    this.pdf.text('www.kivro.africa', this.pageWidth - this.margin, this.yPosition, { align: 'right' });
    
    this.yPosition += 8;
    
    // Generation timestamp
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(...this.colors.pearl);
    this.pdf.setFontSize(8);
    const generatedDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    this.pdf.text(`Generated on ${generatedDate}`, this.pageWidth / 2, this.yPosition, { align: 'center' });
  }

  /**
   * Load image as data URL
   */
  private loadImageAsDataURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/jpeg', 0.95);
          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }
}

// Helper to add triangle (for location pin)
declare module 'jspdf' {
  interface jsPDF {
    triangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, style: string): void;
  }
}

// Extend jsPDF with triangle method
if (typeof jsPDF !== 'undefined') {
  (jsPDF.API as any).triangle = function(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, style: string) {
    this.lines([[x2 - x1, y2 - y1], [x3 - x2, y3 - y2], [x1 - x3, y1 - y3]], x1, y1, [1, 1], style, true);
    return this;
  };
}
