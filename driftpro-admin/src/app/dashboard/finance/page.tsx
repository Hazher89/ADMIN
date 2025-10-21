'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DollarSign, FileText, CreditCard, Calculator, PieChart, 
  TrendingUp, TrendingDown, Plus, Search, Filter, Download,
  Eye, Edit, Trash2, CheckCircle, XCircle, AlertTriangle,
  Calendar, User, Building, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export default function FinancePage() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [budgets, setBudgets] = useState([]);
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
        <span className="ml-2 text-gray-600">Laster finans...</span>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background-color)', minHeight: '100vh', padding: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card-icon">
            <DollarSign />
          </div>
          <div>
            <h1 className="page-title">Finans & Regnskap</h1>
            <p className="page-subtitle">Administrer alle finansielle operasjoner</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Total Inntekt</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--green-600)' }}>2,450,000 kr</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <ArrowUpRight className="w-4 h-4 text-green-600" />
                <span style={{ color: 'var(--green-600)', fontSize: 'var(--font-size-sm)' }}>+12.5%</span>
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
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Utgifter</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--red-600)' }}>1,890,000 kr</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <ArrowDownRight className="w-4 h-4 text-red-600" />
                <span style={{ color: 'var(--red-600)', fontSize: 'var(--font-size-sm)' }}>+8.2%</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--red-100)' }}>
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Netto Resultat</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--blue-600)' }}>560,000 kr</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                <span style={{ color: 'var(--blue-600)', fontSize: 'var(--font-size-sm)' }}>+15.3%</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--blue-100)' }}>
              <PieChart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>Utestående</p>
              <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--orange-600)' }}>245,000 kr</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span style={{ color: 'var(--orange-600)', fontSize: 'var(--font-size-sm)' }}>23 fakturer</span>
              </div>
            </div>
            <div className="card-icon" style={{ background: 'var(--orange-100)' }}>
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)' }}>
          {[
            { id: 'overview', name: 'Oversikt', icon: PieChart },
            { id: 'invoices', name: 'Fakturer', icon: FileText },
            { id: 'payments', name: 'Betalinger', icon: CreditCard },
            { id: 'budgets', name: 'Budsjetter', icon: Calculator },
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
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Finansiell Oversikt
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
                <div className="card" style={{ padding: 'var(--space-6)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-4)' }}>
                    Inntekter vs Utgifter (Siste 12 måneder)
                  </h3>
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', borderRadius: 'var(--border-radius)', color: 'var(--gray-500)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <PieChart className="w-12 h-12 mx-auto mb-2" />
                      <p>Chart kommer snart</p>
                    </div>
                  </div>
                </div>
                <div className="card" style={{ padding: 'var(--space-6)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-4)' }}>
                    Nylige Transaksjoner
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {[
                      { type: 'income', description: 'Faktura #2024-001', amount: '45,000 kr', date: '2024-01-15' },
                      { type: 'expense', description: 'Leie kontor', amount: '25,000 kr', date: '2024-01-14' },
                      { type: 'income', description: 'Faktura #2024-002', amount: '32,000 kr', date: '2024-01-13' },
                      { type: 'expense', description: 'Lønn', amount: '180,000 kr', date: '2024-01-12' },
                    ].map((transaction, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 'var(--border-radius)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          {transaction.type === 'income' ? (
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          )}
                          <div>
                            <p style={{ fontWeight: '500', color: 'var(--gray-900)' }}>{transaction.description}</p>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)' }}>{transaction.date}</p>
                          </div>
                        </div>
                        <p style={{ fontWeight: '600', color: transaction.type === 'income' ? 'var(--green-600)' : 'var(--red-600)' }}>
                          {transaction.type === 'income' ? '+' : '-'}{transaction.amount}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)' }}>
                  Fakturer
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
                    Ny faktura
                  </button>
                </div>
              </div>
              <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Faktura #</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Kunde</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Dato</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Beløp</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Status</th>
                        <th style={{ padding: 'var(--space-4)', textAlign: 'left', fontWeight: '600', color: 'var(--gray-900)' }}>Handlinger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: '2024-001', customer: 'Acme Corp', date: '2024-01-15', amount: '45,000 kr', status: 'paid' },
                        { id: '2024-002', customer: 'Tech Solutions', date: '2024-01-14', amount: '32,000 kr', status: 'pending' },
                        { id: '2024-003', customer: 'Global Ltd', date: '2024-01-13', amount: '28,500 kr', status: 'overdue' },
                        { id: '2024-004', customer: 'Startup Inc', date: '2024-01-12', amount: '15,000 kr', status: 'paid' },
                      ].map((invoice, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>{invoice.id}</td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-900)' }}>{invoice.customer}</td>
                          <td style={{ padding: 'var(--space-4)', color: 'var(--gray-600)' }}>{invoice.date}</td>
                          <td style={{ padding: 'var(--space-4)', fontWeight: '600', color: 'var(--gray-900)' }}>{invoice.amount}</td>
                          <td style={{ padding: 'var(--space-4)' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: 'var(--border-radius)',
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: '500',
                              background: invoice.status === 'paid' ? 'var(--green-100)' : invoice.status === 'pending' ? 'var(--yellow-100)' : 'var(--red-100)',
                              color: invoice.status === 'paid' ? 'var(--green-700)' : invoice.status === 'pending' ? 'var(--yellow-700)' : 'var(--red-700)'
                            }}>
                              {invoice.status === 'paid' ? 'Betalt' : invoice.status === 'pending' ? 'Venter' : 'Forfalt'}
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
                              <button className="btn btn-sm btn-danger">
                                <Trash2 size={14} />
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

          {activeTab === 'payments' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Betalinger
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Betalinger funksjonalitet kommer snart!</p>
              </div>
            </div>
          )}

          {activeTab === 'budgets' && (
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '600', color: 'var(--gray-900)', marginBottom: 'var(--space-6)' }}>
                Budsjetter
              </h2>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--gray-600)' }}>Budsjett funksjonalitet kommer snart!</p>
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










