import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Handshake,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react';
import api from '../api/client';

const MAX_MESSAGE_LENGTH = 500;

const faqs = [
  {
    q: 'How do I claim my shop?',
    a: 'Create an account, go to your dashboard, and submit your shop details with location and verification information. Our team reviews and confirms the claim.',
  },
  {
    q: 'How can I report incorrect information?',
    a: 'Use this contact form with the subject "Data correction" and include the shop name, product, and the exact correction needed. We usually verify within 24 hours.',
  },
  {
    q: 'Is LocalLens free for businesses?',
    a: 'Yes, basic listing and discovery are free. Optional premium visibility features can be enabled later.',
  },
  {
    q: 'How long does approval take?',
    a: 'Most submissions are reviewed within 1 business day. Complex verification can take slightly longer.',
  },
  {
    q: 'How do featured shops work?',
    a: 'Featured shops get highlighted placement in selected discovery areas for a period, based on relevance and quality standards.',
  },
];

const socialLinks = [
  { label: 'Facebook', href: '#', short: 'f' },
  { label: 'Instagram', href: '#', short: 'ig' },
  { label: 'LinkedIn', href: '#', short: 'in' },
  { label: 'X', href: '#', short: 'x' },
];

const initialForm = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactUs() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const messageRemaining = MAX_MESSAGE_LENGTH - form.message.length;

  const trustIndicators = useMemo(
    () => [
      { icon: Handshake, text: 'Trusted by local businesses' },
      { icon: ShieldCheck, text: 'Community-driven local discovery' },
    ],
    [],
  );

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = 'Full name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!emailRegex.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!form.subject.trim()) nextErrors.subject = 'Subject is required.';
    if (!form.message.trim()) nextErrors.message = 'Message is required.';
    else if (form.message.trim().length < 10) nextErrors.message = 'Message should be at least 10 characters.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);
    try {
      await api.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      toast.success('Message sent. Our team will get back to you soon.');
      setForm(initialForm);
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const inputBaseClass =
    'w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute -left-24 top-8 h-56 w-56 rounded-full bg-lime-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-700">Get in touch</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Contact LocalLens</h1>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              Reach out for support, partnerships, business claim requests, bug reports, or any general question. We are
              here to help local discovery stay accurate and useful.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {trustIndicators.map(({ icon: Icon, text }) => (
                <div key={text} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                  <Icon className="h-4 w-4 text-lime-700" />
                  {text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur md:p-7"
          >
            <h2 className="text-xl font-semibold">Send us a message</h2>
            <p className="mt-1 text-sm text-slate-600">Tell us what you need and we will respond as soon as possible.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`${inputBaseClass} ${errors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-300 focus:border-lime-600 focus:ring-lime-100'}`}
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`${inputBaseClass} ${errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-300 focus:border-lime-600 focus:ring-lime-100'}`}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={form.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  className={`${inputBaseClass} ${errors.subject ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-300 focus:border-lime-600 focus:ring-lime-100'}`}
                  placeholder="What can we help with?"
                />
                {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
              </div>

              <div>
                <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={6}
                  value={form.message}
                  onChange={(e) => {
                    const nextValue = e.target.value.slice(0, MAX_MESSAGE_LENGTH);
                    handleChange('message', nextValue);
                  }}
                  className={`${inputBaseClass} resize-none ${errors.message ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-300 focus:border-lime-600 focus:ring-lime-100'}`}
                  placeholder="Describe your request in detail..."
                />
                <div className="mt-1 flex items-center justify-between">
                  {errors.message ? <p className="text-xs text-red-600">{errors.message}</p> : <span />}
                  <p className={`text-xs ${messageRemaining < 40 ? 'text-amber-600' : 'text-slate-500'}`}>
                    {messageRemaining} characters remaining
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={sending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-lime-700" />
                  <div>
                    <p className="font-medium text-slate-900">Support</p>
                    <p>support@locallens.app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 text-lime-700" />
                  <div>
                    <p className="font-medium text-slate-900">Business</p>
                    <p>business@locallens.app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-lime-700" />
                  <div>
                    <p className="font-medium text-slate-900">Phone</p>
                    <p>+880 1234-567890</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-lime-700" />
                  <div>
                    <p className="font-medium text-slate-900">Office</p>
                    <p>Banani, Dhaka, Bangladesh</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-lime-700" />
                  <div>
                    <p className="font-medium text-slate-900">Working hours</p>
                    <p>Sun - Thu, 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3 py-1.5 text-xs font-medium text-lime-800">
                <CheckCircle2 className="h-4 w-4" />
                Usually replies within 24 hours
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Follow us</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {socialLinks.map((link) => (
                    <motion.a
                      whileHover={{ y: -2 }}
                      key={link.label}
                      href={link.href}
                      className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold uppercase text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                      aria-label={link.label}
                    >
                      {link.short}
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <iframe
                title="LocalLens Office Map"
                src="https://www.google.com/maps?q=Banani,+Dhaka&output=embed"
                className="h-52 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"
                >
                  <MessageCircle className="h-5 w-5 text-lime-300" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold">Need urgent help?</p>
                  <p className="text-xs text-slate-200">Share details in the form and mark your subject as "Urgent".</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"
        >
          <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
          <p className="mt-1 text-sm text-slate-600">Quick answers to common LocalLens business and support questions.</p>

          <div className="mt-5 divide-y divide-slate-200">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="py-2">
                  <button
                    type="button"
                    onClick={() => setOpenFaq((prev) => (prev === idx ? -1 : idx))}
                    className="flex w-full items-center justify-between gap-4 rounded-lg px-2 py-3 text-left transition hover:bg-slate-50"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold text-slate-900">{item.q}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{
                      height: isOpen ? 'auto' : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <p className="px-2 pb-3 text-sm text-slate-600">{item.a}</p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
