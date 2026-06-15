<?php

namespace App\Repositories\Eloquent;

use App\Models\Barber;
use App\Repositories\Interfaces\BarberRepositoryInterface;

class BarberRepository extends BaseRepository implements BarberRepositoryInterface
{
    public function __construct(Barber $model)
    {
        parent::__construct($model);
    }

    public function getActiveBarbersByBranch(int $branchId)
    {
        return $this->model->with('user')
            ->where('branch_id', $branchId)
            ->where('status', 'active')
            ->whereNull('deleted_at')
            ->get();
    }
}
