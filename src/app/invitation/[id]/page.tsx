'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const themes = {
  birthday: { bg: 'from-yellow-200 to-pink-200', titleColor: 'text-pink-700', accent: 'bg-pink-300' },
  wedding: { bg: 'from-rose-200 to-purple-200', titleColor: 'text-rose-700', accent: 'bg-rose-300' },
  majlis: { bg: 'from-emerald-200 to-teal-200', titleColor: 'text-emerald-700', accent: 'bg-emerald-300' },
  dares: { bg: 'from-orange-200 to-red-200', titleColor: 'text-orange-700', accent: 'bg-orange-300' },
  'baby-shower': { bg: 'from-blue-200 to-cyan-200', titleColor: 'text-blue-700', accent: 'bg-blue-300' },
  anniversary: { bg: 'from-indigo-200 to-purple-200', titleColor: 'text-indigo-700', accent: 'bg-indigo-300' },
} as const;

type ThemeKey = keyof typeof themes;

export default function Invitation() {
  const { id } = useParams() as { id: string };
  const [invitee, setInvitee] = useState<any>(null);
  const [event, setEvent] = useState({ location: '', date: '', time: '', theme: 'birthday' as ThemeKey });
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
          const loadedTheme: ThemeKey = data.event.theme && data.event.theme in themes ? data.event.theme as ThemeKey : 'birthday';
          setEvent({
            location: data.event.location || '',
            date: data.event.date || '',
            time: data.event.time || '',
            theme: loadedTheme
          });
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

  const currentTheme = themes[event.theme];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (coming === null) return setMessage('Please choose an option');

    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uniqueId: id, coming, people: coming ? people : 0 }),
    });

    if (res.ok) {
      setMessage('Thank you! Your RSVP is recorded.');
      setSubmitted(true);
    } else {
      setMessage('Failed to submit. Try again.');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-3xl font-bold text-gray-800">Loading Invitation...</div>;
  if (!invitee) return <div className="min-h-screen flex items-center justify-center text-red-600 text-3xl font-bold">{message || 'Invalid Invitation'}</div>;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} flex items-center justify-center p-4`}>
      <div className="relative bg-white/95 backdrop-blur-lg p-12 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Decorative Accent Border */}
        <div className={`absolute inset-0 border-12 border-double rounded-3xl ${currentTheme.accent} opacity-70`}></div>

        <div className="relative z-10">
          <h1 className={`text-6xl font-extrabold text-center mb-6 ${currentTheme.titleColor} drop-shadow-lg`}>You're Invited!</h1>
          <p className="text-4xl text-center font-medium mb-12 text-gray-800 drop-shadow">Dear {invitee.name},</p>

          <div className={`p-10 rounded-3xl mb-12 shadow-2xl ${currentTheme.accent} bg-white/90`}>
            <p className="text-3xl mb-6 text-gray-800"><strong>Location:</strong> {event.location || 'To be announced'}</p>
            <p className="text-3xl mb-6 text-gray-800"><strong>Date:</strong> {event.date || 'To be announced'}</p>
            <p className="text-3xl mb-6 text-gray-800"><strong>Time:</strong> {event.time || 'To be announced'}</p>
            <p className="text-3xl text-gray-800">You + up to {invitee.family_size - 1} guests = {invitee.family_size} total</p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-8">
                <label className="flex items-center text-3xl font-medium text-gray-800 cursor-pointer hover:text-gray-900 transition">
                  <input type="radio" name="coming" checked={coming === true} onChange={() => setComing(true)} className="mr-6 w-10 h-10" />
                  <span>Yes, we're coming! 🎉</span>
                </label>
                <label className="flex items-center text-3xl font-medium text-gray-800 cursor-pointer hover:text-gray-900 transition">
                  <input type="radio" name="coming" checked={coming === false} onChange={() => setComing(false)} className="mr-6 w-10 h-10" />
                  <span>Sorry, can't make it 😢</span>
                </label>
              </div>

              {coming && (
                <div>
                  <label className="block text-3xl font-medium mb-6 text-gray-800">Number of attendees</label>
                  <input
                    type="number"
                    value={people}
                    onChange={(e) => setPeople(Math.min(parseInt(e.target.value) || 1, invitee.family_size))}
                    min={1}
                    max={invitee.family_size}
                    className="w-full px-8 py-6 border-4 border-gray-300 rounded-2xl text-3xl text-center focus:border-gray-500 transition"
                  />
                </div>
              )}

              <button type="submit" className={`w-full py-8 rounded-2xl text-4xl font-bold text-white transition transform hover:scale-105 shadow-lg ${currentTheme.accent.replace('300', '600')}`}>
                Submit RSVP
              </button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-6xl font-bold text-green-600 mb-8">Thank You! ❤️</p>
              <p className="text-4xl text-gray-800">Your response: {coming ? `Coming with ${people} people 🎊` : 'Not coming 😔'}</p>
            </div>
          )}

          {message && <p className={`mt-12 text-center text-3xl font-bold ${message.includes('Thank') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </div>
      </div>
    </div>
  );
}