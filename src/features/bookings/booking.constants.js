export const CLIENT_BOOKING_STATUSES = {
  upcoming: ['requested', 'quoted', 'quote_accepted', 'confirmed', 'in_progress'],
  awaitingDelivery: ['awaiting_delivery'],
  past: ['delivered', 'completed'],
};

export const CREATOR_BOOKING_STATUSES = {
  requests: ['requested'],
  upcoming: ['quoted', 'quote_accepted'],
  deliveries: ['confirmed', 'in_progress', 'awaiting_delivery'],
  completed: ['delivered', 'completed'],
};
