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
}
