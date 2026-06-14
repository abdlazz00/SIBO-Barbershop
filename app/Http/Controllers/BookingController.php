<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Service;
use App\Models\Barber;
use App\Models\Booking;
use App\Services\ScheduleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    protected $scheduleService;

    public function __construct(ScheduleService $scheduleService)
    {
        $this->scheduleService = $scheduleService;
    }

    /**
     * Show the booking wizard.
     */
    public function index(): Response
    {
        $branches = Branch::whereNull('deleted_at')->get();
        $services = Service::where('status', 'active')->whereNull('deleted_at')->get();

        return Inertia::render('Booking/Wizard', [
            'branches' => $branches,
            'services' => $services,
            'auth' => [
                'user' => Auth::user(),
            ]
        ]);
    }

    /**
     * Get barbers for a specific branch and calculate their pricing for a service.
     */
    public function getBarbers(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'service_id' => 'required|exists:services,id',
        ]);

        $branchId = $request->branch_id;
        $serviceId = $request->service_id;

        // Fetch all active barbers in this branch, including their user info
        $barbers = Barber::with('user')
            ->where('branch_id', $branchId)
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->get();

        $service = Service::findOrFail($serviceId);

        // Map barbers and compute price overrides
        $barberList = $barbers->map(function ($barber) use ($service) {
            // Check if there is an override price in barber_services
            $override = DB::table('barber_services')
                ->where('barber_id', $barber->id)
                ->where('service_id', $service->id)
                ->first();

            $price = $override ? $override->price : $service->default_price;

            return [
                'id' => $barber->id,
                'uuid' => $barber->uuid,
                'name' => $barber->user->name,
                'photo_path' => $barber->photo_path ?? $barber->user->photo_path,
                'price' => (float) $price,
                'commission_percentage' => $barber->commission_percentage,
            ];
        });

        return response()->json([
            'barbers' => $barberList,
        ]);
    }

    /**
     * Fetch available slots for a barber on a specific date.
     */
    public function getSlots(Request $request)
    {
        $request->validate([
            'barber_id' => 'required|exists:barbers,id',
            'date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'service_id' => 'required|exists:services,id',
        ]);

        $slots = $this->scheduleService->getAvailableSlots(
            $request->barber_id,
            $request->date,
            $request->service_id
        );

        return response()->json([
            'slots' => $slots,
        ]);
    }

    /**
     * Store a new booking.
     */
    public function store(Request $request)
    {
        $rules = [
            'branch_id' => 'required|exists:branches,id',
            'service_id' => 'required|exists:services,id',
            'barber_id' => 'required|exists:barbers,id',
            'date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'time' => 'required|regex:/^[0-9]{2}:[0-9]{2}$/',
        ];

        // Guest validation
        if (!Auth::check()) {
            $rules['guest_name'] = 'required|string|max:100';
            $rules['guest_phone'] = 'required|string|max:20';
        }

        $request->validate($rules);

        $service = Service::findOrFail($request->service_id);
        $duration = $service->duration_minutes;

        // Calculate slot start and end
        $slotStart = Carbon::parse($request->date . ' ' . $request->time);
        $slotEnd = $slotStart->copy()->addMinutes($duration);

        // Collision Check: double-booking prevention using PostgreSQL pessimistic/optimistic check
        // Check if there is an overlapping active booking for this barber
        $collision = Booking::where('barber_id', $request->barber_id)
            ->whereIn('status', ['confirmed', 'in_progress', 'completed'])
            ->where(function ($query) use ($slotStart, $slotEnd) {
                $query->where('slot_start', '<', $slotEnd)
                      ->where('slot_end', '>', $slotStart);
            })
            ->exists();

        if ($collision) {
            return back()->withErrors([
                'time' => 'Slot waktu terpilih sudah di-booking pelanggan lain baru saja. Silahkan pilih slot lain.',
            ]);
        }

        // Verify that the slot is indeed available (checking weekly schedule and leaves)
        $availableSlots = $this->scheduleService->getAvailableSlots(
            $request->barber_id,
            $request->date,
            $request->service_id
        );

        if (!in_array($request->time, $availableSlots)) {
            return back()->withErrors([
                'time' => 'Slot waktu terpilih tidak valid atau berada di luar jam kerja barber.',
            ]);
        }

        // Save booking
        $booking = new Booking();
        $booking->branch_id = $request->branch_id;
        $booking->barber_id = $request->barber_id;
        $booking->service_id = $request->service_id;
        $booking->slot_start = $slotStart;
        $booking->slot_end = $slotEnd;
        $booking->status = 'confirmed';

        if (Auth::check()) {
            $booking->customer_id = Auth::id();
        } else {
            $booking->guest_name = $request->guest_name;
            $booking->guest_phone = $request->guest_phone;
        }

        $booking->save();

        // Redirect to success invoice page
        return redirect()->route('booking.success', $booking->uuid);
    }

    /**
     * Show booking success page.
     */
    public function success(string $uuid): Response
    {
        $booking = Booking::with(['branch', 'service', 'barber.user'])
            ->where('uuid', $uuid)
            ->firstOrFail();

        // Compute price (default or override)
        $override = DB::table('barber_services')
            ->where('barber_id', $booking->barber_id)
            ->where('service_id', $booking->service_id)
            ->first();

        $price = $override ? $override->price : $booking->service->default_price;

        return Inertia::render('Booking/Success', [
            'booking' => [
                'uuid' => $booking->uuid,
                'branch_name' => $booking->branch->name,
                'branch_address' => $booking->branch->address,
                'service_name' => $booking->service->name,
                'service_duration' => $booking->service->duration_minutes,
                'barber_name' => $booking->barber->user->name,
                'slot_start' => $booking->slot_start->format('d M Y, H:i'),
                'slot_end' => $booking->slot_end->format('H:i'),
                'price' => (float) $price,
                'customer_name' => $booking->customer ? $booking->customer->name : $booking->guest_name,
                'customer_phone' => $booking->customer ? $booking->customer->phone : $booking->guest_phone,
            ]
        ]);
    }
}
