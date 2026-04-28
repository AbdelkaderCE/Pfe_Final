/*
  ContactForm — simple contact form.
  Converted from friend's TS. lucide-react → inline SVG, generic grays → tokens.
*/

import React, { useState } from 'react';

/* Send icon (stroke 1.5) */
const SendIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
  </svg>
);

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire to backend
    alert('Message sent!');
  };

  return (
    <div className="bg-surface rounded-lg border border-edge shadow-card p-8">
      <h2 className="text-xl font-bold text-ink mb-6 tracking-tight">Send us a Message</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          placeholder="Your Name"
          className="w-full px-4 py-3 border border-control-border rounded-md bg-control-bg text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Your Email"
          className="w-full px-4 py-3 border border-control-border rounded-md bg-control-bg text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <textarea
          placeholder="Your Message"
          rows={5}
          className="w-full px-4 py-3 border border-control-border rounded-md bg-control-bg text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30 transition resize-none"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          required
        />
        <button
          type="submit"
          className="w-full bg-brand text-white py-3 rounded-md hover:bg-brand-hover transition-all duration-150 flex items-center justify-center font-medium"
        >
          <SendIcon className="w-5 h-5 mr-2" /> Send Message
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
