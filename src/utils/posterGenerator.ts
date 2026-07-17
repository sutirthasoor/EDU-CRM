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

export const generateRequirementPosterPDF = async (data: PosterData) => {
  // Create a temporary div to render the poster
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
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 28px;">🎓 TUTOR REQUIREMENT</h1>
        <p style="margin: 5px 0 0; font-size: 14px;">Excellence Consultants</p>
      </div>
      
      <!-- Title -->
      <h2 style="color: #1e3a8a; text-align: center; margin-bottom: 20px;">Student Requirement Details</h2>
      
      <!-- Two column layout -->
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
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Gender</p>
            <p style="margin: 5px 0 0;">${data.studentGender || 'Not specified'}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Class</p>
            <p style="margin: 5px 0 0;">${data.class}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Board</p>
            <p style="margin: 5px 0 0;">${data.board || 'Not specified'}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">School/College</p>
            <p style="margin: 5px 0 0;">${data.school || 'Not specified'}</p>
          </div>
        </div>
        
        <div style="flex: 1;">
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Subjects</p>
            <p style="margin: 5px 0 0;">${data.subjects?.join(', ') || 'Not specified'}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Tuition Mode</p>
            <p style="margin: 5px 0 0;">${data.tuitionMode === 'home' ? '🏠 Home Tuition' : data.tuitionMode === 'online' ? '💻 Online' : '🔄 Both'}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Preferred Timings</p>
            <p style="margin: 5px 0 0;">${data.preferredTimings || data.time || 'Flexible'}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Days per Week</p>
            <p style="margin: 5px 0 0;">${data.days || 'As per requirement'}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Start Date</p>
            <p style="margin: 5px 0 0;">${data.startDate || 'Immediate'}</p>
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Budget</p>
            <p style="margin: 5px 0 0; font-weight: bold; color: #059669;">💰 ${data.budget}</p>
          </div>
        </div>
      </div>
      
      <!-- Location & Contact -->
      <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div style="flex: 1; background: #eff6ff; padding: 12px; border-radius: 8px;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">📍 Location</p>
          <p style="margin: 5px 0 0;">${data.location}</p>
        </div>
        <div style="flex: 1; background: #eff6ff; padding: 12px; border-radius: 8px;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">📞 Contact</p>
          <p style="margin: 5px 0 0;">${data.contact}</p>
        </div>
      </div>
      
      <!-- Urgency Badge -->
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background: ${data.urgency === 'high' ? '#fee2e2' : data.urgency === 'medium' ? '#fef3c7' : '#d1fae5'}; color: ${data.urgency === 'high' ? '#dc2626' : data.urgency === 'medium' ? '#d97706' : '#059669'}; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold;">
          🔥 Urgency: ${data.urgency?.toUpperCase() || 'MEDIUM'}
        </span>
      </div>
      
      <!-- Requirements -->
      ${data.requirements ? `
        <div style="background: #fef9e3; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: bold; color: #92400e;">📝 Additional Requirements:</p>
          <p style="margin: 0; font-size: 13px; line-height: 1.5;">${data.requirements}</p>
        </div>
      ` : ''}
      
      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 10px; color: #9ca3af;">
          Posted by: ${data.postedBy || 'Excellence Consultants'} | Generated on: ${new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(posterDiv);
  
  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(posterDiv, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const imgWidth = 190; // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`Tutor_Requirement_${data.leadId}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    // Clean up
    document.body.removeChild(posterDiv);
  }
};