/**
 * Outlook-style Layout Component
 * 
 * Provides the main Outlook-style UI layout with:
 * - Folder navigation sidebar
 * - Message list
 * - Reading pane
 * - All Outlook features
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Mail, Inbox, Send, FileText, Archive, Trash2, Star, Flag, Tag,
  Search, Filter, Plus, RefreshCw, ChevronDown, ChevronRight,
  MoreVertical, Reply, ReplyAll, Forward, Delete, Archive as ArchiveIcon,
  Folder, FolderPlus, Settings, X, Eye, EyeOff, Download, Paperclip,
  Calendar, Clock, User, Users, AlertCircle, CheckCircle2, Circle
} from 'lucide-react';
import { microsoftGraphService } from '@/lib/microsoft-graph-service';

interface OutlookLayoutProps {
  children?: React.ReactNode;
  folders: any[];
  selectedFolder: string;
  onFolderSelect: (folderId: string) => void;
  messages: any[];
  selectedMessage: any | null;
  onMessageSelect: (message: any) => void;
  onCompose: () => void;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  // Email actions
  onArchive?: (emailId: string) => void;
  onDelete?: (emailId: string) => void;
  onMove?: (emailId: string, folderId: string) => void;
  onCategorize?: (emailId: string, categories: string[]) => void;
  onFlag?: (emailId: string, flagStatus: 'flagged' | 'complete' | 'notFlagged') => void;
  onStar?: (emailId: string, isStarred: boolean) => void;
  onBatchAction?: (action: 'delete' | 'archive' | 'markRead' | 'markUnread', emailIds: string[]) => void;
  selectedEmails?: Set<string>;
  onEmailSelect?: (emailId: string, selected: boolean) => void;
}

export default function OutlookLayout({
  folders = [],
  selectedFolder,
  onFolderSelect,
  messages = [],
  selectedMessage,
  onMessageSelect,
  onCompose,
  onRefresh,
  searchQuery,
  onSearchChange,
  isLoading = false,
  onArchive,
  onDelete,
  onMove,
  onCategorize,
  onFlag,
  onStar,
  onBatchAction,
  selectedEmails = new Set(),
  onEmailSelect
}: OutlookLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [readingPaneVisible, setReadingPaneVisible] = useState(true);
  const [viewMode, setViewMode] = useState<'compact' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'subject' | 'from'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Outlook default folders
  const defaultFolders = [
    { id: 'inbox', name: 'Innboks', icon: Inbox, unread: 0 },
    { id: 'sent', name: 'Sendt', icon: Send, unread: 0 },
    { id: 'drafts', name: 'Kladder', icon: FileText, unread: 0 },
    { id: 'archive', name: 'Arkiv', icon: Archive, unread: 0 },
    { id: 'deleted', name: 'Slettet', icon: Trash2, unread: 0 },
  ];
  
  const allFolders = [...defaultFolders, ...folders];
  
  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 64px)', // Minus topbar height
      background: 'var(--background-color)',
      overflow: 'hidden'
    }}>
      {/* Left Sidebar - Folders */}
      <div style={{
        width: sidebarCollapsed ? '60px' : '240px',
        background: 'var(--card-background)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        overflow: 'hidden'
      }}>
        {/* Compose Button */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={onCompose}
            className="btn btn-primary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem'
            }}
          >
            <Plus size={18} />
            {!sidebarCollapsed && <span>Ny e-post</span>}
          </button>
        </div>
        
        {/* Folders List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
          {allFolders.map(folder => {
            const Icon = folder.icon || Folder;
            const isSelected = selectedFolder === folder.id;
            const unreadCount = folder.unread || 0;
            
            return (
              <button
                key={folder.id}
                onClick={() => onFolderSelect(folder.id)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? 'white' : 'var(--text-color)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--gray-100)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={18} />
                {!sidebarCollapsed && (
                  <>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                      <span style={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {folder.name || folder.displayName}
                      </span>
                      {folder.path && folder.path !== folder.name && (
                        <span style={{
                          fontSize: 'var(--font-size-xs)',
                          color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--gray-400)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={folder.path}>
                          {folder.path}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        background: isSelected ? 'rgba(255,255,255,0.3)' : 'var(--primary)',
                        color: isSelected ? 'white' : 'white',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Collapse Toggle */}
        <div style={{ padding: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={sidebarCollapsed ? 'Utvid sidebar' : 'Kollaps sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--card-background)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--gray-400)'
            }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Søk i e-post..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--background-color)',
                color: 'var(--text-color)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>
          
          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Batch Actions */}
            {selectedEmails && selectedEmails.size > 0 && onBatchAction && (
              <>
                <button
                  onClick={() => onBatchAction('markRead', Array.from(selectedEmails))}
                  className="btn btn-secondary"
                  style={{ fontSize: 'var(--font-size-xs)', padding: '0.5rem 1rem' }}
                >
                  Marker som lest ({selectedEmails.size})
                </button>
                <button
                  onClick={() => onBatchAction('markUnread', Array.from(selectedEmails))}
                  className="btn btn-secondary"
                  style={{ fontSize: 'var(--font-size-xs)', padding: '0.5rem 1rem' }}
                >
                  Marker som ulest ({selectedEmails.size})
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Er du sikker på at du vil slette ${selectedEmails.size} e-poster?`)) {
                      onBatchAction('delete', Array.from(selectedEmails));
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: 'var(--font-size-xs)', padding: '0.5rem 1rem', color: 'var(--red-600)' }}
                >
                  Slett ({selectedEmails.size})
                </button>
                <button
                  onClick={() => onBatchAction('archive', Array.from(selectedEmails))}
                  className="btn btn-secondary"
                  style={{ fontSize: 'var(--font-size-xs)', padding: '0.5rem 1rem' }}
                >
                  Arkiver ({selectedEmails.size})
                </button>
                <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 0.25rem' }} />
              </>
            )}
            
            <button
              onClick={onRefresh}
              disabled={isLoading}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                color: 'var(--text-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Oppdater"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            
            <button
              onClick={() => setReadingPaneVisible(!readingPaneVisible)}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={readingPaneVisible ? 'Skjul lesepanel' : 'Vis lesepanel'}
            >
              {readingPaneVisible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            
            <button
              onClick={() => setViewMode(viewMode === 'compact' ? 'list' : 'compact')}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Bytt visning"
            >
              <Filter size={18} />
            </button>
          </div>
        </div>
        
        {/* Message List and Reading Pane */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Message List */}
          <div style={{
            width: readingPaneVisible ? '40%' : '100%',
            borderRight: readingPaneVisible ? '1px solid var(--border-color)' : 'none',
            background: 'var(--card-background)',
            overflowY: 'auto',
            transition: 'width 0.3s'
          }}>
            {messages.length === 0 ? (
              <div style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                color: 'var(--gray-500)'
              }}>
                <Mail size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>Ingen meldinger i denne mappen</p>
              </div>
            ) : (
              <div>
                {messages.map((message: any) => {
                  const isSelected = selectedMessage?.id === message.id;
                  const isRead = message.isRead !== false;
                  
                  return (
                    <div
                      key={message.id}
                      onClick={() => onMessageSelect(message)}
                      style={{
                        padding: viewMode === 'compact' ? '0.5rem 1rem' : '1rem',
                        borderBottom: '1px solid var(--border-color)',
                        background: isSelected ? 'var(--blue-50)' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'background 0.2s',
                        fontWeight: isRead ? '400' : '600'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'var(--gray-50)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedEmails?.has(message.id) || false}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (onEmailSelect) {
                            onEmailSelect(message.id, e.target.checked);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      
                      {/* Star */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStar) {
                            onStar(message.id, !message.importance || message.importance !== 'high');
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={message.importance === 'high' ? 'Fjern stjerne' : 'Marker med stjerne'}
                      >
                        <Star size={16} style={{
                          color: message.importance === 'high' ? 'var(--yellow-500)' : 'var(--gray-400)',
                          fill: message.importance === 'high' ? 'var(--yellow-500)' : 'none'
                        }} />
                      </button>
                      
                      {/* Flag */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onFlag) {
                            const newStatus = message.flag?.flagStatus === 'flagged' ? 'notFlagged' : 'flagged';
                            onFlag(message.id, newStatus);
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={message.flag?.flagStatus === 'flagged' ? 'Fjern flagg' : 'Flagg melding'}
                      >
                        <Flag size={16} style={{
                          color: message.flag?.flagStatus === 'flagged' ? 'var(--red-500)' : 'var(--gray-400)',
                          fill: message.flag?.flagStatus === 'flagged' ? 'var(--red-500)' : 'none'
                        }} />
                      </button>
                      
                      {/* Sender - Enhanced display */}
                      <div style={{
                        minWidth: viewMode === 'compact' ? '150px' : '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.125rem'
                      }}>
                        <div style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: isRead ? '400' : '600',
                          color: 'var(--text-color)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={message.from?.emailAddress?.name || message.from?.name || message.from?.emailAddress?.address || message.from?.address || message.fromAddr || 'Ukjent'}>
                          {message.from?.emailAddress?.name || message.from?.name || message.from?.emailAddress?.address || message.from?.address || message.fromAddr || 'Ukjent'}
                        </div>
                        {(message.from?.emailAddress?.address || message.from?.address) && (
                          <div style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--gray-400)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={message.from?.emailAddress?.address || message.from?.address || ''}>
                            {message.from?.emailAddress?.address || message.from?.address}
                          </div>
                        )}
                      </div>
                      
                      {/* Subject and Preview */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: viewMode === 'compact' ? '0' : '0.25rem'
                        }}>
                          <span style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: isRead ? '400' : '600',
                            color: 'var(--text-color)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {message.subject || '(Uten emne)'}
                          </span>
                          {message.hasAttachments && (
                            <Paperclip size={14} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                          )}
                        </div>
                        {viewMode === 'list' && message.snippet && (
                          <div style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--gray-500)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {message.snippet}
                          </div>
                        )}
                      </div>
                      
                      {/* Date */}
                      <div style={{
                        minWidth: '100px',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--gray-500)',
                        textAlign: 'right'
                      }}>
                        {message.receivedDateTime ? new Date(message.receivedDateTime).toLocaleDateString('no-NO', {
                          day: 'numeric',
                          month: 'short',
                          hour: message.receivedDateTime ? '2-digit' : undefined,
                          minute: message.receivedDateTime ? '2-digit' : undefined
                        }) : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Reading Pane */}
          {readingPaneVisible && selectedMessage && (
            <div style={{
              flex: 1,
              background: 'var(--card-background)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Message Header */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--background-color)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <h2 style={{
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: '600',
                    color: 'var(--text-color)',
                    margin: 0,
                    flex: 1
                  }}>
                    {selectedMessage.subject || '(Uten emne)'}
                  </h2>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        if (onArchive && selectedMessage) {
                          onArchive(selectedMessage.id);
                        }
                      }}
                      style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-color)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Arkiver"
                    >
                      <ArchiveIcon size={18} />
                    </button>
                    <button
                      onClick={() => {
                        if (onDelete && selectedMessage) {
                          onDelete(selectedMessage.id);
                        }
                      }}
                      style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-color)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Slett"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-color)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Mer"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Message Actions */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: 'var(--font-size-sm)', padding: '0.5rem 1rem' }}
                  >
                    <Reply size={16} style={{ marginRight: '0.5rem' }} />
                    Svar
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: 'var(--font-size-sm)', padding: '0.5rem 1rem' }}
                  >
                    <ReplyAll size={16} style={{ marginRight: '0.5rem' }} />
                    Svar alle
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: 'var(--font-size-sm)', padding: '0.5rem 1rem' }}
                  >
                    <Forward size={16} style={{ marginRight: '0.5rem' }} />
                    Videresend
                  </button>
                </div>
                
                {/* Message Info */}
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-color)',
                  lineHeight: '1.6'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', minWidth: '80px', display: 'inline-block' }}>Fra:</span>
                    <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-color)' }}>
                        {selectedMessage.from?.emailAddress?.name || selectedMessage.from?.name || selectedMessage.from?.emailAddress?.address || selectedMessage.from?.address || selectedMessage.fromAddr || 'Ukjent'}
                      </div>
                      {(selectedMessage.from?.emailAddress?.address || selectedMessage.from?.address) && (
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-500)', marginTop: '0.125rem' }}>
                          {selectedMessage.from?.emailAddress?.address || selectedMessage.from?.address}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedMessage.toRecipients && selectedMessage.toRecipients.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', minWidth: '80px', display: 'inline-block' }}>Til:</span>
                      <span>{selectedMessage.toRecipients.map((r: any) => {
                        const recipient = r.emailAddress || r;
                        return recipient.name || recipient.address;
                      }).join(', ')}</span>
                    </div>
                  )}
                  {selectedMessage.ccRecipients && selectedMessage.ccRecipients.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', minWidth: '80px', display: 'inline-block' }}>Kopi:</span>
                      <span>{selectedMessage.ccRecipients.map((r: any) => {
                        const recipient = r.emailAddress || r;
                        return recipient.name || recipient.address;
                      }).join(', ')}</span>
                    </div>
                  )}
                  <div>
                    <span style={{ fontWeight: '600', minWidth: '80px', display: 'inline-block' }}>Dato:</span>
                    <span>{selectedMessage.receivedDateTime ? new Date(selectedMessage.receivedDateTime).toLocaleString('no-NO') : 'Ukjent'}</span>
                  </div>
                </div>
              </div>
              
              {/* Message Body */}
              <div style={{
                flex: 1,
                padding: '1.5rem',
                fontSize: 'var(--font-size-base)',
                lineHeight: '1.6',
                color: 'var(--text-color)',
                overflow: 'auto'
              }}>
                {selectedMessage.body?.contentType === 'html' || selectedMessage.bodyHtml ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: selectedMessage.body?.content || selectedMessage.bodyHtml || '' }}
                    style={{
                      maxWidth: '100%',
                      wordWrap: 'break-word'
                    }}
                  />
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                    {selectedMessage.body?.content || selectedMessage.bodyPlain || 'Ingen innhold'}
                  </div>
                )}
              </div>
              
              {/* Attachments */}
              {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                <div style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--border-color)',
                  background: 'var(--background-color)'
                }}>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    color: 'var(--text-color)',
                    marginBottom: '0.75rem'
                  }}>
                    Vedlegg ({selectedMessage.attachments.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedMessage.attachments.map((att: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          background: 'var(--card-background)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <Paperclip size={18} style={{ color: 'var(--gray-400)' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: '500',
                            color: 'var(--text-color)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {att.name}
                          </div>
                          <div style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--gray-500)'
                          }}>
                            {(att.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              // Download attachment
                              const attachmentUrl = await microsoftGraphService.getAttachmentDownloadUrl(selectedMessage.id, att.id);
                              const link = document.createElement('a');
                              link.href = attachmentUrl;
                              link.download = att.name || 'attachment';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } catch (error) {
                              console.error('Error downloading attachment:', error);
                              alert('Kunne ikke laste ned vedlegg');
                            }
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem', fontSize: 'var(--font-size-xs)' }}
                          title="Last ned"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

