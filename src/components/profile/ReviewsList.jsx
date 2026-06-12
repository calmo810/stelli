import React from 'react';
import { Star } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewsList({ reviews = [] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">No reviews yet.</p>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((r, i) => (
        <div key={r.id || i} className="border-b border-border pb-6 last:border-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold">{r.client_name || 'Anonymous'}</p>
              <p className="text-xs text-muted-foreground">{r.event_type?.replace(/_/g, ' ')}</p>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, j) => (
                <Star
                  key={j}
                  className={`w-3 h-3 ${j < r.rating ? 'text-gold fill-gold' : 'text-border'}`}
                />
              ))}
            </div>
          </div>
          {r.comment && (
            <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
          )}
          {r.created_date && (
            <p className="text-[10px] text-muted-foreground/60 mt-2">
              {format(new Date(r.created_date), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}