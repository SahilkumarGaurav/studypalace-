'use client';

import { useState } from 'react';

/**
 * A contact form that composes a mailto: link.
 *
 * Deliberately serverless: there is no mailbox to configure, no third-party form
 * service, and the student keeps a copy of exactly what they sent.
 */
export default function ContactForm({ supportEmail }: { supportEmail: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState('');
  const [topic, setTopic] = useState('Download problem');
  const [message, setMessage] = useState('');

  function send(e: React.FormEvent) {
    e.preventDefault();
    const subject = `${topic} — Order ${order.trim() || 'not provided'}`;
    const body = [
      `Name: ${name.trim() || '-'}`,
      `Email: ${email.trim() || '-'}`,
      `Order number: ${order.trim() || '-'}`,
      `Topic: ${topic}`,
      '',
      message.trim(),
      '',
      '—',
      `Sent from ${typeof window !== 'undefined' ? window.location.href : 'studypalace'}`,
      navigator.userAgent,
    ].join('\n');

    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form onSubmit={send} className="mt-5 grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="c-name">
          Your name
        </label>
        <input id="c-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ananya Sharma" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="c-email">
          Email you paid with <span className="text-red-500">*</span>
        </label>
        <input
          id="c-email"
          type="email"
          required
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
        />
      </div>
      <div>
        <label className="label" htmlFor="c-order">
          Order number
        </label>
        <input
          id="c-order"
          className="input uppercase"
          value={order}
          onChange={(e) => setOrder(e.target.value.toUpperCase())}
          placeholder="SP-7K3FQ2"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="label" htmlFor="c-topic">
          What is this about?
        </label>
        <select id="c-topic" className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option>Download problem</option>
          <option>Paid but files not unlocked</option>
          <option>Corrupt or wrong file</option>
          <option>Duplicate charge</option>
          <option>Question before buying</option>
          <option>Suggestion for new material</option>
          <option>Something else</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="c-message">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="c-message"
          required
          rows={5}
          className="input resize-y"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us exactly what happened, and what you see on screen."
        />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary w-full sm:w-auto">
          Open my email app
        </button>
        <p className="mt-2 text-xs text-ink-500">
          Or mail us directly at{' '}
          <a className="font-bold text-brand-700 underline decoration-brand-200" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
        </p>
      </div>
    </form>
  );
}
