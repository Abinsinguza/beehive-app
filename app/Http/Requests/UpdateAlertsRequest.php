<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAlertsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'inference_id'    => ['sometimes', 'integer', 'exists:inferences,id'],
            'advisory_id'     => ['sometimes', 'integer', 'exists:advisories,id'],
            'alert_type'      => ['sometimes', 'string', 'in:Info,Warning,Critical,Threat'],
            'alert_timestamp' => ['sometimes', 'date'],
            'status'          => ['sometimes', 'string', 'in:pending,sent'],
        ];
    }
}
