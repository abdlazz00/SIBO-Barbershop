<?php

namespace App\Repositories\Interfaces;

interface ServiceRepositoryInterface extends BaseRepositoryInterface
{
    public function getActiveServices();
    public function getServicesWithBarberPrice(int $barberId);
}
