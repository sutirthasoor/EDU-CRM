import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Tutor } from '@/types';

export const generateTutorProfilePDF = (tutor: Tutor): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [600, 850]
  });

  // Colors
  const primaryColor = [41, 98, 255]; // #2962FF
  const secondaryColor = [100, 116, 139]; // #64748B

  // ===== HEADER =====
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 600, 120, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('TUTOR PROFILE', 300, 50, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(tutor.name, 300, 80, { align: 'center' });
  doc.text(`ID: ${tutor.tutorId}`, 300, 100, { align: 'center' });

  // ===== PROFILE PHOTO =====
  if (tutor.photoBase64) {
    try {
      doc.addImage(tutor.photoBase64, 'JPEG', 250, 130, 100, 100);
    } catch (error) {
      console.warn('Could not add photo to PDF');
    }
  }

  let yPos = 250;

  // ===== PERSONAL INFORMATION =====
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Personal Information', 40, yPos);
  yPos += 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const personalInfo = [
    ['Name:', tutor.name],
    ['Phone:', tutor.phone],
    ['Alternate Phone:', tutor.alternatePhone || '—'],
    ['WhatsApp:', tutor.whatsapp || '—'],
    ['Email:', tutor.email || '—'],
    ['Date of Birth:', tutor.dob || '—'],
    ['Age:', tutor.dob ? `${calculateAge(tutor.dob)} years` : '—'],
  ];

  personalInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 40, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 120, yPos);
    yPos += 18;
  });
  yPos += 10;

  // ===== LOCATION & ADDRESS =====
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Location & Address', 40, yPos);
  yPos += 20;

  doc.setFontSize(12);
  const addressInfo = [
    ['Present Address:', tutor.presentAddress || '—'],
    ['Permanent Address:', tutor.permanentAddress || '—'],
    ['Zone:', tutor.zone || '—'],
    ['Area:', tutor.area || '—'],
    ['Sub Area:', tutor.subArea || '—'],
    ['Specific Location:', tutor.location || '—'],
  ];

  addressInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 40, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 140, yPos);
    yPos += 18;
  });
  yPos += 10;

  // ===== QUALIFICATIONS =====
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Qualifications', 40, yPos);
  yPos += 20;

  doc.setFontSize(12);
  
  // Present Qualification
  doc.setFont('helvetica', 'bold');
  doc.text('Present Qualification:', 40, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(tutor.presentQualification || '—', 160, yPos);
  yPos += 18;

  if (tutor.presentCollegeName) {
    doc.setFont('helvetica', 'bold');
    doc.text('College:', 40, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(tutor.presentCollegeName, 160, yPos);
    yPos += 18;
  }

  if (tutor.presentYear) {
    doc.setFont('helvetica', 'bold');
    doc.text('Year:', 40, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${tutor.presentYear} (${tutor.presentStatus || 'Completed'})`, 160, yPos);
    yPos += 18;
  }

  // Last Qualification
  doc.setFont('helvetica', 'bold');
  doc.text('Last Qualification:', 40, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(tutor.lastQualification || '—', 160, yPos);
  yPos += 18;

  if (tutor.lastCollegeName) {
    doc.setFont('helvetica', 'bold');
    doc.text('College:', 40, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(tutor.lastCollegeName, 160, yPos);
    yPos += 18;
  }

  if (tutor.lastYear) {
    doc.setFont('helvetica', 'bold');
    doc.text('Year:', 40, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(tutor.lastYear, 160, yPos);
    yPos += 18;
  }

  // Class 12 Details
  doc.setFont('helvetica', 'bold');
  doc.text('Class 12:', 40, yPos);
  doc.setFont('helvetica', 'normal');
  const class12Info = [
    tutor.class12SchoolName,
    tutor.class12Board,
    tutor.class12Stream,
    tutor.class12Year
  ].filter(Boolean).join(' • ') || '—';
  doc.text(class12Info, 160, yPos, { maxWidth: 350 });
  yPos += 18;

  // Extra Qualification
  if (tutor.extraCourseName || tutor.extraQualification) {
    doc.setFont('helvetica', 'bold');
    doc.text('Extra:', 40, yPos);
    doc.setFont('helvetica', 'normal');
    
    const extraInfo = [];
    if (tutor.extraCourseName) extraInfo.push(tutor.extraCourseName);
    if (tutor.extraInstituteName) extraInfo.push(`@ ${tutor.extraInstituteName}`);
    if (tutor.extraYear) extraInfo.push(`(${tutor.extraYear})`);
    
    doc.text(extraInfo.join(' ') || tutor.extraQualification || '—', 160, yPos, { maxWidth: 350 });
    yPos += 18;
  }
  yPos += 10;

  // Check if we need a new page
  if (yPos > 700) {
    doc.addPage();
    yPos = 40;
  }

  // ===== TEACHING DETAILS =====
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Teaching Details', 40, yPos);
  yPos += 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Classes Handled:', 40, yPos);
  doc.setFont('helvetica', 'normal');
  const classesText = tutor.classesHandled?.join(', ') || '—';
  doc.text(classesText, 140, yPos, { maxWidth: 350 });
  yPos += 18;

  doc.setFont('helvetica', 'bold');
  doc.text('Subjects Handled:', 40, yPos);
  doc.setFont('helvetica', 'normal');
  const subjectsText = tutor.subjectsHandled?.join(', ') || '—';
  doc.text(subjectsText, 140, yPos, { maxWidth: 350 });
  yPos += 18;

  const teachingInfo = [
    ['Experience:', tutor.teachingExperience || '—'],
    ['Availability:', tutor.availability || '—'],
    ['Preferred Slots:', tutor.preferredSlots || '—'],
    ['Fee Range:', tutor.feeRange || '—'],
    ['Preferred Mode:', tutor.preferredMode || '—'],
  ];

  teachingInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 40, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 140, yPos);
    yPos += 18;
  });
  yPos += 10;

  // ===== RATING & STATUS =====
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Rating & Status', 40, yPos);
  yPos += 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Rating:', 40, yPos);
  doc.setFont('helvetica', 'normal');
  const ratingText = tutor.rating ? `${tutor.rating}/5` : '—';
  doc.text(ratingText, 140, yPos);
  yPos += 18;

  if (tutor.ratingComment) {
    doc.setFont('helvetica', 'bold');
    doc.text('Comment:', 40, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(tutor.ratingComment, 140, yPos, { maxWidth: 350 });
    yPos += 18;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 40, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(tutor.isActive ? 'Active' : 'Inactive', 140, yPos);
  yPos += 18;

  if (tutor.isSchoolOrCollegeTeacher) {
    doc.setFont('helvetica', 'bold');
    doc.text('School/College:', 40, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(tutor.schoolOrCollegeName || '—', 140, yPos);
  }

  // ===== FOOTER =====
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(0, 810, 600, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 300, 830, { align: 'center' });

  // Save PDF
  const filename = `tutor-profile-${tutor.tutorId}.pdf`;
  doc.save(filename);
};

// Helper function to calculate age
const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};