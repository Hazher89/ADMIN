'use client';

import React, { useState } from 'react';
import { Check, X, Lock, Unlock, AlertCircle } from 'lucide-react';

interface Permissions {
  // Main pages
  dashboard?: boolean;
  employees?: boolean;
  departments?: boolean;
  hr?: boolean;
  logistics?: boolean;
  internkontrollOgSamsvar?: boolean;
  documents?: boolean;
  chat?: boolean;
  emailSystem?: boolean;
  reports?: boolean;
  smsLogs?: boolean;
  partners?: boolean;
  
  // Audit tabs
  internrevisjon?: boolean;
  avvik?: boolean;
  risikovurdering?: boolean;
  oppfølgingstiltak?: boolean;
  kontrollpunkter?: boolean;
  internkontrollRapporter?: boolean;
  
  // Logistics tabs
  logistikkBudPriser?: boolean;
  logistikkLevering?: boolean;
  logistikkPlanlegging?: boolean;
  logistikkKunder?: boolean;
  logistikkLeverandorer?: boolean;
  logistikkProdukter?: boolean;
  logistikkLager?: boolean;
  logistikkFakturering?: boolean;
  logistikkFinans?: boolean;
  
  // HR tabs
  hrAnsatte?: boolean;
  hrVakter?: boolean;
  hrFravær?: boolean;
  hrFerie?: boolean;
  hrAvdelinger?: boolean;
  
  // Other
  settings?: boolean;
  mail?: boolean;
  notifications?: boolean;
  calendar?: boolean;
  [key: string]: boolean | undefined;
}

interface PermissionsManagerProps {
  permissions: Permissions;
  onChange: (permissions: Permissions) => void;
  role?: 'admin' | 'department_leader' | 'employee' | 'super_admin';
  readOnly?: boolean;
}

// Permission groups for better organization
const permissionGroups = [
  {
    title: 'Hovedområder',
    description: 'Tilgang til hovedseksjoner i systemet',
    permissions: [
      { key: 'dashboard', label: 'Dashboard', description: 'Oversiktsside' },
      { key: 'employees', label: 'Ansatte', description: 'Se og administrere ansatte' },
      { key: 'departments', label: 'Avdelinger', description: 'Se og administrere avdelinger' },
      { key: 'hr', label: 'HR & Personal', description: 'Tilgang til HR-seksjonen' },
      { key: 'logistics', label: 'Logistikk System', description: 'Tilgang til logistikksystemet' },
      { key: 'internkontrollOgSamsvar', label: 'Internkontroll og Samsvar', description: 'Tilgang til internkontroll' },
      { key: 'documents', label: 'Dokumenter', description: 'Se og administrere dokumenter' },
      { key: 'chat', label: 'Chat', description: 'Tilgang til chat' },
      { key: 'emailSystem', label: 'E-post System', description: 'Administrere e-post' },
      { key: 'reports', label: 'Rapporter', description: 'Se rapporter' },
      { key: 'smsLogs', label: 'SMS Logg & Telefonbok', description: 'Se SMS-logg' },
      { key: 'partners', label: 'Samarbeidspartnere', description: 'Se samarbeidspartnere' },
    ]
  },
  {
    title: 'Internkontroll og Samsvar - Faner',
    description: 'Spesifikke faner i Internkontroll og Samsvar',
    permissions: [
      { key: 'internrevisjon', label: 'Internrevisjon', description: 'Internrevisjon fane' },
      { key: 'avvik', label: 'Avvik', description: 'Avvik fane' },
      { key: 'risikovurdering', label: 'Risikovurdering', description: 'Risikovurdering fane' },
      { key: 'oppfølgingstiltak', label: 'Oppfølgingstiltak', description: 'Oppfølgingstiltak fane' },
      { key: 'kontrollpunkter', label: 'Kontrollpunkter', description: 'Kontrollpunkter fane' },
      { key: 'internkontrollRapporter', label: 'Rapporter', description: 'Rapporter fane' },
    ]
  },
  {
    title: 'Logistikk System - Faner',
    description: 'Spesifikke faner i Logistikk System',
    permissions: [
      { key: 'logistikkBudPriser', label: 'BUD Priser', description: 'BUD Priser fane' },
      { key: 'logistikkLevering', label: 'Levering', description: 'Levering fane' },
      { key: 'logistikkPlanlegging', label: 'Planlegging', description: 'Planlegging fane' },
      { key: 'logistikkKunder', label: 'Kunder', description: 'Kunder fane' },
      { key: 'logistikkLeverandorer', label: 'Leverandører', description: 'Leverandører fane' },
      { key: 'logistikkProdukter', label: 'Produkter', description: 'Produkter fane' },
      { key: 'logistikkLager', label: 'Lager', description: 'Lager fane' },
      { key: 'logistikkFakturering', label: 'Fakturering', description: 'Fakturering fane' },
      { key: 'logistikkFinans', label: 'Finans', description: 'Finans fane' },
    ]
  },
  {
    title: 'HR & Personal - Faner',
    description: 'Spesifikke faner i HR & Personal',
    permissions: [
      { key: 'hrAnsatte', label: 'Ansatte', description: 'Ansatte fane i HR' },
      { key: 'hrVakter', label: 'Vakter', description: 'Vakter fane' },
      { key: 'hrFravær', label: 'Fravær', description: 'Fravær fane' },
      { key: 'hrFerie', label: 'Ferie', description: 'Ferie fane' },
      { key: 'hrAvdelinger', label: 'Avdelinger', description: 'Avdelinger fane' },
    ]
  },
  {
    title: 'Andre tilganger',
    description: 'Andre funksjoner og tilganger',
    permissions: [
      { key: 'settings', label: 'Innstillinger', description: 'Tilgang til innstillinger' },
      { key: 'mail', label: 'E-post', description: 'E-post funksjoner' },
      { key: 'notifications', label: 'Varsler', description: 'Se varsler' },
      { key: 'calendar', label: 'Kalender', description: 'Tilgang til kalender' },
    ]
  }
];

export default function PermissionsManager({ 
  permissions, 
  onChange, 
  role = 'employee',
  readOnly = false 
}: PermissionsManagerProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Hovedområder': true,
    'Internkontroll og Samsvar - Faner': false,
    'Logistikk System - Faner': false,
    'HR & Personal - Faner': false,
    'Andre tilganger': false,
  });

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  const togglePermission = (key: string) => {
    if (readOnly) return;
    
    const newPermissions = {
      ...permissions,
      [key]: !permissions[key]
    };
    onChange(newPermissions);
  };

  const selectAll = (groupPermissions: typeof permissionGroups[0]['permissions']) => {
    if (readOnly) return;
    
    const allSelected = groupPermissions.every(p => permissions[p.key]);
    const newPermissions = { ...permissions };
    
    groupPermissions.forEach(p => {
      newPermissions[p.key] = !allSelected;
    });
    
    onChange(newPermissions);
  };

  const selectAllPermissions = () => {
    if (readOnly) return;
    
    const allSelected = permissionGroups.every(group => 
      group.permissions.every(p => permissions[p.key])
    );
    
    const newPermissions = { ...permissions };
    permissionGroups.forEach(group => {
      group.permissions.forEach(p => {
        newPermissions[p.key] = !allSelected;
      });
    });
    
    onChange(newPermissions);
  };

  const countSelected = () => {
    let count = 0;
    permissionGroups.forEach(group => {
      group.permissions.forEach(p => {
        if (permissions[p.key]) count++;
      });
    });
    return count;
  };

  const totalCount = permissionGroups.reduce((sum, group) => sum + group.permissions.length, 0);
  const selectedCount = countSelected();

  return (
    <div style={{ 
      border: '1px solid var(--border-color, #e5e7eb)', 
      borderRadius: '8px', 
      padding: '1.5rem',
      background: 'var(--card-background, #ffffff)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid var(--border-color, #e5e7eb)'
      }}>
        <div>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '700', 
            color: 'var(--text-color, #111827)',
            marginBottom: '0.25rem'
          }}>
            Tilganger og rettigheter
          </h3>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'var(--gray-600, #4b5563)',
            margin: 0
          }}>
            Velg hvilke sider, funksjoner og tilganger denne brukeren skal ha
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={selectAllPermissions}
            style={{
              padding: '0.5rem 1rem',
              background: selectedCount === totalCount ? '#ef4444' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {selectedCount === totalCount ? (
              <>
                <X size={16} />
                Fjern alle
              </>
            ) : (
              <>
                <Check size={16} />
                Velg alle ({selectedCount}/{totalCount})
              </>
            )}
          </button>
        )}
      </div>

      {role === 'employee' && (
        <div style={{
          padding: '0.75rem',
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '6px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'start',
          gap: '0.5rem'
        }}>
          <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
            <strong>Viktig:</strong> Ansatte får kun tilgang til det som er huket av. 
            Hvis ingenting er valgt, vil de kun se Dashboard-siden.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {permissionGroups.map((group, groupIndex) => {
          const groupSelectedCount = group.permissions.filter(p => permissions[p.key]).length;
          const isExpanded = expandedGroups[group.title];
          
          return (
            <div 
              key={groupIndex}
              style={{
                border: '1px solid var(--border-color, #e5e7eb)',
                borderRadius: '6px',
                overflow: 'hidden'
              }}
            >
              <div
                onClick={() => toggleGroup(group.title)}
                style={{
                  padding: '1rem',
                  background: isExpanded ? 'var(--gray-50, #f9fafb)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.2s',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isExpanded) e.currentTarget.style.background = 'var(--gray-50, #f9fafb)';
                }}
                onMouseLeave={(e) => {
                  if (!isExpanded) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <h4 style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      color: 'var(--text-color, #111827)',
                      margin: 0
                    }}>
                      {group.title}
                    </h4>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      background: '#e0e7ff',
                      color: '#4338ca',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {groupSelectedCount}/{group.permissions.length}
                    </span>
                  </div>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-600, #4b5563)',
                    margin: 0
                  }}>
                    {group.description}
                  </p>
                </div>
                {!readOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectAll(group.permissions);
                    }}
                    style={{
                      padding: '0.375rem 0.75rem',
                      background: groupSelectedCount === group.permissions.length ? '#fee2e2' : '#dbeafe',
                      color: groupSelectedCount === group.permissions.length ? '#991b1b' : '#1e40af',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginRight: '0.5rem'
                    }}
                  >
                    {groupSelectedCount === group.permissions.length ? 'Fjern alle' : 'Velg alle'}
                  </button>
                )}
                <div style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}>
                  ▼
                </div>
              </div>

              {isExpanded && (
                <div style={{ 
                  padding: '1rem',
                  background: 'var(--card-background, #ffffff)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {group.permissions.map((permission) => {
                    const isChecked = permissions[permission.key] || false;
                    return (
                      <label
                        key={permission.key}
                        style={{
                          display: 'flex',
                          alignItems: 'start',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          border: `2px solid ${isChecked ? '#2563eb' : 'var(--border-color, #e5e7eb)'}`,
                          borderRadius: '6px',
                          cursor: readOnly ? 'not-allowed' : 'pointer',
                          background: isChecked ? '#eff6ff' : 'transparent',
                          transition: 'all 0.2s',
                          opacity: readOnly ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!readOnly) {
                            e.currentTarget.style.borderColor = isChecked ? '#1d4ed8' : '#93c5fd';
                            e.currentTarget.style.background = isChecked ? '#dbeafe' : '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!readOnly) {
                            e.currentTarget.style.borderColor = isChecked ? '#2563eb' : 'var(--border-color, #e5e7eb)';
                            e.currentTarget.style.background = isChecked ? '#eff6ff' : 'transparent';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(permission.key)}
                          disabled={readOnly}
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: readOnly ? 'not-allowed' : 'pointer',
                            marginTop: '2px',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: 'var(--text-color, #111827)',
                            fontSize: '0.875rem',
                            marginBottom: '0.25rem'
                          }}>
                            {permission.label}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--gray-600, #4b5563)'
                          }}>
                            {permission.description}
                          </div>
                        </div>
                        {isChecked ? (
                          <Check size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
                        ) : (
                          <X size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ 
        marginTop: '1.5rem', 
        paddingTop: '1rem', 
        borderTop: '1px solid var(--border-color, #e5e7eb)',
        fontSize: '0.875rem',
        color: 'var(--gray-600, #4b5563)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>{selectedCount}</strong> av <strong>{totalCount}</strong> tilganger valgt
        </div>
        {selectedCount > 0 && (
          <div style={{ color: '#10b981', fontWeight: '600' }}>
            {Math.round((selectedCount / totalCount) * 100)}% tilganger aktivert
          </div>
        )}
      </div>
    </div>
  );
}


