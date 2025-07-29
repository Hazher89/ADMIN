'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Download,
  Upload,
  FileSpreadsheet,
  ChevronDown,
  Save,
  X,
  UserCheck,
  Check
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as XLSX from 'xlsx';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: 'admin' | 'department_leader' | 'employee';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  permissions: {
    // Basic permissions that can be manually controlled
    fullAccess: boolean;
    manageOwnDepartment: boolean;
    approveVacation: boolean;
    approveAbsence: boolean;
    manageShifts: boolean;
    handleDeviations: boolean;
    submitDeviations: boolean;
    submitAbsence: boolean;
    submitVacation: boolean;
    useChat: boolean;
    readDocuments: boolean;
    editOwnRequests: boolean;
  };
  startDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  leader?: string | null;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: 'employee' as 'admin' | 'department_leader' | 'employee',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    address: {
      street: '',
      city: '',
      postalCode: ''
    },
    startDate: '',
    permissions: {
      fullAccess: false,
      manageOwnDepartment: false,
      approveVacation: false,
      approveAbsence: false,
      manageShifts: false,
      handleDeviations: false,
      submitDeviations: true,
      submitAbsence: true,
      submitVacation: true,
      useChat: true,
      readDocuments: true,
      editOwnRequests: true,
    }
  });

  const filterEmployees = useCallback(() => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    if (roleFilter) {
      filtered = filtered.filter(emp => emp.role === roleFilter);
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, departmentFilter, roleFilter]);

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [filterEmployees]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Don't close dropdown if clicking inside a modal
      if (target.closest('.modal-content') || target.closest('.modal')) {
        return;
      }
      if (selectedEmployee && !target.closest('.dropdown-container')) {
        setSelectedEmployee(null);
      }
      // Close import/export dropdowns if clicking outside
      if (!target.closest('.import-export-dropdown')) {
        setShowImportDropdown(false);
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with Firebase query
      const mockEmployees: Employee[] = [
        {
          id: '1',
          firstName: 'Ola',
          lastName: 'Nordmann',
          email: 'ola.nordmann@driftpro.no',
          phone: '+47 123 45 678',
          department: 'IT',
          position: 'Systemutvikler',
          role: 'employee',
          emergencyContact: {
            name: 'Kari Nordmann',
            phone: '+47 987 65 432',
            relationship: 'Ektefelle'
          },
          address: {
            street: 'Osloveien 123',
            city: 'Oslo',
            postalCode: '0123'
          },
          permissions: {
            fullAccess: false,
            manageOwnDepartment: false,
            approveVacation: false,
            approveAbsence: false,
            manageShifts: false,
            handleDeviations: false,
            submitDeviations: true,
            submitAbsence: true,
            submitVacation: true,
            useChat: true,
            readDocuments: true,
            editOwnRequests: true
          },
          startDate: '2024-01-15',
          status: 'active',
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          firstName: 'Kari',
          lastName: 'Hansen',
          email: 'kari.hansen@driftpro.no',
          phone: '+47 234 56 789',
          department: 'HR',
          position: 'HR-leder',
          role: 'department_leader',
          emergencyContact: {
            name: 'Per Hansen',
            phone: '+47 876 54 321',
            relationship: 'Ektefelle'
          },
          address: {
            street: 'Bergensgaten 456',
            city: 'Bergen',
            postalCode: '5000'
          },
          permissions: {
            fullAccess: false,
            manageOwnDepartment: true,
            approveVacation: true,
            approveAbsence: true,
            manageShifts: true,
            handleDeviations: true,
            submitDeviations: true,
            submitAbsence: true,
            submitVacation: true,
            useChat: true,
            readDocuments: true,
            editOwnRequests: true
          },
          startDate: '2023-06-01',
          status: 'active',
          createdAt: '2023-06-01T09:00:00Z'
        },
        {
          id: '3',
          firstName: 'Admin',
          lastName: 'Bruker',
          email: 'admin@driftpro.no',
          phone: '+47 999 99 999',
          department: 'Administrasjon',
          position: 'Systemadministrator',
          role: 'admin',
          emergencyContact: {
            name: 'Admin Kontakt',
            phone: '+47 888 88 888',
            relationship: 'Kollega'
          },
          address: {
            street: 'Adminveien 1',
            city: 'Oslo',
            postalCode: '0001'
          },
          permissions: {
            fullAccess: true,
            manageOwnDepartment: true,
            approveVacation: true,
            approveAbsence: true,
            manageShifts: true,
            handleDeviations: true,
            submitDeviations: true,
            submitAbsence: true,
            submitVacation: true,
            useChat: true,
            readDocuments: true,
            editOwnRequests: true
          },
          startDate: '2023-01-01',
          status: 'active',
          createdAt: '2023-01-01T08:00:00Z'
        }
      ];
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      // Mock departments - replace with Firebase query
      const mockDepartments: Department[] = [
        { id: '1', name: 'IT', leader: '2' },
        { id: '2', name: 'HR', leader: '2' },
        { id: '3', name: 'Markedsføring', leader: null },
        { id: '4', name: 'Økonomi', leader: null },
        { id: '5', name: 'Produksjon', leader: null }
      ];
      setDepartments(mockDepartments);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleRoleChange = (role: 'admin' | 'department_leader' | 'employee') => {
    setFormData(prev => ({
      ...prev,
      role,
      permissions: getDefaultPermissions(role)
    }));
  };

  const getDefaultPermissions = (role: 'admin' | 'department_leader' | 'employee') => {
    switch (role) {
      case 'admin':
        return {
          fullAccess: true,
          manageOwnDepartment: true,
          approveVacation: true,
          approveAbsence: true,
          manageShifts: true,
          handleDeviations: true,
          submitDeviations: true,
          submitAbsence: true,
          submitVacation: true,
          useChat: true,
          readDocuments: true,
          editOwnRequests: true,
        };
      case 'department_leader':
        return {
          fullAccess: false,
          manageOwnDepartment: true,
          approveVacation: true,
          approveAbsence: true,
          manageShifts: true,
          handleDeviations: true,
          submitDeviations: true,
          submitAbsence: true,
          submitVacation: true,
          useChat: true,
          readDocuments: true,
          editOwnRequests: true,
        };
      case 'employee':
        return {
          fullAccess: false,
          manageOwnDepartment: false,
          approveVacation: false,
          approveAbsence: false,
          manageShifts: false,
          handleDeviations: false,
          submitDeviations: true,
          submitAbsence: true,
          submitVacation: true,
          useChat: true,
          readDocuments: true,
          editOwnRequests: true,
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const employeeData = {
        ...formData,
        status: 'active' as const,
        createdAt: new Date().toISOString()
      };

      // Add to Firebase
      if (!db) throw new Error('Firebase not initialized');
      const docRef = await addDoc(collection(db, 'employees'), employeeData);
      
      const newEmployee = { id: docRef.id, ...employeeData };
      setEmployees(prev => [...prev, newEmployee]);
      
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding employee:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setSaving(true);
    try {
      // Update in Firebase
      if (!db) throw new Error('Firebase not initialized');
      await updateDoc(doc(db, 'employees', selectedEmployee.id), formData);
      
      setEmployees(prev => 
        prev.map(emp => 
          emp.id === selectedEmployee.id 
            ? { ...emp, ...formData }
            : emp
        )
      );
      
      setShowEditModal(false);
      setSelectedEmployee(null);
      resetForm();
    } catch (error) {
      console.error('Error updating employee:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne ansatten?')) return;

    try {
      if (!db) throw new Error('Firebase not initialized');
      await deleteDoc(doc(db, 'employees', employeeId));
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      role: 'employee',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      address: {
        street: '',
        city: '',
        postalCode: ''
      },
      startDate: '',
      permissions: getDefaultPermissions('employee')
    });
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
      role: employee.role,
      emergencyContact: employee.emergencyContact,
      address: employee.address,
      startDate: employee.startDate,
      permissions: employee.permissions
    });
    setShowEditModal(true);
  };

  const openPermissionsModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(prev => ({
      ...prev,
      permissions: employee.permissions
    }));
    setShowPermissionsModal(true);
  };

  // Import/Export functions
  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = employees.map(emp => ({
        'Fornavn': emp.firstName,
        'Etternavn': emp.lastName,
        'E-post': emp.email,
        'Telefon': emp.phone,
        'Avdeling': emp.department,
        'Stilling': emp.position,
        'Rolle': emp.role === 'admin' ? 'Administrator' : 
                emp.role === 'department_leader' ? 'Avdelingsleder' : 'Ansatt',
        'Status': emp.status === 'active' ? 'Aktiv' : 'Inaktiv',
        'Startdato': emp.startDate,
        'Nødkontakt - Navn': emp.emergencyContact.name,
        'Nødkontakt - Telefon': emp.emergencyContact.phone,
        'Nødkontakt - Forhold': emp.emergencyContact.relationship,
        'Adresse - Gate': emp.address.street,
        'Adresse - By': emp.address.city,
        'Adresse - Postnummer': emp.address.postalCode,
        'Tillatelser - Full tilgang': emp.permissions.fullAccess ? 'Ja' : 'Nei',
        'Tillatelser - Administrer egen avdeling': emp.permissions.manageOwnDepartment ? 'Ja' : 'Nei',
        'Tillatelser - Godkjenn ferie': emp.permissions.approveVacation ? 'Ja' : 'Nei',
        'Tillatelser - Godkjenn fravær': emp.permissions.approveAbsence ? 'Ja' : 'Nei',
        'Tillatelser - Administrer skift': emp.permissions.manageShifts ? 'Ja' : 'Nei',
        'Tillatelser - Håndter avvik': emp.permissions.handleDeviations ? 'Ja' : 'Nei',
        'Tillatelser - Send avvik': emp.permissions.submitDeviations ? 'Ja' : 'Nei',
        'Tillatelser - Send fravær': emp.permissions.submitAbsence ? 'Ja' : 'Nei',
        'Tillatelser - Send ferie': emp.permissions.submitVacation ? 'Ja' : 'Nei',
        'Tillatelser - Bruk chat': emp.permissions.useChat ? 'Ja' : 'Nei',
        'Tillatelser - Les dokumenter': emp.permissions.readDocuments ? 'Ja' : 'Nei',
        'Tillatelser - Rediger egne forespørsler': emp.permissions.editOwnRequests ? 'Ja' : 'Nei'
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Fornavn
        { wch: 15 }, // Etternavn
        { wch: 25 }, // E-post
        { wch: 15 }, // Telefon
        { wch: 20 }, // Avdeling
        { wch: 20 }, // Stilling
        { wch: 15 }, // Rolle
        { wch: 10 }, // Status
        { wch: 12 }, // Startdato
        { wch: 20 }, // Nødkontakt - Navn
        { wch: 15 }, // Nødkontakt - Telefon
        { wch: 20 }, // Nødkontakt - Forhold
        { wch: 25 }, // Adresse - Gate
        { wch: 15 }, // Adresse - By
        { wch: 12 }, // Adresse - Postnummer
        { wch: 15 }, // Tillatelser - Full tilgang
        { wch: 25 }, // Tillatelser - Administrer egen avdeling
        { wch: 20 }, // Tillatelser - Godkjenn ferie
        { wch: 20 }, // Tillatelser - Godkjenn fravær
        { wch: 20 }, // Tillatelser - Administrer skift
        { wch: 20 }, // Tillatelser - Håndter avvik
        { wch: 15 }, // Tillatelser - Send avvik
        { wch: 15 }, // Tillatelser - Send fravær
        { wch: 15 }, // Tillatelser - Send ferie
        { wch: 15 }, // Tillatelser - Bruk chat
        { wch: 20 }, // Tillatelser - Les dokumenter
        { wch: 25 }  // Tillatelser - Rediger egne forespørsler
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Ansatte');

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `ansatte_export_${date}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      
      alert(`✅ ${employees.length} ansatte eksportert til ${filename}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('❌ Feil ved eksport: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    }
  };

  const exportToCSV = () => {
    try {
      // Prepare data for export (same as Excel)
      const exportData = employees.map(emp => ({
        'Fornavn': emp.firstName,
        'Etternavn': emp.lastName,
        'E-post': emp.email,
        'Telefon': emp.phone,
        'Avdeling': emp.department,
        'Stilling': emp.position,
        'Rolle': emp.role === 'admin' ? 'Administrator' : 
                emp.role === 'department_leader' ? 'Avdelingsleder' : 'Ansatt',
        'Status': emp.status === 'active' ? 'Aktiv' : 'Inaktiv',
        'Startdato': emp.startDate,
        'Nødkontakt - Navn': emp.emergencyContact.name,
        'Nødkontakt - Telefon': emp.emergencyContact.phone,
        'Nødkontakt - Forhold': emp.emergencyContact.relationship,
        'Adresse - Gate': emp.address.street,
        'Adresse - By': emp.address.city,
        'Adresse - Postnummer': emp.address.postalCode,
        'Tillatelser - Full tilgang': emp.permissions.fullAccess ? 'Ja' : 'Nei',
        'Tillatelser - Administrer egen avdeling': emp.permissions.manageOwnDepartment ? 'Ja' : 'Nei',
        'Tillatelser - Godkjenn ferie': emp.permissions.approveVacation ? 'Ja' : 'Nei',
        'Tillatelser - Godkjenn fravær': emp.permissions.approveAbsence ? 'Ja' : 'Nei',
        'Tillatelser - Administrer skift': emp.permissions.manageShifts ? 'Ja' : 'Nei',
        'Tillatelser - Håndter avvik': emp.permissions.handleDeviations ? 'Ja' : 'Nei',
        'Tillatelser - Send avvik': emp.permissions.submitDeviations ? 'Ja' : 'Nei',
        'Tillatelser - Send fravær': emp.permissions.submitAbsence ? 'Ja' : 'Nei',
        'Tillatelser - Send ferie': emp.permissions.submitVacation ? 'Ja' : 'Nei',
        'Tillatelser - Bruk chat': emp.permissions.useChat ? 'Ja' : 'Nei',
        'Tillatelser - Les dokumenter': emp.permissions.readDocuments ? 'Ja' : 'Nei',
        'Tillatelser - Rediger egne forespørsler': emp.permissions.editOwnRequests ? 'Ja' : 'Nei'
      }));

      // Convert to CSV
      const csvContent = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(exportData), {
        FS: ',', // Field separator
        RS: '\n', // Record separator
        forceQuotes: true // Force quotes around all fields
      });

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `ansatte_export_${date}.csv`;

      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`✅ ${employees.length} ansatte eksportert til ${filename}`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('❌ Feil ved eksport: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    }
  };

  const downloadTemplate = () => {
    try {
      // Create template with headers only
      const templateData = [{
        'Fornavn': '',
        'Etternavn': '',
        'E-post': '',
        'Telefon': '',
        'Avdeling': '',
        'Stilling': '',
        'Rolle': 'Ansatt',
        'Status': 'Aktiv',
        'Startdato': '',
        'Nødkontakt - Navn': '',
        'Nødkontakt - Telefon': '',
        'Nødkontakt - Forhold': '',
        'Adresse - Gate': '',
        'Adresse - By': '',
        'Adresse - Postnummer': '',
        'Tillatelser - Full tilgang': 'Nei',
        'Tillatelser - Administrer egen avdeling': 'Nei',
        'Tillatelser - Godkjenn ferie': 'Nei',
        'Tillatelser - Godkjenn fravær': 'Nei',
        'Tillatelser - Administrer skift': 'Nei',
        'Tillatelser - Håndter avvik': 'Nei',
        'Tillatelser - Send avvik': 'Ja',
        'Tillatelser - Send fravær': 'Ja',
        'Tillatelser - Send ferie': 'Ja',
        'Tillatelser - Bruk chat': 'Ja',
        'Tillatelser - Les dokumenter': 'Ja',
        'Tillatelser - Rediger egne forespørsler': 'Ja'
      }];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);

      // Set column widths
      const colWidths = [
        { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
        { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 20 },
        { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
        { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 20 }, { wch: 25 }
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Mal');
      XLSX.writeFile(wb, 'ansatte_import_mal.xlsx');
      
      alert('✅ Mal lastet ned: ansatte_import_mal.xlsx');
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('❌ Feil ved nedlasting av mal: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    }
  };

  const downloadCSVTemplate = () => {
    try {
      // Create CSV template with headers only
      const templateData = [{
        'Fornavn': '',
        'Etternavn': '',
        'E-post': '',
        'Telefon': '',
        'Avdeling': '',
        'Stilling': '',
        'Rolle': 'Ansatt',
        'Status': 'Aktiv',
        'Startdato': '',
        'Nødkontakt - Navn': '',
        'Nødkontakt - Telefon': '',
        'Nødkontakt - Forhold': '',
        'Adresse - Gate': '',
        'Adresse - By': '',
        'Adresse - Postnummer': '',
        'Tillatelser - Full tilgang': 'Nei',
        'Tillatelser - Administrer egen avdeling': 'Nei',
        'Tillatelser - Godkjenn ferie': 'Nei',
        'Tillatelser - Godkjenn fravær': 'Nei',
        'Tillatelser - Administrer skift': 'Nei',
        'Tillatelser - Håndter avvik': 'Nei',
        'Tillatelser - Send avvik': 'Ja',
        'Tillatelser - Send fravær': 'Ja',
        'Tillatelser - Send ferie': 'Ja',
        'Tillatelser - Bruk chat': 'Ja',
        'Tillatelser - Les dokumenter': 'Ja',
        'Tillatelser - Rediger egne forespørsler': 'Ja'
      }];

      // Convert to CSV
      const csvContent = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(templateData), {
        FS: ',',
        RS: '\n',
        forceQuotes: true
      });

      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'ansatte_import_mal.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('✅ CSV-mal lastet ned: ansatte_import_mal.csv');
    } catch (error) {
      console.error('Error downloading CSV template:', error);
      alert('❌ Feil ved nedlasting av CSV-mal: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interface for Excel row data
  interface ExcelRow {
    'Fornavn'?: string;
    'Etternavn'?: string;
    'E-post'?: string;
    'Telefon'?: string;
    'Avdeling'?: string;
    'Stilling'?: string;
    'Rolle'?: string;
    'Status'?: string;
    'Startdato'?: string;
    'Nødkontakt - Navn'?: string;
    'Nødkontakt - Telefon'?: string;
    'Nødkontakt - Forhold'?: string;
    'Adresse - Gate'?: string;
    'Adresse - By'?: string;
    'Adresse - Postnummer'?: string;
    'Tillatelser - Full tilgang'?: string;
    'Tillatelser - Administrer egen avdeling'?: string;
    'Tillatelser - Godkjenn ferie'?: string;
    'Tillatelser - Godkjenn fravær'?: string;
    'Tillatelser - Administrer skift'?: string;
    'Tillatelser - Håndter avvik'?: string;
    'Tillatelser - Send avvik'?: string;
    'Tillatelser - Send fravær'?: string;
    'Tillatelser - Send ferie'?: string;
    'Tillatelser - Bruk chat'?: string;
    'Tillatelser - Les dokumenter'?: string;
    'Tillatelser - Rediger egne forespørsler'?: string;
  }

  const importFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      let jsonData: ExcelRow[];

      // Check file extension to determine format
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.csv')) {
        // Handle CSV file
        const csvText = new TextDecoder('utf-8').decode(data);
        const worksheet = XLSX.utils.aoa_to_sheet([csvText.split('\n').map(row => row.split(','))]);
        jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];
      } else {
        // Handle Excel file (.xlsx, .xls)
        const workbook = XLSX.read(data, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];
      }

      if (jsonData.length === 0) {
        alert('❌ Filen er tom');
        return;
      }

      const importedEmployees: Omit<Employee, 'id' | 'createdAt'>[] = [];
      const errors: string[] = [];

      jsonData.forEach((row: ExcelRow, index: number) => {
        try {
          // Map Excel columns to Employee fields
          const employee: Omit<Employee, 'id' | 'createdAt'> = {
            firstName: row['Fornavn'] || '',
            lastName: row['Etternavn'] || '',
            email: row['E-post'] || '',
            phone: row['Telefon'] || '',
            department: row['Avdeling'] || '',
            position: row['Stilling'] || '',
            role: row['Rolle'] === 'Administrator' ? 'admin' :
                  row['Rolle'] === 'Avdelingsleder' ? 'department_leader' : 'employee',
            status: row['Status'] === 'Aktiv' ? 'active' : 'inactive',
            startDate: row['Startdato'] || '',
            emergencyContact: {
              name: row['Nødkontakt - Navn'] || '',
              phone: row['Nødkontakt - Telefon'] || '',
              relationship: row['Nødkontakt - Forhold'] || ''
            },
            address: {
              street: row['Adresse - Gate'] || '',
              city: row['Adresse - By'] || '',
              postalCode: row['Adresse - Postnummer'] || ''
            },
            permissions: {
              fullAccess: row['Tillatelser - Full tilgang'] === 'Ja',
              manageOwnDepartment: row['Tillatelser - Administrer egen avdeling'] === 'Ja',
              approveVacation: row['Tillatelser - Godkjenn ferie'] === 'Ja',
              approveAbsence: row['Tillatelser - Godkjenn fravær'] === 'Ja',
              manageShifts: row['Tillatelser - Administrer skift'] === 'Ja',
              handleDeviations: row['Tillatelser - Håndter avvik'] === 'Ja',
              submitDeviations: row['Tillatelser - Send avvik'] === 'Ja',
              submitAbsence: row['Tillatelser - Send fravær'] === 'Ja',
              submitVacation: row['Tillatelser - Send ferie'] === 'Ja',
              useChat: row['Tillatelser - Bruk chat'] === 'Ja',
              readDocuments: row['Tillatelser - Les dokumenter'] === 'Ja',
              editOwnRequests: row['Tillatelser - Rediger egne forespørsler'] === 'Ja'
            }
          };

          // Validate required fields
          if (!employee.firstName || !employee.lastName || !employee.email) {
            errors.push(`Rad ${index + 2}: Mangler fornavn, etternavn eller e-post`);
            return;
          }

          importedEmployees.push(employee);
        } catch (error) {
          errors.push(`Rad ${index + 2}: Feil ved parsing - ${error instanceof Error ? error.message : 'Ukjent feil'}`);
        }
      });

      if (errors.length > 0) {
        alert(`❌ Feil i import:\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n... og flere feil' : ''}`);
        return;
      }

      if (importedEmployees.length === 0) {
        alert('❌ Ingen gyldige ansatte funnet i filen');
        return;
      }

      // Confirm import
      const confirmed = confirm(`✅ ${importedEmployees.length} ansatte funnet i filen.\n\nVil du importere disse ansatte?`);
      if (!confirmed) return;

      // Import to Firebase
      setSaving(true);
      let successCount = 0;
      let errorCount = 0;

      for (const employee of importedEmployees) {
        try {
          if (db) {
            await addDoc(collection(db, 'employees'), {
              ...employee,
              createdAt: new Date().toISOString()
            });
            successCount++;
          }
        } catch (error) {
          console.error('Error importing employee:', error);
          errorCount++;
        }
      }

      // Reload employees
      await loadEmployees();

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert(`✅ Import fullført!\n\n✅ ${successCount} ansatte importert\n❌ ${errorCount} feil`);

    } catch (error) {
      console.error('Error importing from file:', error);
      alert('❌ Feil ved import: ' + (error instanceof Error ? error.message : 'Ukjent feil'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ansatte</h1>
          <p className="text-gray-600">Administrer ansatte og deres tilganger</p>
        </div>
        <div className="flex space-x-2">
          {/* Import button with dropdown */}
          <div className="relative import-export-dropdown">
            <button
              onClick={() => setShowImportDropdown(!showImportDropdown)}
              disabled={saving}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50"
            >
              <Upload className="h-5 w-5" />
              <span>Importer</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {showImportDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-48">
                <div className="py-1">
                  <button
                    onClick={() => {
                      downloadTemplate();
                      setShowImportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Last ned Excel-mal</span>
                  </button>
                  <button
                    onClick={() => {
                      downloadCSVTemplate();
                      setShowImportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Last ned CSV-mal</span>
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <label className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span>Importer fil (.xlsx, .xls, .csv)</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={importFromExcel}
                      className="hidden"
                      disabled={saving}
                      onClick={() => setShowImportDropdown(false)}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {/* Export button with dropdown */}
          <div className="relative import-export-dropdown">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={saving || employees.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              <span>Eksporter</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {showExportDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-48">
                <div className="py-1">
                  <button
                    onClick={() => {
                      exportToExcel();
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Eksporter til Excel</span>
                  </button>
                  <button
                    onClick={() => {
                      exportToCSV();
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Eksporter til CSV</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Legg til ansatt</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Søk etter ansatte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>
          
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="">Alle avdelinger</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="">Alle roller</option>
            <option value="admin">Administrator</option>
            <option value="department_leader">Avdelingsleder</option>
            <option value="employee">Ansatt</option>
          </select>
          
          <div className="text-sm text-gray-500 flex items-center">
            {filteredEmployees.length} av {employees.length} ansatte
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ansatt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avdeling
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rolle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Startdato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.department}</div>
                    <div className="text-sm text-gray-500">{employee.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.role === 'admin' 
                        ? 'bg-red-100 text-red-800'
                        : employee.role === 'department_leader'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {employee.role === 'admin' && 'Administrator'}
                      {employee.role === 'department_leader' && 'Avdelingsleder'}
                      {employee.role === 'employee' && 'Ansatt'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(employee.startDate).toLocaleDateString('nb-NO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Dropdown Menu */}
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => setSelectedEmployee(employee)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100"
                          title="Flere handlinger"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        
                        {/* Dropdown Content */}
                        {selectedEmployee?.id === employee.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setShowDepartmentModal(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <Users className="h-4 w-4" />
                                <span>Endre avdeling</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setShowRoleModal(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <Users className="h-4 w-4" />
                                <span>Endre rolle</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setShowStatusModal(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <UserCheck className="h-4 w-4" />
                                <span>Endre status</span>
                              </button>
                              
                              <hr className="my-1" />
                              
                              <button
                                onClick={() => openPermissionsModal(employee)}
                                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                              >
                                <Users className="h-4 w-4" />
                                <span>Tilganger</span>
                              </button>
                              
                              <button
                                onClick={() => openEditModal(employee)}
                                className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center space-x-2"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Rediger</span>
                              </button>
                              
                              <hr className="my-1" />
                              
                              <button
                                onClick={() => handleDelete(employee.id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Slett</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Quick Actions */}
                      <button
                        onClick={() => openPermissionsModal(employee)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Tilganger"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(employee)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="Rediger"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Legg til ny ansatt</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fornavn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etternavn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-post *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avdeling *
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stilling *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startdato *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rolle *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'department_leader' | 'employee')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="employee">Ansatt</option>
                    <option value="department_leader">Avdelingsleder</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Nødkontakt</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Navn
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContact.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContact.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forhold
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Adresse</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gateadresse
                    </label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      By
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postnummer
                    </label>
                    <input
                      type="text"
                      value={formData.address.postalCode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        address: { ...prev.address, postalCode: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions Preview */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tilganger</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(formData.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        {value ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm text-gray-700">
                          {key === 'fullAccess' && 'Full tilgang'}
                          {key === 'manageOwnDepartment' && 'Administrer egen avdeling'}
                          {key === 'approveVacation' && 'Godkjenn ferie'}
                          {key === 'approveAbsence' && 'Godkjenn fravær'}
                          {key === 'manageShifts' && 'Administrer skift'}
                          {key === 'handleDeviations' && 'Håndter avvik'}
                          {key === 'submitDeviations' && 'Send avvik'}
                          {key === 'submitAbsence' && 'Send fravær'}
                          {key === 'submitVacation' && 'Send ferie'}
                          {key === 'useChat' && 'Bruk chat'}
                          {key === 'readDocuments' && 'Les dokumenter'}
                          {key === 'editOwnRequests' && 'Rediger egne forespørsler'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Lagrer...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Lagre ansatt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Rediger ansatt</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Same form fields as Add Modal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fornavn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etternavn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-post *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avdeling *
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Velg avdeling</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stilling *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startdato *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rolle *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'department_leader' | 'employee')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="employee">Ansatt</option>
                    <option value="department_leader">Avdelingsleder</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Lagrer...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Oppdater ansatt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Tilganger for {selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    const allTrue = Object.keys(formData.permissions).reduce((acc, key) => {
                      acc[key as keyof typeof formData.permissions] = true;
                      return acc;
                    }, {} as typeof formData.permissions);
                    setFormData(prev => ({ ...prev, permissions: allTrue }));
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Aktiver alle
                </button>
                <button
                  onClick={() => {
                    const allFalse = Object.keys(formData.permissions).reduce((acc, key) => {
                      acc[key as keyof typeof formData.permissions] = false;
                      return acc;
                    }, {} as typeof formData.permissions);
                    setFormData(prev => ({ ...prev, permissions: allFalse }));
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Deaktiver alle
                </button>
                <button
                  onClick={() => {
                    const defaultPerms = getDefaultPermissions(selectedEmployee.role);
                    setFormData(prev => ({ ...prev, permissions: defaultPerms }));
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Standard for rolle
                </button>
              </div>

              {/* Permissions List */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tilganger</h3>
                <div className="space-y-3">
                  {Object.entries(formData.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              permissions: { ...prev.permissions, [key]: e.target.checked }
                            }));
                          }}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {key === 'fullAccess' && 'Full tilgang til alt'}
                          {key === 'manageOwnDepartment' && 'Administrer egen avdeling'}
                          {key === 'approveVacation' && 'Godkjenn ferieforespørsler'}
                          {key === 'approveAbsence' && 'Godkjenn fraværsforespørsler'}
                          {key === 'manageShifts' && 'Administrer skiftplaner'}
                          {key === 'handleDeviations' && 'Håndter avviksrapporter'}
                          {key === 'submitDeviations' && 'Send avviksrapporter'}
                          {key === 'submitAbsence' && 'Send fraværsforespørsler'}
                          {key === 'submitVacation' && 'Send ferieforespørsler'}
                          {key === 'useChat' && 'Bruk chat-system'}
                          {key === 'readDocuments' && 'Les delte dokumenter'}
                          {key === 'editOwnRequests' && 'Rediger egne forespørsler'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {value ? '✅ Aktiv' : '❌ Inaktiv'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Sammendrag</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Aktive tilganger:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {Object.values(formData.permissions).filter(Boolean).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Totalt tilganger:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {Object.keys(formData.permissions).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Nåværende rolle:</span>
                    <span className="ml-2 font-medium text-blue-600">
                      {selectedEmployee.role === 'admin' && 'Administrator'}
                      {selectedEmployee.role === 'department_leader' && 'Avdelingsleder'}
                      {selectedEmployee.role === 'employee' && 'Ansatt'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 font-medium ${
                      selectedEmployee.status === 'active' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedEmployee.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t mt-6">
              <button
                type="button"
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!db) throw new Error('Firebase not initialized');
                    await updateDoc(doc(db, 'employees', selectedEmployee.id), {
                      permissions: formData.permissions
                    });
                    setEmployees(prev => 
                      prev.map(emp => 
                        emp.id === selectedEmployee.id 
                          ? { ...emp, permissions: formData.permissions }
                          : emp
                      )
                    );
                    setShowPermissionsModal(false);
                  } catch (error) {
                    console.error('Error updating permissions:', error);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Lagre tilganger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Change Modal */}
      {showDepartmentModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-md modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Endre avdeling</h2>
              <button
                onClick={() => setShowDepartmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ansatt
                </label>
                <p className="text-sm text-gray-900">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nåværende avdeling
                </label>
                <p className="text-sm text-gray-900">{selectedEmployee.department}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ny avdeling *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Velg avdeling</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowDepartmentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!db) throw new Error('Firebase not initialized');
                    await updateDoc(doc(db, 'employees', selectedEmployee.id), {
                      department: formData.department
                    });
                    setEmployees(prev => 
                      prev.map(emp => 
                        emp.id === selectedEmployee.id 
                          ? { ...emp, department: formData.department }
                          : emp
                      )
                    );
                    setShowDepartmentModal(false);
                  } catch (error) {
                    console.error('Error updating department:', error);
                  }
                }}
                disabled={!formData.department}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Oppdater avdeling
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-md modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Endre rolle</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ansatt
                </label>
                <p className="text-sm text-gray-900">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nåværende rolle
                </label>
                <p className="text-sm text-gray-900">
                  {selectedEmployee.role === 'admin' && 'Administrator'}
                  {selectedEmployee.role === 'department_leader' && 'Avdelingsleder'}
                  {selectedEmployee.role === 'employee' && 'Ansatt'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ny rolle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'department_leader' | 'employee')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="employee">Ansatt</option>
                  <option value="department_leader">Avdelingsleder</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Advarsel:</strong> Endring av rolle vil oppdatere alle tilganger automatisk.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!db) throw new Error('Firebase not initialized');
                    await updateDoc(doc(db, 'employees', selectedEmployee.id), {
                      role: formData.role,
                      permissions: formData.permissions
                    });
                    setEmployees(prev => 
                      prev.map(emp => 
                        emp.id === selectedEmployee.id 
                          ? { ...emp, role: formData.role, permissions: formData.permissions }
                          : emp
                      )
                    );
                    setShowRoleModal(false);
                  } catch (error) {
                    console.error('Error updating role:', error);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Oppdater rolle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-md modal-content">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Endre status</h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ansatt
                </label>
                <p className="text-sm text-gray-900">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nåværende status
                </label>
                <p className="text-sm text-gray-900">
                  {selectedEmployee.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ny status *
                </label>
                <select
                  value={selectedEmployee.status === 'active' ? 'inactive' : 'active'}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                </select>
              </div>
              
              {selectedEmployee.status === 'active' && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Advarsel:</strong> Inaktive ansatte vil ikke ha tilgang til systemet.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!db) throw new Error('Firebase not initialized');
                    const newStatus = selectedEmployee.status === 'active' ? 'inactive' : 'active';
                    await updateDoc(doc(db, 'employees', selectedEmployee.id), {
                      status: newStatus
                    });
                    setEmployees(prev => 
                      prev.map(emp => 
                        emp.id === selectedEmployee.id 
                          ? { ...emp, status: newStatus }
                          : emp
                      )
                    );
                    setShowStatusModal(false);
                  } catch (error) {
                    console.error('Error updating status:', error);
                  }
                }}
                className={`px-4 py-2 text-white rounded-lg ${
                  selectedEmployee.status === 'active' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {selectedEmployee.status === 'active' ? 'Deaktiver' : 'Aktiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 