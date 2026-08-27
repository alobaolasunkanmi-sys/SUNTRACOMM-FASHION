import React from "react";
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { X, Check, Edit2, Trash2 } from 'lucide-react';

interface CustomerDetailsModalProps {
  customer: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerDetailsModal({ customer, isOpen, onClose, onSuccess }: CustomerDetailsModalProps) {
  const { token, business } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    address: '',
    gender: 'other',
    notes: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      shoulder: '',
      length: ''
    }
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        fullName: customer.fullName || '',
        phone: customer.phone || '',
        whatsappNumber: customer.whatsappNumber || '',
        email: customer.email || '',
        address: customer.address || '',
        gender: customer.gender || 'other',
        notes: customer.notes || '',
        measurements: customer.measurements || {
          chest: '', waist: '', hips: '', shoulder: '', length: ''
        }
      });
      setIsEditing(false);
      setError('');
    }
  }, [customer, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMeasurementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      measurements: {
        ...formData.measurements,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update customer');

      setIsEditing(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete customer');
      
      onClose();
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const isTailoring = business?.type === 'tailoring' || business?.type === 'both';
  const inputClassName = `w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-sm text-text placeholder-text-muted transition-colors ${!isEditing ? 'opacity-70 cursor-not-allowed bg-surface/50' : ''}`;
  const labelClassName = "block text-xs font-bold uppercase tracking-wider text-text-muted mb-2";

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-[#2D2A26]/40 backdrop-blur-sm">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[48px] sm:border border-border shadow-2xl sm:max-w-2xl flex flex-col overflow-hidden">
        
        <div className="px-6 py-4 sm:px-10 sm:py-6 border-b border-border flex justify-between items-center bg-surface/30 shrink-0">
          <div>
            <h2 className="text-3xl font-serif italic text-primary">
              {isEditing ? 'Edit Customer' : 'Customer Details'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-primary hover:bg-surface rounded-full transition-colors"
                  title="Edit Customer"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-2 text-accent hover:bg-accent/10 rounded-full transition-colors"
                  title="Delete Customer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-text-muted hover:text-primary rounded-full hover:bg-surface transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-2xl text-accent text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className={labelClassName}>Full Name</label>
              <input required disabled={!isEditing} name="fullName" value={formData.fullName} onChange={handleChange} className={inputClassName} />
            </div>
            
            <div>
              <label className={labelClassName}>Phone Number</label>
              <input required disabled={!isEditing} name="phone" value={formData.phone} onChange={handleChange} className={inputClassName} />
            </div>
            
            <div>
              <label className={labelClassName}>WhatsApp Number</label>
              <input disabled={!isEditing} name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} className={inputClassName} />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClassName}>Email Address</label>
              <input type="email" disabled={!isEditing} name="email" value={formData.email} onChange={handleChange} className={inputClassName} />
            </div>

            <div>
              <label className={labelClassName}>Gender</label>
              <select disabled={!isEditing} name="gender" value={formData.gender} onChange={handleChange} className={inputClassName}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelClassName}>Address</label>
              <textarea disabled={!isEditing} name="address" value={formData.address} onChange={handleChange} rows={2} className={inputClassName} />
            </div>
            
            <div className="sm:col-span-2">
              <label className={labelClassName}>Internal Notes</label>
              <textarea disabled={!isEditing} name="notes" value={formData.notes} onChange={handleChange} rows={2} className={inputClassName} />
            </div>
          </div>

          {isTailoring && (
            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-lg font-serif italic text-primary mb-6">Measuring Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <label className={labelClassName}>Chest (in)</label>
                  <input disabled={!isEditing} name="chest" value={formData.measurements.chest} onChange={handleMeasurementChange} className={inputClassName} />
                </div>
                <div>
                  <label className={labelClassName}>Waist (in)</label>
                  <input disabled={!isEditing} name="waist" value={formData.measurements.waist} onChange={handleMeasurementChange} className={inputClassName} />
                </div>
                <div>
                  <label className={labelClassName}>Hips (in)</label>
                  <input disabled={!isEditing} name="hips" value={formData.measurements.hips} onChange={handleMeasurementChange} className={inputClassName} />
                </div>
                <div>
                  <label className={labelClassName}>Shoulder (in)</label>
                  <input disabled={!isEditing} name="shoulder" value={formData.measurements.shoulder} onChange={handleMeasurementChange} className={inputClassName} />
                </div>
                <div>
                  <label className={labelClassName}>Length (in)</label>
                  <input disabled={!isEditing} name="length" value={formData.measurements.length} onChange={handleMeasurementChange} className={inputClassName} />
                </div>
              </div>
            </div>
          )}

          {isEditing && (
            <div className="mt-10 pt-6 border-t border-border flex justify-end gap-4">
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 bg-surface text-text rounded-full text-sm font-bold flex items-center hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-primary text-white rounded-full text-sm font-bold shadow-lg shadow-primary/20 flex items-center hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'} <Check className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
