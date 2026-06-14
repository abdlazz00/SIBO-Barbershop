<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        // Check if user role matches one of the allowed roles
        if (in_array($user->role, $roles)) {
            return $next($request);
        }

        // If not matching, redirect to their proper default dashboard
        return match ($user->role) {
            'owner' => redirect('/owner/dashboard'),
            'cashier' => redirect('/cashier/dashboard'),
            'barber' => redirect('/barber/dashboard'),
            default => redirect('/'),
        };
    }
}
