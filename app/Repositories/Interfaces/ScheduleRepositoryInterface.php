<?php

namespace App\Repositories\Interfaces;

interface ScheduleRepositoryInterface extends BaseRepositoryInterface
{
    public function getWeeklyScheduleForBarber(int $barberId, int $dayOfWeek);
    public function getLeaveScheduleForBarberOnDate(int $barberId, string $date);
}
