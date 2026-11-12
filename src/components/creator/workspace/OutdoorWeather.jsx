import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, CloudRain, MapPin, SunMedium, Wind } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function WeatherIcon({ state }) {
  if (state === 'rain') return <CloudRain className="h-4 w-4" strokeWidth={2.25} />;
  if (state === 'wind') return <Wind className="h-4 w-4" strokeWidth={2.25} />;
  return <SunMedium className="h-4 w-4" strokeWidth={2.25} />;
}

/**
 * A deliberately tiny decision aid for an outdoor shoot.
 * It stays invisible until an outdoor booking has forecast data, then expands
 * only when the creator asks for the three details that change a shoot plan.
 */
export default function OutdoorWeather({ shoot }) {
  const [expanded, setExpanded] = useState(false);
  const isOutdoor = shoot?.shoot_setting === 'outdoor';

  const { data: weather } = useQuery({
    queryKey: ['creator-outdoor-weather', shoot?.id],
    enabled: Boolean(isOutdoor && shoot?.id),
    staleTime: 20 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const response = await base44.functions.invoke('getShootWeather', { bookingId: shoot.id });
      return response.data || null;
    },
  });

  if (!isOutdoor || !weather) return null;

  if (!weather.available) {
    if (weather.reason === 'too_early') {
      return (
        <div className="arch-weather arch-weather--quiet">
          <SunMedium className="h-3.5 w-3.5" strokeWidth={2.3} />
          <span>Forecast opens 7 days before</span>
        </div>
      );
    }

    if (weather.reason === 'location') {
      return (
        <div className="arch-weather arch-weather--quiet">
          <MapPin className="h-3.5 w-3.5" strokeWidth={2.3} />
          <span>Add a street address to view weather</span>
        </div>
      );
    }

    return null;
  }

  const forecast = weather.forecast ? `${weather.forecast} · ${weather.timeLabel}` : `Around ${weather.timeLabel}`;

  return (
    <button
      type="button"
      className={`arch-weather arch-weather--${weather.state || 'clear'} ${expanded ? 'is-expanded' : ''}`}
      onClick={() => setExpanded((value) => !value)}
      aria-expanded={expanded}
      aria-label={`Weather window: ${weather.label}, ${weather.temperature}${weather.temperatureUnit}, ${weather.windMph} miles per hour wind`}
    >
      <span className="arch-weather__icon">
        <WeatherIcon state={weather.state} />
      </span>
      <span className="arch-weather__summary">
        <strong>{weather.label}</strong>
        <small>{weather.temperature}{weather.temperatureUnit} · {weather.windMph} mph</small>
      </span>
      <ChevronDown className="arch-weather__chevron h-4 w-4" strokeWidth={2.35} />

      <span className="arch-weather__details">
        <span>
          <small>Rain</small>
          <b>{weather.rainChance}%</b>
        </span>
        <span>
          <small>Wind</small>
          <b>{weather.windMph} mph</b>
        </span>
        <span className="arch-weather__forecast">{forecast}</span>
      </span>
    </button>
  );
}
