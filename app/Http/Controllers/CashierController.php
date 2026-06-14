<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Service;
use App\Models\Barber;
use App\Models\Booking;
use App\Models\Product;
use App\Models\User;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\CommissionRecord;
use App\Services\ScheduleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CashierController extends Controller
{
    protected $scheduleService;

    public function __construct(ScheduleService $scheduleService)
    {
        $this->scheduleService = $scheduleService;
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

        $branch = Branch::findOrFail($branchId);

        // Filter parameters
        $date = $request->input('date', Carbon::today()->format('Y-m-d'));
        $status = $request->input('status');
        $barberId = $request->input('barber_id');
        $search = $request->input('search');

        // Query Bookings for Cashier's branch
        $bookingsQuery = Booking::with(['service', 'barber.user', 'customer'])
            ->where('branch_id', $branchId)
            ->whereDate('slot_start', $date);

        if ($status) {
            $bookingsQuery->where('status', $status);
        }

        if ($barberId) {
            $bookingsQuery->where('barber_id', $barberId);
        }

        if ($search) {
            $bookingsQuery->where(function ($q) use ($search) {
                $q->where('guest_name', 'like', "%{$search}%")
                  ->orWhere('guest_phone', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        $bookings = $bookingsQuery->orderBy('slot_start', 'asc')->get()->map(function ($booking) {
            // Compute price override or default
            $override = DB::table('barber_services')
                ->where('barber_id', $booking->barber_id)
                ->where('service_id', $booking->service_id)
                ->first();

            $price = $override ? $override->price : $booking->service->default_price;

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
        });

        // Get active barbers for walk-in booking dropdown
        $barbers = Barber::with('user')
            ->where('branch_id', $branchId)
            ->where('status', 'active')
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    'name' => $b->user->name,
                ];
            });

        // Get active services for dropdown
        $services = Service::where('status', 'active')->get();

        // Get active products for POS catalog
        $products = Product::where('branch_id', $branchId)
            ->where('status', 'active')
            ->get();

        // Stats for Today
        $stats = [
            'total_bookings' => Booking::where('branch_id', $branchId)->whereDate('slot_start', $date)->count(),
            'confirmed' => Booking::where('branch_id', $branchId)->whereDate('slot_start', $date)->where('status', 'confirmed')->count(),
            'in_progress' => Booking::where('branch_id', $branchId)->whereDate('slot_start', $date)->where('status', 'in_progress')->count(),
            'completed' => Booking::where('branch_id', $branchId)->whereDate('slot_start', $date)->where('status', 'completed')->count(),
            'revenue' => (float) Transaction::whereHas('booking', function ($q) use ($branchId, $date) {
                $q->where('branch_id', $branchId)->whereDate('slot_start', $date);
            })->sum('grand_total'),
        ];

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

        $booking->status = $request->status;
        $booking->save();

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

        $user = User::where('phone', $request->phone)
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
            'service_id' => 'required|exists:services,id',
            'barber_id' => 'required|exists:barbers,id',
            'time' => 'required|regex:/^[0-9]{2}:[0-9]{2}$/',
            'customer_type' => 'required|in:guest,member',
            'guest_name' => 'required_if:customer_type,guest|nullable|string|max:100',
            'guest_phone' => 'required_if:customer_type,guest|nullable|string|max:20',
            'customer_id' => 'required_if:customer_type,member|nullable|exists:users,id',
        ]);

        $service = Service::findOrFail($request->service_id);
        $duration = $service->duration_minutes;

        // Walk-in booking is always for today
        $todayStr = Carbon::today()->format('Y-m-d');
        $slotStart = Carbon::parse($todayStr . ' ' . $request->time);
        $slotEnd = $slotStart->copy()->addMinutes($duration);

        // Check weekly schedule & leaves
        $availableSlots = $this->scheduleService->getAvailableSlots(
            $request->barber_id,
            $todayStr,
            $request->service_id
        );

        if (!in_array($request->time, $availableSlots)) {
            return back()->withErrors([
                'time' => 'Slot waktu terpilih tidak valid atau barber sedang sibuk/libur.',
            ]);
        }

        $booking = new Booking();
        $booking->branch_id = $branchId;
        $booking->barber_id = $request->barber_id;
        $booking->service_id = $request->service_id;
        $booking->slot_start = $slotStart;
        $booking->slot_end = $slotEnd;
        $booking->status = 'confirmed';

        if ($request->customer_type === 'member') {
            $booking->customer_id = $request->customer_id;
        } else {
            $booking->guest_name = $request->guest_name;
            $booking->guest_phone = $request->guest_phone;
        }

        $booking->save();

        return back()->with('success', 'Booking walk-in berhasil dibuat.');
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

            // Get service price
            $override = DB::table('barber_services')
                ->where('barber_id', $booking->barber_id)
                ->where('service_id', $booking->service_id)
                ->first();

            $servicePrice = $override ? $override->price : $booking->service->default_price;

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
        $products = Product::where('branch_id', $cashier->branch_id)
            ->where('status', 'active')
            ->where('stock', '>', 0)
            ->get();

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
        $branchId = $cashier->branch_id;

        $request->validate([
            'booking_id' => 'nullable|exists:bookings,id',
            'payment_type' => 'required|in:cash,transfer,qris',
            'products' => 'nullable|array',
            'products.*.id' => 'required|exists:products,id',
            'products.*.qty' => 'required|integer|min:1',
        ]);

        $booking = null;
        $totalService = 0.00;

        if ($request->booking_id) {
            $booking = Booking::with(['service', 'barber'])->findOrFail($request->booking_id);

            if ($booking->branch_id !== $branchId) {
                abort(403, 'Aksi tidak diperbolehkan pada cabang lain.');
            }

            if ($booking->status !== 'in_progress') {
                return back()->withErrors(['error' => 'Booking harus berstatus In-Progress untuk checkout.']);
            }

            // Calculate service cost
            $override = DB::table('barber_services')
                ->where('barber_id', $booking->barber_id)
                ->where('service_id', $booking->service_id)
                ->first();

            $servicePrice = $override ? $override->price : $booking->service->default_price;
            $totalService = (float) $servicePrice;
        }

        $totalProduct = 0.00;

        // Validate product stocks and calculate total product cost
        $itemsToSell = [];
        if ($request->has('products') && count($request->products) > 0) {
            foreach ($request->products as $pItem) {
                $product = Product::lockForUpdate()->findOrFail($pItem['id']);
                
                if (+$product->branch_id !== +$branchId) {
                    return back()->withErrors(['error' => "Produk {$product->name} tidak berada di cabang Anda."]);
                }

                if ($product->stock < $pItem['qty']) {
                    return back()->withErrors(['error' => "Stok produk {$product->name} tidak mencukupi (Tersisa: {$product->stock})."]);
                }

                $subtotal = (float) ($product->price * $pItem['qty']);
                $totalProduct += $subtotal;

                $itemsToSell[] = [
                    'product' => $product,
                    'qty' => $pItem['qty'],
                    'unit_price' => (float) $product->price,
                    'subtotal' => $subtotal,
                ];
            }
        }

        // Must buy at least service or product
        if (!$booking && count($itemsToSell) === 0) {
            return back()->withErrors(['error' => 'Keranjang transaksi kosong.']);
        }

        $grandTotal = $totalService + $totalProduct;

        // DB Transaction for atomicity
        DB::beginTransaction();

        try {
            // Generate Invoice number
            $datePrefix = Carbon::now()->format('Ymd');
            $todayTxCount = Transaction::whereDate('created_at', Carbon::today())->count();
            $invoiceNumber = 'TRX-' . $datePrefix . '-' . str_pad($todayTxCount + 1, 3, '0', STR_PAD_LEFT);

            // 1. Create Transaction
            $transaction = new Transaction();
            $transaction->invoice_number = $invoiceNumber;
            $transaction->booking_id = $booking ? $booking->id : null;
            $transaction->cashier_id = $cashier->id;
            $transaction->payment_type = $request->payment_type;
            $transaction->total_service = $totalService;
            $transaction->total_product = $totalProduct;
            $transaction->grand_total = $grandTotal;
            $transaction->save();

            // 2. Create Transaction Item for Service
            if ($booking) {
                $serviceItem = new TransactionItem();
                $serviceItem->transaction_id = $transaction->id;
                $serviceItem->item_type = 'service';
                $serviceItem->reference_id = $booking->service_id;
                $serviceItem->qty = 1;
                $serviceItem->unit_price = $totalService;
                $serviceItem->subtotal = $totalService;
                $serviceItem->save();
            }

            // 3. Create Transaction Items for Products & Update Stocks
            foreach ($itemsToSell as $sell) {
                $txItem = new TransactionItem();
                $txItem->transaction_id = $transaction->id;
                $txItem->item_type = 'product';
                $txItem->reference_id = $sell['product']->id;
                $txItem->qty = $sell['qty'];
                $txItem->unit_price = $sell['unit_price'];
                $txItem->subtotal = $sell['subtotal'];
                $txItem->save();

                // Decrement stock
                $sell['product']->decrement('stock', $sell['qty']);
            }

            // 4. Calculate Barber Commission (service only) & Complete Booking status
            if ($booking) {
                $commissionPercentage = $booking->barber->commission_percentage;
                $commissionAmount = ($totalService * $commissionPercentage) / 100;

                $commission = new CommissionRecord();
                $commission->transaction_id = $transaction->id;
                $commission->barber_id = $booking->barber_id;
                $commission->service_amount = $totalService;
                $commission->percentage = $commissionPercentage;
                $commission->commission_amount = $commissionAmount;
                $commission->save();

                $booking->status = 'completed';
                $booking->save();
            }

            DB::commit();

            return redirect()->route('cashier.transactions.receipt', $transaction->uuid)
                ->with('success', 'Transaksi berhasil diselesaikan.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menyelesaikan transaksi: ' . $e->getMessage()]);
        }
    }

    /**
     * Show cashier receipt page.
     */
    public function receipt(string $uuid): Response
    {
        $transaction = Transaction::with([
            'booking.service',
            'booking.barber.user',
            'cashier',
            'booking.customer'
        ])
        ->where('uuid', $uuid)
        ->firstOrFail();

        $items = TransactionItem::where('transaction_id', $transaction->id)->get()->map(function ($item) {
            $name = '';
            if ($item->item_type === 'service') {
                $name = Service::find($item->reference_id)->name ?? 'Service';
            } else {
                $name = Product::find($item->reference_id)->name ?? 'Product';
            }
            return [
                'name' => $name,
                'type' => $item->item_type,
                'qty' => $item->qty,
                'unit_price' => (float) $item->unit_price,
                'subtotal' => (float) $item->subtotal,
            ];
        });

        $cashier = Auth::user();
        $branch = Branch::findOrFail($cashier->branch_id);

        return Inertia::render('Cashier/Receipt', [
            'transaction' => [
                'invoice_number' => $transaction->invoice_number,
                'payment_type' => strtoupper($transaction->payment_type),
                'total_service' => (float) $transaction->total_service,
                'total_product' => (float) $transaction->total_product,
                'grand_total' => (float) $transaction->grand_total,
                'created_at' => $transaction->created_at->format('d M Y, H:i'),
                'cashier_name' => $transaction->cashier->name,
                'customer_name' => $transaction->booking ? ($transaction->booking->customer ? $transaction->booking->customer->name : $transaction->booking->guest_name) : 'Walk-in',
                'barber_name' => $transaction->booking ? $transaction->booking->barber->user->name : '-',
            ],
            'items' => $items,
            'branch' => $branch,
        ]);
    }
}
