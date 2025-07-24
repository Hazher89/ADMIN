'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Company } from '@/types';
import { BuildingOffice2Icon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface CompanySelectorProps {
  onCompanySelect: (company: Company) => void;
  selectedCompanyId?: string;
}

export default function CompanySelector({ onCompanySelect, selectedCompanyId }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesRef = collection(db, 'companies');
        const q = query(companiesRef, where('isActive', '==', true));
        const snapshot = await getDocs(q);
        
        const companiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          subscription: {
            ...doc.data().subscription,
            expiresAt: doc.data().subscription?.expiresAt?.toDate(),
          }
        })) as Company[];
        
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <BuildingOffice2Icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Velg Bedrift</h2>
          <p className="text-gray-600 mt-2">Velg bedriften du vil administrere</p>
        </div>

        {selectedCompany ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">{selectedCompany.name}</h3>
                <p className="text-sm text-blue-700">{selectedCompany.domain}</p>
              </div>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-blue-600 hover:text-blue-800"
              >
                <ChevronDownIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : null}

        {(!selectedCompany || isOpen) && (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Søk etter bedrift..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredCompanies.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {searchTerm ? 'Ingen bedrifter funnet' : 'Ingen bedrifter tilgjengelig'}
                </div>
              ) : (
                filteredCompanies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => {
                      onCompanySelect(company);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedCompanyId === company.id
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{company.name}</h4>
                        <p className="text-sm text-gray-600">{company.domain}</p>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            company.subscription.plan === 'enterprise'
                              ? 'bg-purple-100 text-purple-800'
                              : company.subscription.plan === 'premium'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {company.subscription.plan === 'enterprise' ? 'Enterprise' :
                             company.subscription.plan === 'premium' ? 'Premium' : 'Basic'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {company.subscription.expiresAt.toLocaleDateString('no-NO')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 