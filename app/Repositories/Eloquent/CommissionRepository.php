<?php

namespace App\Repositories\Eloquent;

use App\Models\CommissionRecord;
use App\Repositories\Interfaces\CommissionRepositoryInterface;

class CommissionRepository extends BaseRepository implements CommissionRepositoryInterface
{
    public function __construct(CommissionRecord $model)
    {
        parent::__construct($model);
    }

    public function getFilteredCommissions(array $filters)
    {
        $query = $this->model->newQuery();

        if (isset($filters['barber_id'])) {
            $query->where('barber_id', $filters['barber_id']);
        }
        if (isset($filters['branch_id'])) {
            $query->whereHas('barber', function ($q) use ($filters) {
                $q->where('branch_id', $filters['branch_id']);
            });
        }
        if (isset($filters['date_start']) && isset($filters['date_end'])) {
            $query->whereBetween('created_at', [$filters['date_start'], $filters['date_end']]);
        }

        return $query->with(['barber.user', 'transaction.booking.service'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getUnpaidCommissionsForBarber(int $barberId)
    {
        return $this->model->newQuery()
            ->where('barber_id', $barberId)
            ->whereNull('payout_id')
            ->with(['transaction.booking.service'])
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function getUnpaidCommissionsGroupedByBarber()
    {
        return $this->model->newQuery()
            ->whereNull('payout_id')
            ->select('barber_id')
            ->selectRaw('SUM(commission_amount) as total_unpaid_commission')
            ->selectRaw('COUNT(*) as total_unpaid_records')
            ->groupBy('barber_id')
            ->with(['barber.user', 'barber.branch'])
            ->get();
    }
}
