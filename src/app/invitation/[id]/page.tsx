'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const themes = {
  birthday: { bg: 'from-yellow-100 to-pink-100', titleColor: 'text-pink-800', accent: 'bg-pink-200', image: 'https://png.pngtree.com/thumb_back/fh260/background/20240620/pngtree-candlelit-celebration-a-birthday-invitation-image_15905940.jpg' },
  wedding: { bg: 'from-rose-100 to-purple-100', titleColor: 'text-rose-800', accent: 'bg-rose-200', image: 'https://png.pngtree.com/thumb_back/fh260/background/20250226/pngtree-blue-watercolor-floral-background-flower-bouquet-illustration-wedding-invitation-design-spring-image_16961730.jpg' },
  majlis: { bg: 'from-emerald-100 to-teal-100', titleColor: 'text-emerald-800', accent: 'bg-emerald-200', image: 'https://images.template.net/398957/Muharram-Majlis-Background-Template-edit-online.png' },
  dares: { bg: 'from-orange-100 to-red-100', titleColor: 'text-orange-800', accent: 'bg-orange-200', image: 'https://media.istockphoto.com/id/1006002682/photo/enter-if-you-dare.jpg?s=612x612&w=0&k=20&c=ubuVm3DEOyKVH2ojmCmECzRsFy4IVC8woxXFJ-Dunyw=' },
  'baby-shower': { bg: 'from-blue-100 to-cyan-100', titleColor: 'text-blue-800', accent: 'bg-blue-200', image: 'https://img.freepik.com/free-psd/maternity-baby-shower-background_23-2150237221.jpg?semt=ais_hybrid&w=740&q=80' },
  anniversary: { bg: 'from-indigo-100 to-purple-100', titleColor: 'text-indigo-800', accent: 'bg-indigo-200', image: 'https://thumbs.dreamstime.com/b/anniversary-celebration-background-gold-white-purple-balloons-confetti-birthday-greeting-card-party-invitation-379350865.jpg' },
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
          const loadedTheme = (data.event.theme && data.event.theme in themes) ? data.event.theme as ThemeKey : 'birthday';
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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-3xl font-bold">Loading Invitation...</div>;
  if (!invitee) return <div className="min-h-screen flex items-center justify-center text-red-600 text-3xl font-bold">{message || 'Invalid Invitation'}</div>;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} flex items-center justify-center p-4`}>
      <div className="relative bg-white/90 backdrop-blur-md p-12 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Theme Background Image */}
        <div className="absolute inset-0 opacity-20">
          <img src={currentTheme.image} alt="Theme background" className="w-full h-full object-cover" />
        </div>

        {/* Decorative Border */}
        <div className={`absolute inset-0 border-8 border-double rounded-3xl ${currentTheme.accent} opacity-50`}></div>

        <div className="relative z-10">
          <h1 className={`text-5xl font-bold text-center mb-6 ${currentTheme.titleColor}`}>You're Invited!</h1>
          <p className="text-3xl text-center font-medium mb-10 text-gray-800">Dear {invitee.name},</p>

          <div className={`p-8 rounded-2xl mb-10 shadow-lg ${currentTheme.accent} bg-white/80`}>
            <p className="text-2xl mb-4 text-gray-800"><strong>Location:</strong> {event.location || 'To be announced'}</p>
            <p className="text-2xl mb-4 text-gray-800"><strong>Date:</strong> {event.date || 'To be announced'}</p>
            <p className="text-2xl mb-4 text-gray-800"><strong>Time:</strong> {event.time || 'To be announced'}</p>
            <p className="text-2xl text-gray-800">You + up to {invitee.family_size - 1} guests = {invitee.family_size} total</p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <label className="flex items-center text-2xl font-medium text-gray-800 cursor-pointer">
                  <input type="radio" name="coming" checked={coming === true} onChange={() => setComing(true)} className="mr-4 w-8 h-8" />
                  <span>Yes, we're coming! 🎉</span>
                </label>
                <label className="flex items-center text-2xl font-medium text-gray-800 cursor-pointer">
                  <input type="radio" name="coming" checked={coming === false} onChange={() => setComing(false)} className="mr-4 w-8 h-8" />
                  <span>Sorry, can't make it 😢</span>
                </label>
              </div>

              {coming && (
                <div>
                  <label className="block text-2xl font-medium mb-4 text-gray-800">Number of attendees</label>
                  <input
                    type="number"
                    value={people}
                    onChange={(e) => setPeople(Math.min(parseInt(e.target.value) || 1, invitee.family_size))}
                    min={1}
                    max={invitee.family_size}
                    className="w-full px-6 py-4 border-4 border-gray-300 rounded-xl text-2xl text-center focus:border-purple-500"
                  />
                </div>
              )}

              <button type="submit" className={`w-full py-6 rounded-xl text-3xl font-bold text-white transition transform hover:scale-105 ${currentTheme.accent.replace('200', '600')}`}>
                Submit RSVP
              </button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-5xl font-bold text-green-600 mb-6">Thank You! ❤️</p>
              <p className="text-3xl text-gray-800">Your response: {coming ? `Coming with ${people} people 🎊` : 'Not coming 😔'}</p>
            </div>
          )}

          {message && <p className={`mt-8 text-center text-2xl font-bold ${message.includes('Thank') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </div>
      </div>
    </div>
  );
}