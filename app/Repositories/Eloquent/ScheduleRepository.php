<?php

namespace App\Repositories\Eloquent;

use App\Models\WeeklySchedule;
use App\Models\LeaveSchedule;
use App\Repositories\Interfaces\ScheduleRepositoryInterface;

class ScheduleRepository extends BaseRepository implements ScheduleRepositoryInterface
{
    public function __construct(WeeklySchedule $model)
    {
        parent::__construct($model);
    }

    public function getWeeklyScheduleForBarber(int $barberId, int $dayOfWeek)
    {
        return $this->model->where('barber_id', $barberId)
            ->where('day_of_week', $dayOfWeek)
            ->first();
    }

    public function getLeaveScheduleForBarberOnDate(int $barberId, string $date)
    {
        return LeaveSchedule::where('barber_id', $barberId)
            ->whereDate('leave_date', $date)
            ->first();
    }
}
