<?php

namespace App\Http\Controllers;

use App\Services\BookingService;
use App\Services\TransactionService;
use App\Repositories\Interfaces\BranchRepositoryInterface;
use App\Repositories\Interfaces\ProductRepositoryInterface;
use App\Repositories\Interfaces\BookingRepositoryInterface;
use App\Repositories\Interfaces\UserRepositoryInterface;
use App\Repositories\Interfaces\BarberRepositoryInterface;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class CashierController extends Controller
{
    protected $bookingService;
    protected $transactionService;
    protected $branchRepo;
    protected $productRepo;
    protected $bookingRepo;
    protected $userRepo;
    protected $barberRepo;
    protected $serviceRepo;

    public function __construct(
        BookingService $bookingService,
        TransactionService $transactionService,
        BranchRepositoryInterface $branchRepo,
        ProductRepositoryInterface $productRepo,
        BookingRepositoryInterface $bookingRepo,
        UserRepositoryInterface $userRepo,
        BarberRepositoryInterface $barberRepo,
        ServiceRepositoryInterface $serviceRepo
    ) {
        $this->bookingService = $bookingService;
        $this->transactionService = $transactionService;
        $this->branchRepo = $branchRepo;
        $this->productRepo = $productRepo;
        $this->bookingRepo = $bookingRepo;
        $this->userRepo = $userRepo;
        $this->barberRepo = $barberRepo;
        $this->serviceRepo = $serviceRepo;
    }

    /**
     * Show cashier dashboard with queue list and stats.
     */
    public function dashboard(Request $request): Response
    {
        $cashier = Auth::user();
        $branchId = $cashier->branch_id;

        if (!$branchId) {
            abort(403, 'Kasir tidak terasosiasi dengan cabang mana pun.');
        }

        $branch = $this->branchRepo->findOrFail($branchId);

        // Filter parameters
        $date = $request->input('date', Carbon::today()->format('Y-m-d'));
        $status = $request->input('status');
        $barberId = $request->input('barber_id');
        $search = $request->input('search');

        // Build filters array for Repository
        $filters = [
            'branch_id' => $branchId,
            'date' => $date,
        ];
        if ($status) {
            $filters['status'] = $status;
        }
        if ($barberId) {
            $filters['barber_id'] = $barberId;
        }

        $bookingsCollection = $this->bookingRepo->getFilteredBookings($filters);

        // Search text filter
        if ($search) {
            $bookingsCollection = $bookingsCollection->filter(function ($booking) use ($search) {
                $customerName = $booking->customer ? $booking->customer->name : $booking->guest_name;
                $customerPhone = $booking->customer ? $booking->customer->phone : $booking->guest_phone;
                return str_contains(strtolower($customerName), strtolower($search)) ||
                       str_contains(strtolower($customerPhone), strtolower($search));
            });
        }

        $bookings = $bookingsCollection->map(function ($booking) {
            // Get dynamically calculated final price
            $servicesWithPrice = $this->bookingService->getServicesForBarber($booking->barber_id);
            $serviceObj = collect($servicesWithPrice)->firstWhere('id', $booking->service_id);
            $price = $serviceObj ? $serviceObj['price'] : $booking->service->default_price;

            return [
                'id' => $booking->id,
                'uuid' => $booking->uuid,
                'customer_name' => $booking->customer ? $booking->customer->name : $booking->guest_name,
                'customer_phone' => $booking->customer ? $booking->customer->phone : $booking->guest_phone,
                'service_name' => $booking->service->name,
                'service_id' => $booking->service_id,
                'barber_name' => $booking->barber->user->name,
                'barber_id' => $booking->barber_id,
                'slot_start' => $booking->slot_start->format('H:i'),
                'slot_end' => $booking->slot_end->format('H:i'),
                'status' => $booking->status,
                'price' => (float) $price,
            ];
        })->values();

        // Get active barbers for dropdown
        $barbers = $this->bookingService->getBarbersForBranch($branchId)
            ->map(function ($b) {
                return [
                    'id' => $b['id'],
                    'name' => $b['name'],
                ];
            });

        // Get active services for dropdown
        $services = $this->bookingService->getActiveServices();

        // Get active products for POS catalog
        $products = $this->productRepo->getActiveProductsByBranch($branchId);

        // Stats for Today
        $stats = $this->transactionService->getTodayStats($branchId, $date);

        return Inertia::render('Cashier/Dashboard', [
            'bookings' => $bookings,
            'barbers' => $barbers,
            'services' => $services,
            'products' => $products,
            'branch' => $branch,
            'stats' => $stats,
            'filters' => [
                'date' => $date,
                'status' => $status,
                'barber_id' => $barberId,
                'search' => $search,
            ]
        ]);
    }

    /**
     * Update booking status (Mulai Service or Batalkan).
     */
    public function updateStatus(Request $request, Booking $booking)
    {
        $cashier = Auth::user();
        
        // Security check: must belong to the same branch
        if ($booking->branch_id !== $cashier->branch_id) {
            abort(403, 'Aksi tidak diperbolehkan pada cabang lain.');
        }

        $request->validate([
            'status' => 'required|in:in_progress,cancelled',
        ]);

        $this->bookingRepo->update($booking->id, [
            'status' => $request->status,
        ]);

        return back()->with('success', 'Status booking berhasil diperbarui.');
    }

    /**
     * Search customer by phone number.
     */
    public function searchCustomer(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
        ]);

        $user = \App\Models\User::where('phone', $request->phone)
            ->where('role', 'customer')
            ->first();

        if ($user) {
            return response()->json([
                'found' => true,
                'customer' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone' => $user->phone,
                ]
            ]);
        }

        return response()->json([
            'found' => false,
        ]);
    }

    /**
     * Store walk-in booking.
     */
    public function storeBooking(Request $request)
    {
        $cashier = Auth::user();
        $branchId = $cashier->branch_id;

        $request->validate([
            'service_id' => 'required|integer',
            'barber_id' => 'required|integer',
            'time' => 'required|regex:/^[0-9]{2}:[0-9]{2}$/',
            'customer_type' => 'required|in:guest,member',
            'guest_name' => 'required_if:customer_type,guest|nullable|string|max:100',
            'guest_phone' => 'required_if:customer_type,guest|nullable|string|max:20',
            'customer_id' => 'required_if:customer_type,member|nullable|integer',
        ]);

        $bookingData = [
            'branch_id' => $branchId,
            'service_id' => $request->service_id,
            'barber_id' => $request->barber_id,
            'date' => Carbon::today()->format('Y-m-d'),
            'time' => $request->time,
        ];

        if ($request->customer_type === 'member') {
            $bookingData['customer_id'] = $request->customer_id;
        } else {
            $bookingData['guest_name'] = $request->guest_name;
            $bookingData['guest_phone'] = $request->guest_phone;
        }

        try {
            $this->bookingService->createBooking($bookingData);
            return back()->with('success', 'Booking walk-in berhasil dibuat.');
        } catch (Exception $e) {
            return back()->withErrors([
                'time' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Render checkout POS page for a booking that is in_progress.
     */
    public function posIndex(?Booking $booking = null): Response
    {
        $cashier = Auth::user();
        $bookingDetails = null;

        if ($booking && $booking->exists) {
            if ($booking->branch_id !== $cashier->branch_id) {
                abort(403, 'Aksi tidak diperbolehkan pada cabang lain.');
            }

            if ($booking->status !== 'in_progress') {
                return redirect()->route('cashier.dashboard')->withErrors([
                    'error' => 'Kasir hanya bisa memproses POS dari booking berstatus In-Progress.',
                ]);
            }

            // Get service price via BookingService / ServiceRepository
            $servicesWithPrice = $this->bookingService->getServicesForBarber($booking->barber_id);
            $serviceObj = collect($servicesWithPrice)->firstWhere('id', $booking->service_id);
            $servicePrice = $serviceObj ? $serviceObj['price'] : $booking->service->default_price;

            $bookingDetails = [
                'id' => $booking->id,
                'uuid' => $booking->uuid,
                'customer_name' => $booking->customer ? $booking->customer->name : $booking->guest_name,
                'customer_phone' => $booking->customer ? $booking->customer->phone : $booking->guest_phone,
                'service_id' => $booking->service_id,
                'service_name' => $booking->service->name,
                'service_price' => (float) $servicePrice,
                'barber_id' => $booking->barber_id,
                'barber_name' => $booking->barber->user->name,
            ];
        }

        // Active products in cashier's branch
        $products = $this->productRepo->getActiveProductsByBranch($cashier->branch_id);

        return Inertia::render('Cashier/POS', [
            'booking' => $bookingDetails,
            'products' => $products,
        ]);
    }

    /**
     * Process checkout transaction.
     */
    public function checkout(Request $request)
    {
        $cashier = Auth::user();

        $request->validate([
            'booking_id' => 'nullable|integer',
            'payment_type' => 'required|in:cash,transfer,qris',
            'products' => 'nullable|array',
            'products.*.id' => 'required|integer',
            'products.*.qty' => 'required|integer|min:1',
        ]);

        try {
            $transaction = $this->transactionService->processCheckout(
                $request->all(),
                $cashier->id,
                $cashier->branch_id
            );

            return redirect()->route('cashier.transactions.receipt', $transaction->uuid)
                ->with('success', 'Transaksi berhasil diselesaikan.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Gagal menyelesaikan transaksi: ' . $e->getMessage()]);
        }
    }

    /**
     * Show cashier receipt page.
     */
    public function receipt(string $uuid): Response
    {
        $details = $this->transactionService->getReceiptDetails($uuid);
        $cashier = Auth::user();
        $branch = $this->branchRepo->findOrFail($cashier->branch_id);

        return Inertia::render('Cashier/Receipt', [
            'transaction' => [
                'invoice_number' => $details['transaction']->invoice_number,
                'payment_type' => strtoupper($details['transaction']->payment_type),
                'total_service' => (float) $details['transaction']->total_service,
                'total_product' => (float) $details['transaction']->total_product,
                'grand_total' => (float) $details['transaction']->grand_total,
                'created_at' => $details['transaction']->created_at->format('d M Y, H:i'),
                'cashier_name' => $details['transaction']->cashier->name,
                'customer_name' => $details['transaction']->booking ? ($details['transaction']->booking->customer ? $details['transaction']->booking->customer->name : $details['transaction']->booking->guest_name) : 'Walk-in',
                'barber_name' => $details['transaction']->booking ? $details['transaction']->booking->barber->user->name : '-',
            ],
            'items' => $details['items'],
            'branch' => $branch,
        ]);
    }
}
