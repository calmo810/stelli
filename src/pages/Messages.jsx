import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function Messages() {
  const { bookingId } = useParams();
  const [message, setMessage] = useState('');
  const bottomRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['message-user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const list = await base44.entities.Booking.filter({ id: bookingId });
      return list[0];
    },
    enabled: !!bookingId,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', bookingId],
    queryFn: () => base44.entities.Message.filter({ booking_id: bookingId }, 'created_date'),
    enabled: !!bookingId,
    refetchInterval: 5000,
  });

  const senderRole = user?.account_type === 'creator' || booking?.lensman_email === user?.email ? 'lensman' : 'client';
  const senderName = user?.profile_name || user?.full_name || user?.email || (senderRole === 'lensman' ? booking?.lensman_name : booking?.client_name) || 'Stelli user';

  const sendMessage = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', bookingId] });
      setMessage('');
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate({
      booking_id: bookingId,
      client_email: booking?.client_email || '',
      lensman_email: booking?.lensman_email || '',
      sender_name: senderName,
      sender_role: senderRole,
      content: message.trim(),
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <div className="bg-background border-b border-border pl-36 md:pl-44 pr-6 py-5 flex items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-semibold text-sm truncate">
            {booking?.event_type?.replace(/_/g, ' ') || 'Booking'} — {booking?.lensman_name || 'Creator'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {booking?.event_date && format(new Date(booking.event_date + 'T12:00:00'), 'MMM d, yyyy')} · {booking?.location}
          </p>
        </div>
      </div>

      <div className="bg-background/50 border-b border-border px-6 py-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Messaging as {senderRole === 'lensman' ? 'Creator' : 'Client'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_role === senderRole;
            return (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${isMe ? 'bg-foreground text-background' : 'bg-card border border-border'} rounded-2xl px-4 py-3`}>
                  <p className={`text-[10px] font-medium mb-1 ${isMe ? 'text-background/60' : 'text-muted-foreground'}`}>
                    {msg.sender_name}
                  </p>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {msg.created_date && (
                    <p className={`text-[10px] mt-1.5 ${isMe ? 'text-background/40' : 'text-muted-foreground/60'}`}>
                      {format(new Date(msg.created_date), 'h:mm a')}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="bg-background border-t border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="rounded-full"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            className="rounded-full bg-foreground text-background h-10 w-10 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}