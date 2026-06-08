<?php

namespace App\Http\Controllers;

use App\Models\AudioSource;
use App\Models\Beehive;
use Illuminate\Http\Request;

class AudioSourceController extends Controller
{
    public function index(Request $request)
    {
        $search  = $request->input('search', '');
        $status  = $request->input('status', '');
        $format  = $request->input('format', '');
        $hive    = $request->input('hive', '');

        $query = AudioSource::with('hive:hive_id,hive_name,hive_location')
            ->when($search, function ($q) use ($search) {
                $q->whereHas('hive', fn($hq) => $hq->where('hive_name', 'ilike', "%{$search}%")
                    ->orWhere('hive_location', 'ilike', "%{$search}%"))
                  ->orWhere('source_url', 'ilike', "%{$search}%")
                  ->orWhere('file_format', 'ilike', "%{$search}%");
            })
            ->when($status, fn($q) => $q->where('status', $status))
            ->when($format, fn($q) => $q->where('file_format', $format))
            ->when($hive,   fn($q) => $q->where('hive_id', $hive))
            ->latest('captured_at');

        $recordings = $query->paginate(8)->withQueryString();

        // Stats
        $total    = AudioSource::count();
        $ingested = AudioSource::where('status', 'ingested')->count();
        $pending  = AudioSource::where('status', 'pending')->count();
        $failed   = AudioSource::where('status', 'failed')->count();

        // Dropdown options
        $formats = AudioSource::selectRaw('DISTINCT file_format')->orderBy('file_format')->pluck('file_format');
        $hives   = Beehive::select('hive_id', 'hive_name', 'hive_location')->orderBy('hive_name')->get();

        return inertia('audio-recordings', [
            'recordings' => $recordings,
            'stats'      => compact('total', 'ingested', 'pending', 'failed'),
            'formats'    => $formats,
            'hives'      => $hives,
            'filters'    => compact('search', 'status', 'format', 'hive'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'hive_id'          => ['required', 'uuid', 'exists:hives,hive_id'],
            'source_url'       => ['required', 'string', 'max:255'],
            'file_format'      => ['required', 'string', 'max:20'],
            'duration_seconds' => ['nullable', 'numeric', 'min:0'],
            'captured_at'      => ['nullable', 'date'],
            'status'           => ['required', 'in:pending,ingested,failed'],
        ]);

        AudioSource::create($validated);

        return redirect()->back()->with('success', 'Recording added successfully.');
    }
}
