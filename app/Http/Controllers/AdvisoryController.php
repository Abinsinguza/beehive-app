<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AdvisoryController extends Controller
{
    public function index()
    {
        return Inertia::render('advisories', [
            'advisories' => $this->api()->getAdvisoryTemplates(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'prediction_code' => ['required', 'numeric'],
            'hive_state'      => ['required', 'string', 'in:normal,pre_swarm,swarm,abscondment,missing_queen,queenbee_present,pest_infested,external_noise,uncertain'],
            'condition_label' => ['required', 'string', 'max:100'],
            'advisory_text'   => ['required', 'string'],
            'advisory_type'   => ['required', 'string', 'in:Reactive,Preventive'],
            'severity'        => ['required', 'string', 'in:info,low,medium,high,critical'],
        ]);

        $this->api()->createAdvisoryTemplate($data);

        return redirect()->back()->with('success', 'Advisory template added successfully');
    }

    public function update(Request $request, string $templateId)
    {
        $data = $request->validate([
            'condition_label' => ['required', 'string', 'max:100'],
            'advisory_text'   => ['required', 'string'],
            'advisory_type'   => ['required', 'string', 'in:Reactive,Preventive'],
            'severity'        => ['required', 'string', 'in:info,low,medium,high,critical'],
        ]);

        $this->api()->updateAdvisoryTemplate((int) $templateId, $data);

        return redirect()->back()->with('success', 'Advisory template updated successfully');
    }

    public function destroy(string $templateId)
    {
        $this->api()->deleteAdvisoryTemplate((int) $templateId);

        return redirect()->back()->with('success', 'Advisory template deleted successfully');
    }
}
