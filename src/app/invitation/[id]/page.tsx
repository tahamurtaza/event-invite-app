'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function Invitation() {
  const { id } = useParams() as { id: string };
  const [invitee, setInvitee] = useState<any>(null);
  const [event, setEvent] = useState({ location: '', date: '', time: '' });
  const [coming, setComing] = useState<boolean | null>(null);
  const [people, setPeople] = useState(1);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public-invitation?id=' + id)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setMessage(data.error);
        } else {
          setInvitee(data.invitee);
          setEvent(data.event);
          if (data.invitee.rsvp_coming !== null) {
            setSubmitted(true);
            setComing(data.invitee.rsvp_coming);
            setPeople(data.invitee.rsvp_people || 1);
          }
        }
      })
      .catch(() => setMessage('Error loading invitation'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (coming === null) return setMessage('Please select an option');

    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uniqueId: id, coming, people: coming ? people : 0 }),
    });

    if (res.ok) {
      setMessage('Thank you! Your RSVP is recorded.');
      setSubmitted(true);
    } else {
      setMessage('Failed to submit. Please try again.');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-3xl font-bold text-gray-800">Loading Invitation...</div>;
  if (!invitee) return <div className="min-h-screen flex items-center justify-center text-red-600 text-3xl font-bold">{message || 'Invalid Invitation'}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full border-4 border-purple-300">
        <h1 className="text-4xl font-bold text-center mb-6 text-purple-800">You're Invited!</h1>
        <p className="text-2xl text-center mb-8 text-gray-800">Dear {invitee.name},</p>

        <div className="bg-gradient-to-r from-purple-200 to-blue-200 p-8 rounded-2xl mb-8">
          <p className="text-xl mb-4 text-gray-800"><strong>Location:</strong> {event.location || 'To be announced'}</p>
          <p className="text-xl mb-4 text-gray-800"><strong>Date:</strong> {event.date || 'To be announced'}</p>
          <p className="text-xl mb-4 text-gray-800"><strong>Time:</strong> {event.time || 'To be announced'}</p>
          <p className="text-xl text-gray-800">You + up to {invitee.family_size - 1} guests ({invitee.family_size} total)</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center text-xl font-medium text-gray-800">
                <input type="radio" name="coming" checked={coming === true} onChange={() => setComing(true)} className="mr-3 w-6 h-6" />
                Yes, we're coming! 🎉
              </label>
              <label className="flex items-center text-xl font-medium text-gray-800">
                <input type="radio" name="coming" checked={coming === false} onChange={() => setComing(false)} className="mr-3 w-6 h-6" />
                Sorry, can't make it 😢
              </label>
            </div>

            {coming && (
              <div>
                <label className="block text-xl font-medium mb-2 text-gray-800">Number of attendees</label>
                <input
                  type="number"
                  value={people}
                  onChange={(e) => setPeople(Math.min(parseInt(e.target.value) || 1, invitee.family_size))}
                  min={1}
                  max={invitee.family_size}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-md text-xl focus:border-purple-500"
                />
              </div>
            )}

            <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-md text-xl font-medium hover:bg-purple-700 transition">
              Submit RSVP
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600 mb-4">Thank You!</p>
            <p className="text-2xl text-gray-800">Your response: {coming ? `Coming with ${people} people` : 'Not Coming'}</p>
          </div>
        )}

        {message && (
          <p className={`mt-6 text-center text-xl font-medium ${message.includes('Thank') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}