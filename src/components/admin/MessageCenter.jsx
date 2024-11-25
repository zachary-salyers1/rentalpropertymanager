import React, { useState, useEffect } from 'react';
import { messageService } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

export function MessageCenter() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  const loadMessages = async () => {
    try {
      const data = await messageService.getAllForUser(user.id);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyTo || !replyContent.trim()) return;

    try {
      await messageService.send({
        senderId: user.id,
        receiverId: replyTo.senderId,
        content: replyContent,
        propertyId: replyTo.propertyId,
        bookingId: replyTo.bookingId
      });
      setReplyContent('');
      setReplyTo(null);
      loadMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await messageService.markAsRead(messageId);
      loadMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Message Center</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all your client communications in one place.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {messages.map((message) => (
              <li key={message.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="truncate text-sm font-medium text-indigo-600">
                        From: {message.senderId}
                      </p>
                      {!message.read && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          New
                        </span>
                      )}
                    </div>
                    <div className="ml-2 flex flex-shrink-0">
                      <p className="text-sm text-gray-500">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-900">{message.content}</p>
                  </div>
                  <div className="mt-3 flex">
                    {!message.read && (
                      <button
                        onClick={() => markAsRead(message.id)}
                        className="text-sm text-gray-500 hover:text-gray-700 mr-4"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => setReplyTo(message)}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {replyTo && (
        <div className="mt-6">
          <form onSubmit={handleReply} className="space-y-4">
            <div>
              <label htmlFor="reply" className="block text-sm font-medium text-gray-700">
                Reply to {replyTo.senderId}
              </label>
              <div className="mt-1">
                <textarea
                  id="reply"
                  name="reply"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Send Reply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
