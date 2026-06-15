<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\User;
use App\Models\Barber;
use App\Models\Service;
use App\Models\Product;
use App\Models\Booking;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\CommissionRecord;
use App\Models\WeeklySchedule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Branches (Cabang)
        $branchKemang = Branch::create([
            'name' => 'Howell Barbershop - Cabang Kemang',
            'address' => 'Jl. Kemang Raya No. 45, Jakarta Selatan',
            'phone' => '021-7198822',
        ]);

        $branchSenopati = Branch::create([
            'name' => 'Howell Barbershop - Cabang Senopati',
            'address' => 'Jl. Senopati No. 82, Jakarta Selatan',
            'phone' => '021-5296633',
        ]);

        // 2. Seed Users & Profiles
        // 2a. Owner Account
        User::create([
            'name' => 'Joko - Owner Howell',
            'email' => 'owner@howell.com',
            'password' => Hash::make('password'),
            'phone' => '081122334455',
            'role' => 'owner',
            'photo_path' => null,
        ]);

        // 2b. Cashier Accounts
        $cashierKemangUser = User::create([
            'name' => 'Andi - Kasir Kemang',
            'email' => 'cashier.kemang@howell.com',
            'password' => Hash::make('password'),
            'phone' => '081234567890',
            'role' => 'cashier',
            'photo_path' => null,
            'branch_id' => $branchKemang->id,
        ]);

        $cashierSenopatiUser = User::create([
            'name' => 'Siti - Kasir Senopati',
            'email' => 'cashier.senopati@howell.com',
            'password' => Hash::make('password'),
            'phone' => '081234567891',
            'role' => 'cashier',
            'photo_path' => null,
            'branch_id' => $branchSenopati->id,
        ]);

        // 2c. Barber Users
        $barberKemangUser1 = User::create([
            'name' => 'Budi (Senior Barber)',
            'email' => 'budi.barber@howell.com',
            'password' => Hash::make('password'),
            'phone' => '082111222333',
            'role' => 'barber',
            'photo_path' => null,
        ]);

        $barberKemangUser2 = User::create([
            'name' => 'Cecep (Junior Barber)',
            'email' => 'cecep.barber@howell.com',
            'password' => Hash::make('password'),
            'phone' => '082111222334',
            'role' => 'barber',
            'photo_path' => null,
        ]);

        $barberSenopatiUser = User::create([
            'name' => 'Dedi (Senior Barber)',
            'email' => 'dedi.barber@howell.com',
            'password' => Hash::make('password'),
            'phone' => '082111222335',
            'role' => 'barber',
            'photo_path' => null,
        ]);

        // 2d. Customer Users (Members)
        $customer1 = User::create([
            'name' => 'Rian Wijaya',
            'email' => 'rian@gmail.com',
            'password' => Hash::make('password'),
            'phone' => '085712345678',
            'role' => 'customer',
        ]);

        $customer2 = User::create([
            'name' => 'Denny Siregar',
            'email' => 'denny@gmail.com',
            'password' => Hash::make('password'),
            'phone' => '085712345679',
            'role' => 'customer',
        ]);

        // 3. Seed Barber Profiles
        $barber1 = Barber::create([
            'user_id' => $barberKemangUser1->id,
            'branch_id' => $branchKemang->id,
            'commission_percentage' => 45.00, // Senior get 45%
            'status' => 'active',
        ]);

        $barber2 = Barber::create([
            'user_id' => $barberKemangUser2->id,
            'branch_id' => $branchKemang->id,
            'commission_percentage' => 35.00, // Junior get 35%
            'status' => 'active',
        ]);

        $barber3 = Barber::create([
            'user_id' => $barberSenopatiUser->id,
            'branch_id' => $branchSenopati->id,
            'commission_percentage' => 45.00,
            'status' => 'active',
        ]);

        // 4. Seed Services
        $service1 = Service::create([
            'name' => 'Premium Haircut & Styling',
            'category' => 'Haircut',
            'description' => 'Gunting rambut premium plus cuci, pijat kepala, handuk hangat, dan styling pomade.',
            'duration_minutes' => 45,
            'default_price' => 80000.00,
            'status' => 'active',
        ]);

        $service2 = Service::create([
            'name' => 'Regular Haircut',
            'category' => 'Haircut',
            'description' => 'Potong rambut standar plus styling.',
            'duration_minutes' => 30,
            'default_price' => 50000.00,
            'status' => 'active',
        ]);

        $service3 = Service::create([
            'name' => 'Gentleman Hair Coloring',
            'category' => 'Coloring',
            'description' => 'Pewarnaan rambut penuh menggunakan produk premium impor.',
            'duration_minutes' => 90,
            'default_price' => 150000.00,
            'status' => 'active',
        ]);

        $service4 = Service::create([
            'name' => 'Creambath & Head Massage',
            'category' => 'Treatment',
            'description' => 'Perawatan akar rambut dengan pijat relaksasi pundak dan kepala.',
            'duration_minutes' => 60,
            'default_price' => 70000.00,
            'status' => 'active',
        ]);

        // 5. Seed Price Overrides for Senior Barbers (Barber Budi & Dedi)
        // Budi Senior (Kemang) override Premium Haircut to 100K
        $barber1->services()->attach($service1->id, ['price' => 100000.00]);
        // Dedi Senior (Senopati) override Premium Haircut to 95K
        $barber3->services()->attach($service1->id, ['price' => 95000.00]);

        // 6. Seed Products (Retail) & Branch Stocks
        $p1 = Product::create([
            'name' => 'Premium Strong Hold Pomade',
            'category' => 'Pomade',
            'price' => 120000.00,
            'status' => 'active',
        ]);
        
        $p2 = Product::create([
            'name' => 'Anti-Hairfall Hair Tonic',
            'category' => 'Vitamin',
            'price' => 85000.00,
            'status' => 'active',
        ]);

        $p3 = Product::create([
            'name' => 'Cooling Shampoo Menthol',
            'category' => 'Shampoo',
            'price' => 65000.00,
            'status' => 'active',
        ]);

        // Branch Kemang stocks
        \App\Models\BranchProductStock::create([
            'product_id' => $p1->id,
            'branch_id' => $branchKemang->id,
            'stock' => 15,
        ]);
        \App\Models\BranchProductStock::create([
            'product_id' => $p2->id,
            'branch_id' => $branchKemang->id,
            'stock' => 20,
        ]);

        // Branch Senopati stocks
        \App\Models\BranchProductStock::create([
            'product_id' => $p1->id,
            'branch_id' => $branchSenopati->id,
            'stock' => 10,
        ]);
        \App\Models\BranchProductStock::create([
            'product_id' => $p3->id,
            'branch_id' => $branchSenopati->id,
            'stock' => 12,
        ]);

        // 7. Seed Weekly Schedules (Shift Kerja default)
        // Shift Budi: 09:00 - 17:00, Libur hari Minggu (0)
        for ($i = 0; $i <= 6; $i++) {
            WeeklySchedule::create([
                'barber_id' => $barber1->id,
                'day_of_week' => $i,
                'start_time' => $i === 0 ? null : '09:00:00',
                'end_time' => $i === 0 ? null : '17:00:00',
                'is_off' => $i === 0,
            ]);
        }

        // Shift Cecep: 12:00 - 20:00, Libur hari Senin (1)
        for ($i = 0; $i <= 6; $i++) {
            WeeklySchedule::create([
                'barber_id' => $barber2->id,
                'day_of_week' => $i,
                'start_time' => $i === 1 ? null : '12:00:00',
                'end_time' => $i === 1 ? null : '20:00:00',
                'is_off' => $i === 1,
            ]);
        }

        // Shift Dedi: 09:00 - 17:00, Libur hari Minggu (0)
        for ($i = 0; $i <= 6; $i++) {
            WeeklySchedule::create([
                'barber_id' => $barber3->id,
                'day_of_week' => $i,
                'start_time' => $i === 0 ? null : '09:00:00',
                'end_time' => $i === 0 ? null : '17:00:00',
                'is_off' => $i === 0,
            ]);
        }

        // 8. Seed Sample Completed Bookings & Transactions (Histori)
        // Kemang Branch - Booking 1 (Customer Rian Wijaya, Barber Budi, Premium Haircut)
        $booking1 = Booking::create([
            'branch_id' => $branchKemang->id,
            'customer_id' => $customer1->id,
            'barber_id' => $barber1->id,
            'service_id' => $service1->id,
            'slot_start' => Carbon::now()->subDays(2)->setHour(10)->setMinute(0)->setSecond(0),
            'slot_end' => Carbon::now()->subDays(2)->setHour(10)->setMinute(45)->setSecond(0),
            'status' => 'completed',
        ]);

        $tx1 = Transaction::create([
            'invoice_number' => 'TRX-' . Carbon::now()->subDays(2)->format('Ymd') . '-001',
            'booking_id' => $booking1->id,
            'cashier_id' => $cashierKemangUser->id,
            'payment_type' => 'qris',
            'total_service' => 100000.00, // Harga override Budi
            'total_product' => 120000.00, // Ditambah beli 1 pomade
            'grand_total' => 220000.00,
            'created_at' => Carbon::now()->subDays(2)->setHour(11)->setMinute(0),
        ]);

        // Item Transaksi
        TransactionItem::create([
            'transaction_id' => $tx1->id,
            'item_type' => 'service',
            'reference_id' => $service1->id,
            'qty' => 1,
            'unit_price' => 100000.00,
            'subtotal' => 100000.00,
        ]);

        TransactionItem::create([
            'transaction_id' => $tx1->id,
            'item_type' => 'product',
            'reference_id' => $product1Kemang->id,
            'qty' => 1,
            'unit_price' => 120000.00,
            'subtotal' => 120000.00,
        ]);

        // Catat Komisi Budi (45% dari 100.000 = 45.000)
        CommissionRecord::create([
            'transaction_id' => $tx1->id,
            'barber_id' => $barber1->id,
            'service_amount' => 100000.00,
            'percentage' => 45.00,
            'commission_amount' => 45000.00,
            'created_at' => Carbon::now()->subDays(2)->setHour(11)->setMinute(0),
        ]);

        // Kurangi stok Pomade Kemang
        $product1Kemang->decrement('stock', 1);

        // Kemang Branch - Booking 2 (Guest Customer, Barber Cecep Junior, Regular Haircut)
        $booking2 = Booking::create([
            'branch_id' => $branchKemang->id,
            'customer_id' => null,
            'guest_name' => 'Boni',
            'guest_phone' => '087799887766',
            'barber_id' => $barber2->id,
            'service_id' => $service2->id,
            'slot_start' => Carbon::now()->subDays(1)->setHour(14)->setMinute(0)->setSecond(0),
            'slot_end' => Carbon::now()->subDays(1)->setHour(14)->setMinute(30)->setSecond(0),
            'status' => 'completed',
        ]);

        $tx2 = Transaction::create([
            'invoice_number' => 'TRX-' . Carbon::now()->subDays(1)->format('Ymd') . '-001',
            'booking_id' => $booking2->id,
            'cashier_id' => $cashierKemangUser->id,
            'payment_type' => 'cash',
            'total_service' => 50000.00,
            'total_product' => 0.00,
            'grand_total' => 50000.00,
            'created_at' => Carbon::now()->subDays(1)->setHour(14)->setMinute(35),
        ]);

        TransactionItem::create([
            'transaction_id' => $tx2->id,
            'item_type' => 'service',
            'reference_id' => $service2->id,
            'qty' => 1,
            'unit_price' => 50000.00,
            'subtotal' => 50000.00,
        ]);

        // Catat Komisi Cecep (35% dari 50.000 = 17.500)
        CommissionRecord::create([
            'transaction_id' => $tx2->id,
            'barber_id' => $barber2->id,
            'service_amount' => 50000.00,
            'percentage' => 35.00,
            'commission_amount' => 17500.00,
            'created_at' => Carbon::now()->subDays(1)->setHour(14)->setMinute(35),
        ]);

        // 9. Seed Sample Active Bookings (Hari ini/Mendatang)
        // Booking 3: Hari ini jam 10:00 (Confirmed)
        Booking::create([
            'branch_id' => $branchKemang->id,
            'customer_id' => $customer2->id,
            'barber_id' => $barber1->id,
            'service_id' => $service1->id,
            'slot_start' => Carbon::today()->setHour(10)->setMinute(0)->setSecond(0),
            'slot_end' => Carbon::today()->setHour(10)->setMinute(45)->setSecond(0),
            'status' => 'confirmed',
        ]);

        // Booking 4: Hari ini jam 13:00 (In-Progress)
        Booking::create([
            'branch_id' => $branchKemang->id,
            'customer_id' => null,
            'guest_name' => 'Fandi',
            'guest_phone' => '089911223344',
            'barber_id' => $barber2->id,
            'service_id' => $service4->id,
            'slot_start' => Carbon::today()->setHour(13)->setMinute(0)->setSecond(0),
            'slot_end' => Carbon::today()->setHour(14)->setMinute(0)->setSecond(0),
            'status' => 'in_progress',
        ]);
    }
}
