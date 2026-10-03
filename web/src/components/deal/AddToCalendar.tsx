"use client";

import { useState } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { dealEvents, googleCalendarUrl, type CalendarDeal, type CalendarRole } from "@/lib/calendar";

/**
 * The handover and the deadline into the viewer's calendar. A web page can't add events to the phone's calendar by
 * itself, so this offers the two routes that open one: the .ics file (Apple devices open it straight in Calendar,
 * served inline; elsewhere it downloads and the calendar app opens it) and Google Calendar links (one event each).
 */
export function AddToCalendar({ deal, role, url }: { deal: CalendarDeal; role: CalendarRole; url: string }) {
  const [open, setOpen] = useState(false);
  const [handover, deadline] = dealEvents(deal, role, url);
  return (
    <>
      <Button variant="secondary" fullWidth className="mt-4" onClick={() => setOpen(true)}>
        <Icon name="calendar" size={18} />
        Add both dates to your calendar
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add to your calendar">
        <p className="text-fg-muted">The key handover and the handover deadline, with a link back to this deal.</p>
        <div className="mt-5 space-y-2">
          <a href={`/api/calendar/${deal.id}?for=${role}`} className={buttonClass({ fullWidth: true })}>
            Apple Calendar, Outlook and others
          </a>
          <p className="text-sm text-fg-muted">On iPhone, iPad and Mac, Calendar opens with both dates and their reminders. Elsewhere a calendar file downloads: open it.</p>
        </div>
        <div className="mt-6 space-y-2 border-t border-rule pt-5">
          <p className="font-semibold">Google Calendar</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { event: handover, label: "Add the handover" },
              { event: deadline, label: "Add the deadline" },
            ].map(({ event, label }) => (
              <a
                key={event.uid}
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noreferrer"
                className={buttonClass({ variant: "secondary", fullWidth: true })}
              >
                {label}
                <span className="sr-only"> (opens Google Calendar in a new tab)</span>
              </a>
            ))}
          </div>
          <p className="text-sm text-fg-muted">Google adds one date at a time: tap Save on each.</p>
        </div>
      </Sheet>
    </>
  );
}
