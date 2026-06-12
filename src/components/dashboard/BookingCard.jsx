import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, User, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  awaiting_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  disputed: 'bg-red-100 text-red-800',
};

export default function BookingCard({ booking, role = 'client' }) {
  const status = booking.status || 'pending';
  const displayDate = booking.event_date ? format(new Date(booking.event_date + 'T12:00:00'), 'MMM d, yyyy') : 'TBD';

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm capitalize">{booking.event_type?.replace(/_/g, ' ') || 'Event'}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {role === 'client' ? booking.lensman_name : booking.client_name}
          </p>
        </div>
        <Badge className={`text-[10px] ${statusColors[status]} border-0`}>
          {status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" /> {displayDate}
          {booking.event_time && ` · ${booking.event_time}`}
        </div>
        {booking.location && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" /> {booking.location}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-sm font-semibold">${booking.total_price || 0}</span>
        <div className="flex gap-2">
          <Link to={`/messages/${booking.id}`}>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-full">
              <MessageCircle className="w-3 h-3 mr-1.5" /> Message
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}