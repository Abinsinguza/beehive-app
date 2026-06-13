<?php

use App\Http\Controllers\BeehiveController;
use App\Http\Controllers\BeekeeperController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdvisoryController;
use App\Http\Controllers\AlertsController;
use App\Http\Controllers\InferenceController;
use App\Http\Controllers\AudioSourceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SystemConfigController;
use App\Http\Controllers\SystemLogsController;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('analytics', [InferenceController::class, 'index'])->name('analytics');
    Route::post('analytics', [InferenceController::class, 'store'])->name('analytics.store');
    Route::get('system-logs', [SystemLogsController::class, 'index'])->name('system-logs');
    Route::inertia('monitoring', 'monitoring')->name('monitoring');
    Route::get('alerts', [AlertsController::class, 'index'])->name('alerts.index');
    Route::post('alerts', [AlertsController::class, 'store'])->name('alerts.store');
    Route::patch('alerts/{alert}/notify', [AlertsController::class, 'notify'])->name('alerts.notify');
   // Route::inertia('beekeepers', 'beekeepers')->name('beekeepers');
    //Route::inertia('beehives', 'beehives')->name('beehives');
    Route::resource('beekeepers', BeekeeperController::class);
    Route::patch('beekeepers/{beekeeper}/revoke',   [BeekeeperController::class, 'revoke'])->name('beekeepers.revoke');
    Route::patch('beekeepers/{beekeeper}/restore',  [BeekeeperController::class, 'restore'])->name('beekeepers.restore');
    Route::resource('beehives', BeehiveController::class);
    Route::resource('advisories', AdvisoryController::class);
    Route::resource('inferences', InferenceController::class)->only(['index', 'store']);
    Route::get('system-config',  [SystemConfigController::class, 'index'])->name('system-config');
    Route::post('system-config', [SystemConfigController::class, 'update'])->name('system-config.update');
    Route::get('audio-recordings', [AudioSourceController::class, 'index'])->name('audio-recordings.index');
    Route::post('audio-recordings', [AudioSourceController::class, 'store'])->name('audio-recordings.store');
    Route::inertia('database-schema', 'database-schema')->name('database-schema');
    Route::inertia('notifications', 'notifications')->name('notifications');
    Route::inertia('help', 'help')->name('help');
});

require __DIR__.'/settings.php';
