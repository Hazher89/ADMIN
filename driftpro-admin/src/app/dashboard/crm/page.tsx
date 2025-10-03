'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Heart, UserCheck, Target, TrendingUp, FileSignature, Headphones,
  Plus, Search, Filter, Download, Eye, Edit, Trash2, Phone, Mail,
  CheckCircle, XCircle, AlertTriangle, Calendar, DollarSign, Star
} from 'lucide-react';

export default function CRMPage() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [sales, setSales] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [support, setSupport] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Laster CRM...</span>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background-color)', minHeight: '100vh', padding: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <Heart />
          </div>
          <div>
            <h1 className="page-title">CRM & Kunder</h1>
            <p className="page-subtitle">Administrer kunder, salg og kundeservice</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Totalt Kunder</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--blue-600)' }}>1,247</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span style={{ color: 'var(--green-600)', fontSize: 'var(--font-size-sm)' }}>+15 denne måneden</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--blue-100)' }}>
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Aktive Leads</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--orange-600)' }}>89</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <Target className="w-4 h-4 text-orange-600" />
                <span style={{ color: 'var(--orange-600)', fontSize: 'var(--font-size-sm)' }}>Høy prioritet: 12</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--orange-100)' }}>
              <Target className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Månedlig Salg</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--green-600)' }}>2.1M kr</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <DollarSign className="w-4 h-4 text-green-600" />
                <span style={{ color: 'var(--green-600)', fontSize: 'var(--font-size-sm)' }}>+8.5% fra forrige måned</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--green-100)' }}>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Åpne Support</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--red-600)' }}>23</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <Headphones className="w-4 h-4 text-red-600" />
                <span style={{ color: 'var(--red-600)', fontSize: 'var(--font-size-sm)' }}>Gjennomsnitt: 2.3 timer</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--red-100)' }}>
              <Headphones className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)' }}>
          {[
            { id: 'customers', name: 'Kunder', icon: UserCheck },
            { id: 'leads', name: 'Leads', icon: Target },
            { id: 'sales', name: 'Salg', icon: TrendingUp },
            { id: 'contracts', name: 'Kontrakter', icon: FileSignature },
            { id: 'support', name: 'Support', icon: Headphones },
            { id: 'reports', name: 'Rapporter', icon: Download },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 0, borderBottom: activeTab === tab.id ? '2px solid var(--blue-600)' : '2px solid transparent' }}
            >
              <tab.icon size={16} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: 'var(--space-6)' }}>
          {activeTab === 'customers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Kunder
                </h2>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button className="btn btn-secondary">
                    <Search size={16} />
                    Søk
                  </button>
                  <button className="btn btn-secondary">
                    <Filter size={16} />
                    Filter
                  </button>
                  <button className="btn btn-success">
                    <Plus size={16} />
                    Ny kunde
                  </button>
                </div>
              </div>
              <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Kunde</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Bedrift</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>E-post</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Telefon</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Status</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Handlinger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Ola Nordmann', company: 'Acme Corp', email: 'ola@acme.no', phone: '+47 123 45 678', status: 'active' },
                        { name: 'Kari Hansen', company: 'Tech Solutions', email: 'kari@tech.no', phone: '+47 987 65 432', status: 'active' },
                        { name: 'Erik Larsen', company: 'Global Ltd', email: 'erik@global.no', phone: '+47 555 12 34', status: 'inactive' },
                        { name: 'Anna Berg', company: 'Startup Inc', email: 'anna@startup.no', phone: '+47 777 88 99', status: 'prospect' },
                      ].map((customer, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--blue-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserCheck className="w-4 h-4 text-blue-600" />
                              </div>
                              {customer.name}
                            </div>
                          </td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>{customer.company}</td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>{customer.email}</td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>{customer.phone}</td>
                          <td style={{ padding: 'var(--space-4)' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: 'var(--border-radius)',
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: '500',
                              background: customer.status === 'active' ? 'var(--green-100)' : customer.status === 'inactive' ? 'var(--gray-100)' : 'var(--blue-100)',
                              color: customer.status === 'active' ? 'var(--green-700)' : customer.status === 'inactive' ? 'var(--gray-700)' : 'var(--blue-700)'
                            }}>
                              {customer.status === 'active' ? 'Aktiv' : customer.status === 'inactive' ? 'Inaktiv' : 'Prospekt'}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                              <button className="btn btn-sm btn-secondary">
                                <Eye size={14} />
                              </button>
                              <button className="btn btn-sm btn-primary">
                                <Edit size={14} />
                              </button>
                              <button className="btn btn-sm btn-success">
                                <Phone size={14} />
                              </button>
                              <button className="btn btn-sm btn-info">
                                <Mail size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Leads
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Leads funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Salg
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Salg funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Kontrakter
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Kontrakter funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Support
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Support funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Rapporter
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Rapport funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



