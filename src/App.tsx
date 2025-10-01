import React, { useState, useEffect } from 'react';
import { 
  Application, 
  BusinessSector, 
  GeographicRegion, 
  Language, 
  User, 
  Assessment 
} from './types/banking';
import { 
  SAMPLE_APPLICATIONS, 
  BUSINESS_SECTORS, 
  IRAQI_REGIONS, 
  SAMPLE_USERS,
  UI_TEXT 
} from './data/bankingMockData';
import { ApplicationCard } from './components/ApplicationCard';
import { RiskScoreDisplay } from './components/RiskScoreDisplay';
import { aiService } from './services/aiService';

function App() {
  // Data state
  const [applications, setApplications] = useState<Application[]>(SAMPLE_APPLICATIONS);
  const [sectors, setSectors] = useState<BusinessSector[]>(BUSINESS_SECTORS);
  const [regions, setRegions] = useState<GeographicRegion[]>(IRAQI_REGIONS);
  const [isLoading, setIsLoading] = useState(false);

  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(SAMPLE_USERS[3]); // Default to loan officer
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // UI State
  const [lang, setLang] = useState<Language>('ar'); // Default to Arabic
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Demo state for AI processing
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchQuery || 
      app.title[lang].toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSector = !selectedSector || app.sectorId === selectedSector;
    const matchesRegion = !selectedRegion || app.regionId === selectedRegion;
    const matchesStatus = !selectedStatus || app.status === selectedStatus;

    return matchesSearch && matchesSector && matchesRegion && matchesStatus;
  });

  // Sort applications by risk score (highest first) and then by date
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (a.status === 'under_review' && b.status !== 'under_review') return -1;
    if (b.status === 'under_review' && a.status !== 'under_review') return 1;
    return b.riskScore - a.riskScore;
  });

  // Handle application click
  const handleApplicationClick = (application: Application) => {
    setSelectedApplication(application);
  };

  // Handle AI assessment generation
  const handleGenerateAssessment = async (applicationId: string) => {
    setIsProcessingAI(true);
    try {
      const mockDocumentData = {
        yearsOfExperience: 5,
        businessType: 'Technology Training',
        monthlyRevenue: 8500,
        expenses: 6200,
        requestedAmount: 50000
      };

      const assessment = await aiService.generateRiskAssessment(applicationId, mockDocumentData);
      
      // Update the application with the new assessment
      setApplications(prev => prev.map(app => {
        if (app.id === applicationId) {
          return {
            ...app,
            assessments: [...app.assessments, assessment],
            riskScore: assessment.riskScore,
            riskLevel: assessment.riskLevel,
            aiSummary: assessment.summary,
            updatedAt: new Date()
          };
        }
        return app;
      }));

      // Update selected application if it's the same one
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => prev ? {
          ...prev,
          assessments: [...prev.assessments, assessment],
          riskScore: assessment.riskScore,
          riskLevel: assessment.riskLevel,
          aiSummary: assessment.summary,
          updatedAt: new Date()
        } : null);
      }
    } catch (error) {
      console.error('Error generating assessment:', error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Language switcher
  const LanguageSwitcher = () => (
    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
      {['ar', 'en', 'ku'].map((language) => (
        <button
          key={language}
          onClick={() => setLang(language as Language)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            lang === language 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {language === 'ar' ? 'عربي' : language === 'en' ? 'English' : 'کوردی'}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${lang === 'ar' || lang === 'ku' ? 'font-arabic' : ''}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TB</span>
                </div>
                <div className={`ml-3 ${lang === 'ar' || lang === 'ku' ? 'text-right' : 'text-left'}`}>
                  <h1 className="text-xl font-bold text-gray-900">
                    {lang === 'ar' ? 'بنك التجارة العراقي' : 
                     lang === 'ku' ? 'بانکی بازرگانی عێراق' : 'TBi Bank'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {UI_TEXT.dashboard.title[lang]}
                  </p>
                </div>
              </div>
            </div>

            {/* User info and language switcher */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              {currentUser && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {currentUser.name.charAt(0)}
                    </span>
                  </div>
                  <div className={`${lang === 'ar' || lang === 'ku' ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-600">
                      {currentUser.role === 'loan_officer' ? 
                        (lang === 'ar' ? 'مسؤول القروض' : lang === 'ku' ? 'بەرپرسی قەرز' : 'Loan Officer') :
                        currentUser.role}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Applications List */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {UI_TEXT.dashboard.title[lang]}
              </h2>
              
              {/* Search and Filters */}
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder={UI_TEXT.dashboard.searchPlaceholder[lang]}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    dir={lang === 'ar' || lang === 'ku' ? 'rtl' : 'ltr'}
                  />
                </div>
                
                {/* Filter buttons */}
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedStatus || ''}
                    onChange={(e) => setSelectedStatus(e.target.value || null)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="">{lang === 'ar' ? 'كل الحالات' : lang === 'ku' ? 'هەموو دۆخەکان' : 'All Status'}</option>
                    <option value="under_review">{UI_TEXT.status.under_review[lang]}</option>
                    <option value="conditionally_approved">{UI_TEXT.status.conditionally_approved[lang]}</option>
                    <option value="approved">{UI_TEXT.status.approved[lang]}</option>
                  </select>
                  
                  <select
                    value={selectedSector || ''}
                    onChange={(e) => setSelectedSector(e.target.value || null)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="">{lang === 'ar' ? 'كل القطاعات' : lang === 'ku' ? 'هەموو بوارەکان' : 'All Sectors'}</option>
                    {sectors.map(sector => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name[lang]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Applications Grid */}
            <div className="space-y-4">
              {sortedApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  sector={sectors.find(s => s.id === application.sectorId)}
                  region={regions.find(r => r.id === application.regionId)}
                  lang={lang}
                  onClick={handleApplicationClick}
                />
              ))}
              
              {sortedApplications.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {lang === 'ar' ? 'لا توجد طلبات' : lang === 'ku' ? 'هیچ داواکارییەک نییە' : 'No applications found'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Application Details Panel */}
          <div className="lg:col-span-1">
            {selectedApplication ? (
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
                <div className={`space-y-6 ${lang === 'ar' || lang === 'ku' ? 'text-right' : 'text-left'}`}>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedApplication.title[lang]}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {selectedApplication.description[lang]}
                    </p>
                    <div className="space-y-2 text-sm">
                      <p><strong>{lang === 'ar' ? 'المتقدم:' : lang === 'ku' ? 'داواکار:' : 'Applicant:'}</strong> {selectedApplication.applicantName}</p>
                      <p><strong>{lang === 'ar' ? 'المبلغ:' : lang === 'ku' ? 'بڕ:' : 'Amount:'}</strong> {UI_TEXT.currency.format(selectedApplication.requestedAmount, selectedApplication.currency)}</p>
                      <p><strong>{lang === 'ar' ? 'القطاع:' : lang === 'ku' ? 'بوار:' : 'Sector:'}</strong> {sectors.find(s => s.id === selectedApplication.sectorId)?.name[lang]}</p>
                      <p><strong>{lang === 'ar' ? 'المنطقة:' : lang === 'ku' ? 'ناوچە:' : 'Region:'}</strong> {regions.find(r => r.id === selectedApplication.regionId)?.name[lang]}</p>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  {selectedApplication.assessments.length > 0 ? (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {lang === 'ar' ? 'تقييم المخاطر' : lang === 'ku' ? 'هەڵسەنگاندنی مەترسی' : 'Risk Assessment'}
                      </h4>
                      <RiskScoreDisplay
                        assessment={selectedApplication.assessments[selectedApplication.assessments.length - 1]}
                        lang={lang}
                        showExplanation={true}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 mb-4">
                        {lang === 'ar' ? 'لم يتم إجراء تقييم للمخاطر بعد' : 
                         lang === 'ku' ? 'هێشتا هەڵسەنگاندنی مەترسی نەکراوە' : 
                         'No risk assessment available'}
                      </p>
                      <button
                        onClick={() => handleGenerateAssessment(selectedApplication.id)}
                        disabled={isProcessingAI}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessingAI ? 
                          (lang === 'ar' ? 'جاري المعالجة...' : lang === 'ku' ? 'پرۆسێسکردن...' : 'Processing...') :
                          (lang === 'ar' ? 'إنشاء تقييم AI' : lang === 'ku' ? 'دروستکردنی هەڵسەنگاندنی AI' : 'Generate AI Assessment')
                        }
                      </button>
                    </div>
                  )}

                  {/* Conditions */}
                  {selectedApplication.conditions && selectedApplication.conditions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {lang === 'ar' ? 'الشروط' : lang === 'ku' ? 'مەرجەکان' : 'Conditions'}
                      </h4>
                      <ul className="space-y-1">
                        {selectedApplication.conditions.map((condition, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="text-yellow-500 mr-2">•</span>
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <p className="text-gray-500">
                  {lang === 'ar' ? 'اختر طلباً لعرض التفاصيل' : 
                   lang === 'ku' ? 'داواکارییەک هەڵبژێرە بۆ بینینی وردەکارییەکان' : 
                   'Select an application to view details'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;