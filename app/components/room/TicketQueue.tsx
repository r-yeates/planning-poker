'use client';

import { useState, useMemo } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Room, TicketItem } from '@/lib/firebase';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';

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
  const [isCollapsed, setIsCollapsed] = useState(() => room.isTicketQueueCollapsed ?? false);
  const itemsPerPage = 10;

  // Edit state
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Helper to get completed and active tickets
  const activeTickets = useMemo(() => (room.ticketQueue || []), [room.ticketQueue]);

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
  }, []);

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
  };  const getParticipantName = (userId: string) => {
    return room.participants[userId]?.name || 'Unknown User';
  };

  const selectTicket = async (ticket: TicketItem) => {
    if (!roomId || !isAdmin) return;
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

  const removeTicket = async (ticket: TicketItem) => {
    if (!roomId || !isAdmin) return;
    try {
      const docRef = doc(db, 'rooms', roomId);
      await updateDoc(docRef, {
        ticketQueue: room.ticketQueue.filter(t => t.id !== ticket.id)
      });
    } catch (error) {
      console.error('Error removing ticket:', error);
    }
  };

  // Add a handler for drag end
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !isAdmin || !roomId) return;
    const sourceIdx = result.source.index;
    const destIdx = result.destination.index;
    if (sourceIdx === destIdx) return;
    const tickets = [...room.ticketQueue];
    const [removed] = tickets.splice(sourceIdx, 1);
    tickets.splice(destIdx, 0, removed);
    try {
      const docRef = doc(db, 'rooms', roomId);
      await updateDoc(docRef, { ticketQueue: tickets });
    } catch (error) {
      console.error('Error reordering tickets:', error);
    }
  };

  // Only allow drag-and-drop if not filtered, not searched, and not paginated
  const isDragAndDropEnabled =
    isAdmin &&
    !searchTerm &&
    sortBy === 'newest' &&
    filteredAndSortedTickets.length === (room.ticketQueue?.length || 0) &&
    totalPages === 1;

  const startEdit = (ticket: TicketItem) => {
    setEditingTicketId(ticket.id);
    setEditTitle(ticket.title);
    setEditDescription(ticket.description || '');
  };

  const cancelEdit = () => {
    setEditingTicketId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const saveEdit = async () => {
    if (!editingTicketId || !roomId || !isAdmin) return;
    setIsEditSubmitting(true);
    try {
      const updatedTickets = room.ticketQueue.map(t =>
        t.id === editingTicketId ? { ...t, title: editTitle.trim(), description: editDescription.trim() } : t
      );
      const docRef = doc(db, 'rooms', roomId);
      await updateDoc(docRef, { ticketQueue: updatedTickets });
      cancelEdit();
    } catch (error) {
      console.error('Error editing ticket:', error);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div className={`p-4${!isCollapsed ? ' border-b border-gray-200 dark:border-gray-700' : ''}`}>        <div className="flex items-center justify-between">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-3 5h3m-6 0h.01M12 16h3m-6 0h.01M10 3v4h4V3h-4Z" />
            </svg>
            Ticket Queue ({filteredAndSortedTickets.length}/{room.ticketQueue?.length || 0})
          </h3>
        </div>        {/* Search and Filter Controls */}
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
          </div>
        )}

        {/* Add Ticket Button */}
        {!isCollapsed && (
          <div className="mt-3">
            <button
              onClick={() => setIsAddingTicket(true)}
              className="w-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" />
              </svg>
              Add New Ticket
            </button>
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
            isDragAndDropEnabled ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="ticket-queue">
                  {(provided: DroppableProvided) => {
                    return (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                        {filteredAndSortedTickets.map((ticket, index) => {
                          const globalIndex = index + 1;
                          const isCurrent = room.currentTicket === ticket.title;
                          return (
                            <Draggable key={ticket.id} draggableId={ticket.id} index={index} isDragDisabled={!isAdmin}>
                              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow${isCurrent ? ' ring-2 ring-blue-400 dark:ring-blue-600' : ''} ${snapshot.isDragging ? 'opacity-80' : ''}`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                            #{globalIndex}
                                          </span>
                                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                            {ticket.title}
                                          </h4>
                                          {isCurrent && (
                                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">Current</span>
                                          )}
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
                                      </div>                        </div>
                                    {isAdmin && (
                                      <div className="flex flex-col items-end ml-2 gap-2">
                                        <button
                                          onClick={() => selectTicket(ticket)}
                                          disabled={isCurrent}
                                          title={isCurrent ? 'Currently selected' : 'Select for discussion'}
                                          className={`p-0.5 rounded-full border transition-all duration-200 focus:outline-none ${isCurrent ? 'border-blue-400 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 opacity-100' : 'border-transparent bg-transparent text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 opacity-30 hover:opacity-100 focus:opacity-100'}`}
                                          style={{ cursor: isCurrent ? 'default' : 'pointer' }}
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => removeTicket(ticket)}
                                          title="Delete ticket"
                                          className="p-0.5 rounded-full border border-transparent bg-transparent text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 transition-all duration-200 focus:outline-none opacity-30 hover:opacity-100 focus:opacity-100"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                        {editingTicketId !== ticket.id && (
                                          <button
                                            onClick={() => startEdit(ticket)}
                                            className="p-0.5 rounded-full border border-transparent bg-transparent text-gray-300 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900 transition-all duration-200 focus:outline-none opacity-30 hover:opacity-100 focus:opacity-100"
                                            title="Edit ticket"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17v4h4l12-12a2 2 0 0 0-2.828-2.828L3 17z" />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Edit form */}
                                  {editingTicketId === ticket.id && (
                                    <div className="mt-2">
                                      <div className="space-y-2">
                                        <input
                                          type="text"
                                          value={editTitle}
                                          onChange={e => setEditTitle(e.target.value)}
                                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                          maxLength={100}
                                          disabled={isEditSubmitting}
                                        />
                                        <textarea
                                          value={editDescription}
                                          onChange={e => setEditDescription(e.target.value)}
                                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                          rows={2}
                                          maxLength={300}
                                          disabled={isEditSubmitting}
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            onClick={saveEdit}
                                            disabled={!editTitle.trim() || isEditSubmitting}
                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:bg-gray-400 text-sm"
                                          >
                                            {isEditSubmitting ? 'Saving...' : 'Save'}
                                          </button>
                                          <button
                                            onClick={cancelEdit}
                                            disabled={isEditSubmitting}
                                            className="px-3 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded text-sm"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    );
                  }}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="space-y-2">
                {paginatedTickets.map((ticket, index) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  const isCurrent = room.currentTicket === ticket.title;
                  return (
                    <div
                      key={ticket.id}
                      className={`bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow${isCurrent ? ' ring-2 ring-blue-400 dark:ring-blue-600' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                #{globalIndex}
                              </span>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                {ticket.title}
                              </h4>
                              {isCurrent && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">Current</span>
                              )}
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
                        {isAdmin && (
                          <div className="flex flex-col items-end ml-2 gap-2">
                            <button
                              onClick={() => selectTicket(ticket)}
                              disabled={isCurrent}
                              title={isCurrent ? 'Currently selected' : 'Select for discussion'}
                              className={`p-0.5 rounded-full border transition-all duration-200 focus:outline-none ${isCurrent ? 'border-blue-400 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 opacity-100' : 'border-transparent bg-transparent text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 opacity-30 hover:opacity-100 focus:opacity-100'}`}
                              style={{ cursor: isCurrent ? 'default' : 'pointer' }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => removeTicket(ticket)}
                              title="Delete ticket"
                              className="p-0.5 rounded-full border border-transparent bg-transparent text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900 transition-all duration-200 focus:outline-none opacity-30 hover:opacity-100 focus:opacity-100"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <button
                              onClick={() => startEdit(ticket)}
                              className="p-0.5 rounded-full border border-transparent bg-transparent text-gray-300 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900 transition-all duration-200 focus:outline-none opacity-30 hover:opacity-100 focus:opacity-100"
                              title="Edit ticket"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6M3 17v4h4l12-12a2 2 0 0 0-2.828-2.828L3 17z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isAdmin && (filteredAndSortedTickets.length !== (room.ticketQueue?.length || 0) || totalPages > 1) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Drag-and-drop reordering is only available when all tickets are shown (no search/filter/pagination).
                  </div>
                )}
              </div>
            )
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
