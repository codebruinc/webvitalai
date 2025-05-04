'use client';

import React, { useState, useEffect } from 'react';
import { getUserAlerts, createAlert, updateAlert, deleteAlert, Alert, getRecentAlertTriggers } from '@/services/alertService';

interface Website {
  id: string;
  name: string;
  url: string;
}

interface AlertManagerProps {
  userId: string;
  websites: Website[];
}

export default function AlertManager({ userId, websites }: AlertManagerProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentTriggers, setRecentTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    websiteId: '',
    metricName: '',
    threshold: 0,
    condition: 'below' as 'above' | 'below',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Available metrics for alerts
  const availableMetrics = [
    { name: 'Performance Score', category: 'performance' },
    { name: 'Accessibility Score', category: 'accessibility' },
    { name: 'SEO Score', category: 'seo' },
    { name: 'Security Score', category: 'security' },
    { name: 'First Contentful Paint', category: 'performance' },
    { name: 'Largest Contentful Paint', category: 'performance' },
    { name: 'Cumulative Layout Shift', category: 'performance' },
    { name: 'Total Blocking Time', category: 'performance' },
    { name: 'Speed Index', category: 'performance' },
  ];

  // Fetch alerts on component mount
  useEffect(() => {
    fetchAlerts();
    fetchRecentTriggers();
  }, [userId]);

  // Fetch alerts from the server
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const userAlerts = await getUserAlerts(userId);
      setAlerts(userAlerts);
    } catch (err) {
      setError('Failed to load alerts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent alert triggers
  const fetchRecentTriggers = async () => {
    try {
      const triggers = await getRecentAlertTriggers(userId);
      setRecentTriggers(triggers);
    } catch (err) {
      console.error('Failed to load recent triggers:', err);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'threshold' ? parseFloat(value) : value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      const newAlert = await createAlert(
        userId,
        formData.websiteId,
        formData.metricName,
        formData.threshold,
        formData.condition
      );
      
      if (newAlert) {
        setAlerts([...alerts, newAlert]);
        setSuccess('Alert created successfully');
        setShowCreateForm(false);
        setFormData({
          websiteId: '',
          metricName: '',
          threshold: 0,
          condition: 'below',
        });
      } else {
        setError('Failed to create alert');
      }
    } catch (err) {
      setError('An error occurred while creating the alert');
      console.error(err);
    }
  };

  // Toggle alert active status
  const toggleAlertStatus = async (alertId: string, currentStatus: boolean) => {
    try {
      const success = await updateAlert(alertId, { isActive: !currentStatus });
      
      if (success) {
        setAlerts(
          alerts.map(alert =>
            alert.id === alertId ? { ...alert, isActive: !currentStatus } : alert
          )
        );
      } else {
        setError('Failed to update alert status');
      }
    } catch (err) {
      setError('An error occurred while updating the alert');
      console.error(err);
    }
  };

  // Delete an alert
  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    
    try {
      const success = await deleteAlert(alertId);
      
      if (success) {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
        setSuccess('Alert deleted successfully');
      } else {
        setError('Failed to delete alert');
      }
    } catch (err) {
      setError('An error occurred while deleting the alert');
      console.error(err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get the appropriate text color based on condition
  const getConditionColor = (condition: string) => {
    return condition === 'above' ? 'text-red-600' : 'text-blue-600';
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Performance Alerts
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Get notified when your website's performance changes
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              {showCreateForm ? 'Cancel' : 'Create Alert'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Create New Alert</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="websiteId" className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <select
                  id="websiteId"
                  name="websiteId"
                  value={formData.websiteId}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Select a website</option>
                  {websites.map((website) => (
                    <option key={website.id} value={website.id}>
                      {website.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="metricName" className="block text-sm font-medium text-gray-700">
                  Metric
                </label>
                <select
                  id="metricName"
                  name="metricName"
                  value={formData.metricName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Select a metric</option>
                  {availableMetrics.map((metric) => (
                    <option key={metric.name} value={metric.name}>
                      {metric.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                  Condition
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="threshold" className="block text-sm font-medium text-gray-700">
                  Threshold
                </label>
                <input
                  type="number"
                  id="threshold"
                  name="threshold"
                  value={formData.threshold}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Create Alert
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Your Alerts</h3>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading alerts...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No alerts configured. Create your first alert to get notified about performance changes.
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Website
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Metric
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Condition
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {(alert as any).websiteName || 'Unknown Website'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {alert.metricName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`font-medium ${getConditionColor(alert.condition)}`}>
                        {alert.condition === 'above' ? 'Above' : 'Below'} {alert.threshold}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${
                        alert.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alert.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => toggleAlertStatus(alert.id, alert.isActive)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        {alert.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {recentTriggers.length > 0 && (
        <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Recent Alerts</h3>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Website
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Metric
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Value
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Threshold
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentTriggers.map((trigger) => (
                  <tr key={trigger.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {formatDate(trigger.triggeredAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {trigger.websiteName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {trigger.metricName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-red-600">
                      {trigger.metricValue}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`font-medium ${getConditionColor(trigger.condition)}`}>
                        {trigger.condition === 'above' ? 'Above' : 'Below'} {trigger.threshold}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}