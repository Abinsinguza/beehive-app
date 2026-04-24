<?php

use App\Http\Controllers\BeehiveController;
use App\Http\Controllers\BeekeeperController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdvisoryController;
use App\Http\Controllers\AlertsController;
use App\Http\Controllers\InferenceController;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('analytics', 'inferences')->name('analytics');
    Route::inertia('monitoring', 'monitoring')->name('monitoring');
    Route::get('alerts', fn() => inertia('alerts'))->name('alerts.index');
    Route::post('alerts', [AlertsController::class, 'store'])->name('alerts.store');
    Route::patch('alerts/{alert}/notify', [AlertsController::class, 'notify'])->name('alerts.notify');
   // Route::inertia('beekeepers', 'beekeepers')->name('beekeepers');
    //Route::inertia('beehives', 'beehives')->name('beehives');
    Route::resource('beekeepers', BeekeeperController::class);
    Route::resource('beehives', BeehiveController::class);
    Route::resource('advisories', AdvisoryController::class);
    Route::resource('inferences', InferenceController::class)->only(['index', 'store']);
    Route::inertia('system-config', 'system-config')->name('system-config');
    Route::inertia('notifications', 'notifications')->name('notifications');
    Route::inertia('help', 'help')->name('help');
});

require __DIR__.'/settings.php';
