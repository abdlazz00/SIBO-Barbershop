<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Branch;
use App\Models\Barber;
use App\Models\Service;
use App\Models\Product;
use App\Models\WeeklySchedule;
use App\Models\LeaveSchedule;
use App\Models\CommissionRecord;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Booking;
use App\Models\ProductStockMutation;
use Illuminate\Http\Request;
use App\Services\CommissionService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class OwnerController extends Controller
{
    /**
     * Show Owner dashboard analytics.
     */
    public function dashboard(Request $request): Response
    {
        $branches = Branch::whereNull('deleted_at')->get();
        $branchId = $request->input('branch_id');

        // 1. Base Queries for metrics
        $revenueQuery = Transaction::query();
        $bookingsQuery = Booking::query();
        $productsQuery = TransactionItem::where('item_type', 'product');
        $commissionsQuery = CommissionRecord::query();

        if ($branchId) {
            $revenueQuery->whereHas('booking', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
            $bookingsQuery->where('branch_id', $branchId);
            $productsQuery->whereHas('transaction.booking', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
            $commissionsQuery->whereHas('barber', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        // Calculations
        $totalRevenue = (float) $revenueQuery->sum('grand_total');
        $totalServiceRevenue = (float) $revenueQuery->sum('total_service');
        $totalProductRevenue = (float) $revenueQuery->sum('total_product');
        $totalBookingsCompleted = $bookingsQuery->where('status', 'completed')->count();
        $totalProductsSold = (int) $productsQuery->sum('qty');
        $totalCommissionsPaid = (float) (clone $commissionsQuery)->whereNotNull('payout_id')->sum('commission_amount');
        $totalCommissionsUnpaid = (float) (clone $commissionsQuery)->whereNull('payout_id')->sum('commission_amount');

        // 2. Recent Bookings (latest 5)
        $bookingsListQuery = Booking::with(['branch', 'service', 'barber.user', 'customer']);
        if ($branchId) {
            $bookingsListQuery->where('branch_id', $branchId);
        }
        $recentBookings = $bookingsListQuery
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'customer_name' => $booking->customer ? $booking->customer->name : $booking->guest_name,
                    'branch_name' => $booking->branch->name,
                    'service_name' => $booking->service->name,
                    'barber_name' => $booking->barber->user->name,
                    'slot_start' => $booking->slot_start->format('d M Y, H:i'),
                    'status' => $booking->status,
                ];
            });

        // 3. Barber Performance
        $barberQuery = Barber::with(['user', 'branch'])
            ->where('status', 'active')
            ->whereNull('deleted_at');
        if ($branchId) {
            $barberQuery->where('branch_id', $branchId);
        }
        $barbersPerformance = $barberQuery->get()
            ->map(function ($barber) {
                $bookingsCount = Booking::where('barber_id', $barber->id)->where('status', 'completed')->count();
                
                $revenue = (float) Transaction::whereHas('booking', function ($q) use ($barber) {
                    $q->where('barber_id', $barber->id);
                })->sum('total_service');

                $commissions = (float) CommissionRecord::where('barber_id', $barber->id)->sum('commission_amount');

                return [
                    'id' => $barber->id,
                    'name' => $barber->user->name,
                    'branch_name' => $barber->branch->name ?? '-',
                    'bookings_count' => $bookingsCount,
                    'revenue' => $revenue,
                    'commissions' => $commissions,
                ];
            });

        // 4. 30-Day Revenue Chart Data
        $chartData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dayRevenueQuery = Transaction::whereDate('created_at', $date);
            if ($branchId) {
                $dayRevenueQuery->whereHas('booking', function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                });
            }
            $revenue = $dayRevenueQuery->sum('grand_total');
            $chartData[] = [
                'date' => $date->format('d M'),
                'revenue' => (float) $revenue,
            ];
        }

        // 5. Top Services Booked (limit 3)
        $topServicesQuery = TransactionItem::where('item_type', 'service');
        if ($branchId) {
            $topServicesQuery->whereHas('transaction.booking', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $topServices = $topServicesQuery
            ->select('reference_id', DB::raw('SUM(qty) as total_qty'))
            ->groupBy('reference_id')
            ->orderBy('total_qty', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($item) {
                $service = Service::find($item->reference_id);
                return [
                    'name' => $service ? $service->name : 'Layanan',
                    'category' => $service ? $service->category : '-',
                    'total_qty' => (int) $item->total_qty,
                ];
            });

        return Inertia::render('Owner/Dashboard', [
            'branches' => $branches,
            'branchesCount' => $branches->count(),
            'barbersCount' => Barber::where('status', 'active')->count(),
            'servicesCount' => Service::where('status', 'active')->count(),
            'metrics' => [
                'revenue' => $totalRevenue,
                'service_revenue' => $totalServiceRevenue,
                'product_revenue' => $totalProductRevenue,
                'bookings_completed' => $totalBookingsCompleted,
                'products_sold' => $totalProductsSold,
                'commissions' => $totalCommissionsPaid,
                'commissions_unpaid' => $totalCommissionsUnpaid,
            ],
            'recentBookings' => $recentBookings,
            'barbersPerformance' => $barbersPerformance,
            'chartData' => $chartData,
            'topServices' => $topServices,
            'filters' => [
                'branch_id' => $branchId,
            ],
        ]);
    }

    /**
     * Staff Management (List, Store, Update, Delete)
     */
    public function listStaff(): Response
    {
        $staff = User::with(['branch', 'barber.branch'])
            ->whereIn('role', ['cashier', 'barber'])
            ->whereNull('deleted_at')
            ->orderBy('role')
            ->get();

        $branches = Branch::whereNull('deleted_at')->get();

        return Inertia::render('Owner/Staff', [
            'staff' => $staff,
            'branches' => $branches,
        ]);
    }

    public function storeStaff(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|string|email|max:150|unique:users,email',
            'phone' => 'required|string|max:20|unique:users,phone',
            'password' => 'required|string|min:8',
            'role' => 'required|in:cashier,barber',
            'branch_id' => 'required|exists:branches,id',
            'commission_percentage' => 'required_if:role,barber|nullable|numeric|min:0|max:100',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $this->uploadAndCompressImage($request->file('photo'), 'photos');
        }

        DB::transaction(function () use ($request, $photoPath) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'branch_id' => $request->branch_id,
                'photo_path' => $photoPath,
            ]);

            if ($request->role === 'barber') {
                $barber = Barber::create([
                    'user_id' => $user->id,
                    'branch_id' => $request->branch_id,
                    'commission_percentage' => $request->commission_percentage ?? 40.00,
                    'status' => 'active',
                ]);

                // Create default weekly schedules (Monday-Saturday: 09:00 - 17:00, Sunday: off)
                for ($i = 0; $i <= 6; $i++) {
                    WeeklySchedule::create([
                        'barber_id' => $barber->id,
                        'day_of_week' => $i,
                        'start_time' => $i === 0 ? null : '09:00:00',
                        'end_time' => $i === 0 ? null : '17:00:00',
                        'is_off' => $i === 0,
                    ]);
                }
            }
        });

        return back()->with('success', 'Staff baru berhasil ditambahkan.');
    }

    public function updateStaff(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'email' => ['required', 'string', 'email', 'max:150', Rule::unique('users')->ignore($user->id)],
            'phone' => ['required', 'string', 'max:20', Rule::unique('users')->ignore($user->id)],
            'branch_id' => 'required|exists:branches,id',
            'password' => 'nullable|string|min:8',
            'commission_percentage' => 'required_if:role,barber|nullable|numeric|min:0|max:100',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png',
        ]);

        $photoPath = $user->photo_path;
        if ($request->hasFile('photo')) {
            if ($user->photo_path) {
                Storage::disk('public')->delete($user->photo_path);
            }
            $photoPath = $this->uploadAndCompressImage($request->file('photo'), 'photos');
        }

        DB::transaction(function () use ($request, $user, $photoPath) {
            $user->name = $request->name;
            $user->email = $request->email;
            $user->phone = $request->phone;
            $user->branch_id = $request->branch_id;
            $user->photo_path = $photoPath;

            if ($request->password) {
                $user->password = Hash::make($request->password);
            }
            $user->save();

            if ($user->role === 'barber' && $user->barber) {
                $user->barber->branch_id = $request->branch_id;
                $user->barber->commission_percentage = $request->commission_percentage;
                $user->barber->save();
            }
        });

        return back()->with('success', 'Data staff berhasil diperbarui.');
    }

    public function deleteStaff(User $user)
    {
        DB::transaction(function () use ($user) {
            if ($user->role === 'barber' && $user->barber) {
                $user->barber->status = 'inactive';
                $user->barber->save();
                $user->barber->delete(); // Soft delete Barber profile
            }
            $user->delete(); // Soft delete User login
        });

        return back()->with('success', 'Akun staff berhasil dinonaktifkan.');
    }

    /**
     * Service Management
     */
    public function listServices(): Response
    {
        $services = Service::whereNull('deleted_at')->get();
        
        $barbers = Barber::with('user')
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    'name' => $b->user->name,
                ];
            });

        // Load price overrides for all barbers
        $overrides = DB::table('barber_services')->get();

        return Inertia::render('Owner/Services', [
            'services' => $services,
            'barbers' => $barbers,
            'overrides' => $overrides,
        ]);
    }

    public function storeService(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'category' => 'required|string|max:50',
            'description' => 'nullable|string',
            'duration_minutes' => 'required|integer|min:5',
            'default_price' => 'required|numeric|min:0',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $this->uploadAndCompressImage($request->file('photo'), 'photos');
        }

        Service::create([
            'name' => $request->name,
            'category' => $request->category,
            'description' => $request->description,
            'duration_minutes' => $request->duration_minutes,
            'default_price' => $request->default_price,
            'photo_path' => $photoPath,
            'status' => 'active',
        ]);

        return back()->with('success', 'Layanan baru berhasil dibuat.');
    }

    public function updateService(Request $request, Service $service)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'category' => 'required|string|max:50',
            'description' => 'nullable|string',
            'duration_minutes' => 'required|integer|min:5',
            'default_price' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png',
        ]);

        $photoPath = $service->photo_path;
        if ($request->hasFile('photo')) {
            if ($service->photo_path) {
                Storage::disk('public')->delete($service->photo_path);
            }
            $photoPath = $this->uploadAndCompressImage($request->file('photo'), 'photos');
        }

        $service->update([
            'name' => $request->name,
            'category' => $request->category,
            'description' => $request->description,
            'duration_minutes' => $request->duration_minutes,
            'default_price' => $request->default_price,
            'status' => $request->status,
            'photo_path' => $photoPath,
        ]);

        return back()->with('success', 'Layanan berhasil diperbarui.');
    }

    public function deleteService(Service $service)
    {
        $service->status = 'inactive';
        $service->save();
        $service->delete();

        return back()->with('success', 'Layanan berhasil dihapus.');
    }

    public function storeOverridePrice(Request $request)
    {
        $request->validate([
            'barber_id' => 'required|exists:barbers,id',
            'service_id' => 'required|exists:services,id',
            'price' => 'required|numeric|min:0',
        ]);

        DB::table('barber_services')->updateOrInsert(
            ['barber_id' => $request->barber_id, 'service_id' => $request->service_id],
            ['price' => $request->price, 'updated_at' => Carbon::now()]
        );

        return back()->with('success', 'Harga khusus barber berhasil disimpan.');
    }

    public function deleteOverridePrice(Request $request)
    {
        $request->validate([
            'barber_id' => 'required|exists:barbers,id',
            'service_id' => 'required|exists:services,id',
        ]);

        DB::table('barber_services')
            ->where('barber_id', $request->barber_id)
            ->where('service_id', $request->service_id)
            ->delete();

        return back()->with('success', 'Harga khusus barber dihapus, kembali menggunakan harga default.');
    }

    /**
     * Product Management
     */
    public function listProducts(): Response
    {
        $products = Product::whereNull('deleted_at')
            ->with(['branchStocks.branch'])
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'category' => $p->category,
                    'price' => (float) $p->price,
                    'photo_path' => $p->photo_path,
                    'status' => $p->status,
                    'stocks' => $p->branchStocks->map(function ($bs) {
                        return [
                            'branch_id' => $bs->branch_id,
                            'branch_name' => $bs->branch->name ?? '-',
                            'stock' => $bs->stock,
                        ];
                    })->values()->toArray(),
                ];
            });

        $branches = Branch::whereNull('deleted_at')->get();

        return Inertia::render('Owner/Products', [
            'products' => $products,
            'branches' => $branches,
        ]);
    }

    public function storeProduct(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
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

        DB::transaction(function () use ($request, $photoPath) {
            // Find existing global product by name and category
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

            // Create or update stock for the selected branch
            \App\Models\BranchProductStock::updateOrCreate(
                [
                    'product_id' => $product->id,
                    'branch_id' => $request->branch_id,
                ],
                [
                    'stock' => $request->stock,
                ]
            );

            // Record initial stock mutation
            ProductStockMutation::create([
                'product_id' => $product->id,
                'branch_id' => $request->branch_id,
                'type' => 'in_restock',
                'reference_id' => null,
                'qty' => $request->stock,
                'stock_before' => 0,
                'stock_after' => $request->stock,
                'notes' => 'Registrasi produk & stok awal',
                'created_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Produk retail berhasil didaftarkan.');
    }

    public function updateProduct(Request $request, Product $product)
    {
        $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'name' => 'required|string|max:100',
            'category' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
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

        DB::transaction(function () use ($request, $product, $photoPath) {
            $product->update([
                'name' => $request->name,
                'category' => $request->category,
                'price' => $request->price,
                'status' => $request->status,
                'photo_path' => $photoPath,
            ]);

            // Update stock for this specific branch only if provided
            if ($request->filled('branch_id') && $request->has('stock')) {
                $stockRecord = \App\Models\BranchProductStock::where('product_id', $product->id)
                    ->where('branch_id', $request->branch_id)
                    ->first();

                $stockBefore = $stockRecord ? $stockRecord->stock : 0;
                $stockAfter = $request->stock;

                \App\Models\BranchProductStock::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'branch_id' => $request->branch_id,
                    ],
                    [
                        'stock' => $stockAfter,
                    ]
                );

                // If stock changed, record mutation
                $diff = $stockAfter - $stockBefore;
                if ($diff !== 0) {
                    ProductStockMutation::create([
                        'product_id' => $product->id,
                        'branch_id' => $request->branch_id,
                        'type' => $diff > 0 ? 'in_opname_correction' : 'out_opname_correction',
                        'reference_id' => null,
                        'qty' => abs($diff),
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockAfter,
                        'notes' => 'Koreksi stok via form edit produk',
                        'created_by' => auth()->id(),
                    ]);
                }
            }
        });

        return back()->with('success', 'Produk retail berhasil diperbarui.');
    }

    public function deleteProduct(Product $product)
    {
        if ($product->photo_path) {
            Storage::disk('public')->delete($product->photo_path);
        }
        $product->status = 'inactive';
        $product->save();
        $product->delete();

        return back()->with('success', 'Produk retail berhasil dihapus.');
    }

    /**
     * Restock a product (stok masuk)
     */
    public function restockProduct(Request $request, Product $product)
    {
        $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'qty' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:255',
        ]);

        $branchId = $request->input('branch_id') ?? Branch::first()->id;

        DB::transaction(function () use ($request, $product, $branchId) {
            $qty = $request->qty;
            
            $stockRecord = \App\Models\BranchProductStock::firstOrCreate(
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
                'notes' => $request->notes ?? 'Pencatatan stok masuk (Restock)',
                'created_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Stok produk berhasil ditambah (Restock).');
    }

    /**
     * Adjust stock / Stock Opname
     */
    public function adjustProduct(Request $request, Product $product)
    {
        $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'actual_stock' => 'required|integer|min:0',
            'notes' => 'nullable|string|max:255',
        ]);

        $branchId = $request->input('branch_id') ?? Branch::first()->id;

        DB::transaction(function () use ($request, $product, $branchId) {
            $actual = $request->actual_stock;

            $stockRecord = \App\Models\BranchProductStock::firstOrCreate(
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
                'notes' => $request->notes ?? 'Penyesuaian stok opname',
                'created_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Stok produk berhasil disesuaikan (Stock Opname).');
    }

    /**
     * Get stock mutations history
     */
    public function getProductMutations(Request $request, Product $product)
    {
        $branchId = $request->query('branch_id');

        $query = ProductStockMutation::with(['creator', 'branch'])
            ->where('product_id', $product->id);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $mutations = $query->orderBy('created_at', 'desc')
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
     * Get products by branch
     */
    public function getProductsByBranch(Branch $branch)
    {
        $products = Product::whereNull('deleted_at')
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(function ($p) use ($branch) {
                $stockRecord = \App\Models\BranchProductStock::where('product_id', $p->id)
                    ->where('branch_id', $branch->id)
                    ->first();
                
                $p->stock = $stockRecord ? $stockRecord->stock : 0;
                return $p;
            });

        return response()->json(['products' => $products]);
    }

    /**
     * Show bulk restock form
     */
    public function showRestockForm(): Response
    {
        $branches = Branch::whereNull('deleted_at')->get();
        return Inertia::render('Owner/ProductsRestock', [
            'branches' => $branches,
        ]);
    }

    /**
     * Store bulk restock
     */
    public function storeBulkRestock(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);

                $stockRecord = \App\Models\BranchProductStock::firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'branch_id' => $request->branch_id,
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
                    'branch_id' => $request->branch_id,
                    'type' => 'in_restock',
                    'reference_id' => null,
                    'qty' => $qty,
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'notes' => $request->notes ?? 'Pencatatan stok masuk (Bulk Restock)',
                    'created_by' => auth()->id(),
                ]);
            }
        });

        return redirect()->route('owner.products.index')->with('success', 'Bulk restock produk berhasil disimpan.');
    }

    /**
     * Show bulk adjust form
     */
    public function showAdjustForm(): Response
    {
        $branches = Branch::whereNull('deleted_at')->get();
        return Inertia::render('Owner/ProductsAdjust', [
            'branches' => $branches,
        ]);
    }

    /**
     * Store bulk adjust
     */
    public function storeBulkAdjust(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.actual_stock' => 'required|integer|min:0',
            'items.*.notes' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);

                $stockRecord = \App\Models\BranchProductStock::firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'branch_id' => $request->branch_id,
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
                    'branch_id' => $request->branch_id,
                    'type' => $diff > 0 ? 'in_opname_correction' : 'out_opname_correction',
                    'reference_id' => null,
                    'qty' => abs($diff),
                    'stock_before' => $stockBefore,
                    'stock_after' => $actual,
                    'notes' => $item['notes'] ?? 'Penyesuaian bulk stok opname',
                    'created_by' => auth()->id(),
                ]);
            }
        });

        return redirect()->route('owner.products.index')->with('success', 'Koreksi stok opname berhasil disimpan.');
    }

    /**
     * Schedule & Leaves Setup
     */
    public function listSchedules(): Response
    {
        $barbers = Barber::with(['user', 'branch', 'weeklySchedules', 'leaveSchedules'])
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->get();

        return Inertia::render('Owner/Schedules', [
            'barbers' => $barbers,
        ]);
    }

    public function updateWeeklySchedule(Request $request)
    {
        $request->validate([
            'barber_id' => 'required|exists:barbers,id',
            'schedules' => 'required|array|size:7',
            'schedules.*.day_of_week' => 'required|integer|between:0,6',
            'schedules.*.is_off' => 'required|boolean',
            'schedules.*.start_time' => 'required_unless:schedules.*.is_off,true|nullable|date_format:H:i',
            'schedules.*.end_time' => 'required_unless:schedules.*.is_off,true|nullable|date_format:H:i',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->schedules as $sched) {
                WeeklySchedule::updateOrCreate(
                    [
                        'barber_id' => $request->barber_id, 
                        'day_of_week' => $sched['day_of_week']
                    ],
                    [
                        'is_off' => $sched['is_off'],
                        'start_time' => $sched['is_off'] ? null : Carbon::parse($sched['start_time'])->format('H:i:s'),
                        'end_time' => $sched['is_off'] ? null : Carbon::parse($sched['end_time'])->format('H:i:s'),
                    ]
                );
            }
        });

        return back()->with('success', 'Jadwal shift kerja mingguan barber berhasil diperbarui.');
    }

    public function storeLeaveSchedule(Request $request)
    {
        $request->validate([
            'barber_id' => 'required|exists:barbers,id',
            'leave_date' => 'required|date|after_or_equal:today',
            'notes' => 'nullable|string|max:255',
        ]);

        // check uniqueness
        $exists = LeaveSchedule::where('barber_id', $request->barber_id)
            ->whereDate('leave_date', $request->leave_date)
            ->exists();

        if ($exists) {
            return back()->withErrors(['leave_date' => 'Tanggal cuti tersebut sudah dicatat sebelumnya untuk barber ini.']);
        }

        LeaveSchedule::create([
            'barber_id' => $request->barber_id,
            'leave_date' => $request->leave_date,
            'notes' => $request->notes,
        ]);

        return back()->with('success', 'Hari cuti/libur barber berhasil ditambahkan.');
    }

    public function deleteLeaveSchedule(LeaveSchedule $leaveSchedule)
    {
        $leaveSchedule->delete();
        return back()->with('success', 'Hari cuti/libur barber berhasil dibatalkan.');
    }

    /**
     * Commission Report
     */
    /**
     * Commission Report
     */
    public function reportCommissions(Request $request, CommissionService $commissionService): Response
    {
        $branches = Branch::whereNull('deleted_at')->get();
        $barbers = Barber::with('user')->where('status', 'active')->whereNull('deleted_at')->get();

        // Filter parameters
        $branchId = $request->input('branch_id');
        $barberId = $request->input('barber_id');
        $startDate = $request->input('start_date', Carbon::today()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::today()->endOfMonth()->format('Y-m-d'));

        // Query Commissions
        $query = CommissionRecord::with(['barber.user', 'transaction.booking.service'])
            ->whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ]);

        if ($branchId) {
            $query->whereHas('barber', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        if ($barberId) {
            $query->where('barber_id', $barberId);
        }

        $records = $query->orderBy('created_at', 'desc')->get()->map(function ($rec) {
            return [
                'id' => $rec->id,
                'barber_name' => $rec->barber->user->name,
                'branch_name' => $rec->barber->branch->name ?? '-',
                'invoice_number' => $rec->transaction->invoice_number,
                'service_name' => $rec->transaction->booking->service->name ?? 'Layanan',
                'service_amount' => (float) $rec->service_amount,
                'percentage' => (float) $rec->percentage,
                'commission_amount' => (float) $rec->commission_amount,
                'date' => $rec->created_at->format('d M Y, H:i'),
                'is_paid' => !is_null($rec->payout_id),
            ];
        });

        // Totals calculation
        $totalServiceAmount = $records->sum('service_amount');
        $totalCommissionAmount = $records->sum('commission_amount');

        // Fetch unpaid commissions grouped by barber
        $unpaidGrouped = $commissionService->getUnpaidGrouped()->map(function ($item) {
            return [
                'barber_id' => $item->barber_id,
                'barber_name' => $item->barber->user->name,
                'branch_name' => $item->barber->branch->name ?? '-',
                'total_unpaid_commission' => (float) $item->total_unpaid_commission,
                'total_unpaid_records' => (int) $item->total_unpaid_records,
            ];
        });

        return Inertia::render('Owner/Commissions', [
            'branches' => $branches,
            'barbers' => $barbers,
            'records' => $records,
            'unpaidGrouped' => $unpaidGrouped,
            'totals' => [
                'service_amount' => (float) $totalServiceAmount,
                'commission_amount' => (float) $totalCommissionAmount,
            ],
            'filters' => [
                'branch_id' => $branchId,
                'barber_id' => $barberId,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ]);
    }

    /**
     * Get unpaid commissions for a specific barber
     */
    public function getUnpaidCommissions(Barber $barber, CommissionService $commissionService)
    {
        $records = $commissionService->getUnpaidForBarber($barber->id)->map(function ($rec) {
            return [
                'id' => $rec->id,
                'invoice_number' => $rec->transaction->invoice_number,
                'service_name' => $rec->transaction->booking->service->name ?? 'Layanan',
                'service_amount' => (float) $rec->service_amount,
                'commission_amount' => (float) $rec->commission_amount,
                'date' => $rec->created_at->format('d M Y, H:i'),
            ];
        });
        return response()->json(['records' => $records]);
    }

    /**
     * Get payout history for a specific barber
     */
    public function getPayouts(Barber $barber, CommissionService $commissionService)
    {
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
     * Store payout transaction
     */
    public function storePayout(Request $request, Barber $barber, CommissionService $commissionService)
    {
        $request->validate([
            'record_ids' => 'required|array',
            'record_ids.*' => 'integer',
            'payment_method' => 'required|string|in:cash,bank_transfer',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $payout = $commissionService->processPayout($barber->id, $request->record_ids, $request->only([
                'payment_method', 'reference_number', 'notes'
            ]));
            return redirect()->back()
                ->with('success', 'Pembayaran komisi berhasil diproses!')
                ->with('latest_payout_id', $payout->id);
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Helper to store and compress uploaded images using native PHP GD library.
     * Keeps images crisp and within 2MB target.
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

    /**
     * Show owner transaction history across all branches.
     */
    public function transactionsIndex(Request $request, \App\Services\TransactionService $transactionService): Response
    {
        $filters = $request->only(['branch_id', 'date_start', 'date_end', 'search', 'payment_type']);
        $branches = Branch::whereNull('deleted_at')->get();

        $transactions = $transactionService->getFilteredTransactions($filters)->map(function ($tx) {
            $branchName = '-';
            if ($tx->booking) {
                $branchName = $tx->booking->branch->name ?? '-';
            } elseif ($tx->cashier) {
                $branchName = $tx->cashier->branch->name ?? '-';
            }
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
                'branch_name' => $branchName,
                'customer_name' => $tx->booking ? ($tx->booking->customer ? $tx->booking->customer->name : $tx->booking->guest_name) : 'Walk-in',
                'barber_name' => $tx->booking ? ($tx->booking->barber->user->name ?? '-') : '-',
            ];
        });

        return Inertia::render('Owner/Transactions', [
            'transactions' => $transactions,
            'branches' => $branches,
            'filters' => $filters,
        ]);
    }

    /**
     * Show owner transaction receipt page.
     */
    public function receipt(string $uuid, \App\Services\TransactionService $transactionService): Response
    {
        $details = $transactionService->getReceiptDetails($uuid);
        $tx = $details['transaction'];
        $branch = $tx->booking ? $tx->booking->branch : ($tx->cashier ? $tx->cashier->branch : null);

        return Inertia::render('Cashier/Receipt', [
            'transaction' => [
                'invoice_number' => $tx->invoice_number,
                'payment_type' => strtoupper($tx->payment_type),
                'total_service' => (float) $tx->total_service,
                'total_product' => (float) $tx->total_product,
                'grand_total' => (float) $tx->grand_total,
                'created_at' => $tx->created_at->format('d M Y, H:i'),
                'cashier_name' => $tx->cashier->name ?? 'System',
                'customer_name' => $tx->booking ? ($tx->booking->customer ? $tx->booking->customer->name : $tx->booking->guest_name) : 'Walk-in',
                'barber_name' => $tx->booking ? ($tx->booking->barber->user->name ?? '-') : '-',
            ],
            'items' => $details['items'],
            'branch' => $branch,
        ]);
    }
}
