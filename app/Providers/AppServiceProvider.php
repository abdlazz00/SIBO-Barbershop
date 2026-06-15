<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Repositories\Interfaces\BranchRepositoryInterface::class,
            \App\Repositories\Eloquent\BranchRepository::class
        );
        $this->app->bind(
            \App\Repositories\Interfaces\ServiceRepositoryInterface::class,
            \App\Repositories\Eloquent\ServiceRepository::class
        );
        $this->app->bind(
            \App\Repositories\Interfaces\BarberRepositoryInterface::class,
            \App\Repositories\Eloquent\BarberRepository::class
        );
        $this->app->bind(
            \App\Repositories\Interfaces\BookingRepositoryInterface::class,
            \App\Repositories\Eloquent\BookingRepository::class
        );
        $this->app->bind(
            \App\Repositories\Interfaces\ProductRepositoryInterface::class,
            \App\Repositories\Eloquent\ProductRepository::class
        );
        $this->app->bind(
            \App\Repositories\Interfaces\TransactionRepositoryInterface::class,
            \App\Repositories\Eloquent\TransactionRepository::class
        );
        $this->app->bind(
            \App\Repositories\Interfaces\CommissionRepositoryInterface::class,
            \App\Repositories\Eloquent\CommissionRepository::class
        );
        $this->app->bind(
            \App\Repositories\Interfaces\UserRepositoryInterface::class,
            \App\Repositories\Eloquent\UserRepository::class
        );
        $this->app->bind(
            \App\Repositories\Interfaces\ScheduleRepositoryInterface::class,
            \App\Repositories\Eloquent\ScheduleRepository::class
        );
        $this->app->bind(
            \App\Repositories\Interfaces\CommissionPayoutRepositoryInterface::class,
            \App\Repositories\Eloquent\CommissionPayoutRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
