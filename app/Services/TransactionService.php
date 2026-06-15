<?php

namespace App\Services;

use App\Repositories\Interfaces\TransactionRepositoryInterface;
use App\Repositories\Interfaces\BookingRepositoryInterface;
use App\Repositories\Interfaces\ProductRepositoryInterface;
use App\Repositories\Interfaces\CommissionRepositoryInterface;
use App\Models\TransactionItem;
use App\Models\Service;
use App\Models\Product;
use App\Models\ProductStockMutation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;

class TransactionService
{
    protected $transactionRepo;
    protected $bookingRepo;
    protected $productRepo;
    protected $commissionRepo;

    public function __construct(
        TransactionRepositoryInterface $transactionRepo,
        BookingRepositoryInterface $bookingRepo,
        ProductRepositoryInterface $productRepo,
        CommissionRepositoryInterface $commissionRepo
    ) {
        $this->transactionRepo = $transactionRepo;
        $this->bookingRepo = $bookingRepo;
        $this->productRepo = $productRepo;
        $this->commissionRepo = $commissionRepo;
    }

    public function getTodayStats(int $branchId, string $date)
    {
        $bookings = $this->bookingRepo->getFilteredBookings([
            'branch_id' => $branchId,
            'date' => $date
        ]);

        $totalRevenue = $this->transactionRepo->getFilteredTransactions([
            'branch_id' => $branchId,
            'date_start' => Carbon::parse($date)->startOfDay(),
            'date_end' => Carbon::parse($date)->endOfDay()
        ])->sum('grand_total');

        return [
            'total_bookings' => $bookings->count(),
            'confirmed' => $bookings->where('status', 'confirmed')->count(),
            'in_progress' => $bookings->where('status', 'in_progress')->count(),
            'completed' => $bookings->where('status', 'completed')->count(),
            'revenue' => (float) $totalRevenue,
        ];
    }

    public function processCheckout(array $data, int $cashierId, int $branchId)
    {
        $booking = null;
        $totalService = 0.00;

        if (!empty($data['booking_id'])) {
            $booking = $this->bookingRepo->findOrFail($data['booking_id']);

            if ($booking->branch_id !== $branchId) {
                throw new Exception('Aksi tidak diperbolehkan pada cabang lain.');
            }

            if ($booking->status !== 'in_progress') {
                throw new Exception('Booking harus berstatus In-Progress untuk checkout.');
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
        $itemsToSell = [];

        if (!empty($data['products']) && is_array($data['products'])) {
            foreach ($data['products'] as $pItem) {
                // Fetch product with lock
                $product = Product::lockForUpdate()->findOrFail($pItem['id']);

                if ((int) $product->branch_id !== (int) $branchId) {
                    throw new Exception("Produk {$product->name} tidak berada di cabang Anda.");
                }

                if ($product->stock < $pItem['qty']) {
                    throw new Exception("Stok produk {$product->name} tidak mencukupi (Tersisa: {$product->stock}).");
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

        if (!$booking && count($itemsToSell) === 0) {
            throw new Exception('Keranjang transaksi kosong.');
        }

        $grandTotal = $totalService + $totalProduct;

        return DB::transaction(function () use ($booking, $totalService, $totalProduct, $grandTotal, $itemsToSell, $data, $cashierId) {
            $datePrefix = Carbon::now()->format('Ymd');
            $todayTxCount = $this->transactionRepo->all()->filter(function ($tx) {
                return $tx->created_at->isToday();
            })->count();
            $invoiceNumber = 'TRX-' . $datePrefix . '-' . str_pad($todayTxCount + 1, 3, '0', STR_PAD_LEFT);

            // 1. Create Transaction
            $transaction = $this->transactionRepo->create([
                'invoice_number' => $invoiceNumber,
                'booking_id' => $booking ? $booking->id : null,
                'cashier_id' => $cashierId,
                'payment_type' => $data['payment_type'],
                'total_service' => $totalService,
                'total_product' => $totalProduct,
                'grand_total' => $grandTotal,
            ]);

            // 2. Create Transaction Item for Service
            if ($booking) {
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'item_type' => 'service',
                    'reference_id' => $booking->service_id,
                    'qty' => 1,
                    'unit_price' => $totalService,
                    'subtotal' => $totalService,
                ]);
            }

            // 3. Create Transaction Items for Products & Update Stocks
            foreach ($itemsToSell as $sell) {
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'item_type' => 'product',
                    'reference_id' => $sell['product']->id,
                    'qty' => $sell['qty'],
                    'unit_price' => $sell['unit_price'],
                    'subtotal' => $sell['subtotal'],
                ]);

                // Decrement stock and record mutation
                $stockBefore = $sell['product']->stock;
                $sell['product']->decrement('stock', $sell['qty']);
                $stockAfter = $sell['product']->fresh()->stock;

                ProductStockMutation::create([
                    'product_id' => $sell['product']->id,
                    'type' => 'out_sale',
                    'reference_id' => $transaction->id,
                    'qty' => $sell['qty'],
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'notes' => 'Penjualan via POS Invoice: ' . $transaction->invoice_number,
                    'created_by' => Auth::id() ?? $cashierId,
                ]);
            }

            // 4. Calculate Barber Commission & Complete Booking status
            if ($booking) {
                $commissionPercentage = $booking->barber->commission_percentage;
                $commissionAmount = ($totalService * $commissionPercentage) / 100;

                $this->commissionRepo->create([
                    'transaction_id' => $transaction->id,
                    'barber_id' => $booking->barber_id,
                    'service_amount' => $totalService,
                    'percentage' => $commissionPercentage,
                    'commission_amount' => $commissionAmount,
                ]);

                // We can use repository update method
                $this->bookingRepo->update($booking->id, [
                    'status' => 'completed',
                ]);
            }

            return $transaction;
        });
    }

    public function getReceiptDetails(string $uuid)
    {
        $transaction = $this->transactionRepo->findByUuid($uuid, [
            'booking.service',
            'booking.barber.user',
            'cashier.user',
            'booking.customer'
        ]);

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

        return [
            'transaction' => $transaction,
            'items' => $items,
        ];
    }
}
