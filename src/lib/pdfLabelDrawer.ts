import jsPDF from 'jspdf';

interface DrawLabelOptions {
  customDescriptions?: { [productIndex: number]: string };
  labelNumber?: number;
  compact?: boolean;
}

// Cache the logo as base64 to avoid repeated fetches
let logoCache: string | null = null;

async function loadLogo(): Promise<string | null> {
  if (logoCache) return logoCache;
  try {
    const response = await fetch('/favoron-logo.jpg');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        logoCache = reader.result as string;
        resolve(logoCache);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function getShopperName(pkg: any): string {
  if (pkg.shopper_name_override) {
    return pkg.shopper_name_override;
  }
  if (pkg.shopper_name && pkg.shopper_name !== 'Shopper desconocido') {
    return pkg.shopper_name;
  }
  if (pkg.profiles?.first_name || pkg.profiles?.last_name) {
    return `${pkg.profiles.first_name || ''} ${pkg.profiles.last_name || ''}`.trim();
  }
  return 'N/A';
}

function getDeliveryMethodText(pkg: any): string {
  return pkg.delivery_method === 'delivery' ? 'A domicilio' : 'Pick-up';
}

function getDeliveryAddress(pkg: any): string | null {
  if (pkg.delivery_method === 'delivery' && pkg.confirmed_delivery_address) {
    const addr = pkg.confirmed_delivery_address;
    return [
      addr.streetAddress,
      addr.cityArea,
      addr.hotelAirbnbName,
      addr.contactNumber ? `Tel: ${addr.contactNumber}` : null
    ].filter(Boolean).join(', ');
  }
  return null;
}

function getPackageId(pkg: any): string {
  return pkg.id ? pkg.id.substring(0, 8).toUpperCase() : 'N/A';
}

function getTotalQuantity(pkg: any): string {
  if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
    return pkg.products_data
      .filter((p: any) => !p.cancelled)
      .reduce((sum: number, p: any) => sum + parseInt(p.quantity || '1'), 0)
      .toString();
  }
  return '1';
}

function getProductLines(pkg: any, customDescriptions?: { [idx: number]: string }): string[] {
  if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
    const active = pkg.products_data
      .map((p: any, i: number) => ({ ...p, originalIndex: i }))
      .filter((p: any) => !p.cancelled);
    return active.map((p: any, i: number) => {
      const qty = parseInt(p.quantity || '1');
      const desc = customDescriptions?.[p.originalIndex] || p.itemDescription || '';
      const qtyText = qty > 1 ? ` (${qty}x)` : '';
      return `${i + 1}. ${desc}${qtyText}`;
    });
  }
  const desc = customDescriptions?.[0] || pkg.item_description || '';
  return [desc];
}

/**
 * Wraps text to fit within maxWidth, returning an array of lines.
 */
function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (pdf.getTextWidth(testLine) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

/**
 * Draws a package label directly onto a jsPDF page using native vector drawing.
 * This replaces the html2canvas approach for dramatically smaller file sizes.
 */
export async function drawLabelToPDF(
  pdf: jsPDF,
  pkg: any,
  x: number,
  y: number,
  w: number,
  h: number,
  options: DrawLabelOptions = {}
): Promise<void> {
  const { customDescriptions, labelNumber, compact = false } = options;
  const fontSize = compact ? 7.5 : 9;
  const headerFontSize = compact ? 8 : 9.5;
  const lineHeight = compact ? 10 : 12;
  const padding = compact ? 6 : 8;
  const contentWidth = w - padding * 2;

  // Border
  pdf.setDrawColor(0);
  pdf.setLineWidth(1.5);
  pdf.rect(x, y, w, h);

  // Logo
  const logo = await loadLogo();
  const logoH = compact ? 18 : 24;
  const headerH = logoH + (compact ? 8 : 12);

  if (logo) {
    const logoW = logoH * 3; // approximate aspect ratio
    const logoX = x + (w - logoW) / 2;
    const logoY = y + (compact ? 4 : 6);
    try {
      pdf.addImage(logo, 'JPEG', logoX, logoY, logoW, logoH);
    } catch {
      // If logo fails, just draw text
      pdf.setFontSize(12);
      pdf.setFont('courier', 'bold');
      pdf.text('FAVORÓN', x + w / 2, y + headerH / 2 + 4, { align: 'center' });
    }
  } else {
    pdf.setFontSize(12);
    pdf.setFont('courier', 'bold');
    pdf.text('FAVORÓN', x + w / 2, y + headerH / 2 + 4, { align: 'center' });
  }

  // Header separator
  const headerBottom = y + headerH;
  pdf.setLineWidth(0.5);
  pdf.line(x, headerBottom, x + w, headerBottom);

  // Content area
  let cursorY = headerBottom + (compact ? 8 : 10);
  const leftX = x + padding;

  const drawBoldLabel = (label: string, value: string) => {
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(fontSize);
    pdf.text(label, leftX, cursorY);
    const labelW = pdf.getTextWidth(label);
    pdf.setFont('courier', 'normal');
    
    const availableW = contentWidth - labelW;
    if (pdf.getTextWidth(value) > availableW) {
      // Wrap value text
      const wrapped = wrapText(pdf, value, availableW);
      pdf.text(wrapped[0], leftX + labelW, cursorY);
      for (let i = 1; i < wrapped.length; i++) {
        cursorY += lineHeight;
        pdf.text(wrapped[i], leftX, cursorY);
      }
    } else {
      pdf.text(value, leftX + labelW, cursorY);
    }
    cursorY += lineHeight;
  };

  // Section: INFORMACIÓN DEL PEDIDO
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(headerFontSize);
  pdf.text('INFORMACIÓN DEL PEDIDO:', leftX, cursorY);
  cursorY += lineHeight + 2;

  // Product descriptions
  pdf.setFontSize(fontSize);
  const productLines = getProductLines(pkg, customDescriptions);
  for (const line of productLines) {
    const wrapped = wrapText(pdf, line, contentWidth);
    for (const wl of wrapped) {
      pdf.setFont('courier', 'normal');
      pdf.text(wl, leftX, cursorY);
      cursorY += lineHeight;
    }
  }

  cursorY += 2;

  // Tracking number
  drawBoldLabel('NO. DE SEGUIMIENTO: ', getPackageId(pkg));

  // Quantity
  drawBoldLabel('Cantidad: ', getTotalQuantity(pkg));

  cursorY += 4;

  // Destinatario
  drawBoldLabel('DESTINATARIO: ', getShopperName(pkg));

  cursorY += 2;

  // Entrega
  drawBoldLabel('ENTREGA: ', getDeliveryMethodText(pkg));

  cursorY += 2;

  // Label number
  const labelNumStr = labelNumber !== undefined && labelNumber !== null
    ? String(labelNumber).padStart(4, '0')
    : '####';
  drawBoldLabel('No. de etiqueta: ', labelNumStr);

  // Delivery address (only for delivery)
  const address = getDeliveryAddress(pkg);
  if (pkg.delivery_method === 'delivery' && address) {
    cursorY += 4;
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(fontSize);
    pdf.text('DIRECCIÓN:', leftX, cursorY);
    cursorY += lineHeight;

    pdf.setFont('courier', 'normal');
    const addrLines = wrapText(pdf, address, contentWidth);
    for (const al of addrLines) {
      pdf.text(al, leftX, cursorY);
      cursorY += lineHeight;
    }
  }

  // Bottom-right small label number
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(153, 153, 153);
  const bottomLabel = labelNumber !== undefined && labelNumber !== null
    ? `No. ${String(labelNumber).padStart(4, '0')}`
    : 'No. ####';
  pdf.text(bottomLabel, x + w - padding, y + h - 4, { align: 'right' });
  pdf.setTextColor(0, 0, 0); // Reset
}

/**
 * Pre-loads the logo so subsequent drawLabelToPDF calls are instant.
 */
export async function preloadLabelAssets(): Promise<void> {
  await loadLogo();
}
