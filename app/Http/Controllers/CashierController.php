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
use App\Models\Product;
use App\Models\Branch;
use App\Models\BranchProductStock;
use App\Models\ProductStockMutation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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

    /**
     * Show cashier transaction history.
     */
    public function transactionsIndex(Request $request): Response
    {
        $cashier = Auth::user();
        $filters = $request->only(['date_start', 'date_end', 'search', 'payment_type']);
        $filters['branch_id'] = $cashier->branch_id;

        $transactions = $this->transactionService->getFilteredTransactions($filters)->map(function ($tx) {
            return [
                'id' => $tx->id,
                'uuid' => $tx->uuid,
                'invoice_number' => $tx->invoice_number,
                'payment_type' => strtoupper($tx->payment_type),
                'total_service' => (float) $tx->total_service,
                'total_product' => (float) $tx->total_product,
                'grand_total' => (float) $tx->grand_total,
                'created_at' => $tx->created_at->format('d M Y, H:i'),
                'cashier_name' => $tx->cashier->name ?? 'System',
                'customer_name' => $tx->booking ? ($tx->booking->customer ? $tx->booking->customer->name : $tx->booking->guest_name) : 'Walk-in',
                'barber_name' => $tx->booking ? ($tx->booking->barber->user->name ?? '-') : '-',
            ];
        });

        return Inertia::render('Cashier/Transactions', [
            'transactions' => $transactions,
            'filters' => $filters,
        ]);
    }

    /**
     * Show cashier products (inventory list) for their branch.
     */
    public function listProducts(): Response
    {
        $cashier = Auth::user();
        $branch = $this->branchRepo->findOrFail($cashier->branch_id);

        $products = Product::whereNull('deleted_at')
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->map(function ($p) use ($cashier) {
                $stocks = DB::table('branch_product_stocks')
                    ->join('branches', 'branches.id', '=', 'branch_product_stocks.branch_id')
                    ->where('product_id', $p->id)
                    ->select('branch_product_stocks.branch_id', 'branches.name as branch_name', 'branch_product_stocks.stock')
                    ->get();

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'category' => $p->category,
                    'price' => (float) $p->price,
                    'status' => $p->status,
                    'photo_path' => $p->photo_path,
                    'stocks' => $stocks,
                ];
            });

        return Inertia::render('Cashier/Products', [
            'products' => $products,
            'branch' => $branch,
        ]);
    }

    /**
     * Store new product and set initial stock for cashier branch.
     */
    public function storeProduct(Request $request)
    {
        $cashier = Auth::user();
        $branchId = $cashier->branch_id;

        $request->validate([
            'name' => 'required|string|max:100',
            'category' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $this->uploadAndCompressImage($request->file('photo'), 'photos');
        }

        DB::transaction(function () use ($request, $photoPath, $branchId) {
            $product = Product::whereRaw('LOWER(TRIM(name)) = ?', [strtolower(trim($request->name))])
                ->whereRaw('LOWER(TRIM(category)) = ?', [strtolower(trim($request->category))])
                ->first();

            if (!$product) {
                $product = Product::create([
                    'name' => $request->name,
                    'category' => $request->category,
                    'price' => $request->price,
                    'photo_path' => $photoPath,
                    'status' => 'active',
                ]);
            } else {
                $product->price = $request->price;
                if ($photoPath) {
                    $product->photo_path = $photoPath;
                }
                $product->status = 'active';
                $product->save();
            }

            BranchProductStock::updateOrCreate(
                [
                    'product_id' => $product->id,
                    'branch_id' => $branchId,
                ],
                [
                    'stock' => $request->stock,
                ]
            );

            ProductStockMutation::create([
                'product_id' => $product->id,
                'branch_id' => $branchId,
                'type' => 'in_restock',
                'reference_id' => null,
                'qty' => $request->stock,
                'stock_before' => 0,
                'stock_after' => $request->stock,
                'notes' => 'Registrasi produk & stok awal (Kasir)',
                'created_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Produk retail berhasil didaftarkan.');
    }

    /**
     * Update product details.
     */
    public function updateProduct(Request $request, Product $product)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'category' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png',
        ]);

        $photoPath = $product->photo_path;
        if ($request->hasFile('photo')) {
            if ($product->photo_path) {
                Storage::disk('public')->delete($product->photo_path);
            }
            $photoPath = $this->uploadAndCompressImage($request->file('photo'), 'photos');
        }

        $product->update([
            'name' => $request->name,
            'category' => $request->category,
            'price' => $request->price,
            'status' => $request->status,
            'photo_path' => $photoPath,
        ]);

        return back()->with('success', 'Detail produk retail berhasil diperbarui.');
    }

    /**
     * Delete (deactivate) product.
     */
    public function deleteProduct(Product $product)
    {
        $product->status = 'inactive';
        $product->save();
        $product->delete();

        return back()->with('success', 'Produk retail berhasil dinonaktifkan.');
    }

    /**
     * Single restock a product.
     */
    public function restockProduct(Request $request, Product $product)
    {
        $cashier = Auth::user();
        $branchId = $cashier->branch_id;

        $request->validate([
            'qty' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request, $product, $branchId) {
            $qty = $request->qty;
            
            $stockRecord = BranchProductStock::firstOrCreate(
                ['product_id' => $product->id, 'branch_id' => $branchId],
                ['stock' => 0]
            );

            $stockBefore = $stockRecord->stock;
            $stockRecord->increment('stock', $qty);
            $stockAfter = $stockRecord->fresh()->stock;

            ProductStockMutation::create([
                'product_id' => $product->id,
                'branch_id' => $branchId,
                'type' => 'in_restock',
                'reference_id' => null,
                'qty' => $qty,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'notes' => $request->notes ?? 'Pencatatan stok masuk (Restock Kasir)',
                'created_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Stok produk berhasil ditambah (Restock).');
    }

    /**
     * Single adjust a product (Stock Opname).
     */
    public function adjustProduct(Request $request, Product $product)
    {
        $cashier = Auth::user();
        $branchId = $cashier->branch_id;

        $request->validate([
            'actual_stock' => 'required|integer|min:0',
            'notes' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request, $product, $branchId) {
            $actual = $request->actual_stock;

            $stockRecord = BranchProductStock::firstOrCreate(
                ['product_id' => $product->id, 'branch_id' => $branchId],
                ['stock' => 0]
            );

            $stockBefore = $stockRecord->stock;
            $diff = $actual - $stockBefore;

            if ($diff === 0) {
                return;
            }

            $stockRecord->stock = $actual;
            $stockRecord->save();

            ProductStockMutation::create([
                'product_id' => $product->id,
                'branch_id' => $branchId,
                'type' => $diff > 0 ? 'in_opname_correction' : 'out_opname_correction',
                'reference_id' => null,
                'qty' => abs($diff),
                'stock_before' => $stockBefore,
                'stock_after' => $actual,
                'notes' => $request->notes ?? 'Penyesuaian stok opname (Kasir)',
                'created_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Stok produk berhasil disesuaikan (Stock Opname).');
    }

    /**
     * Get stock mutations history.
     */
    public function getProductMutations(Product $product)
    {
        $cashier = Auth::user();
        $branchId = $cashier->branch_id;

        $mutations = ProductStockMutation::with(['creator', 'branch'])
            ->where('product_id', $product->id)
            ->where('branch_id', $branchId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($m) {
                $typeLabel = match ($m->type) {
                    'in_restock' => 'Stok Masuk (Restock)',
                    'out_sale' => 'Penjualan (POS)',
                    'in_opname_correction' => 'Koreksi Opname (+)',
                    'out_opname_correction' => 'Koreksi Opname (-)',
                    'out_damaged' => 'Barang Rusak/Hilang',
                    default => 'Penyesuaian Lainnya',
                };

                return [
                    'id' => $m->id,
                    'type' => $m->type,
                    'type_label' => $typeLabel,
                    'qty' => $m->qty,
                    'stock_before' => $m->stock_before,
                    'stock_after' => $m->stock_after,
                    'notes' => $m->notes ?? '-',
                    'operator' => $m->creator->name ?? 'Sistem',
                    'branch_name' => $m->branch->name ?? '-',
                    'date' => $m->created_at->format('d M Y, H:i'),
                ];
            });

        return response()->json(['mutations' => $mutations]);
    }

    /**
     * Show bulk restock form.
     */
    public function showRestockForm(): Response
    {
        $cashier = Auth::user();
        $branch = $this->branchRepo->findOrFail($cashier->branch_id);

        $products = Product::whereNull('deleted_at')
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return Inertia::render('Cashier/ProductsRestock', [
            'branch' => $branch,
            'products' => $products,
        ]);
    }

    /**
     * Store bulk restock.
     */
    public function storeBulkRestock(Request $request)
    {
        $cashier = Auth::user();
        $branchId = $cashier->branch_id;

        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request, $branchId) {
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);

                $stockRecord = BranchProductStock::firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'branch_id' => $branchId,
                    ],
                    [
                        'stock' => 0,
                    ]
                );

                $qty = $item['qty'];
                $stockBefore = $stockRecord->stock;
                $stockRecord->increment('stock', $qty);
                $stockAfter = $stockRecord->fresh()->stock;

                ProductStockMutation::create([
                    'product_id' => $product->id,
                    'branch_id' => $branchId,
                    'type' => 'in_restock',
                    'reference_id' => null,
                    'qty' => $qty,
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'notes' => $request->notes ?? 'Pencatatan stok masuk (Bulk Restock Kasir)',
                    'created_by' => auth()->id(),
                ]);
            }
        });

        return redirect()->route('cashier.products.index')->with('success', 'Bulk restock produk berhasil disimpan.');
    }

    /**
     * Show bulk adjust form.
     */
    public function showAdjustForm(): Response
    {
        $cashier = Auth::user();
        $branch = $this->branchRepo->findOrFail($cashier->branch_id);

        $products = Product::whereNull('deleted_at')
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(function ($p) use ($cashier) {
                $stockRecord = BranchProductStock::where('product_id', $p->id)
                    ->where('branch_id', $cashier->branch_id)
                    ->first();
                // Set stock as a property on product
                $p->stock = $stockRecord ? $stockRecord->stock : 0;
                return $p;
            });

        return Inertia::render('Cashier/ProductsAdjust', [
            'branch' => $branch,
            'products' => $products,
        ]);
    }

    /**
     * Store bulk adjust.
     */
    public function storeBulkAdjust(Request $request)
    {
        $cashier = Auth::user();
        $branchId = $cashier->branch_id;

        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.actual_stock' => 'required|integer|min:0',
            'items.*.notes' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request, $branchId) {
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);

                $stockRecord = BranchProductStock::firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'branch_id' => $branchId,
                    ],
                    [
                        'stock' => 0,
                    ]
                );

                $actual = $item['actual_stock'];
                $stockBefore = $stockRecord->stock;
                $diff = $actual - $stockBefore;

                if ($diff === 0) {
                    continue;
                }

                $stockRecord->stock = $actual;
                $stockRecord->save();

                ProductStockMutation::create([
                    'product_id' => $product->id,
                    'branch_id' => $branchId,
                    'type' => $diff > 0 ? 'in_opname_correction' : 'out_opname_correction',
                    'reference_id' => null,
                    'qty' => abs($diff),
                    'stock_before' => $stockBefore,
                    'stock_after' => $actual,
                    'notes' => $item['notes'] ?? 'Penyesuaian bulk stok opname (Kasir)',
                    'created_by' => auth()->id(),
                ]);
            }
        });

        return redirect()->route('cashier.products.index')->with('success', 'Bulk penyesuaian stok opname berhasil disimpan.');
    }

    /**
     * Upload and compress image.
     */
    private function uploadAndCompressImage($file, $folder)
    {
        $path = $file->store($folder, 'public');
        $absolutePath = storage_path('app/public/' . $path);

        if (extension_loaded('gd')) {
            list($width, $height, $type) = getimagesize($absolutePath);
            
            $maxDim = 1000;
            if ($width > $maxDim || $height > $maxDim) {
                $ratio = $width / $height;
                if ($ratio > 1) {
                    $newWidth = $maxDim;
                    $newHeight = $maxDim / $ratio;
                } else {
                    $newHeight = $maxDim;
                    $newWidth = $maxDim * $ratio;
                }

                $src = null;
                switch ($type) {
                    case IMAGETYPE_JPEG:
                        $src = imagecreatefromjpeg($absolutePath);
                        break;
                    case IMAGETYPE_PNG:
                        $src = imagecreatefrompng($absolutePath);
                        break;
                    case IMAGETYPE_GIF:
                        $src = imagecreatefromgif($absolutePath);
                        break;
                    case IMAGETYPE_WEBP:
                        $src = imagecreatefromwebp($absolutePath);
                        break;
                }

                if ($src) {
                    $dst = imagecreatetruecolor($newWidth, $newHeight);
                    
                    if ($type == IMAGETYPE_PNG) {
                        imagealphablending($dst, false);
                        imagesavealpha($dst, true);
                    }

                    imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
                    
                    switch ($type) {
                        case IMAGETYPE_JPEG:
                            imagejpeg($dst, $absolutePath, 80);
                            break;
                        case IMAGETYPE_PNG:
                            imagepng($dst, $absolutePath, 7);
                            break;
                        case IMAGETYPE_GIF:
                            imagegif($dst, $absolutePath);
                            break;
                        case IMAGETYPE_WEBP:
                            imagewebp($dst, $absolutePath, 80);
                            break;
                    }
                    
                    imagedestroy($src);
                    imagedestroy($dst);
                }
            } else {
                if ($type == IMAGETYPE_JPEG) {
                    $src = imagecreatefromjpeg($absolutePath);
                    if ($src) {
                        imagejpeg($src, $absolutePath, 85);
                        imagedestroy($src);
                    }
                }
            }
        }
        
        return $path;
    }
}
