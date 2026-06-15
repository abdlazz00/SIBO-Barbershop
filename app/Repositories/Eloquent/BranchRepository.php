<?php

namespace App\Repositories\Eloquent;

use App\Models\Branch;
use App\Repositories\Interfaces\BranchRepositoryInterface;

class BranchRepository extends BaseRepository implements BranchRepositoryInterface
{
    public function __construct(Branch $model)
    {
        parent::__construct($model);
    }

    public function getActiveBranches()
    {
        return $this->model->whereNull('deleted_at')->get();
    }
}
