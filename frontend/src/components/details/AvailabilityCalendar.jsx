import { useState } from 'react';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isBeforeDay(a, b) {
  return a.getFullYear() * 372 + a.getMonth() * 31 + a.getDate() < b.getFullYear() * 372 + b.getMonth() * 31 + b.getDate();
}

function buildMonthGrid(monthStart) {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= totalDays; day += 1) cells.push(new Date(year, month, day));
  return cells;
}

// Two-month range picker kept in sync with the sticky cost calculator via
// the checkIn/checkOut props owned by LocationDetailsPage — selecting a
// range here updates the reserve panel, and vice versa.
export default function AvailabilityCalendar({ checkIn, checkOut, onChange }) {
  const today = startOfMonth(new Date());
  const [viewDate, setViewDate] = useState(
    checkIn ? startOfMonth(new Date(checkIn)) : today
  );

  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;

  function handleDayClick(date) {
    if (!checkInDate || (checkInDate && checkOutDate)) {
      onChange(toISO(date), '');
      return;
    }
    if (isBeforeDay(checkInDate, date)) {
      onChange(checkIn, toISO(date));
    } else {
      onChange(toISO(date), '');
    }
  }

  function dayClasses(date) {
    if (!date) return 'availability-calendar__day is-empty';
    const classes = ['availability-calendar__day'];
    if (isBeforeDay(date, new Date()) && toISO(date) !== toISO(new Date())) classes.push('is-past');
    if (checkInDate && toISO(date) === toISO(checkInDate)) classes.push('is-selected');
    if (checkOutDate && toISO(date) === toISO(checkOutDate)) classes.push('is-selected');
    if (
      checkInDate &&
      checkOutDate &&
      isBeforeDay(checkInDate, date) &&
      isBeforeDay(date, checkOutDate)
    ) {
      classes.push('is-in-range');
    }
    return classes.join(' ');
  }

  function renderMonth(monthStart, label) {
    return (
      <div className="availability-calendar__month">
        <p className="availability-calendar__month-label">{label}</p>
        <div className="availability-calendar__weekdays">
          {WEEKDAYS.map((wd) => (
            <span key={wd}>{wd}</span>
          ))}
        </div>
        <div className="availability-calendar__grid">
          {buildMonthGrid(monthStart).map((date, i) => (
            <button
              key={i}
              type="button"
              className={dayClasses(date)}
              disabled={!date || (isBeforeDay(date, new Date()) && toISO(date) !== toISO(new Date()))}
              onClick={() => date && handleDayClick(date)}
            >
              {date ? date.getDate() : ''}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const monthA = viewDate;
  const monthB = addMonths(viewDate, 1);
  const monthLabel = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="availability-calendar">
      <div className="availability-calendar__header">
        <button
          type="button"
          className="availability-calendar__nav"
          aria-label="Previous month"
          disabled={toISO(startOfMonth(monthA)) <= toISO(today)}
          onClick={() => setViewDate((v) => addMonths(v, -1))}
        >
          ‹
        </button>
        {renderMonth(monthA, monthLabel(monthA))}
        {renderMonth(monthB, monthLabel(monthB))}
        <button
          type="button"
          className="availability-calendar__nav"
          aria-label="Next month"
          onClick={() => setViewDate((v) => addMonths(v, 1))}
        >
          ›
        </button>
      </div>

      <div className="availability-calendar__footer">
        <button
          type="button"
          className="availability-calendar__today"
          aria-label="Jump to current month"
          onClick={() => setViewDate(today)}
        >
          Today
        </button>
        {(checkIn || checkOut) && (
          <button type="button" className="availability-calendar__clear" onClick={() => onChange('', '')}>
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}
