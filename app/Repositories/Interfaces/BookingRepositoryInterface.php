<?php

namespace App\Repositories\Interfaces;

interface BookingRepositoryInterface extends BaseRepositoryInterface
{
    public function getActiveOverlappingBookings(int $barberId, $slotStart, $slotEnd);
    public function findByUuid(string $uuid, array $relations = []);
    public function getFilteredBookings(array $filters);
}
