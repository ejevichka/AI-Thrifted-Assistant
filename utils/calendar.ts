interface CalendarEvent {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
}

export async function addToGoogleCalendar(event: CalendarEvent): Promise<boolean> {
  try {
    // Format the event for Google Calendar API
    const calendarEvent = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      location: event.location,
    };

    // Make API call to Google Calendar
    const response = await fetch('/api/calendar/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    });

    return response.ok;
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    return false;
  }
}

export async function addToAppleCalendar(event: CalendarEvent): Promise<boolean> {
  try {
    // Format the event for Apple Calendar
    const calendarEvent = {
      title: event.title,
      notes: event.description,
      startDate: event.startTime,
      endDate: event.endTime,
      location: event.location,
    };

    // Make API call to Apple Calendar
    const response = await fetch('/api/calendar/apple/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    });

    return response.ok;
  } catch (error) {
    console.error('Error adding event to Apple Calendar:', error);
    return false;
  }
}

export async function addToOutlookCalendar(event: CalendarEvent): Promise<boolean> {
  try {
    // Format the event for Outlook Calendar
    const calendarEvent = {
      subject: event.title,
      body: {
        contentType: 'text',
        content: event.description,
      },
      start: {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      location: {
        displayName: event.location,
      },
    };

    // Make API call to Outlook Calendar
    const response = await fetch('/api/calendar/outlook/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    });

    return response.ok;
  } catch (error) {
    console.error('Error adding event to Outlook Calendar:', error);
    return false;
  }
} 