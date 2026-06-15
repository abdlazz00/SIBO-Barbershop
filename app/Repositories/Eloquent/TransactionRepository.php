<?php

namespace App\Repositories\Eloquent;

use App\Models\Transaction;
use App\Repositories\Interfaces\TransactionRepositoryInterface;
use Carbon\Carbon;

class TransactionRepository extends BaseRepository implements TransactionRepositoryInterface
{
    public function __construct(Transaction $model)
    {
        parent::__construct($model);
    }

    public function findByUuid(string $uuid, array $relations = [])
    {
        return $this->model->with($relations)->where('uuid', $uuid)->firstOrFail();
    }

    public function getFilteredTransactions(array $filters)
    {
        $query = $this->model->newQuery();

        if (isset($filters['branch_id']) && !empty($filters['branch_id'])) {
            $branchId = $filters['branch_id'];
            $query->where(function ($q) use ($branchId) {
                $q->whereHas('booking', function ($qb) use ($branchId) {
                    $qb->where('branch_id', $branchId);
                })->orWhereHas('cashier', function ($qc) use ($branchId) {
                    $qc->where('branch_id', $branchId);
                });
            });
        }

        if (isset($filters['date_start']) && isset($filters['date_end']) && !empty($filters['date_start']) && !empty($filters['date_end'])) {
            $start = Carbon::parse($filters['date_start'])->startOfDay();
            $end = Carbon::parse($filters['date_end'])->endOfDay();
            $query->whereBetween('created_at', [$start, $end]);
        }

        if (isset($filters['payment_type']) && !empty($filters['payment_type'])) {
            $query->where('payment_type', $filters['payment_type']);
        }

        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('booking', function ($qb) use ($search) {
                      $qb->where('guest_name', 'like', "%{$search}%")
                         ->orWhereHas('customer', function ($qc) use ($search) {
                             $qc->where('name', 'like', "%{$search}%");
                         })
                         ->orWhereHas('barber.user', function ($qu) use ($search) {
                             $qu->where('name', 'like', "%{$search}%");
                         });
                  });
            });
        }

        return $query->with(['booking.service', 'booking.barber.user', 'booking.branch', 'cashier.branch'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
