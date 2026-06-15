<?php

namespace App\Repositories\Eloquent;

use App\Models\Product;
use App\Repositories\Interfaces\ProductRepositoryInterface;

class ProductRepository extends BaseRepository implements ProductRepositoryInterface
{
    public function __construct(Product $model)
    {
        parent::__construct($model);
    }

    public function getActiveProductsByBranch(int $branchId)
    {
        return $this->model->where('branch_id', $branchId)
            ->where('status', 'active')
            ->where('stock', '>', 0)
            ->get();
    }
}
