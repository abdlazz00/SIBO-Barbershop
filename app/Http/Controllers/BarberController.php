<?php

namespace App\Http\Controllers;

use App\Repositories\Interfaces\BarberRepositoryInterface;
use App\Repositories\Interfaces\ScheduleRepositoryInterface;
use App\Repositories\Interfaces\BookingRepositoryInterface;
use App\Repositories\Interfaces\CommissionRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class BarberController extends Controller
{
    protected $barberRepo;
    protected $scheduleRepo;
    protected $bookingRepo;
    protected $commissionRepo;

    public function __construct(
        BarberRepositoryInterface $barberRepo,
        ScheduleRepositoryInterface $scheduleRepo,
        BookingRepositoryInterface $bookingRepo,
        CommissionRepositoryInterface $commissionRepo
    ) {
        $this->barberRepo = $barberRepo;
        $this->scheduleRepo = $scheduleRepo;
        $this->bookingRepo = $bookingRepo;
        $this->commissionRepo = $commissionRepo;
    }

    /**
     * Show Barber dashboard (schedule & today's bookings).
     */
    public function dashboard(): Response
    {
        $user = Auth::user();
        $barber = $user->barber;

        if (!$barber) {
            abort(403, 'Akses ditolak. Pengguna bukan barber aktif.');
        }

        $todayStr = Carbon::today()->format('Y-m-d');
        $dayOfWeek = Carbon::today()->dayOfWeek;

        // 1. Get shift schedule for today
        $shift = $this->scheduleRepo->getWeeklyScheduleForBarber($barber->id, $dayOfWeek);

        // 2. Get today's bookings for this barber
        $bookings = $this->bookingRepo->getFilteredBookings([
            'barber_id' => $barber->id,
            'date' => $todayStr,
        ])->filter(function ($b) {
            return in_array($b->status, ['confirmed', 'in_progress', 'completed']);
        })->map(function ($booking) {
            return [
                'id' => $booking->id,
                'customer_name' => $booking->customer ? $booking->customer->name : $booking->guest_name,
                'customer_phone' => $booking->customer ? $booking->customer->phone : $booking->guest_phone,
                'service_name' => $booking->service->name,
                'duration' => $booking->service->duration_minutes,
                'slot_start' => $booking->slot_start->format('H:i'),
                'slot_end' => $booking->slot_end->format('H:i'),
                'status' => $booking->status,
            ];
        })->values();

        // 3. Monthly commissions summary
        $startOfMonth = Carbon::today()->startOfMonth();
        $endOfMonth = Carbon::today()->endOfMonth();

        $monthlyCommissions = $this->commissionRepo->getFilteredCommissions([
            'barber_id' => $barber->id,
            'date_start' => $startOfMonth,
            'date_end' => $endOfMonth
        ])->sum('commission_amount');

        $monthlyBookingsCount = $this->bookingRepo->getFilteredBookings([
            'barber_id' => $barber->id,
            'date_start' => $startOfMonth,
            'date_end' => $endOfMonth,
            'status' => 'completed'
        ])->count();

        return Inertia::render('Barber/Dashboard', [
            'bookings' => $bookings,
            'shift' => $shift ? [
                'is_off' => $shift->is_off,
                'start_time' => $shift->start_time ? Carbon::parse($shift->start_time)->format('H:i') : null,
                'end_time' => $shift->end_time ? Carbon::parse($shift->end_time)->format('H:i') : null,
            ] : null,
            'summary' => [
                'monthly_commission' => (float) $monthlyCommissions,
                'monthly_bookings' => $monthlyBookingsCount,
                'commission_percentage' => (float) $barber->commission_percentage,
            ]
        ]);
    }

    /**
     * Show barber self-view commissions report list.
     */
    public function commissions(Request $request): Response
    {
        $user = Auth::user();
        $barber = $user->barber;

        if (!$barber) {
            abort(403, 'Akses ditolak. Pengguna bukan barber aktif.');
        }

        // Filter parameters
        $startDate = $request->input('start_date', Carbon::today()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::today()->endOfMonth()->format('Y-m-d'));

        // Query Commissions for this barber
        $records = $this->commissionRepo->getFilteredCommissions([
            'barber_id' => $barber->id,
            'date_start' => Carbon::parse($startDate)->startOfDay(),
            'date_end' => Carbon::parse($endDate)->endOfDay()
        ])->map(function ($rec) {
            return [
                'id' => $rec->id,
                'invoice_number' => $rec->transaction->invoice_number,
                'service_name' => $rec->transaction->booking->service->name ?? 'Layanan',
                'customer_name' => $rec->transaction->booking ? ($rec->transaction->booking->customer ? $rec->transaction->booking->customer->name : $rec->transaction->booking->guest_name) : 'Walk-in',
                'service_amount' => (float) $rec->service_amount,
                'percentage' => (float) $rec->percentage,
                'commission_amount' => (float) $rec->commission_amount,
                'date' => $rec->created_at->format('d M Y, H:i'),
            ];
        });

        $totalCommission = $records->sum('commission_amount');
        $totalServiceAmount = $records->sum('service_amount');

        return Inertia::render('Barber/Commissions', [
            'records' => $records,
            'totals' => [
                'service_amount' => (float) $totalServiceAmount,
                'commission_amount' => (float) $totalCommission,
            ],
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ]);
    }

    /**
     * Get payout history for the logged-in barber
     */
    public function getPayouts(Request $request, \App\Services\CommissionService $commissionService)
    {
        $user = Auth::user();
        $barber = $user->barber;

        if (!$barber) {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        $payouts = $commissionService->getPayoutsForBarber($barber->id);
        $payouts->load(['paidBy', 'commissionRecords.transaction.booking.service']);

        $mappedPayouts = $payouts->map(function ($p) {
            return [
                'id' => $p->id,
                'payout_amount' => (float) $p->payout_amount,
                'payment_method' => $p->payment_method === 'cash' ? 'Tunai' : 'Transfer Bank',
                'reference_number' => $p->reference_number ?? '-',
                'notes' => $p->notes ?? '-',
                'paid_by_name' => $p->paidBy->name,
                'paid_at' => $p->paid_at->format('d M Y, H:i'),
                'records' => $p->commissionRecords->map(function ($rec) {
                    return [
                        'id' => $rec->id,
                        'invoice_number' => $rec->transaction->invoice_number ?? '-',
                        'service_name' => $rec->transaction->booking->service->name ?? 'Layanan',
                        'service_amount' => (float) $rec->service_amount,
                        'percentage' => (float) $rec->percentage,
                        'commission_amount' => (float) $rec->commission_amount,
                        'date' => $rec->created_at->format('d M Y, H:i'),
                    ];
                }),
            ];
        });

        return response()->json(['payouts' => $mappedPayouts]);
    }

    /**
     * Render the Barber's Schedules (Google Calendar style page).
     */
    public function listSchedules(Request $request): Response
    {
        $user = Auth::user();
        $barber = $user->barber;

        if (!$barber) {
            abort(403, 'Akses ditolak. Pengguna bukan barber aktif.');
        }

        return Inertia::render('Barber/Schedules', [
            'barber' => [
                'id' => $barber->id,
                'name' => $barber->name,
            ]
        ]);
    }

    /**
     * Get schedules data for calendar (Axios JSON endpoint).
     */
    public function getSchedulesData(Request $request)
    {
        $user = Auth::user();
        $barber = $user->barber;

        if (!$barber) {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        $month = (int) $request->input('month', Carbon::today()->month);
        $year = (int) $request->input('year', Carbon::today()->year);

        $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        // 1. Fetch leave schedules for this month
        $leaves = \App\Models\LeaveSchedule::where('barber_id', $barber->id)
            ->whereBetween('leave_date', [$startOfMonth->format('Y-m-d'), $endOfMonth->format('Y-m-d')])
            ->get()
            ->keyBy(function ($l) {
                return $l->leave_date->format('Y-m-d');
            });

        // 2. Fetch weekly schedules template
        $weeklySchedules = \App\Models\WeeklySchedule::where('barber_id', $barber->id)
            ->get()
            ->keyBy('day_of_week');

        // 3. Fetch all bookings for this month (excluding cancelled ones)
        $bookings = \App\Models\Booking::where('barber_id', $barber->id)
            ->whereBetween('slot_start', [$startOfMonth->copy()->startOfDay(), $endOfMonth->copy()->endOfDay()])
            ->whereIn('status', ['confirmed', 'in_progress', 'completed'])
            ->with(['customer', 'service'])
            ->get();

        // Group bookings by date
        $bookingsByDate = [];
        foreach ($bookings as $b) {
            $dateStr = $b->slot_start->format('Y-m-d');
            $bookingsByDate[$dateStr][] = [
                'id' => $b->id,
                'customer_name' => $b->customer ? $b->customer->name : $b->guest_name,
                'customer_phone' => $b->customer ? $b->customer->phone : $b->guest_phone,
                'service_name' => $b->service->name ?? 'Layanan',
                'duration' => $b->service->duration_minutes ?? 0,
                'slot_start' => $b->slot_start->format('H:i'),
                'slot_end' => $b->slot_end->format('H:i'),
                'status' => $b->status,
            ];
        }

        // Build days array
        $daysData = [];
        $tempDate = $startOfMonth->copy();
        
        while ($tempDate->lte($endOfMonth)) {
            $dateStr = $tempDate->format('Y-m-d');
            $dayOfWeek = $tempDate->dayOfWeek; // 0 for Sunday, 1 for Monday... 6 for Saturday

            $isOff = false;
            $offReason = null;
            $shiftTemplate = $weeklySchedules->get($dayOfWeek);

            // Check cuti/leave first
            if ($leaves->has($dateStr)) {
                $isOff = true;
                $offReason = 'Cuti/Izin: ' . ($leaves->get($dateStr)->notes ?: 'Tidak ada catatan');
            } elseif ($shiftTemplate && $shiftTemplate->is_off) {
                $isOff = true;
                $offReason = 'Libur Rutin';
            }

            $daysData[] = [
                'date' => $dateStr,
                'day_of_month' => $tempDate->day,
                'day_of_week' => $dayOfWeek,
                'is_off' => $isOff,
                'off_reason' => $offReason,
                'shift_hours' => $isOff ? null : ($shiftTemplate ? Carbon::parse($shiftTemplate->start_time)->format('H:i') . ' - ' . Carbon::parse($shiftTemplate->end_time)->format('H:i') : null),
                'bookings' => $bookingsByDate[$dateStr] ?? [],
            ];

            $tempDate->addDay();
        }

        return response()->json([
            'month' => $month,
            'year' => $year,
            'days' => $daysData,
        ]);
    }
}
