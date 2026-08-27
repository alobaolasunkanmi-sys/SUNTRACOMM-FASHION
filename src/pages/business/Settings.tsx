import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Settings as SettingsIcon, Shield, Users, Bell, MessageSquare, CreditCard, Lock } from 'lucide-react';
import clsx from 'clsx';
import StaffManagement from '../../components/settings/StaffManagement';
import SecuritySettings from '../../components/settings/SecuritySettings';
import BusinessProfileSettings from '../../components/settings/BusinessProfileSettings';
import WhatsAppSettings from '../../components/settings/WhatsAppSettings';

export default function Settings() {
  const { user, business } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Business Profile', icon: SettingsIcon, allowed: ['admin'] },
    { id: 'security', name: 'Account & Security', icon: Shield, allowed: ['admin', 'staff'] },
    { id: 'staff', name: 'Staff Management', icon: Users, allowed: ['admin'] },
    { id: 'roles', name: 'Roles & Permissions', icon: Lock, allowed: ['admin'] },
    { id: 'notifications', name: 'Notifications', icon: Bell, allowed: ['admin', 'staff'] },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, allowed: ['admin'] },
    { id: 'payment', name: 'Payment Settings', icon: CreditCard, allowed: ['admin'] },
  ];

  const filteredTabs = tabs.filter(tab => tab.allowed.includes(user?.role || ''));

  // Ensure active tab is allowed, otherwise default to security for staff
  useEffect(() => {
    if (user?.role === 'staff' && activeTab !== 'security' && activeTab !== 'notifications') {
      setActiveTab('security');
    }
  }, [user?.role, activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between mb-8">
        <h1 className="text-5xl font-serif italic text-primary">Settings</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0 space-y-1">
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors text-left',
                activeTab === tab.id 
                  ? 'bg-primary text-white' 
                  : 'text-text-muted hover:bg-surface hover:text-primary'
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0 bg-white border border-border rounded-[32px] p-8 shadow-sm">
          {activeTab === 'profile' && <BusinessProfileSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'staff' && <StaffManagement />}
          {activeTab === 'whatsapp' && <WhatsAppSettings />}
          
          {['roles', 'notifications', 'payment'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
                <SettingsIcon className="w-8 h-8 text-primary opacity-40" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Coming Soon</h3>
              <p className="text-sm text-text-muted">This settings module is under development.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
