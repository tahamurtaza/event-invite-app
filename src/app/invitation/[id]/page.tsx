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
    if (coming === null) return setMessage('Please choose an option');

    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uniqueId: id, coming, people: coming ? people : 0 }),
    });

    if (res.ok) {
      setMessage('Your response has been updated!');
    } else {
      setMessage('Failed to update. Please try again.');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-3xl font-bold text-gray-800">Loading...</div>;
  if (!invitee) return <div className="min-h-screen flex items-center justify-center text-red-600 text-3xl font-bold">{message || 'Invalid Invitation'}</div>;

  const maxPeople = invitee.family_size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full border-4 border-purple-300">
        <h1 className="text-4xl font-bold text-center mb-6 text-purple-800">You're Invited!</h1>
        <p className="text-2xl text-center mb-8 text-gray-800">Dear {invitee.name},</p>

        <div className="bg-gradient-to-r from-purple-200 to-blue-200 p-8 rounded-2xl mb-8">
          <p className="text-xl mb-4 text-gray-800"><strong>Location:</strong> {event.location || 'To be announced'}</p>
          <p className="text-xl mb-4 text-gray-800"><strong>Date:</strong> {event.date || 'To be announced'}</p>
          <p className="text-xl mb-4 text-gray-800"><strong>Time:</strong> {event.time || 'To be announced'}</p>
          <p className="text-xl text-gray-800">You + up to {maxPeople - 1} guests ({maxPeople} total)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="flex justify-center gap-8">
              <button
                type="button"
                onClick={() => setComing(true)}
                className={`px-10 py-6 rounded-xl text-2xl font-bold transition transform hover:scale-105 ${coming === true ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                Yes, Coming! 🎉
              </button>
              <button
                type="button"
                onClick={() => setComing(false)}
                className={`px-10 py-6 rounded-xl text-2xl font-bold transition transform hover:scale-105 ${coming === false ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                No, Can't Come 😢
              </button>
            </div>
          </div>

          {coming === true && (
            <div>
              <p className="text-2xl text-center mb-6 text-gray-800 font-medium">How many people are coming?</p>
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: maxPeople }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPeople(num)}
                    className={`py-4 rounded-xl text-2xl font-bold transition transform hover:scale-110 ${people === num ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-purple-600 text-white py-6 rounded-xl text-3xl font-bold hover:bg-purple-700 transition transform hover:scale-105">
            {coming === null ? 'Choose an Option' : 'Update Response'}
          </button>
        </form>

        {message && (
          <p className={`mt-8 text-center text-2xl font-bold ${message.includes('updated') || message.includes('recorded') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}