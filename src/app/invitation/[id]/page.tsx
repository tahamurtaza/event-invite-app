'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const themes = {
  birthday: { bg: 'from-pink-50 to-yellow-50', title: "You're Invited to a Birthday Bash!", greeting: "Let's Celebrate!" },
  wedding: { bg: 'from-rose-50 to-purple-50', title: "You're Invited to Our Wedding!", greeting: "Join Us on Our Special Day" },
  majlis: { bg: 'from-emerald-50 to-teal-50', title: "You're Invited to a Majlis Gathering!", greeting: "Come Share Joy With Us" },
  dares: { bg: 'from-orange-50 to-red-50', title: "Dare to Join the Adventure!", greeting: "Get Ready for Fun & Dares!" },
  'baby-shower': { bg: 'from-blue-50 to-cyan-50', title: "Baby Shower Invitation!", greeting: "Welcoming Our Little One" },
  anniversary: { bg: 'from-indigo-50 to-purple-50', title: "Anniversary Celebration!", greeting: "Celebrating Love & Togetherness" },
};

export default function Invitation() {
  const { id } = useParams() as { id: string };
  const [invitee, setInvitee] = useState<any>(null);
  const [event, setEvent] = useState({ location: '', date: '', time: '', theme: 'birthday' });
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
          setEvent({ ...data.event, theme: data.event.theme || 'birthday' });
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

  const theme = themes[event.theme] || themes.birthday;

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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-2xl">Loading Invitation...</div>;
  if (!invitee) return <div className="min-h-screen flex items-center justify-center text-red-600 text-2xl">{message || 'Invalid Invitation'}</div>;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} flex items-center justify-center p-4`}>
      <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-4 text-purple-800">{theme.title}</h1>
        <p className="text-2xl text-center mb-8 font-medium text-gray-700">{theme.greeting}</p>
        <p className="text-2xl text-center mb-10">Dear {invitee.name},</p>

        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-8 rounded-2xl mb-10">
          <p className="text-xl mb-4"><strong>Location:</strong> {event.location || 'TBD'}</p>
          <p className="text-xl mb-4"><strong>Date:</strong> {event.date || 'TBD'}</p>
          <p className="text-xl mb-4"><strong>Time:</strong> {event.time || 'TBD'}</p>
          <p className="text-xl">You + up to {invitee.family_size - 1} guests ({invitee.family_size} total)</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <label className="flex items-center text-xl">
                <input type="radio" name="coming" checked={coming === true} onChange={() => setComing(true)} className="mr-4 w-6 h-6" />
                <span>Yes, we're coming! 🎉</span>
              </label>
              <label className="flex items-center text-xl">
                <input type="radio" name="coming" checked={coming === false} onChange={() => setComing(false)} className="mr-4 w-6 h-6" />
                <span>Sorry, can't make it 😢</span>
              </label>
            </div>

            {coming && (
              <div>
                <label className="block text-xl mb-3">Number of attendees (max {invitee.family_size})</label>
                <input
                  type="number"
                  value={people}
                  onChange={(e) => setPeople(Math.min(parseInt(e.target.value) || 1, invitee.family_size))}
                  min={1}
                  max={invitee.family_size}
                  className="w-full px-6 py-4 border-2 border-purple-300 rounded-xl text-xl"
                />
              </div>
            )}

            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 rounded-xl text-2xl font-bold hover:from-purple-700 hover:to-pink-700 transition">
              Submit RSVP
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600 mb-6">Thank You! ❤️</p>
            <p className="text-2xl">Your response: {coming ? `Coming with ${people} people 🎊` : 'Not coming 😔'}</p>
          </div>
        )}

        {message && <p className={`mt-8 text-center text-xl font-medium ${message.includes('Thank') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
      </div>
    </div>
  );
}