import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Phone, MessageCircle, Heart, Sparkles, Award, Clock, Code, Zap, Mail, MapPin, TrendingUp } from 'lucide-react';

interface AppLayoutProps {
  title?: string;
  children: ReactNode;
  onNewLead?: () => void;
}

export default function AppLayout({ title, children, onNewLead }: AppLayoutProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title || "Dashboard"} onNewLead={onNewLead} />
        <main className="flex-1 overflow-y-auto">
          {children}
          
          {/* High Contrast Footer */}
          <footer className="relative mt-12 border-t-2 border-primary/30 bg-gradient-to-r from-primary via-primary/95 to-primary/90 overflow-hidden">
            {/* Bold background pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }} />
            
            {/* Animated accent lines */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse" />
            
            <div className="relative container mx-auto px-6 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                
                {/* Left Section - Developer Credit - Bold */}
                <div className="flex flex-col items-center md:items-start gap-3">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <div className="relative">
                    </div>
                    <span className="text-sm font-bold text-white">
                      Systems Solutions Pvt. Ltd.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <span className="text-sm font-medium">Developed with ❤️ for education</span>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-200">
                    <Award className="w-4 h-4" />
                    <span className="text-xs font-semibold">Premium Home Tuition Solutions Since 2015</span>
                  </div>
                </div>
                
                {/* Center Section - Copyright - Bold */}
                <div className="text-center bg-white/15 backdrop-blur-sm rounded-xl px-6 py-3">
                  <div className="flex items-center gap-2 justify-center mb-2">
                    <Zap className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-bold text-white">TutorMatch CRM</span>
                    <span className="text-xs bg-yellow-400 text-primary px-2 py-0.5 rounded-full font-bold">v5.0</span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    © {currentYear} Excellence Consultants
                  </p>
                  <p className="text-xs text-white/80 mt-1">
                    Empowering Education Through Technology
                  </p>
                </div>
                
                {/* Right Section - Contact - Bold */}
                <div className="flex flex-col items-center md:items-end gap-3">
                  <div className="flex flex-col gap-2">
                    <a 
                      href="tel:+919937191669" 
                      className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 transition-all duration-300 shadow-lg hover:shadow-xl"
                      title="Call Us"
                    >
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-xs text-primary px-2 py-0.5l">Call Now</span>
                    </a>
                    <a 
                      href="https://wa.me/919937191669" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-green-500 hover:bg-green-400 transition-all duration-300 shadow-lg hover:shadow-xl"
                      title="WhatsApp Us"
                    >
                      <MessageCircle className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white">WhatsApp Us</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Mon - Sat: 9:00 AM - 7:00 PM</span>
                    <span className="w-1 h-1 rounded-full bg-yellow-400"></span>
                    <span className="font-semibold text-yellow-200">Emergency Support: 24/7</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/70 text-xs">
                    <Mail className="w-3 h-3" />
                    <span>support@excellenceconsultants.in</span>
                    <MapPin className="w-3 h-3" />
                    <span>Kolkata, India</span>
                  </div>
                </div>
              </div>
              
              {/* Bottom decorative bar */}
              <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap justify-center gap-4 text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  500+ Students Placed
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  200+ Expert Tutors
                </span>
                <span>•</span>
                <span>98% Satisfaction Rate</span>
                <span>•</span>
                <span>ISO Certified Partner</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}