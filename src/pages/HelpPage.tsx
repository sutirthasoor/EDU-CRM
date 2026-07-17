import React, { useState, useEffect } from 'react';
import { Calculator, School, BookOpen, Clock, IndianRupee, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useTutors } from '../hooks/useTutors';
import { useLeads } from '../hooks/useLeads';
import { useClasses } from '../hooks/useClasses';
import { useSubjects } from '../hooks/useSubjects';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
interface BudgetSuggestion {
  min: number;
  max: number;
  average: number;
  tutors: number;
  level: 'low' | 'medium' | 'high';
}

interface BoardInfo {
  name: string;
  commonSchools: string[];
  curriculum: string;
  examPattern: string;
}

export default function HelpPage() {
  const { tutors } = useTutors();
  const { leads } = useLeads();
  const { classes, loading: classesLoading } = useClasses();
  const { subjects, loading: subjectsLoading } = useSubjects();
    console.log('🔍 DEBUG - Classes from hook:', classes);
  console.log('🔍 DEBUG - Classes loading:', classesLoading);
  console.log('🔍 DEBUG - Subjects from hook:', subjects);
  console.log('🔍 DEBUG - Subjects loading:', subjectsLoading);
  // Create active arrays
  const activeClasses = classes?.filter(c => c.isActive) || [];
  const activeSubjects = subjects?.filter(s => s.isActive) || [];
  
  const [activeTab, setActiveTab] = useState<'budget' | 'board'>('budget');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedMode, setSelectedMode] = useState<'home' | 'online' | 'both'>('both');
  const [schoolName, setSchoolName] = useState('');
  const [budgetResult, setBudgetResult] = useState<BudgetSuggestion | null>(null);
  const [boardResult, setBoardResult] = useState<BoardInfo | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Board database
  const boardDatabase: BoardInfo[] = [
    {
      name: 'CBSE',
      commonSchools: [
        'Delhi Public School', 'DPS', 'Kendriya Vidyalaya', 'KV',
        'Army Public School', 'APS', 'Sanskriti School', 'Springdales',
        'Modern School', 'Bluebells', 'Amity International'
      ],
      curriculum: 'NCERT based curriculum, focuses on Science and Mathematics',
      examPattern: 'Two term exams, objective and subjective questions'
    },
    {
      name: 'ICSE',
      commonSchools: [
        'The Assembly of God Church School', 'La Martiniere', 'St. Xavier\'s',
        'Calcutta Boys\' School', 'Loreto House', 'Pratt Memorial',
        'Julien Day School', 'Frank Anthony', 'Bishop Cotton'
      ],
      curriculum: 'Detailed curriculum with emphasis on English and practicals',
      examPattern: 'Annual exams with extensive practical assessments'
    },
    {
      name: 'ISC',
      commonSchools: [
        'St. James\' School', 'St. Paul\'s School', 'Don Bosco',
        'Holy Child School', 'St. Joseph\'s College', 'Cathedral School'
      ],
      curriculum: 'Advanced level, prepares for competitive exams',
      examPattern: 'Comprehensive annual exams with projects'
    },
    {
      name: 'State Board',
      commonSchools: [
        'Government High School', 'Zilla Parishad School', 'Municipal School',
        'Sarvodaya Vidyalaya', 'Model School', 'Adarsh Vidyalaya'
      ],
      curriculum: 'State-specific curriculum, regional language focus',
      examPattern: 'Annual exams prescribed by state education board'
    },
    {
      name: 'IB',
      commonSchools: [
        'Oberoi International', 'Aditya Birla World Academy', 'D Y Patil International',
        'Oakridge International', 'Canadian International', 'American School'
      ],
      curriculum: 'International curriculum, inquiry-based learning',
      examPattern: 'Continuous assessment with final exams'
    },
    {
      name: 'IGCSE',
      commonSchools: [
        'Cambridge School', 'The British School', 'Woodstock School',
        'The International School', 'Pathways World School'
      ],
      curriculum: 'Cambridge curriculum, flexible subject choices',
      examPattern: 'Cambridge International Examinations'
    }
  ];

  // Calculate budget based on class, subject, and mode
// Calculate budget based on class, subject, and mode
const calculateBudget = () => {
  console.log('🔍 Calculating budget with:', { selectedClass, selectedSubject, selectedMode });
  
  if (!selectedClass || !selectedSubject) {
    toast.error('Please select both class and subject');
    return;
  }

  // Get tutors matching criteria
  const relevantTutors = tutors?.filter(tutor => {
    // Check if tutor handles this class
    const handlesClass = tutor.classesHandled?.some(c => 
      c.toLowerCase().includes(selectedClass.toLowerCase()) ||
      selectedClass.toLowerCase().includes(c.toLowerCase())
    );
    
    // Check if tutor handles this subject
    const handlesSubject = tutor.subjectsHandled?.some(s => 
      s.toLowerCase().includes(selectedSubject.toLowerCase()) ||
      selectedSubject.toLowerCase().includes(s.toLowerCase())
    );
    
    // Check mode preference
    const modeMatches = selectedMode === 'both' || 
                       tutor.preferredMode === selectedMode ||
                       tutor.preferredMode === 'both';
    
    return handlesClass && handlesSubject && modeMatches && tutor.isActive;
  }) || [];

  console.log('📊 Relevant tutors found:', relevantTutors.length);
  console.log('📊 Tutor data:', relevantTutors);

  if (relevantTutors.length === 0) {
    toast.error('No tutors found matching your criteria');
    setBudgetResult(null);
    return;
  }

  // Extract fee ranges with better parsing
  const fees = relevantTutors
    .map(t => {
      const feeStr = t.feeRange || '';
      console.log(`💰 Fee string for ${t.name}:`, feeStr);
      
      // Try to extract numbers from various formats
      const numbers = feeStr.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        // If range like "500-800", take the average
        if (numbers.length >= 2) {
          const min = parseInt(numbers[0]);
          const max = parseInt(numbers[1]);
          return Math.round((min + max) / 2);
        }
        // If single number like "500", use that
        return parseInt(numbers[0]);
      }
      
      // Check for fee in other fields (some tutors might have fee in location or notes)
      const locationFee = t.location?.match(/\d+/g);
      if (locationFee) return parseInt(locationFee[0]);
      
      return null;
    })
    .filter((fee): fee is number => fee !== null && fee > 0);

  console.log('💰 Parsed fees:', fees);

  if (fees.length === 0) {
    // Use default values based on class level
    const classNum = parseInt(selectedClass) || 0;
    let defaultMin = 500, defaultMax = 2000;
    
    if (classNum <= 5) {
      defaultMin = 300; defaultMax = 800;
    } else if (classNum <= 8) {
      defaultMin = 400; defaultMax = 1000;
    } else if (classNum <= 10) {
      defaultMin = 500; defaultMax = 1200;
    } else if (classNum <= 12) {
      defaultMin = 600; defaultMax = 1500;
    } else {
      defaultMin = 800; defaultMax = 2500;
    }

    setBudgetResult({
      min: defaultMin,
      max: defaultMax,
      average: Math.round((defaultMin + defaultMax) / 2),
      tutors: relevantTutors.length,
      level: defaultMin < 600 ? 'low' : defaultMin < 1000 ? 'medium' : 'high'
    });
    return;
  }

  const min = Math.min(...fees);
  const max = Math.max(...fees);
  const avg = Math.round(fees.reduce((a, b) => a + b, 0) / fees.length);

  // Determine budget level
  let level: 'low' | 'medium' | 'high' = 'medium';
  if (avg < 600) level = 'low';
  else if (avg > 1200) level = 'high';

  setBudgetResult({
    min,
    max,
    average: avg,
    tutors: relevantTutors.length,
    level
  });

  toast.success(`Found ${relevantTutors.length} tutors matching your criteria`);
}; // <-- Make sure this closing brace is here

// Debug Panel - Move this OUTSIDE the function, put it in your JSX where you want it
// Place this in your return statement where you want the debug info to appear
  // Find board based on school name
  const findBoard = () => {
    if (!schoolName.trim()) return;

    const searchTerm = schoolName.toLowerCase().trim();
    
    // Search in board database
    for (const board of boardDatabase) {
      const match = board.commonSchools.some(school => 
        searchTerm.includes(school.toLowerCase()) ||
        school.toLowerCase().includes(searchTerm)
      );
      
      if (match) {
        setBoardResult(board);
        return;
      }
    }

    // If no match found, suggest based on common patterns
    if (searchTerm.includes('dps') || searchTerm.includes('delhi public')) {
      setBoardResult(boardDatabase.find(b => b.name === 'CBSE') || null);
    } else if (searchTerm.includes('st.') || searchTerm.includes('saint')) {
      setBoardResult(boardDatabase.find(b => b.name === 'ICSE') || null);
    } else if (searchTerm.includes('international')) {
      setBoardResult(boardDatabase.find(b => b.name === 'IB') || null);
    } else if (searchTerm.includes('cambridge')) {
      setBoardResult(boardDatabase.find(b => b.name === 'IGCSE') || null);
    } else {
      // Default to most common
      setBoardResult(boardDatabase.find(b => b.name === 'CBSE') || null);
    }
  };

  // FAQ data
  const faqs = [
    {
      question: 'How is tuition fee calculated?',
      answer: 'Fees are calculated based on actual tutor data in our database. We analyze fees charged by tutors teaching similar subjects and classes in your area.'
    },
    {
      question: 'Why do fees vary so much?',
      answer: 'Fees vary based on tutor qualifications, experience, location, and demand for specific subjects. Premium tutors with advanced degrees typically charge higher fees.'
    },
    {
      question: 'Is online tuition cheaper than home tuition?',
      answer: 'Generally yes. Online tuition fees are often 20-30% lower than home tuition as tutors save on travel time and costs.'
    },
    {
      question: 'How accurate is the board finder?',
      answer: 'The board finder uses our database of schools across India. While we strive for accuracy, we recommend confirming with the school directly.'
    },
    {
      question: 'What if I can\'t find my school?',
      answer: 'You can contact us directly, and our counselors will help identify the correct board for your school.'
    }
  ];

  return (
    <AppLayout title="Help Center">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">How Can We Help You?</h1>
          <p className="text-muted-foreground">Budget calculator & board finder powered by real data</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab('budget')}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition-all',
                activeTab === 'budget'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Calculator size={18} />
              Budget Calculator
            </button>
            <button
              onClick={() => setActiveTab('board')}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition-all',
                activeTab === 'board'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <School size={18} />
              Board Finder
            </button>
          </div>
        </div>

        {/* Budget Calculator Tab */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator size={20} className="text-primary" />
                  Estimate Tuition Fees
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
  <label className="text-sm font-medium mb-1 block">Class</label>
  <select
    value={selectedClass}
    onChange={(e) => setSelectedClass(e.target.value)}
    className="w-full px-3 py-2 border border-border rounded-md bg-background"
    disabled={classesLoading}
  >
    <option value="">{classesLoading ? 'Loading classes...' : 'Select Class'}</option>
    {activeClasses.map(cls => (
      <option key={cls.id} value={cls.name}>
        {cls.displayName || cls.name}
      </option>
    ))}
  </select>
</div>
                  
                  <div>
  <label className="text-sm font-medium mb-1 block">Subject</label>
  <select
    value={selectedSubject}
    onChange={(e) => setSelectedSubject(e.target.value)}
    className="w-full px-3 py-2 border border-border rounded-md bg-background"
    disabled={subjectsLoading}
  >
    <option value="">{subjectsLoading ? 'Loading subjects...' : 'Select Subject'}</option>
    {activeSubjects.map(subject => (
      <option key={subject.id} value={subject.name}>
        {subject.name}
      </option>
    ))}
  </select>
</div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Mode</label>
                    <select
                      value={selectedMode}
                      onChange={(e) => setSelectedMode(e.target.value as any)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    >
                      <option value="both">Both</option>
                      <option value="home">Home Tuition</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </div>
                
                <Button 
  onClick={() => {
    console.log('🔵 BUTTON CLICKED at:', new Date().toISOString());
    console.log('Current values:', { 
      selectedClass, 
      selectedSubject, 
      selectedMode,
      tutorsCount: tutors?.length 
    });
    calculateBudget();
  }} 
  className="w-full"
>
  Calculate Estimated Budget
</Button>
              </CardContent>
            </Card>

            {budgetResult && (
              <Card className="animate-in fade-in slide-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee size={20} className="text-primary" />
                    Estimated Budget Range
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Minimum</p>
                      <p className="text-3xl font-bold text-blue-700">₹{budgetResult.min}</p>
                      <p className="text-xs text-blue-500 mt-1">per hour</p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Average</p>
                      <p className="text-3xl font-bold text-green-700">₹{budgetResult.average}</p>
                      <p className="text-xs text-green-500 mt-1">per hour</p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">Maximum</p>
                      <p className="text-3xl font-bold text-purple-700">₹{budgetResult.max}</p>
                      <p className="text-xs text-purple-500 mt-1">per hour</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Budget Level:</span>
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        budgetResult.level === 'low' ? 'bg-green-100 text-green-700' :
                        budgetResult.level === 'high' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      )}>
                        {budgetResult.level === 'low' ? '🟢 Affordable' :
                         budgetResult.level === 'high' ? '🔴 Premium' : '🟡 Moderate'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on {budgetResult.tutors} tutors teaching {selectedSubject} for {selectedClass}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Board Finder Tab */}
        {activeTab === 'board' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School size={20} className="text-primary" />
                  Find Your Board by School Name
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">School Name</label>
                  <Input
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Enter your school name (e.g. DPS, St. Xavier's, Kendriya Vidyalaya)"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter full school name or common abbreviation
                  </p>
                </div>
                
                <Button onClick={findBoard} className="w-full">
                  Find Board
                </Button>
              </CardContent>
            </Card>

            {boardResult && (
              <Card className="animate-in fade-in slide-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen size={20} className="text-primary" />
                    {boardResult.name} Board
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Curriculum</p>
                    <p className="font-medium">{boardResult.curriculum}</p>
                  </div>
                  
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">Exam Pattern</p>
                    <p className="font-medium">{boardResult.examPattern}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Common Schools:</p>
                    <div className="flex flex-wrap gap-2">
                      {boardResult.commonSchools.slice(0, 8).map((school, i) => (
                        <span key={i} className="text-xs bg-secondary px-2 py-1 rounded-full">
                          {school}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <HelpCircle size={20} className="text-primary" />
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-left">{faq.question}</span>
                  {faqOpen === index ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </button>
                
                {faqOpen === index && (
                  <div className="px-4 py-3 bg-muted/20 border-t border-border">
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{tutors?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Tutors in Database</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{leads?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Leads Processed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{classes?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Classes Available</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{subjects?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Subjects Covered</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}