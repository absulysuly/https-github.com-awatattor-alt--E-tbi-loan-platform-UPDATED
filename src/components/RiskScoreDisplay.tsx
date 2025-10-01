import React from 'react';
import { Assessment, AssessmentFactor, Language } from '../types/banking';

interface RiskScoreDisplayProps {
  assessment: Assessment;
  lang: Language;
  showExplanation?: boolean;
  onExplainClick?: () => void;
}

export const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = ({
  assessment,
  lang,
  showExplanation = true,
  onExplainClick
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { 
      bg: 'bg-green-100', 
      text: 'text-green-800', 
      ring: 'ring-green-200',
      progress: 'bg-green-500'
    };
    if (score >= 60) return { 
      bg: 'bg-yellow-100', 
      text: 'text-yellow-800', 
      ring: 'ring-yellow-200',
      progress: 'bg-yellow-500'
    };
    return { 
      bg: 'bg-red-100', 
      text: 'text-red-800', 
      ring: 'ring-red-200',
      progress: 'bg-red-500'
    };
  };

  const colors = getScoreColor(assessment.riskScore);

  const texts = {
    riskScore: { en: 'Risk Score', ar: 'نقاط المخاطر', ku: 'خاڵی مەترسی' },
    confidence: { en: 'Confidence', ar: 'الثقة', ku: 'دڵنیایی' },
    topFactors: { en: 'Key Factors', ar: 'العوامل الرئيسية', ku: 'فاکتەرە سەرەکییەکان' },
    whyThisScore: { en: 'Why this score?', ar: 'لماذا هذه النقاط؟', ku: 'بۆچی ئەم خاڵانە؟' },
    modelVersion: { en: 'Model Version', ar: 'إصدار النموذج', ku: 'وەشانی مۆدێل' },
    recommendation: { en: 'Recommendation', ar: 'التوصية', ku: 'پێشنیار' },
    positiveImpact: { en: 'Positive Impact', ar: 'تأثير إيجابي', ku: 'کاریگەری ئەرێنی' },
    negativeImpact: { en: 'Negative Impact', ar: 'تأثير سلبي', ku: 'کاریگەری نەرێنی' }
  };

  const getRecommendationText = (recommendation: string) => {
    const recommendationTexts = {
      approve: { en: 'Approve', ar: 'موافقة', ku: 'پەسەندکردن' },
      conditional: { en: 'Conditional Approval', ar: 'موافقة مشروطة', ku: 'پەسەندکردنی مەرجدار' },
      reject: { en: 'Reject', ar: 'رفض', ku: 'ڕەتکردنەوە' }
    };
    return recommendationTexts[recommendation as keyof typeof recommendationTexts]?.[lang] || recommendation;
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'approve': return 'bg-green-500 text-white';
      case 'conditional': return 'bg-yellow-500 text-white';
      case 'reject': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className={`space-y-4 ${lang === 'ar' || lang === 'ku' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' || lang === 'ku' ? 'rtl' : 'ltr'}>
      {/* Main Score Display */}
      <div className={`${colors.bg} ${colors.ring} ring-1 rounded-lg p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${colors.text} mb-2`}>
              {texts.riskScore[lang]}
            </h3>
            <div className="flex items-baseline space-x-2">
              <span className={`text-4xl font-bold ${colors.text}`}>
                {assessment.riskScore}
              </span>
              <span className={`text-xl ${colors.text} opacity-70`}>
                /100
              </span>
            </div>
            <div className="mt-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${colors.progress}`}
                  style={{ width: `${assessment.riskScore}%` }}
                ></div>
              </div>
            </div>
            <p className={`text-sm ${colors.text} opacity-80 mt-2`}>
              {texts.confidence[lang]}: {Math.round(assessment.confidence * 100)}%
            </p>
          </div>
          
          {/* Traffic Light Indicator */}
          <div className="flex flex-col space-y-2">
            <div className={`w-4 h-4 rounded-full ${assessment.riskScore >= 80 ? 'bg-green-500 shadow-lg shadow-green-300' : 'bg-gray-300'}`}></div>
            <div className={`w-4 h-4 rounded-full ${assessment.riskScore >= 60 && assessment.riskScore < 80 ? 'bg-yellow-500 shadow-lg shadow-yellow-300' : 'bg-gray-300'}`}></div>
            <div className={`w-4 h-4 rounded-full ${assessment.riskScore < 60 ? 'bg-red-500 shadow-lg shadow-red-300' : 'bg-gray-300'}`}></div>
          </div>
        </div>

        {/* Recommendation Badge */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">
              {texts.recommendation[lang]}:
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(assessment.recommendation)}`}>
              {getRecommendationText(assessment.recommendation)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Contributing Factors */}
      {showExplanation && assessment.factors.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">
            {texts.topFactors[lang]}
          </h4>
          
          <div className="space-y-3">
            {assessment.factors.slice(0, 5).map((factor, index) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {factor.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {factor.explanation}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      factor.shapValue > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {factor.shapValue > 0 ? '+' : ''}{Math.round(factor.shapValue * 100)}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      factor.importance === 'high' ? 'bg-red-400' :
                      factor.importance === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} title={factor.importance}></div>
                  </div>
                </div>
                
                {/* SHAP Bar Visualization */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="w-16 text-gray-500">
                    {typeof factor.value === 'number' ? factor.value.toFixed(1) : factor.value}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 relative">
                    <div 
                      className={`absolute top-0 h-2 rounded-full ${
                        factor.shapValue > 0 ? 'bg-green-400' : 'bg-red-400'
                      }`}
                      style={{
                        width: `${Math.abs(factor.shapValue) * 200}%`,
                        maxWidth: '100%',
                        left: factor.shapValue > 0 ? '50%' : 'auto',
                        right: factor.shapValue < 0 ? '50%' : 'auto'
                      }}
                    ></div>
                    <div className="absolute top-0 left-1/2 w-px h-2 bg-gray-400"></div>
                  </div>
                  {factor.sourceDocument && (
                    <span className="text-blue-600 hover:text-blue-800 cursor-pointer text-xs">
                      📄
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {onExplainClick && (
            <button
              onClick={onExplainClick}
              className="mt-4 w-full text-center py-2 px-4 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              {texts.whyThisScore[lang]}
            </button>
          )}
        </div>
      )}

      {/* Model Info */}
      <div className="text-xs text-gray-500 flex items-center justify-between">
        <span>{texts.modelVersion[lang]}: {assessment.modelVersion}</span>
        <span>{new Date(assessment.timestamp).toLocaleString()}</span>
      </div>
    </div>
  );
};