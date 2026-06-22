<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'branches' => $request->user() 
                    ? ($request->user()->role === 'owner' 
                        ? \App\Models\Branch::pluck('id')->toArray() 
                        : ($request->user()->branch_id ? [$request->user()->branch_id] : []))
                    : [],
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'latest_payout_id' => $request->session()->get('latest_payout_id'),
            ],
        ];
    }
}
