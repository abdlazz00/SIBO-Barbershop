<?php

namespace App\Http\Controllers;

use App\Services\BookingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class BookingController extends Controller
{
    protected $bookingService;

    public function __construct(BookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    /**
     * Show the booking wizard.
     */
    public function index(): Response
    {
        $branches = $this->bookingService->getAllBranches();
        $services = $this->bookingService->getActiveServices();

        return Inertia::render('Booking/Wizard', [
            'branches' => $branches,
            'services' => $services,
            'auth' => [
                'user' => auth()->user(),
            ]
        ]);
    }

    /**
     * Get barbers for a specific branch.
     */
    public function getBarbers(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|integer',
        ]);

        $barbers = $this->bookingService->getBarbersForBranch($request->branch_id)
            ->map(function ($barber) {
                return [
                    'id' => $barber->id,
                    'uuid' => $barber->uuid,
                    'name' => $barber->user->name,
                    'photo_path' => $barber->photo_path ?? $barber->user->photo_path,
                    'commission_percentage' => $barber->commission_percentage,
                ];
            });

        return response()->json([
            'barbers' => $barbers,
        ]);
    }

    /**
     * Get active services and calculate pricing for a specific barber.
     */
    public function getServices(Request $request)
    {
        $request->validate([
            'barber_id' => 'required|integer',
        ]);

        $services = $this->bookingService->getServicesForBarber($request->barber_id);

        return response()->json([
            'services' => $services,
        ]);
    }

    /**
     * Fetch available slots for a barber on a specific date.
     */
    public function getSlots(Request $request)
    {
        $request->validate([
            'barber_id' => 'required|integer',
            'date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'service_id' => 'required|integer',
        ]);

        $slots = $this->bookingService->getAvailableSlots(
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
            'branch_id' => 'required|integer',
            'service_id' => 'required|integer',
            'barber_id' => 'required|integer',
            'date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'time' => 'required|regex:/^[0-9]{2}:[0-9]{2}$/',
        ];

        // Guest validation
        if (!auth()->check()) {
            $rules['guest_name'] = 'required|string|max:100';
            $rules['guest_phone'] = 'required|string|max:20';
        }

        $request->validate($rules);

        try {
            $booking = $this->bookingService->createBooking($request->all());
            return redirect()->route('booking.success', $booking->uuid);
        } catch (Exception $e) {
            return back()->withErrors([
                'time' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Show booking success page.
     */
    public function success(string $uuid): Response
    {
        $bookingDetails = $this->bookingService->getBookingDetailsForInvoice($uuid);

        return Inertia::render('Booking/Success', [
            'booking' => $bookingDetails
        ]);
    }
}
