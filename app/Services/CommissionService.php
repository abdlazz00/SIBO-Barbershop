<?php

namespace App\Services;

use App\Repositories\Interfaces\CommissionRepositoryInterface;
use App\Repositories\Interfaces\CommissionPayoutRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;

class CommissionService
{
    protected $commissionRepo;
    protected $payoutRepo;

    public function __construct(
        CommissionRepositoryInterface $commissionRepo,
        CommissionPayoutRepositoryInterface $payoutRepo
    ) {
        $this->commissionRepo = $commissionRepo;
        $this->payoutRepo = $payoutRepo;
    }

    /**
     * Mendapatkan daftar ringkasan komisi belum dibayar per barber
     */
    public function getUnpaidGrouped()
    {
        return $this->commissionRepo->getUnpaidCommissionsGroupedByBarber();
    }

    /**
     * Mendapatkan detail komisi belum dibayar untuk barber tertentu
     */
    public function getUnpaidForBarber(int $barberId)
    {
        return $this->commissionRepo->getUnpaidCommissionsForBarber($barberId);
    }

    /**
     * Mendapatkan riwayat payout komisi untuk barber tertentu
     */
    public function getPayoutsForBarber(int $barberId)
    {
        return $this->payoutRepo->getPayoutsForBarber($barberId);
    }

    /**
     * Memproses pembayaran payout komisi
     */
    public function processPayout(int $barberId, array $recordIds, array $payoutData)
    {
        if (empty($recordIds)) {
            throw new Exception('Pilih minimal satu transaksi komisi untuk dibayar.');
        }

        return DB::transaction(function () use ($barberId, $recordIds, $payoutData) {
            // Ambil komisi yang belum dibayar dari DB
            $unpaidRecords = $this->commissionRepo->getUnpaidCommissionsForBarber($barberId);
            
            // Filter hanya record yang dipilih
            $recordsToPay = $unpaidRecords->whereIn('id', $recordIds);

            if ($recordsToPay->isEmpty() || $recordsToPay->count() !== count($recordIds)) {
                throw new Exception('Beberapa transaksi komisi tidak valid atau sudah dibayar.');
            }

            // Hitung total komisi
            $totalAmount = $recordsToPay->sum('commission_amount');

            // Simpan data payout
            $payout = $this->payoutRepo->create([
                'barber_id' => $barberId,
                'paid_by' => Auth::id(),
                'payout_amount' => $totalAmount,
                'payment_method' => $payoutData['payment_method'],
                'reference_number' => $payoutData['reference_number'] ?? null,
                'notes' => $payoutData['notes'] ?? null,
                'paid_at' => now(),
            ]);

            // Hubungkan komisi-komisi dengan payout_id
            foreach ($recordsToPay as $record) {
                $this->commissionRepo->update($record->id, [
                    'payout_id' => $payout->id
                ]);
            }

            return $payout;
        });
    }
}
