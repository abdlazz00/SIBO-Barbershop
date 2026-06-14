<?php

namespace App\Services;

use App\Models\Barber;
use App\Models\Service;
use App\Models\Booking;
use App\Models\LeaveSchedule;
use App\Models\WeeklySchedule;
use Carbon\Carbon;

class ScheduleService
{
    /**
     * Get available booking slots for a barber on a specific date.
     *
     * @param int $barberId
     * @param string $date (Format: YYYY-MM-DD)
     * @param int $serviceId
     * @return array List of available start times (e.g. ['09:00', '09:30', ...])
     */
    public function getAvailableSlots(int $barberId, string $date, int $serviceId): array
    {
        $barber = Barber::findOrFail($barberId);
        $service = Service::findOrFail($serviceId);
        $duration = $service->duration_minutes;

        $carbonDate = Carbon::parse($date);
        
        // 1. Check if barber is on leave on this date
        $onLeave = LeaveSchedule::where('barber_id', $barberId)
            ->whereDate('leave_date', $date)
            ->exists();
            
        if ($onLeave) {
            return [];
        }

        // 2. Get weekly schedule for this day of week (0 = Sunday, 1 = Monday, etc.)
        $dayOfWeek = $carbonDate->dayOfWeek;
        $schedule = WeeklySchedule::where('barber_id', $barberId)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if (!$schedule || $schedule->is_off || !$schedule->start_time || !$schedule->end_time) {
            return [];
        }

        // Parse work hours
        $workStart = Carbon::parse($date . ' ' . $schedule->start_time);
        $workEnd = Carbon::parse($date . ' ' . $schedule->end_time);

        // 3. Get existing bookings for this barber on this date (not cancelled)
        $bookings = Booking::where('barber_id', $barberId)
            ->whereIn('status', ['confirmed', 'in_progress', 'completed'])
            ->whereDate('slot_start', $date)
            ->get();

        // 4. Generate potential slots in 30-minute intervals
        $slots = [];
        $currentTime = clone $workStart;
        
        // Ensure slots are in the future if booking for today
        $now = Carbon::now();

        while ($currentTime->copy()->addMinutes($duration)->lte($workEnd)) {
            $slotStart = clone $currentTime;
            $slotEnd = $slotStart->copy()->addMinutes($duration);

            // If the date is today, slot must start in the future (plus a buffer of 15 minutes)
            if ($carbonDate->isToday() && $slotStart->lte($now->copy()->addMinutes(15))) {
                $currentTime->addMinutes(30);
                continue;
            }

            // Check overlap with existing bookings
            $overlap = false;
            foreach ($bookings as $booking) {
                // Check if candidate slot overlaps with booking
                // overlap if: candidate_start < booking_end AND candidate_end > booking_start
                if ($slotStart->lt($booking->slot_end) && $slotEnd->gt($booking->slot_start)) {
                    $overlap = true;
                    break;
                }
            }

            if (!$overlap) {
                $slots[] = $slotStart->format('H:i');
            }

            $currentTime->addMinutes(30); // 30-minute slot intervals
        }

        return $slots;
    }
}
