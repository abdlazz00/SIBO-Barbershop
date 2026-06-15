<?php

namespace App\Repositories\Eloquent;

use App\Models\Transaction;
use App\Repositories\Interfaces\TransactionRepositoryInterface;

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

        if (isset($filters['branch_id'])) {
            $query->whereHas('booking', function ($q) use ($filters) {
                $q->where('branch_id', $filters['branch_id']);
            });
        }
        if (isset($filters['date_start']) && isset($filters['date_end'])) {
            $query->whereBetween('created_at', [$filters['date_start'], $filters['date_end']]);
        }

        return $query->with(['booking.service', 'booking.barber.user', 'cashier.user'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
