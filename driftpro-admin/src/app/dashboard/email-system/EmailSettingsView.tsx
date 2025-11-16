'use client';

/**
 * Email Settings View Component
 * 
 * Complete Outlook-like settings page with:
 * - Auto-reply configuration
 * - Signatures
 * - Auto-mark as read settings
 * - All Outlook settings
 */

import React, { useState, useEffect } from 'react';
import { Settings, Save, Mail, User, Bell, Clock, FileText, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface EmailSettings {
  // General
  autoMarkAsRead: boolean;
  markAsReadDelay: number; // milliseconds
  autoRefreshInterval: number; // seconds
  
  // Auto-reply
  autoReplyEnabled: boolean;
  autoReplySubject: string;
  autoReplyMessage: string;
  autoReplyStartDate?: string;
  autoReplyEndDate?: string;
  autoReplyOnlyToContacts: boolean;
  
  // Signatures
  defaultSignature: string;
  signatures: Array<{
    id: string;
    name: string;
    content: string;
    isDefault: boolean;
  }>;
  
  // Reading
  readingPanePosition: 'right' | 'bottom' | 'off';
  compactView: boolean;
  conversationView: boolean;
  
  // Notifications
  desktopNotifications: boolean;
  soundNotifications: boolean;
  notificationOnNewMail: boolean;
  
  // Sending
  saveSentItems: boolean;
  requestReadReceipts: boolean;
  requestDeliveryReceipts: boolean;
  
  // Filters and Rules
  autoArchive: boolean;
  autoArchiveDays: number;
  autoDeleteJunk: boolean;
  autoDeleteJunkDays: number;
}

interface EmailSettingsViewProps {
  userProfile: any;
  onSave: (settings: EmailSettings) => void;
}

export default function EmailSettingsView({ userProfile, onSave }: EmailSettingsViewProps) {
  const [settings, setSettings] = useState<EmailSettings>(() => {
    const saved = localStorage.getItem('emailSettings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      autoMarkAsRead: true,
      markAsReadDelay: 0,
      autoRefreshInterval: 30,
      autoReplyEnabled: false,
      autoReplySubject: '',
      autoReplyMessage: '',
      autoReplyOnlyToContacts: false,
      defaultSignature: '',
      signatures: [],
      readingPanePosition: 'right',
      compactView: false,
      conversationView: true,
      desktopNotifications: true,
      soundNotifications: true,
      notificationOnNewMail: true,
      saveSentItems: true,
      requestReadReceipts: false,
      requestDeliveryReceipts: false,
      autoArchive: false,
      autoArchiveDays: 30,
      autoDeleteJunk: false,
      autoDeleteJunkDays: 30,
    };
  });
  
  const [activeTab, setActiveTab] = useState<'general' | 'autoReply' | 'signatures' | 'reading' | 'notifications' | 'sending' | 'filters'>('general');
  const [newSignature, setNewSignature] = useState({ name: '', content: '' });
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  const handleSave = () => {
    onSave(settings);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };
  
  const addSignature = () => {
    if (!newSignature.name || !newSignature.content) {
      alert('Vennligst fyll ut navn og innhold for signaturen');
      return;
    }
    
    const signature = {
      id: Date.now().toString(),
      name: newSignature.name,
      content: newSignature.content,
      isDefault: settings.signatures.length === 0
    };
    
    setSettings({
      ...settings,
      signatures: [...settings.signatures, signature],
      defaultSignature: signature.isDefault ? signature.id : settings.defaultSignature
    });
    
    setNewSignature({ name: '', content: '' });
  };
  
  const setDefaultSignature = (id: string) => {
    setSettings({
      ...settings,
      signatures: settings.signatures.map(sig => ({
        ...sig,
        isDefault: sig.id === id
      })),
      defaultSignature: id
    });
  };
  
  const deleteSignature = (id: string) => {
    setSettings({
      ...settings,
      signatures: settings.signatures.filter(sig => sig.id !== id),
      defaultSignature: settings.defaultSignature === id ? '' : settings.defaultSignature
    });
  };
  
  const tabs = [
    { id: 'general', label: 'Generelt', icon: Settings },
    { id: 'autoReply', label: 'Autosvar', icon: Mail },
    { id: 'signatures', label: 'Signaturer', icon: FileText },
    { id: 'reading', label: 'Lesing', icon: User },
    { id: 'notifications', label: 'Varsler', icon: Bell },
    { id: 'sending', label: 'Sending', icon: Mail },
    { id: 'filters', label: 'Filtre', icon: Settings },
  ];
  
  return (
    <div style={{
      flex: 1,
      overflow: 'auto',
      background: 'var(--background-color)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--surface-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: '700',
              color: 'var(--text-color)',
              marginBottom: '0.5rem'
            }}>
              E-postinnstillinger
            </h1>
            <p style={{ color: 'var(--gray-500)', fontSize: 'var(--font-size-sm)' }}>
              Konfigurer alle Outlook-innstillinger
            </p>
          </div>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Save size={18} />
            Lagre alle innstillinger
          </button>
        </div>
        {showSaveSuccess && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'var(--green-100)',
            color: 'var(--green-700)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle size={18} />
            Innstillinger lagret!
          </div>
        )}
      </div>
      
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--surface-color)',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.75rem 1.5rem',
                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-color)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        {/* General Settings */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-color)' }}>
                Generelle innstillinger
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.25rem', display: 'block' }}>
                      Marker automatisk som lest når e-post åpnes
                    </label>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                      E-poster markeres automatisk som lest når du klikker på dem
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={settings.autoMarkAsRead}
                      onChange={(e) => setSettings({ ...settings, autoMarkAsRead: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: settings.autoMarkAsRead ? 'var(--primary)' : 'var(--gray-300)',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: settings.autoMarkAsRead ? '24px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>
                
                <div>
                  <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                    Forsinkelse før automatisk markering som lest (millisekunder)
                  </label>
                  <input
                    type="number"
                    value={settings.markAsReadDelay}
                    onChange={(e) => setSettings({ ...settings, markAsReadDelay: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-color)',
                      color: 'var(--text-color)'
                    }}
                    min="0"
                    step="100"
                  />
                </div>
                
                <div>
                  <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                    Auto-oppdatering intervall (sekunder)
                  </label>
                  <input
                    type="number"
                    value={settings.autoRefreshInterval}
                    onChange={(e) => setSettings({ ...settings, autoRefreshInterval: parseInt(e.target.value) || 30 })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-color)',
                      color: 'var(--text-color)'
                    }}
                    min="10"
                    step="10"
                  />
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                    Hvor ofte e-postlisten skal oppdateres automatisk
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-Reply Settings */}
        {activeTab === 'autoReply' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-color)' }}>
                Autosvar (Out of Office)
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.25rem', display: 'block' }}>
                      Aktiver autosvar
                    </label>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                      Send automatisk svar på innkommende e-poster
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={settings.autoReplyEnabled}
                      onChange={(e) => setSettings({ ...settings, autoReplyEnabled: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: settings.autoReplyEnabled ? 'var(--primary)' : 'var(--gray-300)',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: settings.autoReplyEnabled ? '24px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>
                
                {settings.autoReplyEnabled && (
                  <>
                    <div>
                      <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                        Emne
                      </label>
                      <input
                        type="text"
                        value={settings.autoReplySubject}
                        onChange={(e) => setSettings({ ...settings, autoReplySubject: e.target.value })}
                        placeholder="Fravær / Out of Office"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface-color)',
                          color: 'var(--text-color)'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                        Melding
                      </label>
                      <textarea
                        value={settings.autoReplyMessage}
                        onChange={(e) => setSettings({ ...settings, autoReplyMessage: e.target.value })}
                        placeholder="Takk for din e-post. Jeg er borte fra kontoret..."
                        rows={8}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface-color)',
                          color: 'var(--text-color)',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                          Startdato
                        </label>
                        <input
                          type="datetime-local"
                          value={settings.autoReplyStartDate || ''}
                          onChange={(e) => setSettings({ ...settings, autoReplyStartDate: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--surface-color)',
                            color: 'var(--text-color)'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                          Sluttdato
                        </label>
                        <input
                          type="datetime-local"
                          value={settings.autoReplyEndDate || ''}
                          onChange={(e) => setSettings({ ...settings, autoReplyEndDate: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--surface-color)',
                            color: 'var(--text-color)'
                          }}
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.25rem', display: 'block' }}>
                          Send kun til kontakter
                        </label>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                          Send autosvar kun til personer i din kontaktliste
                        </p>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                        <input
                          type="checkbox"
                          checked={settings.autoReplyOnlyToContacts}
                          onChange={(e) => setSettings({ ...settings, autoReplyOnlyToContacts: e.target.checked })}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: settings.autoReplyOnlyToContacts ? 'var(--primary)' : 'var(--gray-300)',
                          borderRadius: '24px',
                          transition: '0.3s'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: '18px',
                            width: '18px',
                            left: settings.autoReplyOnlyToContacts ? '24px' : '3px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: '0.3s'
                          }} />
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Signatures */}
        {activeTab === 'signatures' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-color)' }}>
                Signaturer
              </h2>
              
              {/* Existing Signatures */}
              {settings.signatures.length > 0 && (
                <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {settings.signatures.map(sig => (
                    <div
                      key={sig.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        background: sig.isDefault ? 'var(--primary)10' : 'var(--surface-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ color: 'var(--text-color)' }}>{sig.name}</strong>
                          {sig.isDefault && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              background: 'var(--primary)',
                              color: 'white',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 'var(--font-size-xs)'
                            }}>
                              Standard
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {!sig.isDefault && (
                            <button
                              onClick={() => setDefaultSignature(sig.id)}
                              className="btn btn-secondary"
                              style={{ fontSize: 'var(--font-size-xs)', padding: '0.5rem 1rem' }}
                            >
                              Sett som standard
                            </button>
                          )}
                          <button
                            onClick={() => deleteSignature(sig.id)}
                            className="btn btn-secondary"
                            style={{ fontSize: 'var(--font-size-xs)', padding: '0.5rem 1rem', color: 'var(--red-600)' }}
                          >
                            Slett
                          </button>
                        </div>
                      </div>
                      <div
                        style={{
                          padding: '0.75rem',
                          background: 'var(--background-color)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-color)',
                          fontSize: 'var(--font-size-sm)',
                          whiteSpace: 'pre-wrap'
                        }}
                        dangerouslySetInnerHTML={{ __html: sig.content }}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add New Signature */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-color)' }}>
                  Legg til ny signatur
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                      Navn
                    </label>
                    <input
                      type="text"
                      value={newSignature.name}
                      onChange={(e) => setNewSignature({ ...newSignature, name: e.target.value })}
                      placeholder="F.eks. Jobb, Personlig"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-color)',
                        color: 'var(--text-color)'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                      Innhold
                    </label>
                    <textarea
                      value={newSignature.content}
                      onChange={(e) => setNewSignature({ ...newSignature, content: e.target.value })}
                      placeholder="Med vennlig hilsen,&#10;Ditt navn&#10;Din stilling"
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-color)',
                        color: 'var(--text-color)',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  
                  <button
                    onClick={addSignature}
                    className="btn btn-primary"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Legg til signatur
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Reading Settings */}
        {activeTab === 'reading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-color)' }}>
                Lesingsinnstillinger
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                    Lesepanel posisjon
                  </label>
                  <select
                    value={settings.readingPanePosition}
                    onChange={(e) => setSettings({ ...settings, readingPanePosition: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-color)',
                      color: 'var(--text-color)'
                    }}
                  >
                    <option value="right">Høyre</option>
                    <option value="bottom">Bunn</option>
                    <option value="off">Av</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.25rem', display: 'block' }}>
                      Kompakt visning
                    </label>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                      Vis mindre informasjon i e-postlisten
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={settings.compactView}
                      onChange={(e) => setSettings({ ...settings, compactView: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: settings.compactView ? 'var(--primary)' : 'var(--gray-300)',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: settings.compactView ? '24px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.25rem', display: 'block' }}>
                      Samtalevisning
                    </label>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                      Grupper relaterte e-poster i samtaler
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={settings.conversationView}
                      onChange={(e) => setSettings({ ...settings, conversationView: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: settings.conversationView ? 'var(--primary)' : 'var(--gray-300)',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: settings.conversationView ? '24px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-color)' }}>
                Varsler
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.25rem', display: 'block' }}>
                      Skrivebordsvarsler
                    </label>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                      Vis varsler på skrivebordet når nye e-poster ankommer
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={settings.desktopNotifications}
                      onChange={(e) => setSettings({ ...settings, desktopNotifications: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: settings.desktopNotifications ? 'var(--primary)' : 'var(--gray-300)',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: settings.desktopNotifications ? '24px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.25rem', display: 'block' }}>
                      Lydvarsler
                    </label>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                      Spill lyd når nye e-poster ankommer
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={settings.soundNotifications}
                      onChange={(e) => setSettings({ ...settings, soundNotifications: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: settings.soundNotifications ? 'var(--primary)' : 'var(--gray-300)',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: settings.soundNotifications ? '24px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Sending Settings */}
        {activeTab === 'sending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-color)' }}>
                Sendingsinnstillinger
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.25rem', display: 'block' }}>
                      Lagre sendte elementer
                    </label>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                      Lagre alle sendte e-poster i "Sendt"-mappen
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={settings.saveSentItems}
                      onChange={(e) => setSettings({ ...settings, saveSentItems: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: settings.saveSentItems ? 'var(--primary)' : 'var(--gray-300)',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: settings.saveSentItems ? '24px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.25rem', display: 'block' }}>
                      Be om lesebekreftelse
                    </label>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                      Be om lesebekreftelse for alle sendte e-poster
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={settings.requestReadReceipts}
                      onChange={(e) => setSettings({ ...settings, requestReadReceipts: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: settings.requestReadReceipts ? 'var(--primary)' : 'var(--gray-300)',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: settings.requestReadReceipts ? '24px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Filters */}
        {activeTab === 'filters' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-color)' }}>
                Filtre og regler
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.25rem', display: 'block' }}>
                      Automatisk arkivering
                    </label>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>
                      Arkiver e-poster automatisk etter et antall dager
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={settings.autoArchive}
                      onChange={(e) => setSettings({ ...settings, autoArchive: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: settings.autoArchive ? 'var(--primary)' : 'var(--gray-300)',
                      borderRadius: '24px',
                      transition: '0.3s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: settings.autoArchive ? '24px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s'
                      }} />
                    </span>
                  </label>
                </div>
                
                {settings.autoArchive && (
                  <div>
                    <label style={{ fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.5rem', display: 'block' }}>
                      Arkiver etter (dager)
                    </label>
                    <input
                      type="number"
                      value={settings.autoArchiveDays}
                      onChange={(e) => setSettings({ ...settings, autoArchiveDays: parseInt(e.target.value) || 30 })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-color)',
                        color: 'var(--text-color)'
                      }}
                      min="1"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}





