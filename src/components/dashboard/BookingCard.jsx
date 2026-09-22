import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, MessageCircle, FileText, ExternalLink, StickyNote, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const statusColors = {
  requested: 'bg-amber-100 text-amber-800',
  quoted: 'bg-sky-100 text-sky-800',
  quote_accepted: 'bg-indigo-100 text-indigo-800',
  pending: 'bg-amber-100 text-amber-800',
  awaiting_creator_acceptance: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  awaiting_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  disputed: 'bg-red-100 text-red-800',
};

export default function BookingCard({ booking, role = 'client' }) {
  const status = booking.status || 'requested';
  const displayDate = booking.event_date ? format(new Date(booking.event_date + 'T12:00:00'), 'MMM d, yyyy') : 'TBD';

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm capitalize">{booking.event_type?.replace(/_/g, ' ') || 'Booking'}</h3>
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Tag className="w-3 h-3" /> {booking.total_price ? `$${Number(booking.total_price).toLocaleString()}` : 'Private quote pending'}
        </div>
        {booking.event_description && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <StickyNote className="w-3 h-3 mt-0.5 shrink-0" /> <span>{booking.event_description}</span>
          </div>
        )}
        {booking.delivery_link && (
          <a href={booking.delivery_link} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-xs font-medium text-foreground">
            <ExternalLink className="w-3 h-3" /> Open delivered gallery
          </a>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex gap-2">
          {booking.contract_id && (
            <Link to={`/agreements/${booking.contract_id}`}>
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-full">
                <FileText className="w-3 h-3 mr-1.5" /> Agreement
              </Button>
            </Link>
          )}
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