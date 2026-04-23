<?php

use App\Http\Controllers\BeehiveController;
use App\Http\Controllers\BeekeeperController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\AdvisoryController;
use App\Http\Controllers\AlertsController;
use App\Http\Controllers\InferenceController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
   // Route::inertia('beekeepers', 'beekeepers')->name('beekeepers');
    //Route::inertia('beehives', 'beehives')->name('beehives');
    Route::resource('beekeepers', BeekeeperController::class);
    Route::resource('beehives', BeehiveController::class);
    Route::resource('advisories', AdvisoryController::class);
    Route::resource('inferences', InferenceController::class)->only(['index', 'store']);
    Route::resource('alerts', AlertsController::class)->only(['index', 'store']);
    Route::patch('alerts/{alert}/notify', [AlertsController::class, 'notify'])->name('alerts.notify');
    Route::inertia('system-config', 'system-config')->name('system-config');
});

require __DIR__.'/settings.php';
