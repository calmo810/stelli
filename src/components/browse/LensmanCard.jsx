import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function LensmanCard({ lensman, index = 0 }) {
  const images = lensman.portfolio_images || [];
  const heroImage = images[0] || 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&h=400&fit=crop';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/lensman/${lensman.id}`} className="block group">
        <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          {/* Portfolio Preview */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={heroImage}
              alt={lensman.display_name || 'Lensman'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
              <Star className="w-3 h-3 text-gold fill-gold" />
              <span className="text-xs font-semibold">{lensman.avg_rating?.toFixed(1) || '5.0'}</span>
              <span className="text-xs text-muted-foreground">({lensman.review_count || 0})</span>
            </div>
          </div>

          {/* Info */}
          <div className="p-5">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-display text-lg font-semibold">{lensman.display_name || lensman.full_name}</h3>
            </div>

            {lensman.neighborhoods?.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{lensman.neighborhoods.slice(0, 2).join(', ')}</span>
              </div>
            )}

            {lensman.specialties?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {lensman.specialties.slice(0, 3).map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] font-medium px-2 py-0.5 rounded-full">
                    {s}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm font-semibold">
                ${lensman.rate_half_day || 800}
                {lensman.rate_full_day && <span className="text-muted-foreground font-normal"> – ${lensman.rate_full_day}</span>}
                <span className="text-xs text-muted-foreground font-normal">/day</span>
              </span>
              <span className="text-xs text-primary font-medium group-hover:underline">View Profile →</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}