<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAlertsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'hive_id'            => ['required', 'string', 'exists:hives,hive_id'],
            'inference_id'       => ['required', 'string', 'exists:inference_results,inference_id'],
            'advisory_id'        => ['nullable', 'string', 'exists:advisories,advisory_id'],
            'severity_level'     => ['required', 'string', 'max:20'],
            'recommended_action' => ['nullable', 'string'],
            'action_status'      => ['required', 'string', 'max:20'],
            'alert_timestamp'    => ['required', 'date'],
        ];
    }
}
