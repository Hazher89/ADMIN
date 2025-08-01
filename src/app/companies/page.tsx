import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CompanyDetailModal from '@/components/CompanyDetailModal';