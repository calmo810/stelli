import React from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import useThreads from '@/hooks/useThreads';
import ConversationList from '@/components/thread/ConversationList';
import ChatView from '@/components/thread/ChatView';

/**
 * Messages. On a computer: your conversations on the left, the open chat on the right.
 * On a phone: the list is one page, and tapping a conversation opens the chat as its own page.
 */
export default function Messages() {
  const { bookingId } = useParams();
  const { threads, unreadCount, isLoading } = useThreads();

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-[1240px] lg:px-6 lg:py-5">
      <div className="flex min-h-0 w-full overflow-hidden lg:rounded-[32px] lg:border lg:border-white/[0.08] lg:bg-white/[0.02]">
        <aside
          className={`min-h-0 w-full shrink-0 border-white/[0.08] lg:flex lg:w-[380px] lg:border-r ${
            bookingId ? 'hidden' : 'flex'
          }`}
        >
          <div className="min-h-0 w-full">
            <ConversationList
              threads={threads}
              activeId={bookingId}
              isLoading={isLoading}
              unreadCount={unreadCount}
            />
          </div>
        </aside>

        <section className={`min-h-0 min-w-0 flex-1 lg:flex ${bookingId ? 'flex' : 'hidden'}`}>
          <div className="min-h-0 w-full">
            {bookingId ? (
              <ChatView key={bookingId} bookingId={bookingId} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <MessageCircle className="mb-4 h-9 w-9 text-white/20" />
                <p className="text-[17px] font-semibold text-white/70">Pick a conversation</p>
                <p className="mt-1 text-[14px] text-white/40">Your messages open here.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
