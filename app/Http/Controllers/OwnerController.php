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
use Illuminate\Http\Request;
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
    public function dashboard(): Response
    {
        $branches = Branch::whereNull('deleted_at')->get();

        // 1. Total Metrics
        $totalRevenue = (float) Transaction::sum('grand_total');
        $totalBookingsCompleted = Booking::where('status', 'completed')->count();
        $totalProductsSold = (int) TransactionItem::where('item_type', 'product')->sum('qty');
        $totalCommissions = (float) CommissionRecord::sum('commission_amount');

        // 2. Recent Bookings (latest 5)
        $recentBookings = Booking::with(['branch', 'service', 'barber.user', 'customer'])
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
        $barbersPerformance = Barber::with(['user', 'branch'])
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->get()
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
            $revenue = Transaction::whereDate('created_at', $date)->sum('grand_total');
            $chartData[] = [
                'date' => $date->format('d M'),
                'revenue' => (float) $revenue,
            ];
        }

        return Inertia::render('Owner/Dashboard', [
            'branchesCount' => $branches->count(),
            'barbersCount' => Barber::where('status', 'active')->count(),
            'servicesCount' => Service::where('status', 'active')->count(),
            'metrics' => [
                'revenue' => $totalRevenue,
                'bookings_completed' => $totalBookingsCompleted,
                'products_sold' => $totalProductsSold,
                'commissions' => $totalCommissions,
            ],
            'recentBookings' => $recentBookings,
            'barbersPerformance' => $barbersPerformance,
            'chartData' => $chartData,
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
        $products = Product::with('branch')->whereNull('deleted_at')->get();
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

        Product::create([
            'branch_id' => $request->branch_id,
            'name' => $request->name,
            'category' => $request->category,
            'price' => $request->price,
            'stock' => $request->stock,
            'photo_path' => $photoPath,
            'status' => 'active',
        ]);

        return back()->with('success', 'Produk retail berhasil didaftarkan.');
    }

    public function updateProduct(Request $request, Product $product)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'name' => 'required|string|max:100',
            'category' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
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
            'branch_id' => $request->branch_id,
            'name' => $request->name,
            'category' => $request->category,
            'price' => $request->price,
            'stock' => $request->stock,
            'status' => $request->status,
            'photo_path' => $photoPath,
        ]);

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
    public function reportCommissions(Request $request): Response
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
            ];
        });

        // Totals calculation
        $totalServiceAmount = $records->sum('service_amount');
        $totalCommissionAmount = $records->sum('commission_amount');

        return Inertia::render('Owner/Commissions', [
            'branches' => $branches,
            'barbers' => $barbers,
            'records' => $records,
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
}
