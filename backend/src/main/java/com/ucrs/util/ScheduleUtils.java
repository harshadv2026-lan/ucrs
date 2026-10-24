package com.ucrs.util;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ScheduleUtils {

    private static final Pattern TIME_PATTERN = Pattern.compile("(\\d{1,2}):(\\d{2})\\s*-\\s*(\\d{1,2}):(\\d{2})");

    private static final Map<String, String> DAY_ABBREV = new HashMap<>();
    static {
        DAY_ABBREV.put("MON", "MON");
        DAY_ABBREV.put("MONDAY", "MON");
        DAY_ABBREV.put("M", "MON");

        DAY_ABBREV.put("TUE", "TUE");
        DAY_ABBREV.put("TUES", "TUE");
        DAY_ABBREV.put("TUESDAY", "TUE");
        DAY_ABBREV.put("T", "TUE");

        DAY_ABBREV.put("WED", "WED");
        DAY_ABBREV.put("WEDNESDAY", "WED");
        DAY_ABBREV.put("W", "WED");

        DAY_ABBREV.put("THU", "THU");
        DAY_ABBREV.put("THUR", "THU");
        DAY_ABBREV.put("THURS", "THU");
        DAY_ABBREV.put("THURSDAY", "THU");
        DAY_ABBREV.put("R", "THU");

        DAY_ABBREV.put("FRI", "FRI");
        DAY_ABBREV.put("FRIDAY", "FRI");
        DAY_ABBREV.put("F", "FRI");

        DAY_ABBREV.put("SAT", "SAT");
        DAY_ABBREV.put("SATURDAY", "SAT");
        DAY_ABBREV.put("S", "SAT");

        DAY_ABBREV.put("SUN", "SUN");
        DAY_ABBREV.put("SUNDAY", "SUN");
        DAY_ABBREV.put("U", "SUN");
    }

    public static class ParsedSchedule {
        private final Set<String> days;
        private final int startMinutes;
        private final int endMinutes;
        private final boolean valid;

        public ParsedSchedule(Set<String> days, int startMinutes, int endMinutes, boolean valid) {
            this.days = days;
            this.startMinutes = startMinutes;
            this.endMinutes = endMinutes;
            this.valid = valid;
        }

        public Set<String> getDays() { return days; }
        public int getStartMinutes() { return startMinutes; }
        public int getEndMinutes() { return endMinutes; }
        public boolean isValid() { return valid; }
    }

    /**
     * Parses schedules such as:
     * "Mon/Wed 09:00-10:30", "Tue/Thu 11:00-12:30", "Mon/Wed/Fri 08:00-09:00", "Fri 10:00-13:00"
     */
    public static ParsedSchedule parse(String schedule) {
        if (schedule == null || schedule.trim().isEmpty() || "TBA".equalsIgnoreCase(schedule.trim())) {
            return new ParsedSchedule(Collections.emptySet(), 0, 0, false);
        }

        Matcher matcher = TIME_PATTERN.matcher(schedule);
        if (!matcher.find()) {
            return new ParsedSchedule(Collections.emptySet(), 0, 0, false);
        }

        int startHour = Integer.parseInt(matcher.group(1));
        int startMin = Integer.parseInt(matcher.group(2));
        int endHour = Integer.parseInt(matcher.group(3));
        int endMin = Integer.parseInt(matcher.group(4));

        int startMinutes = startHour * 60 + startMin;
        int endMinutes = endHour * 60 + endMin;

        String dayPart = schedule.substring(0, matcher.start()).trim();
        String[] rawDays = dayPart.split("[/,\\s]+");
        Set<String> days = new HashSet<>();

        for (String raw : rawDays) {
            String cleaned = raw.toUpperCase().replaceAll("[^A-Z]", "");
            if (DAY_ABBREV.containsKey(cleaned)) {
                days.add(DAY_ABBREV.get(cleaned));
            }
        }

        if (days.isEmpty()) {
            return new ParsedSchedule(Collections.emptySet(), 0, 0, false);
        }

        return new ParsedSchedule(days, startMinutes, endMinutes, true);
    }

    /**
     * Determines whether scheduleA conflicts with scheduleB.
     * Returns true if there is an overlapping day and overlapping time.
     */
    public static boolean hasConflict(String scheduleA, String scheduleB) {
        ParsedSchedule a = parse(scheduleA);
        ParsedSchedule b = parse(scheduleB);

        if (!a.isValid() || !b.isValid()) {
            return false;
        }

        // Check if there are days in common
        boolean sharesDay = false;
        for (String day : a.getDays()) {
            if (b.getDays().contains(day)) {
                sharesDay = true;
                break;
            }
        }

        if (!sharesDay) {
            return false;
        }

        // Overlap condition: startA < endB && endA > startB
        return a.getStartMinutes() < b.getEndMinutes() && a.getEndMinutes() > b.getStartMinutes();
    }
}
