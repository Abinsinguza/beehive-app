<?php

use App\Http\Controllers\AdvisoryController;
use App\Http\Controllers\AlertsController;
use App\Http\Controllers\BeehiveController;
use App\Http\Controllers\BeekeeperController;
use App\Http\Controllers\InferenceController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard',    'dashboard')->name('dashboard');
    Route::inertia('analytics',    'inferences')->name('analytics');
    Route::inertia('monitoring',   'monitoring')->name('monitoring');
    Route::inertia('system-config','system-config')->name('system-config');
    Route::inertia('notifications','notifications')->name('notifications');
    Route::inertia('help',         'help')->name('help');

    // Alerts
    Route::get('alerts',                        [AlertsController::class, 'index'])->name('alerts.index');
    Route::patch('alerts/{alertId}/notify',     [AlertsController::class, 'notify'])->name('alerts.notify');
    Route::patch('alerts/{alertId}/acknowledge',[AlertsController::class, 'acknowledge'])->name('alerts.acknowledge');

    // Beekeepers (farmers)
    Route::get('beekeepers',                  [BeekeeperController::class, 'index'])->name('beekeepers.index');
    Route::post('beekeepers',                 [BeekeeperController::class, 'store'])->name('beekeepers.store');
    Route::put('beekeepers/{userId}',         [BeekeeperController::class, 'update'])->name('beekeepers.update');
    Route::delete('beekeepers/{userId}',      [BeekeeperController::class, 'destroy'])->name('beekeepers.destroy');

    // Beehives / hives
    Route::get('beehives',                    [BeehiveController::class, 'index'])->name('beehives.index');
    Route::post('beehives',                   [BeehiveController::class, 'store'])->name('beehives.store');
    Route::put('beehives/{hiveId}',           [BeehiveController::class, 'update'])->name('beehives.update');
    Route::delete('beehives/{hiveId}',        [BeehiveController::class, 'destroy'])->name('beehives.destroy');

    // Advisories (advisory templates)
    Route::get('advisories',                  [AdvisoryController::class, 'index'])->name('advisories.index');
    Route::post('advisories',                 [AdvisoryController::class, 'store'])->name('advisories.store');
    Route::put('advisories/{templateId}',     [AdvisoryController::class, 'update'])->name('advisories.update');
    Route::delete('advisories/{templateId}',  [AdvisoryController::class, 'destroy'])->name('advisories.destroy');

    // Inferences (read-only)
    Route::get('inferences',                  [InferenceController::class, 'index'])->name('inferences.index');
});

require __DIR__.'/settings.php';
