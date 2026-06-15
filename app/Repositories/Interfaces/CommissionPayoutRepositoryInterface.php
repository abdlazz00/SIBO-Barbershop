<?php

namespace App\Repositories\Interfaces;

interface CommissionPayoutRepositoryInterface extends BaseRepositoryInterface
{
    public function getPayoutsForBarber(int $barberId);
}
