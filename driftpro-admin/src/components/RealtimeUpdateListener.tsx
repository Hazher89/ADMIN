'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { realtimeService, RealtimeUpdate } from '@/lib/realtime-service';
import { Bell, RefreshCw, X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RealtimeUpdateListenerProps {
  onUpdate?: (update: RealtimeUpdate) => void;
  autoRefresh?: boolean; // Automatically refresh page on critical updates
}

export default function RealtimeUpdateListener({ onUpdate, autoRefresh = true }: RealtimeUpdateListenerProps) {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState<RealtimeUpdate | null>(null);

  useEffect(() => {
    if (!userProfile?.companyId) return;

    const unsubscribe = realtimeService.subscribeToUpdates(
      userProfile.companyId,
      (newUpdates) => {
        // Filter out updates that aren't relevant to this user
        const relevantUpdates = newUpdates.filter(update => 
          !update.affectedUsers || 
          update.affectedUsers.length === 0 || 
          update.affectedUsers.includes(userProfile.id)
        );

        setUpdates(relevantUpdates);
        
        // Check for new updates
        if (relevantUpdates.length > 0) {
          const newest = relevantUpdates[0];
          if (newest !== latestUpdate) {
            setLatestUpdate(newest);
            setShowNotification(true);
            setUnreadCount(prev => prev + 1);
            
            // Auto-refresh if required
            if (autoRefresh && newest.requiresRefresh && newest.priority === 'critical') {
              // Delay refresh slightly to show notification
              setTimeout(() => {
                router.refresh();
              }, 1000);
            }
            
            // Call custom handler
            if (onUpdate) {
              onUpdate(newest);
            }
          }
        }
      },
      {
        limit: 50,
        userId: userProfile.id,
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userProfile?.companyId, userProfile?.id, router, autoRefresh, onUpdate, latestUpdate]);

  const getUpdateIcon = (priority: RealtimeUpdate['priority']) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getUpdateColor = (priority: RealtimeUpdate['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'medium':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-green-50 border-green-200 text-green-900';
    }
  };

  const handleDismissNotification = () => {
    setShowNotification(false);
    setUnreadCount(0);
  };

  const handleManualRefresh = () => {
    router.refresh();
    handleDismissNotification();
  };

  if (!latestUpdate || !showNotification) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5">
      <div className={`border rounded-lg shadow-lg p-4 ${getUpdateColor(latestUpdate.priority)}`}>
        <div className="flex items-start gap-3">
          {getUpdateIcon(latestUpdate.priority)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-sm">
                {latestUpdate.priority === 'critical' ? 'Viktig oppdatering' : 'Oppdatering'}
              </h4>
              <button
                onClick={handleDismissNotification}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm mb-2">{latestUpdate.message || 'Systemet har blitt oppdatert'}</p>
            {latestUpdate.requiresRefresh && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualRefresh}
                  className="text-xs font-medium underline hover:no-underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Oppdater siden
                </button>
              </div>
            )}
            <div className="text-xs opacity-75 mt-2">
              {new Date(latestUpdate.timestamp).toLocaleTimeString('nb-NO')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating notification badge component
export function RealtimeUpdateBadge() {
  const { userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (!userProfile?.companyId) return;

    const unsubscribe = realtimeService.subscribeToUpdates(
      userProfile.companyId,
      (updates) => {
        const relevantUpdates = updates.filter(update => 
          !update.affectedUsers || 
          update.affectedUsers.length === 0 || 
          update.affectedUsers.includes(userProfile.id)
        );
        
        setUnreadCount(relevantUpdates.length);
        setShowBadge(relevantUpdates.length > 0);
      },
      {
        limit: 50,
        userId: userProfile.id,
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userProfile?.companyId, userProfile?.id]);

  if (!showBadge || unreadCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-blue-600 text-white rounded-full p-3 shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
    </div>
  );
}


