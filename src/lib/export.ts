import { Message, SavedChat } from '@/types/chat';

/**
 * Exports messages as Markdown format
 */
export function exportAsMarkdown(messages: Message[], chatTitle?: string): string {
  let markdown = '';

  if (chatTitle) {
    markdown += `# ${chatTitle}\n\n`;
  }

  markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
  markdown += '---\n\n';

  messages.forEach((message) => {
    const role = message.role === 'user' ? 'You' : 'Assistant';
    const timestamp = new Date(message.timestamp).toLocaleString();
    
    markdown += `## ${role} (${timestamp})\n\n`;
    markdown += `${message.content}\n\n`;
    
    if (message.model) {
      markdown += `*Model: ${message.model}*\n\n`;
    }
    
    markdown += '---\n\n';
  });

  return markdown;
}

/**
 * Exports messages as JSON format
 */
export function exportAsJSON(messages: Message[], chatTitle?: string, currentModel?: string): string {
  const exportData: SavedChat & { exportDate: string } = {
    id: `export-${Date.now()}`,
    title: chatTitle || 'Exported Chat',
    messages,
    currentModel: currentModel || '',
    createdAt: messages.length > 0 ? messages[0].timestamp : Date.now(),
    updatedAt: messages.length > 0 ? messages[messages.length - 1].timestamp : Date.now(),
    exportDate: new Date().toISOString(),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Exports messages as PDF by creating an HTML document and triggering download/print
 */
export function exportAsPDF(messages: Message[], chatTitle?: string): void {
  // Create HTML content
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${chatTitle || 'Chat Export'}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #333;
          border-bottom: 2px solid #666;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .meta {
          color: #666;
          font-size: 14px;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 1px solid #ddd;
        }
        .message {
          margin-bottom: 30px;
          padding: 15px;
          border-left: 4px solid #ddd;
          background: #f9f9f9;
        }
        .message.user {
          border-left-color: #4CAF50;
          background: #e8f5e9;
        }
        .message.assistant {
          border-left-color: #2196F3;
          background: #e3f2fd;
        }
        .message-header {
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }
        .message-content {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .message-meta {
          font-size: 12px;
          color: #666;
          margin-top: 10px;
          font-style: italic;
        }
        .page-break {
          page-break-after: always;
        }
        @media print {
          body {
            padding: 0;
          }
          .message {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <h1>${chatTitle || 'Chat Export'}</h1>
      <div class="meta">
        Generated: ${new Date().toLocaleString()}<br>
        Total Messages: ${messages.length}
      </div>
  `;

  messages.forEach((message, index) => {
    const role = message.role === 'user' ? 'You' : 'Assistant';
    const timestamp = new Date(message.timestamp).toLocaleString();
    const messageClass = message.role;
    
    htmlContent += `
      <div class="message ${messageClass}">
        <div class="message-header">${role} (${timestamp})</div>
        <div class="message-content">${escapeHtml(message.content)}</div>
        ${message.model ? `<div class="message-meta">Model: ${escapeHtml(message.model)}</div>` : ''}
      </div>
    `;
  });

  htmlContent += `
    </body>
    </html>
  `;

  // Create a new window for printing to PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Note: User can save as PDF from the print dialog
        // After printing, close the window after a delay
        setTimeout(() => {
          printWindow.close();
        }, 500);
      }, 250);
    };
  } else {
    // Fallback: Download HTML file if popup is blocked
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(chatTitle || 'chat-export').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Downloads text content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

