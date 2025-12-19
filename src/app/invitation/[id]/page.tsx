'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import fs from 'fs';
import path from 'path';

export default function Invitation() {
  const { id } = useParams() as { id: string };
  const [invitee, setInvitee] = useState<any>(null);
  const [event, setEvent] = useState({ location: 'Loading...', date: 'Loading...', time: 'Loading...' });
  const [coming, setComing] = useState<boolean | null>(null);
  const [people, setPeople] = useState(1);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvitation();
  }, [id]);

  const fetchInvitation = async () => {
    try {
      // Search all hosts for the uniqueId
      const res = await fetch('/api/rsvp-search?uniqueId=' + id); // We'll create this temporary endpoint or use client logic
      // Since we can't easily search all hosts from client, we'll use a new public endpoint
      // For now, use the RSVP endpoint logic in a new public GET
      const response = await fetch('/api/public-invitation?id=' + id);
      if (!response.ok) {
        setMessage('Invalid invitation link.');
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      setInvitee(data.invitee);
      setEvent(data.event);
      if (data.invitee.rsvp_coming !== null) {
        setSubmitted(true);
        setComing(data.invitee.rsvp_coming);
        setPeople(data.invitee.rsvp_people || 1);
      }
    } catch {
      setMessage('Error loading invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (coming === null) {
      setMessage('Please select if you are coming.');
      return;
    }

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniqueId: id, coming, people: coming ? people : 0 }),
      });

      if (res.ok) {
        setMessage('Thank you! Your RSVP has been recorded.');
        setSubmitted(true);
      } else {
        setMessage('Failed to submit. Please try again.');
      }
    } catch {
      setMessage('Network error.');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading invitation...</div>;
  if (!invitee) return <div className="min-h-screen flex items-center justify-center text-red-600">Invalid Invitation Link</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-xl shadow-2xl max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-700">You're Invited!</h1>
        <p className="text-xl text-center mb-8">Dear {invitee.name},</p>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <p className="text-lg mb-2"><strong>Location:</strong> {event.location}</p>
          <p className="text-lg mb-2"><strong>Date:</strong> {event.date}</p>
          <p className="text-lg mb-2"><strong>Time:</strong> {event.time}</p>
          <p className="text-lg">You are invited with up to <strong>{invitee.family_size}</strong> people (including yourself).</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center">
                <input type="radio" name="coming" checked={coming === true} onChange={() => setComing(true)} className="mr-3" />
                <span className="text-lg">Yes, I'll be there!</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="coming" checked={coming === false} onChange={() => setComing(false)} className="mr-3" />
                <span className="text-lg">Sorry, I can't make it</span>
              </label>
            </div>

            {coming === true && (
              <div>
                <label className="block text-lg mb-2">Number of attendees (max {invitee.family_size})</label>
                <input
                  type="number"
                  value={people}
                  onChange={(e) => setPeople(Math.min(parseInt(e.target.value) || 1, invitee.family_size))}
                  min={1}
                  max={invitee.family_size}
                  className="w-full px-4 py-3 border rounded-md"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-4 rounded-md text-lg font-medium hover:bg-green-700 transition"
            >
              Submit RSVP
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 mb-4">Thank You!</p>
            <p className="text-lg">Your response has been recorded:</p>
            <p className="text-xl font-medium mt-4">
              {coming ? `Coming with ${people} people` : 'Not Coming'}
            </p>
          </div>
        )}

        {message && (
          <p className={`mt-6 text-center text-lg font-medium ${message.includes('Thank') || message.includes('recorded') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}