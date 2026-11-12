import React from 'react';
import { BadgeCheck, Camera, Link as LinkIcon, ShieldCheck, Star, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { displayNameOf, profilePath, profileUrlLabel } from '@/lib/creatorProfile';
import { Avatar, Btn, Card, Chip, Page, Sheet, Stat } from '@/components/system';

const PILLARS = [
  {
    icon: LinkIcon,
    tone: 'lime',
    title: 'A profile worth putting in your bio',
    desc: 'Your Stelli page is your portfolio, booking link, and credibility signal in one clean URL.',
  },
  {
    icon: BadgeCheck,
    tone: 'sky',
    title: 'A collective people want into',
    desc: 'Selected creators get a public profile and visibility inside the Stelli network.',
  },
  {
    icon: ShieldCheck,
    tone: 'butter',
    title: 'Book safely, not through DMs',
    desc: 'Stop chasing clients, getting ghosted, or eating bad checks. Payments are protected before the shoot starts.',
  },
];

/** The pitch to photographers and filmmakers, with a real creator's page as the proof. */
export default function ForCreators() {
  // The sample profile is a real, approved creator, never a hardcoded name.
  const { data: sample } = useQuery({
    queryKey: ['for-creators-sample'],
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ status: 'approved' }, '-created_date', 1).catch(() => []);
      return list[0] || null;
    },
  });

  const sampleName = sample ? displayNameOf(sample) : 'A Stelli creator';
  const cover = sample?.cover_image || sample?.portfolio_images?.[0] || '';
  const rating = Number(sample?.avg_rating) || 0;
  const shoots = Number(sample?.completed_shoots) || 0;
  const photos = (sample?.portfolio_images || []).length;

  return (
    <Page>
      <Sheet>
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div>
            <Chip tone="ink">For creators</Chip>
            <h1 className="st-display mt-5">
              Your next paying gig is <span className="st-serif">one click away.</span>
            </h1>
            <p className="st-lede mt-5">
              Stelli gives photographers and filmmakers a bio link that looks better than a DM, and books safer than one.
            </p>
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
              <Btn to="/apply" size="lg" arrow="end">
                Apply to join
              </Btn>
              {sample && (
                <Btn to={profilePath(sample)} variant="outline" size="lg">
                  View a sample profile
                </Btn>
              )}
            </div>
          </div>

          {/* A real creator's card, the way it reads in a bio link. */}
          <Card pad={false} large className="mx-auto w-full max-w-[400px] overflow-hidden lg:rotate-[1.5deg]">
            <div className="st-aurora st-aurora--lime h-[190px]">
              {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="px-5 pb-5">
              <div className="-mt-9 flex items-end justify-between gap-3">
                <Avatar src={sample?.profile_image} name={sampleName} size="lg" ring className="!h-[76px] !w-[76px]" />
                <Chip tone="lime">Bio link preview</Chip>
              </div>
              <p className="mt-3 text-[22px] font-extrabold tracking-[-0.035em]">{sampleName}</p>
              <p className="text-[13.5px] text-fg-3">{sample ? profileUrlLabel(sample) : 'getstelli.com/creators/you'}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
                <Stat icon={Star} value={rating ? rating.toFixed(1) : 'New'} label="Rating" />
                <Stat icon={Camera} value={photos || '—'} label="Photos" />
                <Stat icon={Users} value={shoots || '—'} label="Shoots" />
              </div>
              <Btn variant="ink" arrow="start" block className="mt-5 !justify-start pointer-events-none" aria-hidden tabIndex={-1}>
                <span className="flex-1 text-center">Request a date</span>
              </Btn>
            </div>
          </Card>
        </div>

        <section aria-label="Why creators join" className="mt-10 grid gap-3 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <Card key={pillar.title} tone={pillar.tone} hover>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white" aria-hidden>
                <pillar.icon className="h-[18px] w-[18px]" />
              </span>
              <h2 className="st-h2 mt-5">{pillar.title}</h2>
              <p className="st-body mt-2.5">{pillar.desc}</p>
            </Card>
          ))}
        </section>

        <Card tone="ink" large className="mt-3 px-6 py-12 text-center sm:py-16">
          <h2 className="st-display mx-auto max-w-[14ch] !text-[clamp(32px,5vw,58px)]">
            Stop sending clients to your <span className="st-serif text-neon-lime">DMs.</span>
          </h2>
          <p className="st-lede mx-auto mt-5">Send them somewhere that makes you look booked, protected, and worth paying.</p>
          <Btn to="/apply" variant="lime" size="lg" arrow="end" className="mt-8">
            Apply to join Stelli
          </Btn>
        </Card>
      </Sheet>
    </Page>
  );
}
