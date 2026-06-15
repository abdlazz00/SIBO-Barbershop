<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Interfaces\UserRepositoryInterface;

class UserRepository extends BaseRepository implements UserRepositoryInterface
{
    public function __construct(User $model)
    {
        parent::__construct($model);
    }

    public function getStaffByBranch(int $branchId)
    {
        return $this->model->where('branch_id', $branchId)
            ->whereIn('role', ['cashier', 'barber'])
            ->get();
    }
}
