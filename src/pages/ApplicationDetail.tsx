import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { applicationsService, assessmentsService } from '../services/api';
import type { LoanApplication, RiskAssessment } from '../types/api';
import { handleApiError } from '../lib/api-client';

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: notifyError } = useNotification();
  
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'assessment' | 'history'>('details');
  
  // Action modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionComment, setActionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchApplicationDetails();
    }
  }, [id]);

  const fetchApplicationDetails = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError('');
      const [appData, assessmentsData] = await Promise.all([
        applicationsService.getApplicationById(id),
        assessmentsService.getAssessmentsByApplication(id),
      ]);
      setApplication(appData);
      setAssessments(assessmentsData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      await applicationsService.approveApplication(id, actionComment);
      success('Application approved successfully');
      setShowApproveModal(false);
      setActionComment('');
      fetchApplicationDetails();
    } catch (err) {
      notifyError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!id || !actionComment) {
      notifyError('Please provide a reason for rejection');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await applicationsService.rejectApplication(id, actionComment);
      success('Application rejected');
      setShowRejectModal(false);
      setActionComment('');
      fetchApplicationDetails();
    } catch (err) {
      notifyError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canApprove = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const canReview = user?.role === 'UNDERWRITER' || canApprove;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error || 'Application not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const latestAssessment = assessments.length > 0 ? assessments[0] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900 flex items-center mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {application.applicant
                  ? `${application.applicant.firstName} ${application.applicant.lastName}`
                  : 'Loan Application'}
              </h1>
              <p className="text-gray-600 mt-1">Application ID: {application.id.slice(0, 8)}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  application.status === 'APPROVED'
                    ? 'bg-green-100 text-green-700'
                    : application.status === 'REJECTED'
                    ? 'bg-red-100 text-red-700'
                    : application.status === 'UNDER_REVIEW'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {application.status.replace('_', ' ')}
              </span>
              
              {canApprove && application.status === 'UNDER_REVIEW' && (
                <>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {['details', 'assessment', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applicant Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Applicant Information</h2>
              {application.applicant && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Name</label>
                    <p className="font-medium">{`${application.applicant.firstName} ${application.applicant.lastName}`}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-medium">{application.applicant.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phone</label>
                    <p className="font-medium">{application.applicant.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Employment Status</label>
                    <p className="font-medium">{application.applicant.employmentStatus.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Monthly Income</label>
                    <p className="font-medium">${application.applicant.monthlyIncome.toLocaleString()}</p>
                  </div>
                  {application.applicant.creditScore && (
                    <div>
                      <label className="text-sm text-gray-600">Credit Score</label>
                      <p className="font-medium">{application.applicant.creditScore}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Loan Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Loan Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Requested Amount</label>
                  <p className="text-2xl font-bold text-blue-600">${application.amount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Term</label>
                  <p className="font-medium">{application.termMonths} months</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Purpose</label>
                  <p className="font-medium">{application.purpose}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Submitted</label>
                  <p className="font-medium">
                    {application.submittedAt
                      ? new Date(application.submittedAt).toLocaleString()
                      : 'Not yet submitted'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {application.notes && (
              <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                <h2 className="text-lg font-semibold mb-4">Notes</h2>
                <p className="text-gray-700">{application.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assessment' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Risk Assessment</h2>
            {latestAssessment ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Risk Score</p>
                    <p className="text-3xl font-bold">{latestAssessment.riskScore}/100</p>
                  </div>
                  <div>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        latestAssessment.riskCategory === 'LOW'
                          ? 'bg-green-100 text-green-700'
                          : latestAssessment.riskCategory === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-700'
                          : latestAssessment.riskCategory === 'HIGH'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {latestAssessment.riskCategory} RISK
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Recommendation</h3>
                  <p className="text-gray-700">{latestAssessment.recommendation}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Assessed By</h3>
                  <p className="text-gray-700">{latestAssessment.assessor?.name || 'System'}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(latestAssessment.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No risk assessment available yet.</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Application History</h2>
            <div className="space-y-4">
              <div className="border-l-2 border-blue-600 pl-4">
                <p className="font-medium">Application Created</p>
                <p className="text-sm text-gray-600">{new Date(application.createdAt).toLocaleString()}</p>
              </div>
              {application.submittedAt && (
                <div className="border-l-2 border-blue-600 pl-4">
                  <p className="font-medium">Submitted for Review</p>
                  <p className="text-sm text-gray-600">{new Date(application.submittedAt).toLocaleString()}</p>
                </div>
              )}
              {application.reviewedAt && (
                <div className="border-l-2 border-blue-600 pl-4">
                  <p className="font-medium">Reviewed</p>
                  <p className="text-sm text-gray-600">{new Date(application.reviewedAt).toLocaleString()}</p>
                  {application.reviewer && <p className="text-sm text-gray-600">By: {application.reviewer.name}</p>}
                </div>
              )}
              {application.approvedAt && (
                <div className="border-l-2 border-green-600 pl-4">
                  <p className="font-medium text-green-600">Approved</p>
                  <p className="text-sm text-gray-600">{new Date(application.approvedAt).toLocaleString()}</p>
                  {application.approver && <p className="text-sm text-gray-600">By: {application.approver.name}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Approve Application</h3>
            <p className="text-gray-600 mb-4">Add any comments or conditions for approval:</p>
            <textarea
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4"
              rows={4}
              placeholder="Comments (optional)"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
            <textarea
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-4"
              rows={4}
              placeholder="Reason for rejection (required)"
              required
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                disabled={isSubmitting || !actionComment}
              >
                {isSubmitting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
