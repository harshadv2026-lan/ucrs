package com.ucrs.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class ScheduleUtilsTest {

    @Test
    public void testOverlappingDaysAndTimesConflict() {
        // Mon/Wed 09:00-10:30 overlaps with Mon/Wed 10:00-11:30
        assertTrue(ScheduleUtils.hasConflict("Mon/Wed 09:00-10:30", "Mon/Wed 10:00-11:30"));
        // Same time slot
        assertTrue(ScheduleUtils.hasConflict("Tue/Thu 11:00-12:30", "Tue/Thu 11:00-12:30"));
        // One shares a day: Mon/Wed/Fri 08:00-09:30 vs Wed 09:00-10:00
        assertTrue(ScheduleUtils.hasConflict("Mon/Wed/Fri 08:00-09:30", "Wed 09:00-10:00"));
    }

    @Test
    public void testNonOverlappingTimesDoNotConflict() {
        // Back to back times on same days do NOT conflict
        assertFalse(ScheduleUtils.hasConflict("Mon/Wed 09:00-10:30", "Mon/Wed 10:30-12:00"));
        assertFalse(ScheduleUtils.hasConflict("Mon/Wed/Fri 08:00-09:00", "Mon/Wed 09:00-10:30"));
    }

    @Test
    public void testDifferentDaysDoNotConflict() {
        // Same time, different days
        assertFalse(ScheduleUtils.hasConflict("Mon/Wed 09:00-10:30", "Tue/Thu 09:00-10:30"));
        assertFalse(ScheduleUtils.hasConflict("Fri 10:00-13:00", "Mon/Wed 10:00-11:30"));
    }

    @Test
    public void testInvalidOrEmptySchedules() {
        assertFalse(ScheduleUtils.hasConflict(null, "Mon/Wed 09:00-10:30"));
        assertFalse(ScheduleUtils.hasConflict("TBA", "Mon/Wed 09:00-10:30"));
        assertFalse(ScheduleUtils.hasConflict("", "Mon/Wed 09:00-10:30"));
    }
}
