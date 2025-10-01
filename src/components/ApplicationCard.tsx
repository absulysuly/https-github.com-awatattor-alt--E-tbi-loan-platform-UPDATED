import React from 'react';
import { 
  Application, 
  BusinessSector, 
  GeographicRegion, 
  Language 
} from '../types/banking';
import { UI_TEXT } from '../data/bankingMockData';

interface ApplicationCardProps {
  application: Application;
  sector?: BusinessSector;
  region?: GeographicRegion;
  lang: Language;
  onClick: (application: Application) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  sector,
  region,
  lang,
  onClick
}) => {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500 text-white';
      case 'conditionally_approved': return 'bg-yellow-500 text-white';
      case 'under_review': return 'bg-blue-500 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      case 'submitted': return 'bg-purple-500 text-white';
      case 'draft': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'IQD') {
      return new Intl.NumberFormat('ar-IQ', {
        style: 'currency',
        currency: 'IQD',
        minimumFractionDigits: 0
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (lang === 'ar') {
      return date.toLocaleDateString('ar-IQ');
    } else if (lang === 'ku') {
      return date.toLocaleDateString('ckb-IQ');
    }
    return date.toLocaleDateString('en-US');
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden ${
        lang === 'ar' || lang === 'ku' ? 'text-right' : 'text-left'
      }`}
      onClick={() => onClick(application)}
      dir={lang === 'ar' || lang === 'ku' ? 'rtl' : 'ltr'}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {application.title[lang]}
            </h3>
            <p className="text-sm text-gray-600">
              {application.applicantName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {sector?.name[lang]} • {region?.name[lang]}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2 ml-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
              {UI_TEXT.status[application.status as keyof typeof UI_TEXT.status]?.[lang] || application.status}
            </span>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(application.riskLevel)}`}>
              {UI_TEXT.risk[application.riskLevel]?.[lang] || application.riskLevel}
            </div>
          </div>
        </div>

        {/* Risk Score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {lang === 'ar' ? 'نقاط المخاطر' : lang === 'ku' ? 'خاڵی مەترسی' : 'Risk Score'}
            </span>
            <span className="text-lg font-bold text-gray-900">
              {application.riskScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                application.riskScore >= 80 ? 'bg-green-500' :
                application.riskScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${application.riskScore}%` }}
            ></div>
          </div>
        </div>

        {/* Amount and Date */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">
              {lang === 'ar' ? 'المبلغ المطلوب' : lang === 'ku' ? 'بڕی داواکراو' : 'Requested Amount'}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(application.requestedAmount, application.currency)}
            </p>
          </div>
          <div className={`${lang === 'ar' || lang === 'ku' ? 'text-left' : 'text-right'}`}>
            <p className="text-sm text-gray-600 mb-1">
              {lang === 'ar' ? 'تاريخ التقديم' : lang === 'ku' ? 'بەرواری پێشکەشکردن' : 'Submitted'}
            </p>
            <p className="text-sm font-medium text-gray-700">
              {formatDate(application.submittedDate)}
            </p>
          </div>
        </div>

        {/* AI Summary Preview */}
        {application.aiSummary && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-blue-600">🤖</span>
              </div>
              <div className={`ml-3 ${lang === 'ar' || lang === 'ku' ? 'text-right' : 'text-left'}`}>
                <p className="text-sm text-blue-800 line-clamp-2">
                  {application.aiSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conditions Preview (if any) */}
        {application.conditions && application.conditions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              {lang === 'ar' ? 'الشروط' : lang === 'ku' ? 'مەرجەکان' : 'Conditions'}:
            </p>
            <div className="flex flex-wrap gap-1">
              {application.conditions.slice(0, 2).map((condition, index) => (
                <span 
                  key={index}
                  className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {condition}
                </span>
              ))}
              {application.conditions.length > 2 && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  +{application.conditions.length - 2} {lang === 'ar' ? 'المزيد' : lang === 'ku' ? 'زیاتر' : 'more'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};