<?php

namespace App\Repositories\Eloquent;

use App\Models\CommissionPayout;
use App\Repositories\Interfaces\CommissionPayoutRepositoryInterface;

class CommissionPayoutRepository extends BaseRepository implements CommissionPayoutRepositoryInterface
{
    public function __construct(CommissionPayout $model)
    {
        parent::__construct($model);
    }

    public function getPayoutsForBarber(int $barberId)
    {
        return $this->model->newQuery()
            ->where('barber_id', $barberId)
            ->with(['paidBy'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
