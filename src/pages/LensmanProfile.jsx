import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, MapPin, Clock, Camera, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import PortfolioGallery from '../components/profile/PortfolioGallery';
import ReviewsList from '../components/profile/ReviewsList';
import { Skeleton } from '@/components/ui/skeleton';

export default function LensmanProfile() {
  const { id } = useParams();

  const { data: lensman, isLoading } = useQuery({
    queryKey: ['lensman', id],
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ id });
      return list[0];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => base44.entities.Review.filter({ lensman_id: id }),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-64 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!lensman) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Lensman not found</p>
          <Link to="/browse" className="text-sm text-primary underline">Back to browse</Link>
        </div>
      </div>
    );
  }

  const packages = [
    lensman.rate_half_day && { name: 'Half Day', desc: '4-hour shoot', price: lensman.rate_half_day, type: 'half_day' },
    lensman.rate_full_day && { name: 'Full Day', desc: 'Content day or 8-hour shoot', price: lensman.rate_full_day, type: 'full_day' },
    lensman.rate_custom && { name: 'Custom', desc: lensman.custom_package_description || 'Custom package', price: lensman.rate_custom, type: 'custom' },
  ].filter(Boolean);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-cream star-bg py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Link to="/browse" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to browse
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
                {lensman.display_name || lensman.full_name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {lensman.neighborhoods?.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {lensman.neighborhoods.join(', ')}
                  </span>
                )}
                {lensman.years_experience && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {lensman.years_experience}+ years
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                  {lensman.avg_rating?.toFixed(1) || '5.0'} ({lensman.review_count || 0} reviews)
                </span>
              </div>
            </div>
            <Link to={`/book/${lensman.id}`}>
              <Button size="lg" className="h-12 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90">
                <Camera className="w-4 h-4 mr-2" /> Book This Creator
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Portfolio */}
            <section>
              <h2 className="font-display text-xl font-semibold mb-6">Portfolio</h2>
              <PortfolioGallery images={lensman.portfolio_images || []} />
            </section>

            {/* Bio */}
            {lensman.bio && (
              <section>
                <h2 className="font-display text-xl font-semibold mb-4">About</h2>
                <p className="text-muted-foreground leading-relaxed">{lensman.bio}</p>
              </section>
            )}

            {/* Reviews */}
            <section>
              <h2 className="font-display text-xl font-semibold mb-6">Reviews</h2>
              <ReviewsList reviews={reviews} />
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Specialties */}
            {lensman.specialties?.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-semibold mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {lensman.specialties.map((s, i) => (
                    <Badge key={i} variant="secondary" className="rounded-full text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            {packages.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-semibold mb-4">Packages</h3>
                <div className="space-y-4">
                  {packages.map((pkg, i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground">{pkg.desc}</p>
                      </div>
                      <p className="text-sm font-semibold">${pkg.price}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-green-600" /> Edited photos included
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-green-600" /> Full usage rights
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-green-600" /> Payment held safely until delivery
                  </div>
                </div>
              </div>
            )}

            {/* Style Tags */}
            {lensman.style_tags?.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-semibold mb-3">Style</h3>
                <div className="flex flex-wrap gap-2">
                  {lensman.style_tags.map((t, i) => (
                    <Badge key={i} variant="outline" className="rounded-full text-xs capitalize">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Book CTA */}
            <Link to={`/book/${lensman.id}`} className="block">
              <Button className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90">
                Book This Creator
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}