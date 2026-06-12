import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, DollarSign, Users, Calendar, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
  { icon: DollarSign, title: 'Fair, fixed pay', desc: 'No pay-per-photo nonsense. Day rates that protect your margins and value your time.' },
  { icon: Users, title: 'Curated clients', desc: "We screen clients too. No last-minute flakers, no scope creep. Real people with real budgets." },
  { icon: Calendar, title: 'You control your schedule', desc: 'Set your availability, blackout dates, and pricing. Accept only the gigs that excite you.' },
  { icon: Shield, title: 'Guaranteed payment', desc: 'Money is held in escrow before the shoot. Deliver your files, get paid. Simple as that.' },
  { icon: Sparkles, title: 'Creative freedom', desc: "We match you with clients who love your style. No one's asking you to shoot something you hate." },
  { icon: Star, title: 'Build your reputation', desc: 'Ratings and reviews from real clients build your profile. Great work means more bookings.' },
];

export default function ForCreators() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-cream star-bg py-20 px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
          <Star className="w-6 h-6 text-gold fill-gold mx-auto mb-4" />
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
            Your next paying gig is one click away.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Curated clients, fair pay, creative freedom. Join ~10 handpicked creators per neighborhood.
          </p>
          <Link to="/apply">
            <Button size="lg" className="h-12 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 group">
              Apply to Join Stelli <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-semibold text-center mb-16">Why creators choose Stelli</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-cream-dark flex items-center justify-center mx-auto mb-4">
                  <b.icon className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works for Creators */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-semibold text-center mb-12">How it works for creators</h2>
          <div className="space-y-8">
            {[
              { step: '01', title: 'Apply with your portfolio', desc: 'Upload 15–20 of your best photos or videos. Tell us about your style and set your rates.' },
              { step: '02', title: 'Get vetted by our team', desc: "We review your portfolio and check references. We're looking for quality and reliability." },
              { step: '03', title: 'Start getting bookings', desc: 'Your profile goes live. Clients in your neighborhood find you and book directly.' },
              { step: '04', title: 'Shoot, deliver, get paid', desc: 'Do what you love. Upload your files after the shoot. Payment releases automatically when the client confirms.' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex gap-5">
                <span className="text-3xl font-display font-bold text-border">{s.step}</span>
                <div>
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="font-display text-3xl font-semibold mb-4">Ready to join?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Applications take about 5 minutes. We review every one within 48 hours.
        </p>
        <Link to="/apply">
          <Button size="lg" className="h-12 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90">
            Apply Now <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </section>
    </div>
  );
}