// initialization block for all calendars on the page
// A_CALENDARS array contains references to each calendar instance
if (A_CALENDARS != null) {
  for (var n = 0; n < A_CALENDARS.length; n++) {
    A_CALENDARS[n].create();
  }
}