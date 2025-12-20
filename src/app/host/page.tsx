'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Host() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [familySize, setFamilySize] = useState(1);
  const [invitees, setInvitees] = useState<any[]>([]);
  const [event, setEvent] = useState({ location: '', date: '', time: '' });
  const [editLocation, setEditLocation] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [summary, setSummary] = useState({ coming: 0, notComing: 0, pending: 0, totalPeople: 0 });
  const [message, setMessage] = useState('');
  const [eventMessage, setEventMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;

      if (role !== 'admin' && role !== 'superadmin') {
        alert('Access denied.');
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        loadData(token);
      }
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [router]);

  const loadData = async (token: string) => {
    await fetchEvent(token);
    await fetchInvitees(token);
  };

  const fetchEvent = async (token: string) => {
    try {
      const res = await fetch('/api/event', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
        // This is the critical fix: always sync edit fields with loaded event
        setEditLocation(data.location || '');
        setEditDate(data.date || '');
        setEditTime(data.time || '');
      } else {
        setEvent({ location: '', date: '', time: '' });
        setEditLocation('');
        setEditDate('');
        setEditTime('');
      }
    } catch (err) {
      console.error('Failed to fetch event', err);
      setEvent({ location: '', date: '', time: '' });
      setEditLocation('');
      setEditDate('');
      setEditTime('');
    }
  };

  const fetchInvitees = async (token: string) => {
    try {
      const res = await fetch('/api/invitees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInvitees(data);
        calculateSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch invitees', err);
    }
  };

  const calculateSummary = (list: any[]) => {
    let coming = 0, notComing = 0, pending = 0, totalPeople = 0;
    list.forEach(i => {
      if (i.rsvp_coming === true) {
        coming++;
        totalPeople += i.rsvp_people;
      } else if (i.rsvp_coming === false) {
        notComing++;
      } else {
        pending++;
      }
    });
    setSummary({ coming, notComing, pending, totalPeople });
  };

  const handleAddInvitee = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (!name.trim() || !phone.trim()) {
      setMessage('Name and phone are required.');
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/add-invitee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), family_size: familySize }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`"${name}" added successfully!`);
        setName('');
        setPhone('');
        setFamilySize(1);
        fetchInvitees(token);
      } else {
        setMessage(data.error || 'Failed to add invitee.');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventMessage('');
    setIsLoading(true);

    if (!editLocation.trim() || !editDate.trim() || !editTime.trim()) {
      setEventMessage('Please fill in all event details.');
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/set-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ location: editLocation.trim(), date: editDate.trim(), time: editTime.trim() }),
      });

      if (res.ok) {
        setEventMessage('Event details updated successfully!');
        setEvent({ location: editLocation.trim(), date: editDate.trim(), time: editTime.trim() });
        setShowEditForm(false);
      } else {
        const data = await res.json();
        setEventMessage(data.error || 'Failed to update event.');
      }
    } catch (err) {
      setEventMessage('Network error.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPrefilledMessage = (inviteeName: string, invitee: any) => {
  const loc = event.location || 'To be announced';
  const dt = event.date || 'To be announced';
  const tm = event.time || 'To be announced';
  return encodeURIComponent(
    `Hi ${inviteeName},\n\nYou're invited to our event!\n\n` +
    `Location: ${loc}\nDate: ${dt}\nTime: ${tm}\n\n` +
    `RSVP here: ${baseUrl}/invitation/${invitee.unique_id}\n\n` +
    `Hope to see you!`
  );
};

  const getRsvpStatus = (i: any) => {
    if (i.rsvp_coming === null) return 'Pending';
    return i.rsvp_coming ? `Coming (${i.rsvp_people} people)` : 'Not Coming';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-green-600 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Host Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md text-sm font-medium">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-8 p-4 space-y-8">

        {/* RSVP Summary */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">RSVP Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-100 p-6 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-800">{summary.coming}</p>
              <p className="text-gray-700">Coming ({summary.totalPeople} people)</p>
            </div>
            <div className="bg-red-100 p-6 rounded-lg text-center">
              <p className="text-3xl font-bold text-red-800">{summary.notComing}</p>
              <p className="text-gray-700">Not Coming</p>
            </div>
            <div className="bg-gray-200 p-6 rounded-lg text-center">
              <p className="text-3xl font-bold text-gray-800">{summary.pending}</p>
              <p className="text-gray-700">Pending</p>
            </div>
          </div>
        </div>

        {/* Current Event Details + Edit Button */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Current Event Details</h2>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              {showEditForm ? 'Cancel' : 'Edit Event Details'}
            </button>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-lg mb-2"><strong>Location:</strong> {event.location || 'Not set'}</p>
            <p className="text-lg mb-2"><strong>Date:</strong> {event.date || 'Not set'}</p>
            <p className="text-lg"><strong>Time:</strong> {event.time || 'Not set'}</p>
          </div>

          {showEditForm && (
            <form onSubmit={handleUpdateEvent} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Location"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                required
                className="px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                placeholder="Date (e.g. 2025-12-31)"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
                className="px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                placeholder="Time (e.g. 7:00 PM)"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                required
                className="px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 disabled:opacity-70 transition"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {eventMessage && (
            <p className={`mt-4 font-medium text-lg ${eventMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {eventMessage}
            </p>
          )}
        </div>

        {/* Add Invitee */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Add New Invitee</h2>
          <form onSubmit={handleAddInvitee} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Guest Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="Phone (+country code)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
            <input
              type="number"
              placeholder="Family Size"
              value={familySize}
              onChange={(e) => setFamilySize(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-70 transition"
            >
              Add Invitee
            </button>
          </form>
          {message && (
            <p className={`mt-4 font-medium text-lg ${message.includes('success') || message.includes('added') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>

        {/* Invitees List */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Invitees ({invitees.length})</h2>
          {invitees.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No invitees yet. Add one above!</p>
          ) : (
            <div className="space-y-4">
              {invitees.map((inv) => (
                <div key={inv.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-gray-50 rounded-lg border">
                  <div className="mb-4 md:mb-0">
                    <span className="font-semibold text-lg">{inv.name}</span>
                    <span className="text-gray-600 ml-4">{inv.phone}</span>
                    <span className="text-gray-600 ml-4">Family: {inv.family_size}</span>
                    <span className="text-blue-600 font-medium ml-4">| RSVP: {getRsvpStatus(inv)}</span>
                  </div>
                  <a
  href={`https://wa.me/${inv.phone.replace(/[^0-9+]/g, '')}?text=${getPrefilledMessage(inv.name, inv)}`}
  target="_blank"
  rel="noopener noreferrer"
  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-md transition"
>
  Send WhatsApp Invite
</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}