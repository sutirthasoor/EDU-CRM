import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PosterData {
  leadId: string;
  studentName: string;
  subjects: string[];
  class: string;
  budget: string;
  location: string;
  contact: string;
  requirements?: string;
  postedBy?: string;
  studentGender?: string;
  school?: string;
  board?: string;
  days?: string;
  time?: string;
  tuitionMode?: string;
  preferredTimings?: string;
  startDate?: string;
  urgency?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  studentName: string;
  amount: number;
  date: string;
  dueDate: string;
  status: string;
  paymentMode?: string;
  transactionId?: string;
  notes?: string;
}

// PDF Generator for Tutor Requirement Poster
export const generateRequirementPosterPDF = async (data: PosterData) => {
  console.log('Generating Poster PDF for lead:', data.leadId);
  
  const posterDiv = document.createElement('div');
  posterDiv.style.width = '800px';
  posterDiv.style.backgroundColor = '#ffffff';
  posterDiv.style.padding = '20px';
  posterDiv.style.fontFamily = 'Arial, sans-serif';
  posterDiv.style.position = 'fixed';
  posterDiv.style.left = '-9999px';
  posterDiv.style.top = '0';
  
  posterDiv.innerHTML = `
    <div style="border: 2px solid #e5e7eb; padding: 20px; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 28px;">TUTOR REQUIREMENT</h1>
        <p style="margin: 5px 0 0; font-size: 14px;">Excellence Consultants</p>
      </div>
      
      <h2 style="color: #1e3a8a; text-align: center; margin-bottom: 20px;">Student Requirement Details</h2>
      
      <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div style="flex: 1;">
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Lead ID</p>
            <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold; color: #dc2626;">${data.leadId}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Student Name</p>
            <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold;">${data.studentName}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Class</p>
            <p style="margin: 5px 0 0;">${data.class}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Board</p>
            <p style="margin: 5px 0 0;">${data.board || 'Not specified'}</p>
          </div>
        </div>
        
        <div style="flex: 1;">
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Subjects</p>
            <p style="margin: 5px 0 0;">${data.subjects?.join(', ') || 'Not specified'}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Budget</p>
            <p style="margin: 5px 0 0; font-weight: bold; color: #059669;">💰 ${data.budget}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Location</p>
            <p style="margin: 5px 0 0;">${data.location}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Contact</p>
            <p style="margin: 5px 0 0;">${data.contact}</p>
          </div>
        </div>
      </div>
      
      ${data.requirements ? `
        <div style="background: #fef9e3; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: bold; color: #92400e;">📝 Additional Requirements:</p>
          <p style="margin: 0; font-size: 13px; line-height: 1.5;">${data.requirements}</p>
        </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 10px; color: #9ca3af;">
          Posted by: ${data.postedBy || 'Excellence Consultants'} | Generated on: ${new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(posterDiv);
  
  try {
    const canvas = await html2canvas(posterDiv, { scale: 2, backgroundColor: '#ffffff', logging: false });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`Tutor_Requirement_${data.leadId}.pdf`);
    console.log('PDF generated successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    document.body.removeChild(posterDiv);
  }
};

// PDF Generator for Invoice
// PDF Generator for Invoice
// PDF Generator for Invoice
// PDF Generator for Invoice
export const generateInvoicePDF = async (data: InvoiceData) => {
  console.log('Generating Invoice PDF for:', data);
  console.log('Amount received:', data.amount);
  console.log('Status received:', data.status);
  
  // Add safety checks for all fields
  const safeData = {
    invoiceNumber: data.invoiceNumber || 'INV-0000',
    studentName: data.studentName || 'Unknown',
    amount: data.amount || 0,
    date: data.date || new Date().toLocaleDateString(),
    dueDate: data.dueDate || new Date().toLocaleDateString(),
    status: data.status || 'pending',
    paymentMode: data.paymentMode || '',
    transactionId: data.transactionId || '',
    notes: data.notes || ''
  };
  
  console.log('Safe data amount:', safeData.amount);
  
  const invoiceDiv = document.createElement('div');
  invoiceDiv.style.width = '800px';
  invoiceDiv.style.backgroundColor = '#ffffff';
  invoiceDiv.style.padding = '20px';
  invoiceDiv.style.fontFamily = 'Arial, sans-serif';
  invoiceDiv.style.position = 'fixed';
  invoiceDiv.style.left = '-9999px';
  invoiceDiv.style.top = '0';
  
  // Create a canvas for the image to ensure it loads properly
  const logoHtml = `
    <div style="flex-shrink: 0; width: 80px; height: 80px; background: linear-gradient(135deg, #1e3a8a, #3b82f6); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
      <span style="color: white; font-size: 24px; font-weight: bold;">EC</span>
    </div>
  `;
  
  invoiceDiv.innerHTML = `
    <div style="border: 2px solid #e5e7eb; padding: 20px; border-radius: 12px;">
      <!-- Header with Logo and Company Info -->
      <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #1e3a8a;">
        <div style="flex: 1;">
          <h1 style="margin: 0; color: #1e3a8a; font-size: 24px;">Excellence Consultants</h1>
          <p style="margin: 5px 0 0; color: #4b5563; font-size: 12px;">Your Trusted Education Partner</p>
        </div>
      </div>
      
      <!-- Company Address -->
      <div style="background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #334155;">
          📍 5, Shyama Charan Chowdhury Lane, Salkia, Howrah – 711106<br>
          📞 84208-75543 / 91639-33744 | 📧 excellencescf@gmail.com<br>
          🌐 www.excellenceconsultants.in
        </p>
      </div>
      
      <!-- Invoice Title -->
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1e3a8a; font-size: 20px;">TAX INVOICE</h2>
        <p style="margin: 5px 0 0; color: #6b7280;">Payment Receipt</p>
      </div>
      
      <!-- Invoice Details -->
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
          <div>
            <p style="margin: 5px 0;"><strong>Invoice No:</strong> ${safeData.invoiceNumber}</p>
            <p style="margin: 5px 0;"><strong>Invoice Date:</strong> ${safeData.date}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${safeData.dueDate}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> 
              <span style="background: ${safeData.status === 'paid' ? '#d1fae5' : '#fee2e2'}; color: ${safeData.status === 'paid' ? '#059669' : '#dc2626'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                ${safeData.status ? safeData.status.toUpperCase() : 'PENDING'}
              </span>
            </p>
          </div>
        </div>
      </div>
      
      <!-- Student Info -->
      <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0;"><strong>Student Name:</strong> ${safeData.studentName}</p>
        ${safeData.paymentMode ? `<p style="margin: 5px 0 0;"><strong>Payment Mode:</strong> ${safeData.paymentMode}</p>` : ''}
        ${safeData.transactionId ? `<p style="margin: 5px 0 0;"><strong>Transaction ID:</strong> ${safeData.transactionId}</p>` : ''}
      </div>
      
      <!-- Amount Table -->
      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb;">Description</th>
              <th style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">Amount (₹)</th>
             </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Tuition Fees</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb;">₹${safeData.amount.toLocaleString()}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 12px; font-weight: bold;">Total Amount</td>
              <td style="text-align: right; padding: 12px; font-weight: bold;">₹${safeData.amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Notes -->
      ${safeData.notes ? `
        <div style="background: #fef9e3; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0;"><strong>📝 Notes:</strong> ${safeData.notes}</p>
        </div>
      ` : ''}
      
      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 10px; color: #9ca3af;">
          This is a computer-generated invoice and does not require a physical signature.<br>
          Thank you for choosing Excellence Consultants!
        </p>
        <p style="margin: 5px 0 0; font-size: 10px; color: #9ca3af;">
          Generated on: ${new Date().toLocaleString()}
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(invoiceDiv);
  
  try {
    const canvas = await html2canvas(invoiceDiv, { scale: 2, backgroundColor: '#ffffff', logging: false });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`Invoice_${safeData.invoiceNumber}.pdf`);
    console.log('Invoice PDF generated successfully with amount:', safeData.amount);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    alert('Failed to generate invoice PDF. Please try again.');
  } finally {
    document.body.removeChild(invoiceDiv);
  }
};