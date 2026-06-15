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
        return $this->model->newQuery()
            ->join('branch_product_stocks', 'products.id', '=', 'branch_product_stocks.product_id')
            ->where('branch_product_stocks.branch_id', $branchId)
            ->where('products.status', 'active')
            ->where('branch_product_stocks.stock', '>', 0)
            ->select('products.*', 'branch_product_stocks.stock')
            ->get();
    }
}
