<?php

namespace App\Repositories\Interfaces;

interface CommissionRepositoryInterface extends BaseRepositoryInterface
{
    public function getFilteredCommissions(array $filters);
    public function getUnpaidCommissionsForBarber(int $barberId);
    public function getUnpaidCommissionsGroupedByBarber();
}
