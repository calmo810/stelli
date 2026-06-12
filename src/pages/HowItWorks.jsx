import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera, Shield, Users, Image, Star, Clock, CreditCard, MessageCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { icon: Camera, title: 'Tell us about your moment', desc: 'Birthday, content day, music video — pick your event type and date. We match you with creators who specialize in exactly that.' },
  { icon: Users, title: 'Browse vetted creators', desc: "Every lensman on Stelli is handpicked and reviewed. Browse portfolios, check reviews, and find someone whose style matches your vision." },
  { icon: CreditCard, title: 'Book with confidence', desc: "Choose your package, pick add-ons, and pay securely. Your money is held safely in escrow — we don't release it until you're happy." },
  { icon: MessageCircle, title: 'Coordinate with your creator', desc: 'Chat directly with your lensman before the shoot. Share shot lists, venue details, and any creative ideas.' },
  { icon: Image, title: 'Get your files', desc: 'Edited photos and video delivered within 14 days (or 5 days with rush delivery). Download everything from your dashboard.' },
];

const faqs = [
  { q: 'How does payment work?', a: "When you book, your payment is held in escrow. We only release it to the creator after you've confirmed you received your files and everything looks great." },
  { q: 'What if I need to cancel?', a: "Cancellations made more than 48 hours before the shoot get a full refund. Within 48 hours, a 50% fee applies. We know plans change — we'll always try to work with you." },
  { q: 'How are creators vetted?', a: "Every lensman goes through a portfolio review, reference check, and test shoot before being approved. We keep ~10 creators per neighborhood to maintain quality." },
  { q: 'How long until I get my photos?', a: "Standard delivery is 14 days after your shoot. Need them sooner? Add rush delivery for 5-day turnaround." },
  { q: "What's a Content Day?", a: 'A full-day shoot designed for businesses and brands. You get 60+ edited photos and social media content for $1,000–$1,200. Perfect for restaurants, product lines, and personal brands.' },
  { q: 'Can I request specific shots?', a: "Absolutely. Once your booking is confirmed, you can share a shot list, mood board, or reference images directly with your creator via our messaging system." },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-cream star-bg py-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <Star className="w-6 h-6 text-gold fill-gold mx-auto mb-4" />
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-4">How Stelli Works</h1>
          <p className="text-lg text-muted-foreground">From booking to delivery, we make it simple and safe.</p>
        </motion.div>
      </section>

      {/* Steps */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto space-y-16">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-cream-dark flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                </div>
                {i < steps.length - 1 && <div className="flex-1 w-px bg-border mt-4" />}
              </div>
              <div className="pb-8">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gold">Step {i + 1}</span>
                <h3 className="font-display text-xl font-semibold mt-1 mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-8 h-8 text-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="font-display text-3xl font-semibold mb-4">Built on trust</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
            Stelli was born because we had a terrible experience hiring a photographer and getting corrupted files. 
            We built the safety nets we wished we'd had.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { title: 'Escrow payments', desc: 'Your money is held safely until you confirm delivery. No risk.' },
              { title: 'Vetted creators', desc: 'Every lensman is handpicked, portfolio-reviewed, and reference-checked.' },
              { title: 'Guaranteed delivery', desc: 'Clear timelines. If something goes wrong, our team steps in.' },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold mb-2 text-sm">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-semibold text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="border-b border-border pb-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-foreground text-background text-center">
        <h2 className="font-display text-3xl font-semibold mb-6">Ready to get started?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/browse">
            <Button size="lg" className="rounded-full bg-background text-foreground hover:bg-background/90">
              Browse Lensmen <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/apply">
            <Button variant="outline" size="lg" className="rounded-full border-background/30 text-background hover:bg-background/10">
              Join as Creator
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}