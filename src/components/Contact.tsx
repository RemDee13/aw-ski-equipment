import { useState } from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'

// Web3Forms — public client-side access key (safe to commit, not a secret).
const ACCESS_KEY = '9ca61ce9-166c-4793-ad84-1aa5f8f3be0f'
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'
const FALLBACK_EMAIL = 'hello@awski.example'

export default function Contact() {
  const [status, setStatus] = useState('')

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    // until a real key is set, fall back to opening the visitor's email app
    if (ACCESS_KEY.startsWith('YOUR_')) {
      const body =
        `Name: ${data.get('name') || ''}\nEmail: ${data.get('email') || ''}\n` +
        `Interest: ${data.get('interest') || ''}\n\n${data.get('message') || ''}`
      window.location.href = `mailto:${FALLBACK_EMAIL}?subject=AW%20Ski%20inquiry&body=` + encodeURIComponent(body)
      setStatus('Opening your email app…')
      return
    }

    setStatus('Sending…')
    fetch(WEB3FORMS_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) { form.reset(); setStatus("Thanks — I'll be in touch within one business day.") }
        else setStatus('Something went wrong. Please email me directly.')
      })
      .catch(() => setStatus('Network error — please try again.'))
  }

  const field =
    'w-full bg-bg/60 border border-white/15 rounded-xl px-4 py-3 text-ink placeholder-ink/40 focus:outline-none focus:border-gear transition-colors'

  return (
    <section id="contact" className="relative overflow-hidden bg-bg2 py-24 md:py-32">
      <div className="relative z-10 mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-14">
        <div className="reveal-up">
          <p className="text-xs tracking-[0.28em] uppercase text-gear mb-5">Get in touch</p>
          <h2 className="font-playfair italic text-4xl md:text-6xl leading-[1.04]">
            Gear up<br />with us
          </h2>
          <p className="mt-6 text-ink-muted text-lg leading-relaxed max-w-md">
            Want a scroll-driven site like this one? Send a note and I'll get back within a business day.
          </p>
          <div className="mt-8 space-y-3 text-ink/80">
            <div className="flex items-center gap-3"><Mail size={18} className="text-gear" /> hello@awski.example</div>
            <div className="flex items-center gap-3"><Phone size={18} className="text-gear" /> +1 (000) 555-0142</div>
            <div className="flex items-center gap-3"><MapPin size={18} className="text-gear" /> Alps · Worldwide</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="reveal-up space-y-4" action={WEB3FORMS_ENDPOINT} method="POST">
          <input type="hidden" name="access_key" value={ACCESS_KEY} />
          <input type="hidden" name="subject" value="New inquiry — AW Ski Equipment" />
          <input type="hidden" name="from_name" value="AW Ski Equipment website" />
          <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" />

          <div>
            <label htmlFor="cf-name" className="block text-xs uppercase tracking-[0.12em] text-ink/65 mb-2">Name</label>
            <input id="cf-name" name="name" type="text" autoComplete="name" required className={field} />
          </div>
          <div>
            <label htmlFor="cf-email" className="block text-xs uppercase tracking-[0.12em] text-ink/65 mb-2">Email</label>
            <input id="cf-email" name="email" type="email" autoComplete="email" required className={field} />
          </div>
          <div>
            <label htmlFor="cf-interest" className="block text-xs uppercase tracking-[0.12em] text-ink/65 mb-2">What are you after?</label>
            <input id="cf-interest" name="interest" type="text" className={field} />
          </div>
          <div>
            <label htmlFor="cf-msg" className="block text-xs uppercase tracking-[0.12em] text-ink/65 mb-2">Message</label>
            <textarea id="cf-msg" name="message" required rows={4} className={field + ' resize-y'} />
          </div>
          <button
            type="submit"
            className="bg-brand hover:bg-brand-dark text-white font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.02] active:scale-95"
          >
            Send message
          </button>
          <p className="text-sm text-success min-h-[1.2em]" role="status">{status}</p>
        </form>
      </div>
    </section>
  )
}
