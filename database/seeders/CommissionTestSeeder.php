<?php

namespace Database\Seeders;

use App\Models\Barber;
use App\Models\Booking;
use App\Models\CommissionRecord;
use App\Models\Service;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CommissionTestSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Get a cashier for transaction recording
        $cashier = User::where('role', 'cashier')->first();
        if (!$cashier) {
            $this->command->error('Kasir tidak ditemukan. Silakan jalankan seeder utama (DatabaseSeeder) terlebih dahulu.');
            return;
        }

        // 2. Get active barbers
        $barbers = Barber::with('user')->get();
        if ($barbers->isEmpty()) {
            $this->command->error('Barber tidak ditemukan. Silakan jalankan seeder utama terlebih dahulu.');
            return;
        }

        // 3. Get active services
        $services = Service::where('status', 'active')->get();
        if ($services->isEmpty()) {
            $this->command->error('Layanan (Service) tidak ditemukan.');
            return;
        }

        $this->command->info('Memulai seeding data komisi testing...');

        // Seed 3 unpaid commissions for each barber
        foreach ($barbers as $barber) {
            $this->command->info("Menambahkan komisi unpaid untuk Barber: {$barber->user->name}");

            for ($i = 1; $i <= 3; $i++) {
                $service = $services->random();
                $price = $service->default_price;

                // Adjust price if override exists
                $override = \DB::table('barber_services')
                    ->where('barber_id', $barber->id)
                    ->where('service_id', $service->id)
                    ->first();
                if ($override) {
                    $price = $override->price;
                }

                // Random dates over the last 7 days
                $date = Carbon::now()->subDays(rand(1, 7))->setHour(rand(9, 16))->setMinute(rand(0, 5) * 10);
                
                // Create Booking
                $booking = Booking::create([
                    'branch_id' => $barber->branch_id,
                    'customer_id' => null,
                    'guest_name' => 'Pelanggan Uji Komisi ' . $barber->id . '-' . $i,
                    'guest_phone' => '08' . rand(10000000, 99999999),
                    'barber_id' => $barber->id,
                    'service_id' => $service->id,
                    'slot_start' => $date,
                    'slot_end' => $date->copy()->addMinutes($service->duration_minutes),
                    'status' => 'completed',
                ]);

                // Create Transaction
                $invoiceCount = Transaction::whereDate('created_at', $date)->count();
                $invoiceNumber = 'TRX-' . $date->format('Ymd') . '-' . str_pad($invoiceCount + 1, 3, '0', STR_PAD_LEFT);
                
                $transaction = Transaction::create([
                    'invoice_number' => $invoiceNumber,
                    'booking_id' => $booking->id,
                    'cashier_id' => $cashier->id,
                    'payment_type' => ['cash', 'transfer', 'qris'][rand(0, 2)],
                    'total_service' => $price,
                    'total_product' => 0.00,
                    'grand_total' => $price,
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);

                // Create Transaction Item
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'item_type' => 'service',
                    'reference_id' => $service->id,
                    'qty' => 1,
                    'unit_price' => $price,
                    'subtotal' => $price,
                ]);

                // Calculate Commission
                $commissionPercentage = $barber->commission_percentage;
                $commissionAmount = ($price * $commissionPercentage) / 100;

                // Create Commission Record manually to set created_at and bypass timestamps
                $cr = new CommissionRecord([
                    'transaction_id' => $transaction->id,
                    'barber_id' => $barber->id,
                    'service_amount' => $price,
                    'percentage' => $commissionPercentage,
                    'commission_amount' => $commissionAmount,
                    'payout_id' => null, // Unpaid
                ]);
                $cr->created_at = $date;
                $cr->save();
            }
        }

        $this->command->info('Seeding data komisi testing selesai!');
    }
}
