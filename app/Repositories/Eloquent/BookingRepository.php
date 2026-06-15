<?php

namespace App\Repositories\Eloquent;

use App\Models\Booking;
use App\Repositories\Interfaces\BookingRepositoryInterface;

class BookingRepository extends BaseRepository implements BookingRepositoryInterface
{
    public function __construct(Booking $model)
    {
        parent::__construct($model);
    }

    public function getActiveOverlappingBookings(int $barberId, $slotStart, $slotEnd)
    {
        return $this->model->where('barber_id', $barberId)
            ->whereIn('status', ['confirmed', 'in_progress', 'completed'])
            ->where(function ($query) use ($slotStart, $slotEnd) {
                $query->where('slot_start', '<', $slotEnd)
                      ->where('slot_end', '>', $slotStart);
            })
            ->get();
    }

    public function findByUuid(string $uuid, array $relations = [])
    {
        return $this->model->with($relations)->where('uuid', $uuid)->firstOrFail();
    }

    public function getFilteredBookings(array $filters)
    {
        $query = $this->model->newQuery();

        if (isset($filters['branch_id'])) {
            $query->where('branch_id', $filters['branch_id']);
        }
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (isset($filters['barber_id'])) {
            $query->where('barber_id', $filters['barber_id']);
        }
        if (isset($filters['date'])) {
            $query->whereDate('slot_start', $filters['date']);
        }
        if (isset($filters['date_start']) && isset($filters['date_end'])) {
            $query->whereBetween('slot_start', [$filters['date_start'], $filters['date_end']]);
        }

        return $query->with(['branch', 'service', 'barber.user', 'customer'])
            ->orderBy('slot_start', 'asc')
            ->get();
    }
}
