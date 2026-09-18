"use client";
import { useState } from "react";
import {
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { dayKey, type LoadRecord } from "@/lib/load-history";
import { MINUTE } from "@/lib/laundry";

const time = (value: number) =>
  new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
export function LoadHistory({
  records,
  now,
}: {
  records: LoadRecord[];
  now: number;
}) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [month, setMonth] = useState(
    () => new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1),
  );
  const [selectedDay, setSelectedDay] = useState(() => dayKey(now));
  const finished = records
    .filter((r) => r.endsAt <= now)
    .sort((a, b) => b.startedAt - a.startedAt);
  const washes = finished.filter((r) => r.kind === "washer").length;
  const minutes = finished.reduce(
    (sum, r) => sum + (r.endsAt - r.startedAt) / MINUTE,
    0,
  );
  const entries =
    view === "list"
      ? finished
      : finished.filter((r) => dayKey(r.startedAt) === selectedDay);
  const cells = Array.from(
    {
      length:
        month.getDay() +
        new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
    },
    (_, i) =>
      i < month.getDay()
        ? null
        : new Date(
            month.getFullYear(),
            month.getMonth(),
            i - month.getDay() + 1,
          ),
  );
  function moveMonth(delta: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    setMonth(next);
    setSelectedDay(dayKey(next.getTime()));
  }
  return (
    <details className="load-history">
      <summary className="history-disclosure">
        <span>History</span>
        <small>{finished.length} loads</small>
        <ChevronDown size={18} />
      </summary>
      <div className="history-heading">
        <span className="history-view-label">Your laundry over time</span>
        <div className="history-view" role="group" aria-label="History view">
          <button
            aria-label="History list"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <List size={16} />
          </button>
          <button
            aria-label="History calendar"
            aria-pressed={view === "calendar"}
            onClick={() => setView("calendar")}
          >
            <CalendarDays size={16} />
          </button>
        </div>
      </div>
      <div className="history-stats">
        <div>
          <strong>{finished.length}</strong>
          <span>Loads finished</span>
        </div>
        <div>
          <strong>
            {washes} / {finished.length - washes}
          </strong>
          <span>Wash / dry</span>
        </div>
        <div>
          <strong>
            {(minutes / 60).toLocaleString([], { maximumFractionDigits: 1 })}h
          </strong>
          <span>Cycle time</span>
        </div>
      </div>
      {view === "calendar" && (
        <div className="history-calendar">
          <div className="calendar-heading">
            <button aria-label="Previous month" onClick={() => moveMonth(-1)}>
              <ChevronLeft size={18} />
            </button>
            <h3 aria-live="polite">
              {month.toLocaleDateString([], { month: "long", year: "numeric" })}
            </h3>
            <button aria-label="Next month" onClick={() => moveMonth(1)}>
              <ChevronRight size={18} />
            </button>
          </div>
          <div
            className="calendar-days"
            role="group"
            aria-label="Laundry dates"
          >
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <span
                className="calendar-weekday"
                key={`weekday-${i}`}
                aria-hidden="true"
              >
                {day}
              </span>
            ))}
            {cells.map((date, i) => {
              if (!date) return <span key={`blank-${i}`} />;
              const key = dayKey(date.getTime());
              const count = finished.filter(
                (r) => dayKey(r.startedAt) === key,
              ).length;
              return (
                <button
                  key={key}
                  aria-label={`${date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}, ${count} loads`}
                  aria-pressed={selectedDay === key}
                  aria-current={key === dayKey(now) ? "date" : undefined}
                  onClick={() => setSelectedDay(key)}
                >
                  <span>{date.getDate()}</span>
                  {count > 0 && <i aria-hidden="true">{count}</i>}
                </button>
              );
            })}
          </div>
          <button
            className="calendar-today"
            onClick={() => {
              setMonth(
                new Date(
                  new Date(now).getFullYear(),
                  new Date(now).getMonth(),
                  1,
                ),
              );
              setSelectedDay(dayKey(now));
            }}
          >
            Today
          </button>
          <p className="history-selected-date">
            {new Date(`${selectedDay}T12:00:00`).toLocaleDateString([], {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      )}
      {entries.length ? (
        <ul className="history-entries">
          {entries.map((record) => (
            <li key={record.id}>
              <div>
                <strong>
                  {record.kind === "washer" ? "Washer" : "Dryer"}{" "}
                  {record.machineId}
                </strong>
                <span>
                  {Math.round((record.endsAt - record.startedAt) / MINUTE)} min
                </span>
              </div>
              <time dateTime={new Date(record.startedAt).toISOString()}>
                {new Date(record.startedAt).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              <p>
                Started {time(record.startedAt)} · Finished{" "}
                {time(record.endsAt)}
                {dayKey(record.startedAt) !== dayKey(record.endsAt)
                  ? ` (${new Date(record.endsAt).toLocaleDateString([], { month: "short", day: "numeric" })})`
                  : ""}
              </p>
              {record.movedTo && (
                <p>
                  Moved to {record.movedTo}
                  {record.movedAt ? ` · ${time(record.movedAt)}` : ""}
                </p>
              )}
              {record.collectedAt && (
                <p>Collected {time(record.collectedAt)}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="history-empty">
          {view === "calendar"
            ? "No finished loads on this day."
            : "Your finished loads will appear here."}
        </p>
      )}
      <p className="history-note">
        Saved on this device. Dates reflect when each load started.
      </p>
    </details>
  );
}
