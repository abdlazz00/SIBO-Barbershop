<?php

namespace App\Repositories\Eloquent;

use App\Models\Service;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use Illuminate\Support\Facades\DB;

class ServiceRepository extends BaseRepository implements ServiceRepositoryInterface
{
    public function __construct(Service $model)
    {
        parent::__construct($model);
    }

    public function getActiveServices()
    {
        return $this->model->where('status', 'active')->whereNull('deleted_at')->get();
    }

    public function getServicesWithBarberPrice(int $barberId)
    {
        return $this->getActiveServices()->map(function ($service) use ($barberId) {
            $override = DB::table('barber_services')
                ->where('barber_id', $barberId)
                ->where('service_id', $service->id)
                ->first();

            $price = $override ? $override->price : $service->default_price;

            return [
                'id' => $service->id,
                'uuid' => $service->uuid,
                'name' => $service->name,
                'category' => $service->category,
                'description' => $service->description,
                'duration_minutes' => $service->duration_minutes,
                'photo_path' => $service->photo_path,
                'price' => (float) $price,
            ];
        });
    }
}
