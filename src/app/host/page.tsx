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
  const [summary, setSummary] = useState({ attending: 0, notAttending: 0, pending: 0 });
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
        setEditLocation(data.location || '');
        setEditDate(data.date || '');
        setEditTime(data.time || '');
      }
    } catch (err) {
      console.error('Failed to fetch event', err);
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
    let attending = 0;
    let notAttending = 0;
    let pending = 0;

    list.forEach((invitee) => {
      if (invitee.rsvp_coming === true) {
        attending += invitee.rsvp_people;
      } else if (invitee.rsvp_coming === false) {
        notAttending += invitee.family_size;
      } else {
        pending += invitee.family_size;
      }
    });

    setSummary({ attending, notAttending, pending });
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Host Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg text-lg font-medium transition">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 p-6 space-y-10">

        {/* Attendance Summary */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Attendance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-green-100 p-8 rounded-xl text-center shadow-md">
              <p className="text-6xl font-bold text-green-700">{summary.attending}</p>
              <p className="text-2xl font-medium text-green-800 mt-4">Attending</p>
            </div>
            <div className="bg-red-100 p-8 rounded-xl text-center shadow-md">
              <p className="text-6xl font-bold text-red-700">{summary.notAttending}</p>
              <p className="text-2xl font-medium text-red-800 mt-4">Not Attending</p>
            </div>
            <div className="bg-yellow-100 p-8 rounded-xl text-center shadow-md">
              <p className="text-6xl font-bold text-yellow-700">{summary.pending}</p>
              <p className="text-2xl font-medium text-yellow-800 mt-4">Pending</p>
            </div>
          </div>
        </div>

        {/* Current Event Details + Edit Button */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Current Event Details</h2>
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
            >
              {showEditForm ? 'Cancel' : 'Edit Event Details'}
            </button>
          </div>

          <div className="bg-gray-100 p-6 rounded-lg">
            <p className="text-lg mb-3 text-gray-800"><strong>Location:</strong> {event.location || 'Not set'}</p>
            <p className="text-lg mb-3 text-gray-800"><strong>Date:</strong> {event.date || 'Not set'}</p>
            <p className="text-lg text-gray-800"><strong>Time:</strong> {event.time || 'Not set'}</p>
          </div>

          {showEditForm && (
            <form onSubmit={handleUpdateEvent} className="mt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input
                  type="text"
                  placeholder="Location"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  required
                  className="px-5 py-4 border border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <input
                  type="text"
                  placeholder="Date (e.g. 2025-12-31)"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  className="px-5 py-4 border border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <input
                  type="text"
                  placeholder="Time (e.g. 7:00 PM)"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  required
                  className="px-5 py-4 border border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-4 rounded-lg text-xl font-medium hover:bg-blue-700 transition"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {eventMessage && (
            <p className={`mt-6 text-center text-xl font-medium ${eventMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {eventMessage}
            </p>
          )}
        </div>

        {/* Add New Invitee */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Invitee</h2>
          <form onSubmit={handleAddInvitee} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <input
              type="text"
              placeholder="Guest Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="px-5 py-4 border border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <input
              type="text"
              placeholder="Phone (+country code)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="px-5 py-4 border border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <input
              type="number"
              placeholder="Family Size"
              value={familySize}
              onChange={(e) => setFamilySize(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="px-5 py-4 border border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white py-4 rounded-lg text-xl font-medium hover:bg-blue-700 transition"
            >
              Add Invitee
            </button>
          </form>
          {message && (
            <p className={`mt-6 text-center text-xl font-medium ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>

        {/* Invitees List */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Invitees ({invitees.length})</h2>
          {invitees.length === 0 ? (
            <p className="text-center text-xl text-gray-500 py-10">No invitees yet. Add one above!</p>
          ) : (
            <div className="space-y-6">
              {invitees.map((inv) => (
                <div key={inv.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="mb-4 md:mb-0">
                    <span className="text-xl font-semibold text-gray-800">{inv.name}</span>
                    <span className="text-lg text-gray-600 ml-5">{inv.phone}</span>
                    <span className="text-lg text-gray-600 ml-5">Family: {inv.family_size}</span>
                    <span className="text-lg font-medium text-blue-600 ml-5">| RSVP: {getRsvpStatus(inv)}</span>
                  </div>
                  <a
                    href={`https://wa.me/${inv.phone.replace(/[^0-9+]/g, '')}?text=${getPrefilledMessage(inv.name, inv)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-lg text-lg transition flex items-center"
                  >
                    <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.446.099-.148.05-.272-.025-.372-.074-.099-.67-1.623-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
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