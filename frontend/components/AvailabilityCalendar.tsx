"use client";

import {
  addDays,
  addMonths,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

interface UnavailableRange {
  check_in: string;
  check_out: string;
}

interface Props {
  listingId: number;
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
}

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function AvailabilityCalendar({ listingId, checkIn, checkOut, onChange }: Props) {
  const today = startOfDay(new Date());
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(startOfMonth(today));
  const [unavailable, setUnavailable] = useState<UnavailableRange[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api<{ unavailable_ranges: UnavailableRange[] }>(`/listings/${listingId}/availability`)
      .then((data) => setUnavailable(data.unavailable_ranges))
      .finally(() => setLoading(false));
  }, [listingId]);

  const days = useMemo(() => {
    const first = startOfWeek(startOfMonth(month));
    return Array.from({ length: 42 }, (_, index) => addDays(first, index));
  }, [month]);

  function unavailableOn(day: Date) {
    return unavailable.some((range) => {
      const start = parseISO(range.check_in);
      const end = parseISO(range.check_out);
      return !isBefore(day, start) && isBefore(day, end);
    });
  }

  function rangeCrossesUnavailable(start: Date, end: Date) {
    for (let cursor = start; isBefore(cursor, end); cursor = addDays(cursor, 1)) {
      if (unavailableOn(cursor)) return true;
    }
    return false;
  }

  function select(day: Date) {
    const value = format(day, "yyyy-MM-dd");
    if (!checkIn || checkOut || !isBefore(parseISO(checkIn), day)) {
      onChange(value, "");
      return;
    }
    if (rangeCrossesUnavailable(parseISO(checkIn), day)) {
      onChange(value, "");
      return;
    }
    onChange(checkIn, value);
    setOpen(false);
  }

  function selected(day: Date) {
    return (checkIn && isSameDay(day, parseISO(checkIn))) || (checkOut && isSameDay(day, parseISO(checkOut)));
  }

  function inRange(day: Date) {
    return Boolean(checkIn && checkOut && isBefore(parseISO(checkIn), day) && isBefore(day, parseISO(checkOut)));
  }

  return (
    <div className="availability-picker">
      <button type="button" className="date-box booking-date-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span><small>CHECK-IN</small><strong>{checkIn ? format(parseISO(checkIn), "MMM d, yyyy") : "Add date"}</strong></span>
        <span><small>CHECKOUT</small><strong>{checkOut ? format(parseISO(checkOut), "MMM d, yyyy") : "Add date"}</strong></span>
        <CalendarDays size={18} />
      </button>
      {open && (
        <div className="calendar-popover">
          <div className="calendar-heading">
            <button type="button" aria-label="Previous month" disabled={isSameMonth(month, today)} onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft size={18} /></button>
            <strong>{format(month, "MMMM yyyy")}</strong>
            <button type="button" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight size={18} /></button>
          </div>
          <div className="calendar-weekdays">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">
            {days.map((day) => {
              const disabled = isBefore(day, today) || unavailableOn(day) || !isSameMonth(day, month);
              return <button type="button" key={day.toISOString()} disabled={disabled} className={`${selected(day) ? "selected" : ""} ${inRange(day) ? "in-range" : ""}`} onClick={() => select(day)}>{format(day, "d")}</button>;
            })}
          </div>
          <div className="calendar-footer">
            <span>{loading ? "Checking availability…" : "Crossed-out dates are unavailable"}</span>
            {(checkIn || checkOut) && <button type="button" onClick={() => onChange("", "")}>Clear dates</button>}
          </div>
        </div>
      )}
    </div>
  );
}
