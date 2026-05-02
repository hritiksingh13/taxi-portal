import React, { useState, useEffect } from 'react';

interface DateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => {
  const h = i === 0 ? 12 : i;
  return { value: String(h).padStart(2, '0'), label: String(h).padStart(2, '0') };
});

const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0'),
}));

const selectBase =
  'bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-fleet-500 transition-colors appearance-none cursor-pointer';

export const DateTimeInput: React.FC<DateTimeInputProps> = ({ value, onChange, className = '', label }) => {
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  // Initialize from value on mount and when value changes
  useEffect(() => {
    if (value) {
      const dateObj = new Date(value);
      if (!isNaN(dateObj.getTime())) {
        // Get local date
        const offset = dateObj.getTimezoneOffset() * 60000;
        const localDate = new Date(dateObj.getTime() - offset);
        const dateStr = localDate.toISOString().split('T')[0];

        // Get time in 12-hour format
        let hours = dateObj.getHours();
        const mins = dateObj.getMinutes();
        const newPeriod = hours >= 12 ? 'PM' : 'AM';
        if (hours > 12) hours -= 12;
        if (hours === 0) hours = 12;

        setDate(dateStr);
        setHour(String(hours).padStart(2, '0'));
        setMinute(String(mins).padStart(2, '0'));
        setPeriod(newPeriod);
      }
    }
  }, [value]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    emitChange(newDate, hour, minute, period);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = e.target.value;
    setHour(newHour);
    emitChange(date, newHour, minute, period);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = e.target.value;
    setMinute(newMinute);
    emitChange(date, hour, newMinute, period);
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    setPeriod(newPeriod);
    emitChange(date, hour, minute, newPeriod);
  };

  const emitChange = (d: string, h: string, m: string, p: 'AM' | 'PM') => {
    if (d && h && m) {
      let hours24 = parseInt(h, 10);

      if (p === 'PM' && hours24 !== 12) {
        hours24 += 12;
      } else if (p === 'AM' && hours24 === 12) {
        hours24 = 0;
      }

      const isoDateTime = `${d}T${String(hours24).padStart(2, '0')}:${m}:00`;
      onChange(isoDateTime);
    }
  };

  return (
    <div>
      {label && <label className="text-[10px] text-slate-500 uppercase block mb-1">{label}</label>}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date picker */}
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className={`w-full sm:w-auto sm:flex-1 min-w-0 px-3 py-2 ${selectBase} ${className}`}
        />

        {/* Hour : Minute selectors */}
        <div className="flex items-center gap-1">
          <select
            value={hour}
            onChange={handleHourChange}
            className={`w-[3.25rem] px-1.5 py-2 text-center ${selectBase}`}
          >
            {HOURS.map((h) => (
              <option key={h.value} value={h.value} className="bg-slate-800">
                {h.label}
              </option>
            ))}
          </select>
          <span className="text-slate-500 font-bold text-sm select-none">:</span>
          <select
            value={minute}
            onChange={handleMinuteChange}
            className={`w-[3.25rem] px-1.5 py-2 text-center ${selectBase}`}
          >
            {MINUTES.map((m) => (
              <option key={m.value} value={m.value} className="bg-slate-800">
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM toggle */}
        <div className="flex border border-slate-700 rounded-lg bg-slate-800 flex-shrink-0">
          <button
            type="button"
            onClick={() => handlePeriodChange('AM')}
            className={`px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
              period === 'AM'
                ? 'bg-fleet-500/20 text-fleet-300 border-r border-slate-700'
                : 'text-slate-400 hover:text-slate-300 border-r border-slate-700'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('PM')}
            className={`px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
              period === 'PM'
                ? 'bg-fleet-500/20 text-fleet-300'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
};
