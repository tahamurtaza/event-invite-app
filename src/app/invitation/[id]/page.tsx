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
  const [editing, setEditing] = useState(false); // New: for edit mode
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
    if (coming === null) return setMessage('Please choose an option');

    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uniqueId: id, coming, people: coming ? people : 0 }),
    });

    if (res.ok) {
      setMessage(submitted ? 'Your response has been updated!' : 'Thank you! Your RSVP is recorded.');
      setSubmitted(true);
      setEditing(false);
    } else {
      setMessage('Failed to submit. Please try again.');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-3xl font-bold text-gray-800">Loading Invitation...</div>;
  if (!invitee) return <div className="min-h-screen flex items-center justify-center text-red-600 text-3xl font-bold">{message || 'Invalid Invitation'}</div>;

  const maxPeople = invitee.family_size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full border-8 border-purple-300">
        <h1 className="text-5xl font-extrabold text-center mb-8 text-purple-800">You're Invited! 🎉</h1>
        <p className="text-3xl text-center font-medium mb-12 text-gray-800">Dear {invitee.name},</p>

        <div className="bg-gradient-to-r from-purple-200 to-pink-200 p-10 rounded-2xl mb-12 shadow-lg">
          <p className="text-2xl mb-6 text-gray-800"><strong>Location:</strong> {event.location || 'To be announced'}</p>
          <p className="text-2xl mb-6 text-gray-800"><strong>Date:</strong> {event.date || 'To be announced'}</p>
          <p className="text-2xl mb-6 text-gray-800"><strong>Time:</strong> {event.time || 'To be announced'}</p>
          <p className="text-2xl text-gray-800">You + up to {maxPeople - 1} guests = {maxPeople} total</p>
        </div>

        {submitted && !editing ? (
          <div className="text-center">
            <p className="text-5xl font-bold text-green-600 mb-8">Thank You! ❤️</p>
            <p className="text-3xl text-gray-800 mb-10">Your response: {coming ? `Coming with ${people} people 🎊` : 'Not coming 😔'}</p>
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-600 text-white py-4 px-10 rounded-xl text-2xl font-bold hover:bg-blue-700 transition transform hover:scale-105 shadow-lg"
            >
              Edit Response ✏️
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-8">
              <div className="flex justify-center gap-10">
                <button
                  type="button"
                  onClick={() => setComing(true)}
                  className={`px-12 py-8 rounded-2xl text-3xl font-bold transition transform hover:scale-110 ${coming === true ? 'bg-green-600 text-white shadow-2xl' : 'bg-gray-200 text-gray-800'}`}
                >
                  Yes, Coming! 🎉
                </button>
                <button
                  type="button"
                  onClick={() => setComing(false)}
                  className={`px-12 py-8 rounded-2xl text-3xl font-bold transition transform hover:scale-110 ${coming === false ? 'bg-red-600 text-white shadow-2xl' : 'bg-gray-200 text-gray-800'}`}
                >
                  No, Can't Come 😢
                </button>
              </div>
            </div>

            {coming === true && (
              <div>
                <p className="text-3xl text-center font-medium mb-8 text-gray-800">How many people are coming?</p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-6">
                  {Array.from({ length: maxPeople }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPeople(num)}
                      className={`py-6 rounded-2xl text-3xl font-bold transition transform hover:scale-110 ${people === num ? 'bg-green-600 text-white shadow-2xl' : 'bg-gray-200 text-gray-800'}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 rounded-2xl text-3xl font-bold hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105 shadow-2xl">
              {submitted ? 'Update Response' : 'Submit RSVP'}
            </button>
          </form>
        )}

        {message && (
          <p className={`mt-10 text-center text-2xl font-bold ${message.includes('Thank') || message.includes('updated') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}