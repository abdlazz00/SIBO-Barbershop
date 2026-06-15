<?php

namespace App\Repositories\Interfaces;

interface BarberRepositoryInterface extends BaseRepositoryInterface
{
    public function getActiveBarbersByBranch(int $branchId);
}
