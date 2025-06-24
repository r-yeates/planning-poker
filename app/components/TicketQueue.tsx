'use client';

import { useState, useMemo } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Room, TicketItem } from '@/lib/firebase';

interface TicketQueueProps {
  room: Room;
  roomId: string;
  userId: string | null;
  isAdmin: boolean;
}

export default function TicketQueue({
  room,
  roomId,
  userId,
  isAdmin
}: TicketQueueProps) {
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Scalability improvements
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdminCollapsed, setIsAdminCollapsed] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const itemsPerPage = 10;

  // Filter and sort tickets
  const filteredAndSortedTickets = useMemo(() => {
    let tickets = room.ticketQueue || [];
    
    // Filter by search term
    if (searchTerm) {
      tickets = tickets.filter(ticket => 
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.description && ticket.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort tickets
    tickets = [...tickets].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.addedAt - a.addedAt;
        case 'oldest':
          return a.addedAt - b.addedAt;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    return tickets;
  }, [room.ticketQueue, searchTerm, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTickets.length / itemsPerPage);
  const paginatedTickets = filteredAndSortedTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  const addTicket = async () => {
    if (!newTicketTitle.trim() || !userId || !roomId) return;

    setIsSubmitting(true);
    try {
      const newTicket: TicketItem = {
        id: Date.now().toString(),
        title: newTicketTitle.trim(),
        addedBy: userId,
        addedAt: Date.now()
      };

      // Only add description if it has content
      const trimmedDescription = newTicketDescription.trim();
      if (trimmedDescription) {
        newTicket.description = trimmedDescription;
      }

      const docRef = doc(db, 'rooms', roomId);
      await updateDoc(docRef, {
        ticketQueue: arrayUnion(newTicket)
      });

      setNewTicketTitle('');
      setNewTicketDescription('');
      setIsAddingTicket(false);
    } catch (error) {
      console.error('Error adding ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeTicket = async (ticket: TicketItem) => {
    if (!isAdmin) return;

    try {
      const docRef = doc(db, 'rooms', roomId);
      await updateDoc(docRef, {
        ticketQueue: arrayRemove(ticket)
      });
    } catch (error) {
      console.error('Error removing ticket:', error);
    }
  };

  const selectTicket = async (ticket: TicketItem) => {
    if (!isAdmin) return;

    try {
      const docRef = doc(db, 'rooms', roomId);
      await updateDoc(docRef, {
        currentTicket: ticket.title,
        votes: {},
        votesRevealed: false
      });
    } catch (error) {
      console.error('Error selecting ticket:', error);
    }
  };

  const bulkRemoveTickets = async () => {
    if (!roomId || selectedTickets.size === 0) return;
    
    try {
      const ticketsToRemove = filteredAndSortedTickets.filter(ticket => 
        selectedTickets.has(ticket.id)
      );
      
      const docRef = doc(db, 'rooms', roomId);
      const updates = ticketsToRemove.map(ticket => 
        updateDoc(docRef, { ticketQueue: arrayRemove(ticket) })
      );
      
      await Promise.all(updates);
      setSelectedTickets(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error removing tickets:', error);
    }
  };

  const toggleTicketSelection = (ticketId: string) => {
    const newSelection = new Set(selectedTickets);
    if (newSelection.has(ticketId)) {
      newSelection.delete(ticketId);
    } else {
      newSelection.add(ticketId);
    }
    setSelectedTickets(newSelection);
  };

  const selectAllCurrentPage = () => {
    const newSelection = new Set(selectedTickets);
    paginatedTickets.forEach(ticket => newSelection.add(ticket.id));
    setSelectedTickets(newSelection);
  };

  const deselectAll = () => {
    setSelectedTickets(new Set());
  };

  const getParticipantName = (userId: string) => {
    return room.participants[userId]?.name || 'Unknown User';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      {/* Admin Dropdown - Only for Admin Users */}
      {isAdmin && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsAdminCollapsed(!isAdminCollapsed)}
            className="w-full flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin Controls</span>
            <svg 
              className={`w-4 h-4 transition-transform text-gray-400 ${isAdminCollapsed ? '-rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Admin Controls Content */}
          {!isAdminCollapsed && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Use the buttons below to manage tickets and control the voting session.
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-3 py-2 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                >
                  {showBulkActions ? 'Exit Bulk' : 'Bulk Actions'}
                </button>
                <button 
                  onClick={() => setIsAddingTicket(true)}
                  className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Add Ticket
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Ticket Queue ({filteredAndSortedTickets.length}/{room.ticketQueue?.length || 0})
          </h3>
          {!isAdmin && (
            <button
              onClick={() => setIsAddingTicket(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add Ticket
            </button>
          )}
        </div>

        {/* Search and Filter Controls */}
        {!isCollapsed && (room.ticketQueue?.length || 0) > 3 && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tickets..."
                  className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
                className="p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">By Title</option>
              </select>
            </div>
            {searchTerm && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Found {filteredAndSortedTickets.length} of {room.ticketQueue?.length || 0} tickets
              </div>
            )}
            
            {/* Bulk Actions Bar */}
            {showBulkActions && isAdmin && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      {selectedTickets.size} selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllCurrentPage}
                        className="text-xs px-2 py-1 bg-orange-200 dark:bg-orange-700 hover:bg-orange-300 dark:hover:bg-orange-600 text-orange-800 dark:text-orange-200 rounded transition-colors"
                      >
                        Select Page
                      </button>
                      <button
                        onClick={deselectAll}
                        className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={bulkRemoveTickets}
                    disabled={selectedTickets.size === 0}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors"
                  >
                    Remove Selected
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="p-4 space-y-3">
          {/* Add Ticket Form */}
          {isAddingTicket && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ticket Title *
                </label>
                <input
                  type="text"
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter ticket title..."
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newTicketDescription}
                  onChange={(e) => setNewTicketDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Brief description of the ticket..."
                  rows={2}
                  maxLength={300}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addTicket}
                  disabled={!newTicketTitle.trim() || isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
                >
                  {isSubmitting ? 'Adding...' : 'Add Ticket'}
                </button>
                <button
                  onClick={() => {
                    setIsAddingTicket(false);
                    setNewTicketTitle('');
                    setNewTicketDescription('');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Ticket List */}
          {filteredAndSortedTickets.length > 0 ? (
            <>
              <div className="space-y-2">
                {paginatedTickets.map((ticket, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <div
                      key={ticket.id}
                      className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {/* Bulk Selection Checkbox */}
                          {showBulkActions && isAdmin && (
                            <input
                              type="checkbox"
                              checked={selectedTickets.has(ticket.id)}
                              onChange={() => toggleTicketSelection(ticket.id)}
                              className="mt-1 w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                #{globalIndex}
                              </span>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                {ticket.title}
                              </h4>
                            </div>
                            {ticket.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {ticket.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>Added by {getParticipantName(ticket.addedBy)}</span>
                              <span>•</span>
                              <span>{new Date(ticket.addedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 ml-2">
                          {isAdmin && !showBulkActions && (
                            <>
                              <button
                                onClick={() => selectTicket(ticket)}
                                className="p-1.5 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                title="Select this ticket for voting"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeTicket(ticket)}
                                className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Remove ticket"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedTickets.length)} of {filteredAndSortedTickets.length}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:hover:bg-gray-200 dark:disabled:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                    >
                      ←
                    </button>
                    <span className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:hover:bg-gray-200 dark:disabled:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm">
                {searchTerm ? 'No tickets match your search' : 'No tickets in queue'}
              </p>
              <p className="text-xs mt-1">
                {searchTerm ? 'Try adjusting your search terms' : 'Add tickets to get started with estimation'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
